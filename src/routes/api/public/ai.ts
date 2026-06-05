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
          // ✅ الحصول على المفتاح من متغيرات البيئة
          const apiKey = process.env.GEMINI_API_KEY?.trim();
          
          if (!apiKey) {
            return new Response(
              JSON.stringify({ 
                error: "GEMINI_API_KEY غير مضاف. تحقق من إعدادات Cloudflare Workers." 
              }),
              { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          // ✅ التحقق الصحيح من طول المفتاح فقط
          if (apiKey.length < 20) {
            return new Response(
              JSON.stringify({ 
                error: "GEMINI_API_KEY قصير جداً. تأكد من نسخ المفتاح كاملاً من Google AI Studio." 
              }),
              { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          const { prompt, imageBase64, temperature, maxOutputTokens } = await request.json();

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
                data: imageBase64.replace(/^data:image\/\w+;base64,/, "") 
              },
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

          // ✅ استخدم gemini-pro بدلاً من gemini-2.0-flash
          const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

          const upstream = await fetch(geminiUrl, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json", 
              "x-goog-api-key": apiKey 
            },
            body: JSON.stringify(body),
          });

          if (!upstream.ok) {
            const txt = await upstream.text();
            const status = upstream.status;
            let msg = "Gemini API error";
            
            if (status === 429) {
              msg = "تجاوزت حد الطلبات. حاول بعد دقيقة.";
            } else if (status === 401 || status === 403) {
              msg = "مفتاح API غير صحيح. تحقق من الإعدادات في Cloudflare.";
            } else if (status === 400) {
              msg = "طلب غير صحيح. تحقق من الصورة والـ prompt.";
            }
            
            console.error(`Gemini API Error (${status}):`, txt);
            
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
          const errorMsg = e instanceof Error ? e.message : "Unknown error";
          console.error("AI Route Error:", errorMsg);
          
          return new Response(
            JSON.stringify({ error: errorMsg }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      },
    },
  },
});
