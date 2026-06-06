import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Origin",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function stripDataUrlPrefix(value: string): string {
  return value.replace(/^data:[^;]+;base64,/i, "").trim();
}

function friendlyAiError(status: number, detail: string): string {
  if (status === 429) return "تجاوزت حد الطلبات. حاول بعد دقيقة.";
  if (status === 402) return "نفذ الرصيد المتاح للذكاء الاصطناعي.";
  if (status === 401 || status === 403 || /api key|apikey|unauthorized|permission/i.test(detail)) {
    return "مفتاح API غير صحيح أو لا يملك الصلاحية.";
  }
  if (/model.+not.+valid|valid model id|not found/i.test(detail)) {
    return "نموذج الذكاء الاصطناعي غير متاح حالياً.";
  }
  return "تعذر تشغيل الذكاء الاصطناعي حالياً.";
}

async function callGeminiDirect(args: {
  apiKey: string;
  prompt: string;
  imageBase64?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
}) {
  const parts: any[] = [{ text: args.prompt }];
  if (args.imageBase64) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: stripDataUrlPrefix(args.imageBase64) } });
  }

  const generationConfig: Record<string, unknown> = {
    temperature: args.temperature ?? 0.7,
    maxOutputTokens: args.maxOutputTokens ?? 1024,
  };
  if (args.responseMimeType === "application/json") {
    generationConfig.responseMimeType = "application/json";
  }

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(args.apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig }),
    },
  );

  if (!upstream.ok) {
    const detail = await upstream.text();
    return jsonResponse({ error: friendlyAiError(upstream.status, detail), detail }, upstream.status);
  }

  const data: any = await upstream.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text ?? "").join("").trim() ?? "";
  if (!text) return jsonResponse({ error: "لم يتمكن الـ AI من إنتاج رد." }, 500);
  return jsonResponse({ text });
}

async function callOpenRouter(args: {
  apiKey: string;
  prompt: string;
  imageBase64?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
}) {
  const content: any[] = [{ type: "text", text: args.prompt }];
  if (args.imageBase64) {
    content.unshift({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${stripDataUrlPrefix(args.imageBase64)}` },
    });
  }

  const body: any = {
    model: "google/gemini-2.5-flash",
    messages: [{ role: "user", content }],
    temperature: args.temperature ?? 0.7,
    max_tokens: args.maxOutputTokens ?? 1024,
  };
  if (args.responseMimeType === "application/json") {
    body.response_format = { type: "json_object" };
  }

  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://geostring.com",
      "X-Title": "Geostring",
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const detail = await upstream.text();
    return jsonResponse({ error: friendlyAiError(upstream.status, detail), detail }, upstream.status);
  }

  const data: any = await upstream.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  if (!text) return jsonResponse({ error: "لم يتمكن الـ AI من إنتاج رد." }, 500);
  return jsonResponse({ text });
}

export const Route = createFileRoute("/api/public/ai")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        try {
          const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
          const openRouterApiKey = process.env.OPENROUTER_API_KEY?.trim();

          const { prompt, imageBase64, temperature, maxOutputTokens, responseMimeType } =
            await request.json();

          if (!prompt || typeof prompt !== "string") {
            return jsonResponse({ error: "prompt is required" }, 400);
          }

          const args = {
            prompt,
            imageBase64: typeof imageBase64 === "string" ? imageBase64 : undefined,
            temperature,
            maxOutputTokens,
            responseMimeType,
          };

          if (geminiApiKey) {
            return callGeminiDirect({ apiKey: geminiApiKey, ...args });
          }

          if (openRouterApiKey) {
            return callOpenRouter({ apiKey: openRouterApiKey, ...args });
          }

          return jsonResponse({ error: "GEMINI_API_KEY أو OPENROUTER_API_KEY غير مضاف في Cloudflare." }, 500);

        } catch (e) {
          return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
        }
      },
    },
  },
});
