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
              JSON.stringify({ error: "GEMINI_API_KEY غير مضاف في Cloudflare." }),
              { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          const { prompt, imageBase64, temperature, maxOutputTokens, responseMimeType } =
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
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
              },
            });
          }
          parts.push({ text: prompt });

          const generationConfig: any = {
            temperature: temperature ?? 0.7,
            maxOutputTokens: maxOutputTokens ?? 1024,
          };

          // ✅ تفعيل JSON mode إذا طُلب
          if (responseMimeType === "application/json") {
            generationConfig.responseMimeType = "application/json";
          }

          const body = {
            contents: [{ parts }],
            generationConfig,
          };

          // ✅ النموذج الصحيح الذي يدعم الصور والـ JSON mode
          const geminiUrl =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

          const upstream = await fetch(geminiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify(body),
          });

          if (!upstream.ok) {
            const txt = await upstream.text();
            const status = upstream.status;
            let msg = "Gemini API error";
            if (status === 429) msg = "تجاوزت حد الطلبات. حاول بعد دقيقة.";
            else if (status === 401 || status === 403) msg = "مفتاح API غير صحيح.";
            else if (status === 400) msg = "طلب غير صحيح. تحقق من الصورة.";
            return new Response(
              JSON.stringify({ error: msg, detail: txt }),
              { status, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          const data = await upstream.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

          if (!text) {
            return new Response(
              JSON.stringify({ error: "لم يتمكن الـ AI من إنتاج رد." }),
              { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

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
