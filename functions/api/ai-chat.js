const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
};

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

const PREFERRED_MODELS = [
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'qwen/qwen3-32b',
  'llama-3.1-8b-instant',
  'openai/gpt-oss-20b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
];

const FALLBACK_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.1-8b-instant',
  'qwen/qwen3-32b',
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

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestGet(context) {
  const apiKey = (context?.env?.GROQ_API_KEY || '').trim();
  const hasGroqKey = Boolean(apiKey);
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
      ...(activeModels ? { activeModels } : {}),
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

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          reply: 'کلید GROQ_API_KEY در تنظیمات Cloudflare یافت نشد.',
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

    const configuredModel = (context?.env?.GROQ_MODEL || '').trim();
    const liveModels = await getCandidateModels(apiKey, false);
    const candidateModels = configuredModel
      ? [configuredModel, ...liveModels.filter((m) => m !== configuredModel)]
      : liveModels;

    const attemptErrors = [];

    for (const model of candidateModels) {
      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
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

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return new Response(
          JSON.stringify({
            ok: false,
            reply:
              'کلید GROQ_API_KEY نامعتبر است یا منقضی شده است. لطفاً کلید جدیدی در تنظیمات Cloudflare Pages ثبت کنید.',
          }),
          { status: 401, headers: JSON_HEADERS }
        );
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
            }),
            { status: 200, headers: JSON_HEADERS }
          );
        }
        attemptErrors.push(`${model}: پاسخ خالی`);
        continue;
      }

      const errMsg = data?.error?.message || `HTTP ${response.status}`;
      attemptErrors.push(`${model}: ${errMsg}`);

      // اگر مدل منقضی شده یا وجود نداشت، کش مدل‌ها را برای درخواست بعدی تازه کن
      if (response.status === 404 || /does not exist|decommissioned/i.test(errMsg)) {
        cachedModels = null;
        cachedModelsAt = 0;
      }
    }

    const summaryError =
      attemptErrors.length > 0 ? attemptErrors.slice(0, 2).join(' | ') : 'خطا در ارتباط با Groq';

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
