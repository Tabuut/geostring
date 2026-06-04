import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import GeoStringApp from "@/components/GeoStringApp";

function useCountUp(target: number, duration = 1800) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const start = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / duration);
          setVal(Math.floor(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
          else setVal(target);
        };
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { ref, val };
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string>(ids[0]);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { threshold: 0.4 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [ids.join(",")]);
  return active;
}

function Ticker() {
  const items = ["GEOSTRING", "منظومة هندسة الأوتار", "CNC POLAR ART", "AI POWERED", "STRING ART ENGINE"];
  const loop = [...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-b border-[var(--gold)]/10 bg-[var(--gold)]/[0.03] py-1.5">
      <div className="inline-block whitespace-nowrap animate-[ticker_30s_linear_infinite] font-mono text-[10px] tracking-[1px] text-[var(--gold)]/60">
        {loop.map((t, i) => (
          <span key={i} className="mx-3">
            {t}<span className="mx-1.5 text-[var(--gold)]/30">·</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Geostring System — منظومة هندسة الأوتار" },
      { name: "description", content: "روبوت رسم بالخيط مؤتمت يعتمد على الهندسة القطبية والتحكم الرقمي CNC." },
      { property: "og:title", content: "Geostring System — منظومة هندسة الأوتار" },
      { property: "og:description", content: "روبوت رسم بالخيط مؤتمت يعتمد على الهندسة القطبية والتحكم الرقمي CNC." },
    ],
  }),
  component: Index,
});

const navLinks = [
  { href: "#hero", key: "nav.home" as const },
  { href: "#presentation", key: "nav.presentation" as const },
  { href: "#simulation", key: "nav.simulation" as const },
  { href: "#specs", key: "nav.specs" as const },
  { href: "#team", key: "nav.team" as const },
];

function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      aria-label="Toggle language"
      className={`px-2.5 py-1.5 rounded-md border border-[var(--gold)]/40 text-[var(--gold)] text-xs font-mono font-bold hover:bg-[var(--gold)]/10 transition ${className}`}
    >
      {lang === "ar" ? "EN" : "ع"}
    </button>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  const active = useActiveSection(["hero", "presentation", "simulation", "specs", "team"]);
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--gold-2)] flex items-center justify-center font-display font-bold text-background shrink-0">G</div>
          <span className="font-display text-base sm:text-lg font-bold tracking-wider truncate">GEOSTRING<span className="text-[var(--gold)]">.</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {navLinks.map(l => {
            const id = l.href.slice(1);
            const isActive = active === id;
            return (
              <a
                key={l.href}
                href={l.href}
                className={`relative pb-1 transition hover:text-[var(--gold)] ${isActive ? "text-[var(--gold)]" : ""} after:absolute after:bottom-0 after:right-0 after:h-px after:bg-[var(--gold)] after:transition-all ${isActive ? "after:w-full" : "after:w-0 hover:after:w-full"}`}
              >
                {t(l.key)}
              </a>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <LangToggle />
          <Link to="/app" className="px-2.5 py-1.5 sm:px-3 rounded-md bg-gradient-to-r from-[var(--gold)] to-[var(--gold-2)] text-background font-bold text-xs sm:text-sm hover:scale-[1.03] transition whitespace-nowrap">
            {t("nav.openApp")}
          </Link>
          <button
            onClick={() => setOpen(o => !o)}
            aria-label={t("nav.menu")}
            className="md:hidden w-9 h-9 inline-flex items-center justify-center rounded-md border border-border text-[var(--gold)]"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map(l => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2 px-3 rounded-md text-sm text-muted-foreground hover:text-[var(--gold)] hover:bg-[var(--gold)]/5 transition"
              >
                {t(l.key)}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  const { t } = useLang();
  return (
    <section id="hero" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-[var(--cyan)]/15 blur-3xl" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 rounded-full bg-[var(--gold)]/15 blur-3xl" />

      <div className="container mx-auto px-6 py-28 md:py-40 relative">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/5 text-xs font-mono text-[var(--gold)] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-pulse" />
            {t("hero.badge")}
          </div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6">
            {t("hero.title1")} <span className="text-gradient-gold">{t("hero.title2")}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl">
            {t("hero.desc")}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/app"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-gradient-to-r from-[var(--gold)] to-[var(--gold-2)] text-background font-bold text-lg glow-gold hover:scale-[1.02] transition"
            >
              {t("hero.cta1")}
              <span className="group-hover:-translate-x-1 transition">←</span>
            </Link>
            <a
              href="#simulation"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-lg border border-[var(--cyan)]/50 text-[var(--cyan)] font-bold text-lg hover:bg-[var(--cyan)]/10 transition"
            >
              {t("hero.cta2")}
            </a>
            <a
              href="#presentation"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-lg border border-border text-muted-foreground font-bold text-lg hover:text-foreground transition"
            >
              {t("hero.cta3")}
            </a>
          </div>

          <HeroStats />
        </div>
      </div>
    </section>
  );
}

function HeroStats() {
  const { t } = useLang();
  const polar = useCountUp(360);
  const threads = useCountUp(8000);
  return (
    <div className="grid grid-cols-3 gap-6 mt-16 max-w-xl">
      <div className="border-r-2 border-[var(--gold)]/60 pr-4">
        <div className="font-display text-3xl font-bold text-[var(--gold)]">
          <span ref={polar.ref}>{polar.val}</span>°
        </div>
        <div className="text-sm text-muted-foreground mt-1">{t("hero.stat1")}</div>
      </div>
      <div className="border-r-2 border-[var(--gold)]/60 pr-4">
        <div className="font-display text-3xl font-bold text-[var(--gold)]">CNC</div>
        <div className="text-sm text-muted-foreground mt-1">{t("hero.stat2")}</div>
      </div>
      <div className="border-r-2 border-[var(--gold)]/60 pr-4">
        <div className="font-display text-3xl font-bold text-[var(--gold)]">
          <span ref={threads.ref}>{threads.val.toLocaleString()}</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">{t("hero.stat3")}</div>
      </div>
    </div>
  );
}

function Presentation() {
  const { t } = useLang();
  return (
    <section id="presentation" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <div className="font-mono text-xs text-[var(--cyan)] mb-3">{t("pres.kicker")}</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">{t("pres.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("pres.desc")}</p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-[var(--gold)]/30 bg-card shadow-2xl glow-cyan">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/60">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <span className="font-mono text-xs text-muted-foreground">Geostring_Presentation.html</span>
            <a href="/presentation.html" target="_blank" rel="noreferrer" className="text-xs text-[var(--gold)] hover:underline">{t("pres.open")}</a>
          </div>
          <iframe
            src="/presentation.html"
            title="Geostring Presentation"
            className="w-full h-[75vh] bg-[#07101e]"
          />
        </div>
      </div>
    </section>
  );
}

function Simulation() {
  const { t } = useLang();
  return (
    <section id="simulation" className="py-24 relative">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-12">
          <div className="font-mono text-xs text-[var(--cyan)] mb-3">{t("sim.kicker")}</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient-gold">{t("sim.title1")}</span> {t("sim.title2")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("sim.desc")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            { t: t("sim.step1.t"), d: t("sim.step1.d") },
            { t: t("sim.step2.t"), d: t("sim.step2.d") },
            { t: t("sim.step3.t"), d: t("sim.step3.d") },
          ].map((c, i) => (
            <div key={i} className="p-6 rounded-xl border border-border bg-card/60 hover:border-[var(--gold)]/50 transition">
              <div className="font-display text-2xl text-[var(--gold)] mb-2">0{i + 1}</div>
              <div className="font-bold text-lg mb-2">{c.t}</div>
              <div className="text-sm text-muted-foreground">{c.d}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden border border-[var(--cyan)]/40 bg-card shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/60">
            <span className="font-mono text-xs text-[var(--cyan)]">{t("sim.live")}</span>
            <a
              href="/app"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--gold)] hover:underline"
            >
              {t("sim.openFull")}
            </a>
          </div>
          <div style={{ width: "100%", minHeight: "90vh", background: "#0d1117" }}>
            <GeoStringApp />
          </div>
        </div>
      </div>
    </section>
  );
}

function Specifications() {
  const { t } = useLang();
  const specs = [
    { label: t("specs.frameW"), value: "325 mm" },
    { label: t("specs.frameL"), value: "425 mm" },
    { label: t("specs.disc"), value: "290 mm" },
    { label: t("specs.armL"), value: "100 mm" },
    { label: t("specs.armH"), value: "200 mm" },
    { label: t("specs.uno"), value: "68 × 53 mm" },
  ];

  return (
    <section id="specs" className="py-24 relative">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-12">
          <div className="font-mono text-xs text-[var(--cyan)] mb-3">{t("specs.kicker")}</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient-gold">{t("specs.title1")}</span> {t("specs.title2")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("specs.desc")}
          </p>
        </div>

        <div className="max-w-2xl mx-auto rounded-2xl border border-[var(--gold)]/30 bg-card/60 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/60">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <span className="font-mono text-xs text-muted-foreground">Technical_Specs.json</span>
            <span className="text-xs text-[var(--gold)]">mm</span>
          </div>
          <div className="divide-y divide-border">
            {specs.map((s, i) => (
              <div
                key={s.label}
                className="flex items-center justify-between px-6 py-4 hover:bg-[var(--gold)]/5 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[var(--cyan)] w-6">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-bold">{s.label}</span>
                </div>
                <span className="font-mono text-[var(--gold)] font-bold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Team() {
  const { t } = useLang();
  const team = [
    { name: t("name.thabit"), role: t("team.lead") },
    { name: t("name.abdullah"), role: t("team.researcher") },
    { name: t("name.sally"), role: t("team.researcher") },
    { name: t("name.kawkab"), role: t("team.researcher") },
  ];

  return (
    <section id="team" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-14">
          <div className="font-mono text-xs text-[var(--cyan)] mb-3">{t("team.kicker")}</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">{t("team.title")}</h2>
          <p className="text-muted-foreground">{t("team.desc")}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {team.map((member, i) => (
            <div
              key={member.name}
              className="group relative p-6 rounded-xl border border-border bg-card/60 hover:border-[var(--gold)]/60 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(201,168,76,0.08)] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-[var(--gold)]/10 group-hover:bg-[var(--gold)]/20 transition" />
              <div className="font-mono text-xs text-[var(--cyan)] mb-3">0{i + 1}</div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-2)] flex items-center justify-center text-background font-bold text-xl mb-4 relative">
                {member.name.charAt(0)}
              </div>
              <div className="font-bold text-lg relative">{member.name}</div>
              <div className="text-xs text-muted-foreground mt-1 relative">{member.role}</div>
            </div>
          ))}
        </div>

        <div className="max-w-md mx-auto p-8 rounded-2xl border-2 border-[var(--gold)]/50 bg-gradient-to-br from-[var(--navy-2)] to-background text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="relative">
            <div className="font-mono text-xs text-[var(--gold)] mb-3">{t("team.supervisor")}</div>
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[var(--cyan)] to-[var(--gold)] flex items-center justify-center text-background font-bold text-2xl mb-4 glow-gold">
              {t("team.supName").charAt(t("team.supName").startsWith("Eng") ? 4 : 0)}
            </div>
            <div className="font-display text-2xl font-bold">{t("team.supName")}</div>
            <div className="text-sm text-muted-foreground mt-2">{t("team.supRole")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-border py-10 mt-12">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-display text-sm tracking-widest text-muted-foreground">
          GEOSTRING SYSTEM © {new Date().getFullYear()}
        </div>
        <div className="font-mono text-xs text-[var(--gold)]">{t("footer.dev")}</div>
        <div className="font-mono text-xs text-[var(--gold)]">{t("footer.tag")}</div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Ticker />
      <main>
        <Hero />
        <Presentation />
        <Simulation />
        <Specifications />
        <Team />
      </main>
      <Footer />
    </div>
  );
}
