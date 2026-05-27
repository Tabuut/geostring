import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

export const dict = {
  // Nav
  "nav.home": { ar: "الرئيسية", en: "Home" },
  "nav.presentation": { ar: "العرض التقديمي", en: "Presentation" },
  "nav.simulation": { ar: "المحاكاة", en: "Simulation" },
  "nav.specs": { ar: "الأبعاد", en: "Specifications" },
  "nav.team": { ar: "الفريق", en: "Team" },
  "nav.openApp": { ar: "افتح التطبيق ←", en: "Open App →" },
  "nav.menu": { ar: "القائمة", en: "Menu" },
  "nav.lang": { ar: "EN", en: "ع" },

  // Hero
  "hero.badge": { ar: "CNC · هندسة قطبية · فن الأوتار", en: "CNC · POLAR GEOMETRY · STRING ART" },
  "hero.title1": { ar: "منظومة", en: "The" },
  "hero.title2": { ar: "هندسة الأوتار", en: "Geostring System" },
  "hero.desc": {
    ar: "روبوت رسم بالخيط مؤتمت يعتمد على الهندسة القطبية والتحكم الرقمي CNC — يحوّل الصور إلى لوحات فنية محبوكة من خيط واحد متصل.",
    en: "An automated string-drawing robot based on polar geometry and CNC control — turning images into artworks woven from a single continuous thread.",
  },
  "hero.cta1": { ar: "افتح مولّد فن الأوتار", en: "Open the String Art Generator" },
  "hero.cta2": { ar: "جرب المحاكاة", en: "Try the Simulation" },
  "hero.cta3": { ar: "العرض التقديمي", en: "Presentation" },
  "hero.stat1": { ar: "تحكم قطبي", en: "Polar Control" },
  "hero.stat2": { ar: "تحكم رقمي", en: "Digital Control" },
  "hero.stat3": { ar: "خيط متصل", en: "Single Thread" },

  // Presentation
  "pres.kicker": { ar: "02 — العرض التقديمي", en: "02 — PRESENTATION" },
  "pres.title": { ar: "العرض التقديمي للمشروع", en: "Project Presentation" },
  "pres.desc": {
    ar: "تصفّح شرائح العرض مباشرة من هنا — استخدم القائمة الجانبية للتنقّل بين الشرائح.",
    en: "Browse the slide deck right here — use the side menu to navigate between slides.",
  },
  "pres.open": { ar: "فتح في نافذة جديدة ↗", en: "Open in new window ↗" },

  // Simulation
  "sim.kicker": { ar: "03 — المحاكاة", en: "03 — SIMULATION" },
  "sim.title1": { ar: "محاكاة", en: "Project" },
  "sim.title2": { ar: "المشروع", en: "Simulation" },
  "sim.desc": {
    ar: "جرّب أداة المحاكاة التفاعلية وحوّل صورك إلى فن الخيط رقمياً قبل الطباعة الفعلية.",
    en: "Try the interactive simulation and turn your images into string art digitally before printing.",
  },
  "sim.step1.t": { ar: "ارفع صورتك", en: "Upload your image" },
  "sim.step1.d": { ar: "اختر أي صورة لتحويلها إلى مسار خيط واحد.", en: "Pick any image to convert into a single thread path." },
  "sim.step2.t": { ar: "اضبط المعاملات", en: "Tune parameters" },
  "sim.step2.d": { ar: "عدد المسامير، كثافة الخيط، التباين والدقة.", en: "Nails count, thread density, contrast and detail." },
  "sim.step3.t": { ar: "صدّر المسار", en: "Export the path" },
  "sim.step3.d": { ar: "احصل على إحداثيات قابلة للتنفيذ على آلة CNC.", en: "Get coordinates ready to run on a CNC machine." },
  "sim.live": { ar: "● محاكاة مباشرة", en: "● LIVE SIMULATION" },
  "sim.openFull": { ar: "فتح في نافذة كاملة ↗", en: "Open full window ↗" },
  "sim.cta": { ar: "افتح المحاكاة بحجم كامل", en: "Open simulation full size" },

  // Specs
  "specs.kicker": { ar: "04 — المواصفات", en: "04 — SPECIFICATIONS" },
  "specs.title1": { ar: "الأبعاد", en: "Key" },
  "specs.title2": { ar: "الرئيسية", en: "Dimensions" },
  "specs.desc": { ar: "المواصفات الفنية الأساسية لمنظومة هندسة الأوتار", en: "Core technical specifications of the Geostring System" },
  "specs.frameW": { ar: "عرض الإطار الكلي", en: "Total Frame Width" },
  "specs.frameL": { ar: "طول الإطار الكلي", en: "Total Frame Length" },
  "specs.disc": { ar: "قطر القرص (Canvas)", en: "Disc Diameter (Canvas)" },
  "specs.armL": { ar: "طول ذراع الرسم", en: "Drawing Arm Length" },
  "specs.armH": { ar: "ارتفاع ذراع الرسم", en: "Drawing Arm Height" },
  "specs.uno": { ar: "Arduino UNO", en: "Arduino UNO" },

  // Team
  "team.kicker": { ar: "05 — الفريق", en: "05 — TEAM" },
  "team.title": { ar: "فريق العمل", en: "Our Team" },
  "team.desc": { ar: "العقول التي صنعت هذه المنظومة", en: "The minds behind this system" },
  "team.lead": { ar: "قائد الفريق", en: "Team Leader" },
  "team.researcher": { ar: "باحث", en: "Researcher" },
  "team.supervisor": { ar: "المشرف · بإشراف", en: "SUPERVISOR" },
  "team.supName": { ar: "م. مفاذ يحيى ضمرة", en: "Eng. Mufath Yahya Damra" },
  "team.supRole": { ar: "المشرف الأكاديمي", en: "Academic Supervisor" },

  // Team names
  "name.thabit": { ar: "ثابت حسان", en: "Thabit Hassan" },
  "name.abdullah": { ar: "عبدالله عمار", en: "Abdullah Ammar" },
  "name.sally": { ar: "سالي أحمد", en: "Sally Ahmad" },
  "name.kawkab": { ar: "كوكب معن", en: "Kawkab Maan" },

  // Footer
  "footer.dev": { ar: "تطوير: ثابت حسان سالم", en: "Developed by Thabit Hassan Salem" },
  "footer.tag": { ar: "منظومة هندسة الأوتار · فن قطبي بتحكم CNC", en: "Geostring System · CNC POLAR ART" },
} satisfies Dict;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: keyof typeof dict) => string };
const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("geo.lang")) as Lang | null;
    if (saved === "ar" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("geo.lang", l); } catch {}
  };

  const t = (k: keyof typeof dict) => dict[k][lang];

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLang(): Ctx {
  const c = useContext(LanguageContext);
  if (!c) return { lang: "ar", setLang: () => {}, t: (k) => dict[k]?.ar ?? String(k) };
  return c;
}
