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
          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          const { prompt, imageBase64, temperature, maxOutputTokens, responseMimeType } =
            await request.json();

          if (!prompt || typeof prompt !== "string") {
            return new Response(JSON.stringify({ error: "prompt is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          const content: any[] = [{ type: "text", text: prompt }];
          if (imageBase64 && typeof imageBase64 === "string") {
            content.unshift({
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            });
          }

          const body: any = {
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content }],
            temperature: temperature ?? 0.7,
            max_tokens: maxOutputTokens ?? 1024,
          };
          if (responseMimeType === "application/json") {
            body.response_format = { type: "json_object" };
          }

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });

          if (!upstream.ok) {
            const txt = await upstream.text();
            const status = upstream.status;
            let msg = "AI gateway error";
            if (status === 429) msg = "تجاوزت حد الطلبات، حاول لاحقاً.";
            else if (status === 402) msg = "نفذت الأرصدة، أضف رصيداً لمساحة العمل.";
            return new Response(JSON.stringify({ error: msg, detail: txt }), {
              status,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          const data = await upstream.json();
          const text = data?.choices?.[0]?.message?.content ?? "";
          return new Response(JSON.stringify({ text }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (e) {
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
          );
        }
      },
    },
  },
});
