import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const Route = createFileRoute("/api/public/ai")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        try {
          const apiKey = process.env.GEMINI_API_KEY?.trim();
          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: "GEMINI_API_KEY غير مضاف في إعدادات Cloudflare Worker." }),
              { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          if (apiKey.startsWith("AQ.") || apiKey.startsWith("ya29.") || apiKey.startsWith("Bearer ")) {
            return new Response(
              JSON.stringify({ error: "GEMINI_API_KEY الحالي ليس API Key صالحاً. استخدم مفتاح Google AI Studio الذي يبدأ عادةً بـ AIza." }),
              { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          const { prompt, imageBase64, temperature, maxOutputTokens } =
            await request.json();

          if (!prompt || typeof prompt !== "string") {
            return new Response(
              JSON.stringify({ error: "prompt is required" }),
              { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          const parts: any[] = [];
          if (imageBase64 && typeof imageBase64 === "string") {
            parts.push({
              inlineData: { mimeType: "image/jpeg", data: imageBase64.replace(/^data:image\/\w+;base64,/, "") },
            });
          }
          parts.push({ text: prompt });

          const body = {
            contents: [{ parts }],
            generationConfig: {
              temperature: temperature ?? 0.7,
              maxOutputTokens: maxOutputTokens ?? 1024,
            },
          };

          const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

          const upstream = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify(body),
          });

          if (!upstream.ok) {
            const txt = await upstream.text();
            const status = upstream.status;
            let msg = "Gemini API error";
            if (status === 429) msg = "تجاوزت حد الطلبات، حاول لاحقاً.";
            else if (status === 401 || status === 403) msg = "مفتاح Gemini API غير صحيح أو ليس API Key صالحاً. أنشئ مفتاحاً من Google AI Studio يبدأ عادةً بـ AIza ثم ضعه في Cloudflare باسم GEMINI_API_KEY.";
            return new Response(
              JSON.stringify({ error: msg, detail: txt }),
              { status, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          const data = await upstream.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          return new Response(JSON.stringify({ text }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });

        } catch (e) {
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      },
    },
  },
});
