export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function onRequestGet(context) {
  const hasGroqKey = Boolean((context?.env?.GROQ_API_KEY || '').trim());
  return new Response(
    JSON.stringify({
      ok: true,
      status: 'ready',
      endpoint: '/api/ai-chat',
      hasGroqKey,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function onRequestPost(context) {
  const corsHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = await context.request.json();
    const { message, history, publicContext, studentInfo } = body || {};
    const apiKey = (context?.env?.GROQ_API_KEY || '').trim();

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          reply: 'کلید GROQ_API_KEY در تنظیمات Cloudflare یافت نشد.',
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const cleanAndTruncate = (obj, maxLength = 2500) => {
      if (!obj) return '';
      try {
        const str =
          typeof obj === 'string'
            ? obj
            : JSON.stringify(obj, (_key, value) => {
                if (
                  typeof value === 'string' &&
                  (value.startsWith('data:image') || value.length > 500)
                ) {
                  return '[حذف شد]';
                }
                return value;
              });
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
      } catch {
        return '';
      }
    };

    const resolvedStudentInfo =
      studentInfo ||
      (publicContext && typeof publicContext === 'object'
        ? publicContext.currentUserContext
        : null);

    const systemInstruction = `
تو دستیار هوشمند رسمی «سامانه اسکان و امور سراهای دانشجویی دانشگاه فرهنگیان اصفهان» هستی.
به سوالات دانشجویان درباره اطلاعات سراها، اطلاعیه‌ها، مسائل خوابگاهی و آموزشی به زبان فارسی روان و محترمانه پاسخ بده.
خط قرمز امنیتی: هرگز اطلاعات شخصی و حساس (کد ملی، شماره تماس، رمز عبور، آدرس و محل اسکان سایر افراد) را فاش نکن.

خلاصه اطلاعات سامانه:
${cleanAndTruncate(publicContext, 2500)}

اطلاعات کاربر فعلی:
${cleanAndTruncate(resolvedStudentInfo, 800) || 'کاربر مهمان'}
`.trim();

    const chatMessages = [{ role: 'system', content: systemInstruction }];
    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (!item || typeof item !== 'object') continue;
        const text = String(item.text || item.content || '').trim().substring(0, 600);
        if (!text) continue;
        const role = item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user';
        chatMessages.push({ role, content: text });
      }
    }
    chatMessages.push({
      role: 'user',
      content: String(message || 'سلام').substring(0, 1000),
    });

    const models = [
      'llama-3.1-8b-instant',
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'llama-3.3-70b-versatile',
    ];

    let lastError = 'خطا در ارتباط با Groq';

    for (const model of models) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: chatMessages,
          temperature: 0.5,
          max_tokens: 512,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.choices?.[0]?.message?.content) {
        const reply = data.choices[0].message.content
          .replace(/<think>[\s\S]*?<\/think>/g, '')
          .trim();
        return new Response(
          JSON.stringify({
            ok: true,
            success: true,
            reply,
            text: reply,
            answer: reply,
          }),
          { status: 200, headers: corsHeaders }
        );
      } else {
        lastError = data?.error?.message || `HTTP ${response.status}`;
      }
    }

    return new Response(
      JSON.stringify({ ok: false, reply: `خطای سرویس هوش مصنوعی: ${lastError}` }),
      { status: 400, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        reply: `خطای داخلی سرور: ${err instanceof Error ? err.message : String(err)}`,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
