import { createFileRoute } from "@tanstack/react-router";
import GeoStringApp from "@/components/GeoStringApp";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Geostring App — مولّد فن الأوتار" },
      { name: "description", content: "حوّل أي صورة إلى لوحة فن الأوتار جاهزة للتنفيذ على CNC — مع مساعد ذكي Gemini AI." },
    ],
  }),
  component: GeoStringApp,
});
