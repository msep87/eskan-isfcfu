const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PRIMARY_MODEL = 'llama-3.1-8b-instant';
const FALLBACK_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

function cleanAndTruncate(obj, maxLength = 2500) {
  if (!obj) return '';
  try {
    const str =
      typeof obj === 'string'
        ? obj
        : JSON.stringify(obj, (_key, value) => {
            if (typeof value === 'string') {
              if (value.startsWith('data:image') || value.startsWith('data:application')) {
                return '[تصویر/فایل حذف شد]';
              }
              if (value.length > 500) {
                return value.slice(0, 500) + '... [خلاصه شده]';
              }
            }
            return value;
          });
    return str.length > maxLength ? str.slice(0, maxLength) + '... [خلاصه شده]' : str;
  } catch {
    return '';
  }
}

async function requestGroqCompletion(apiKey, model, messages) {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 1024,
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestPost(context) {
  try {
    const apiKey = String(context?.env?.GROQ_API_KEY || '').trim();
    if (!apiKey) {
      return jsonResponse(
        {
          ok: false,
          reply:
            'کلید GROQ_API_KEY در تنظیمات متغیرهای محیطی Cloudflare Pages یافت نشد. لطفاً آن را در بخش Environment Variables پروژه تنظیم نمایید.',
          error: 'MISSING_GROQ_API_KEY',
        },
        500
      );
    }

    let body = {};
    try {
      body = await context.request.json();
    } catch {
      return jsonResponse(
        {
          ok: false,
          reply: 'ساختار درخواست ارسال‌شده معتبر نیست.',
          error: 'INVALID_JSON',
        },
        400
      );
    }

    const { message, history, publicContext, studentInfo } = body || {};
    const safeMessage = String(message || '').trim().slice(0, 1500);
    if (!safeMessage) {
      return jsonResponse(
        {
          ok: false,
          reply: 'لطفاً متن پیام یا سوال خود را وارد نمایید.',
          error: 'EMPTY_MESSAGE',
        },
        400
      );
    }

    const safeContext = cleanAndTruncate(publicContext, 3200);
    const resolvedStudentInfo =
      studentInfo ||
      (publicContext && typeof publicContext === 'object' ? publicContext.currentUserContext : null);
    const safeStudent = cleanAndTruncate(resolvedStudentInfo, 800);

    const systemInstruction = [
      'تو دستیار هوشمند رسمی «سامانه اسکان و امور سراهای دانشجویی دانشگاه فرهنگیان اصفهان» هستی.',
      'به سوالات دانشجویان درباره اطلاعات سراهای دانشجویی، ظرفیت‌ها، اطلاعیه‌ها، آیین‌نامه‌ها، خدمات مشاوره، مسائل خوابگاهی و آموزشی به زبان فارسی روان، دقیق و محترمانه پاسخ بده.',
      'خط قرمز امنیتی: هرگز اطلاعات شخصی و حساس (کد ملی، شماره تماس، رمز عبور، آدرس و محل اسکان سایر افراد) را فاش نکن.',
      safeContext ? `\nخلاصه اطلاعات عمومی سامانه:\n${safeContext}` : '',
      safeStudent ? `\nاطلاعات کاربر فعلی:\n${safeStudent}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const chatMessages = [{ role: 'system', content: systemInstruction }];

    if (Array.isArray(history)) {
      for (const item of history.slice(-8)) {
        if (!item || typeof item !== 'object') continue;
        const text = String(item.text || item.content || '').trim().slice(0, 800);
        if (!text) continue;
        const role = item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user';
        chatMessages.push({ role, content: text });
      }
    }

    chatMessages.push({ role: 'user', content: safeMessage });

    const configuredModel = String(context?.env?.GROQ_MODEL || '').trim();
    const firstModel = configuredModel || PRIMARY_MODEL;

    let { res: groqRes, data: groqData } = await requestGroqCompletion(
      apiKey,
      firstModel,
      chatMessages
    );

    if (!groqRes.ok && firstModel !== FALLBACK_MODEL && (groqRes.status === 400 || groqRes.status === 404)) {
      ({ res: groqRes, data: groqData } = await requestGroqCompletion(
        apiKey,
        FALLBACK_MODEL,
        chatMessages
      ));
    }

    if (!groqRes.ok) {
      const apiErr =
        groqData?.error?.message || `خطای سرویس هوش مصنوعی (کد ${groqRes.status})`;
      return jsonResponse(
        {
          ok: false,
          reply:
            'در حال حاضر سرویس پاسخ‌گویی هوشمند با خطا مواجه شده است. لطفاً چند لحظه دیگر مجدداً تلاش نمایید.',
          error: apiErr,
        },
        groqRes.status >= 400 && groqRes.status < 600 ? groqRes.status : 502
      );
    }

    const reply = String(groqData?.choices?.[0]?.message?.content || '').trim();
    if (!reply) {
      return jsonResponse(
        {
          ok: false,
          reply: 'پاسخی از مدل هوشمند دریافت نشد. لطفاً سوال خود را مجدداً مطرح کنید.',
          error: 'EMPTY_REPLY',
        },
        502
      );
    }

    return jsonResponse({ ok: true, reply }, 200);
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        reply: 'خطای داخلی در پردازش پیام دستیار هوشمند رخ داد. لطفاً دوباره تلاش کنید.',
        error: err instanceof Error ? err.message : 'INTERNAL_ERROR',
      },
      500
    );
  }
}
