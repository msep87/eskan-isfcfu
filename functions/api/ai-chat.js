const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

const PREFERRED_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
];

const FALLBACK_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
];

const NON_CHAT_MODEL_KEYWORDS = [
  'whisper',
  'guard',
  'safeguard',
  'tts',
  'orpheus',
  'playai',
  'embed',
  'moderation',
  'transcri',
  'gpt-oss',
  'preview',
];

// کش کوتاه‌مدت در حافظه Worker برای جلوگیری از فراخوانی تکراری /models در هر پیام
let cachedModels = null;
let cachedModelsAt = 0;
const MODELS_CACHE_TTL_MS = 10 * 60 * 1000;

function isChatModelId(id) {
  if (!id || typeof id !== 'string') return false;
  const lower = id.toLowerCase();
  return !NON_CHAT_MODEL_KEYWORDS.some((kw) => lower.includes(kw));
}

async function getCandidateModels(apiKey, forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && Array.isArray(cachedModels) && cachedModels.length > 0 && now - cachedModelsAt < MODELS_CACHE_TTL_MS) {
    return cachedModels;
  }

  try {
    const modelsRes = await fetch(`${GROQ_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (modelsRes.ok) {
      const modelsData = await modelsRes.json().catch(() => ({}));
      const availableIds = (Array.isArray(modelsData?.data) ? modelsData.data : [])
        .filter((m) => m && m.active !== false)
        .map((m) => m.id)
        .filter(isChatModelId);

      if (availableIds.length > 0) {
        const sorted = [
          ...PREFERRED_MODELS.filter((p) => availableIds.includes(p)),
          ...availableIds.filter((id) => !PREFERRED_MODELS.includes(id)),
        ];
        cachedModels = sorted.slice(0, 6);
        cachedModelsAt = now;
        return cachedModels;
      }
    }
  } catch {
    // در صورت خطای شبکه هنگام دریافت لیست مدل‌ها از لیست پیش‌فرض استفاده می‌شود
  }

  return FALLBACK_MODELS;
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
                return '[حذف شد]';
              }
              if (value.length > 500) {
                return value.substring(0, 500) + '...';
              }
            }
            return value;
          });
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  } catch {
    return '';
  }
}

function cleanReplyText(rawContent) {
  if (typeof rawContent !== 'string') return '';
  return rawContent
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/gi, '')
    .trim();
}

const GEMINI_MODELS = [
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
];

async function callGeminiChat(geminiKey, systemInstruction, history, message) {
  const geminiContents = [];
  if (Array.isArray(history)) {
    for (const item of history.slice(-6)) {
      if (!item || typeof item !== 'object') continue;
      const text = String(item.text || item.content || '').trim().substring(0, 600);
      if (!text) continue;
      const role = item.role === 'model' || item.role === 'assistant' ? 'model' : 'user';
      geminiContents.push({ role, parts: [{ text }] });
    }
  }
  geminiContents.push({
    role: 'user',
    parts: [{ text: String(message || 'سلام').substring(0, 1000) }],
  });

  const errors = [];
  let lastStatus = 502;

  for (const model of GEMINI_MODELS) {
    let geminiRes;
    try {
      const generationConfig = model.startsWith('gemini-4')
        ? { maxOutputTokens: 1024 }
        : { temperature: 0.5, maxOutputTokens: 1024 };

      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey,
            'User-Agent': 'aistudio-build',
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: geminiContents,
            generationConfig,
          }),
        }
      );
    } catch (fetchErr) {
      errors.push(
        `${model}: ${fetchErr instanceof Error ? fetchErr.message : 'خطای ارتباط شبکه'}`
      );
      continue;
    }

    lastStatus = geminiRes.status || 502;
    const geminiData = await geminiRes.json().catch(() => ({}));

    if (geminiRes.ok) {
      const parts = geminiData?.candidates?.[0]?.content?.parts || [];
      const reply = cleanReplyText(
        parts.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('\n')
      );
      if (reply) {
        return { ok: true, reply, modelUsed: model };
      }
      errors.push(`${model}: پاسخ خالی`);
      continue;
    }

    const errMsg = geminiData?.error?.message || `HTTP ${geminiRes.status}`;
    errors.push(`${model}: ${errMsg}`);

    if (geminiRes.status === 400 && /API key not valid|API_KEY_INVALID/i.test(errMsg)) {
      break;
    }
  }

  return {
    ok: false,
    status: lastStatus >= 400 ? lastStatus : 502,
    error: errors.slice(0, 2).join(' | ') || 'پاسخی از سرویس Gemini دریافت نشد.',
  };
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestGet(context) {
  const apiKey = (context?.env?.GROQ_API_KEY || '').trim();
  const geminiKey = (context?.env?.GEMINI_API_KEY || '').trim();
  const hasGroqKey = Boolean(apiKey);
  const hasGeminiKey = Boolean(geminiKey);
  const url = new URL(context.request.url);
  let activeModels;

  if (hasGroqKey && url.searchParams.get('models') === '1') {
    activeModels = await getCandidateModels(apiKey, true);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      status: 'ready',
      endpoint: '/api/ai-chat',
      hasGroqKey,
      hasGeminiKey,
      ...(activeModels ? { activeModels } : {}),
      ...(hasGeminiKey && url.searchParams.get('models') === '1'
        ? { geminiModels: GEMINI_MODELS }
        : {}),
    }),
    {
      status: 200,
      headers: JSON_HEADERS,
    }
  );
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ ok: false, reply: 'ساختار درخواست ارسال‌شده معتبر نیست.' }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const { message, history, publicContext, studentInfo } = body;
    const apiKey = (context?.env?.GROQ_API_KEY || '').trim();
    const geminiKey = (context?.env?.GEMINI_API_KEY || '').trim();

    if (!apiKey && !geminiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          reply:
            'کلید GROQ_API_KEY یا GEMINI_API_KEY در تنظیمات محیطی سرور (Cloudflare Pages) یافت نشد.',
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    const resolvedStudentInfo =
      studentInfo ||
      (publicContext && typeof publicContext === 'object'
        ? publicContext.currentUserContext
        : null);

    const systemInstruction = `
تو دستیار هوشمند رسمی «سامانه جامع خدمات دانشجویی دانشگاه فرهنگیان اصفهان» (با زیرمجموعه اصلی سراهای دانشجویی) هستی.
به سوالات دانشجویان درباره سراهای دانشجویی، امور آموزشی، مالی، فرهنگی، کتابخانه، تسویه حساب فارغ‌التحصیلان و اطلاعیه‌ها به زبان فارسی روان و محترمانه پاسخ بده.
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

    // اگر کلید GROQ_API_KEY تنظیم نشده ولی GEMINI_API_KEY در محیط سرور موجود باشد، مستقیم از Gemini استفاده می‌شود
    if (!apiKey && geminiKey) {
      const geminiResult = await callGeminiChat(geminiKey, systemInstruction, history, message);
      if (geminiResult.ok) {
        return new Response(
          JSON.stringify({
            ok: true,
            success: true,
            reply: geminiResult.reply,
            text: geminiResult.reply,
            answer: geminiResult.reply,
            modelUsed: geminiResult.modelUsed,
            providerUsed: 'gemini',
          }),
          { status: 200, headers: JSON_HEADERS }
        );
      }
      return new Response(
        JSON.stringify({
          ok: false,
          reply:
            geminiResult.error ||
            'پاسخی از سرویس هوش مصنوعی دریافت نشد. لطفاً کلید GEMINI_API_KEY را در تنظیمات سرور بررسی کنید.',
        }),
        { status: geminiResult.status, headers: JSON_HEADERS }
      );
    }

    const rawConfiguredModel = (context?.env?.GROQ_MODEL || '').trim();
    const configuredModel = rawConfiguredModel && isChatModelId(rawConfiguredModel) ? rawConfiguredModel : '';
    const liveModels = await getCandidateModels(apiKey, false);
    const candidateModels = (
      configuredModel
        ? [configuredModel, ...liveModels.filter((m) => m !== configuredModel)]
        : liveModels
    ).filter(isChatModelId);
    const finalCandidateModels = candidateModels.length > 0 ? candidateModels : FALLBACK_MODELS;

    const RATE_LIMIT_REPLY =
      'ترافیک پرسش‌های دستیار هوشمند در این لحظه بالاست؛ لطفاً ۱۰ ثانیه صبر کرده و دوباره ارسال کنید';
    const attemptErrors = [];
    let rateLimitHits = 0;
    let groqUnauthorized = false;

    for (const model of finalCandidateModels) {
      let response;
      try {
        response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: chatMessages,
            temperature: 0.5,
            max_tokens: 1024,
          }),
        });
      } catch (fetchErr) {
        attemptErrors.push(
          `${model}: ${fetchErr instanceof Error ? fetchErr.message : 'خطای ارتباط شبکه'}`
        );
        continue;
      }

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        groqUnauthorized = true;
        attemptErrors.push(`${model}: HTTP 401`);
        break;
      }

      if (response.status === 403 || response.status === 404) {
        const errMsg = data?.error?.message || `HTTP ${response.status}`;
        attemptErrors.push(`${model}: ${errMsg}`);
        cachedModels = null;
        cachedModelsAt = 0;
        continue;
      }

      if (response.status === 429) {
        rateLimitHits += 1;
        attemptErrors.push(`${model}: HTTP 429`);
        if (rateLimitHits >= 2 || finalCandidateModels.length === 1) {
          break;
        }
        continue;
      }

      if (response.ok) {
        const rawContent = data?.choices?.[0]?.message?.content;
        const reply = cleanReplyText(rawContent);
        if (reply) {
          return new Response(
            JSON.stringify({
              ok: true,
              success: true,
              reply,
              text: reply,
              answer: reply,
              modelUsed: model,
              providerUsed: 'groq',
            }),
            { status: 200, headers: JSON_HEADERS }
          );
        }
        attemptErrors.push(`${model}: پاسخ خالی`);
        continue;
      }

      const errMsg = data?.error?.message || `HTTP ${response.status}`;
      if (/rate.?limit|too many requests|429/i.test(errMsg)) {
        rateLimitHits += 1;
        attemptErrors.push(`${model}: ${errMsg}`);
        if (rateLimitHits >= 2) {
          break;
        }
        continue;
      }
      attemptErrors.push(`${model}: ${errMsg}`);

      // اگر مدل مسدود، منقضی شده یا وجود نداشت، کش مدل‌ها را برای درخواست بعدی تازه کن و سراغ مدل بعدی برو
      if (/forbidden|does not exist|decommissioned|not allowed/i.test(errMsg)) {
        cachedModels = null;
        cachedModelsAt = 0;
        continue;
      }
    }

    // اگر سرویس Groq به هر دلیلی (خطای کلید، محدودیت نرخ، مسدودی یا خطای شبکه) پاسخ نداد و GEMINI_API_KEY موجود بود، به صورت خودکار به Gemini سوییچ می‌شود
    if (geminiKey) {
      const geminiResult = await callGeminiChat(geminiKey, systemInstruction, history, message);
      if (geminiResult.ok) {
        return new Response(
          JSON.stringify({
            ok: true,
            success: true,
            reply: geminiResult.reply,
            text: geminiResult.reply,
            answer: geminiResult.reply,
            modelUsed: geminiResult.modelUsed,
            providerUsed: 'gemini',
            fallbackFrom: 'groq',
          }),
          { status: 200, headers: JSON_HEADERS }
        );
      }
      attemptErrors.push(`gemini: ${geminiResult.error}`);
    }

    if (groqUnauthorized && !geminiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          reply:
            'کلید GROQ_API_KEY نامعتبر است یا منقضی شده است. لطفاً کلید جدیدی در تنظیمات Cloudflare Pages ثبت کنید.',
        }),
        { status: 401, headers: JSON_HEADERS }
      );
    }

    if (rateLimitHits > 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: 'RATE_LIMITED',
          retryAfterSeconds: 10,
          reply: RATE_LIMIT_REPLY,
        }),
        {
          status: 429,
          headers: {
            ...JSON_HEADERS,
            'Retry-After': '10',
          },
        }
      );
    }

    const summaryError =
      attemptErrors.length > 0 ? attemptErrors.slice(0, 2).join(' | ') : 'خطا در ارتباط با سرویس هوش مصنوعی';

    return new Response(
      JSON.stringify({ ok: false, reply: `خطای سرویس هوش مصنوعی: ${summaryError}` }),
      { status: 400, headers: JSON_HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        reply: `خطای داخلی سرور: ${err instanceof Error ? err.message : String(err)}`,
      }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
}

export async function onRequest() {
  return new Response(
    JSON.stringify({
      ok: false,
      reply: 'متد درخواستی برای سرویس دستیار هوشمند پشتیبانی نمی‌شود (از POST استفاده کنید).',
    }),
    { status: 405, headers: JSON_HEADERS }
  );
}
