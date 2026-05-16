import { createFileRoute, Link } from "@tanstack/react-router";

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

const team = [
  { name: "ثابت حسان", role: "قائد الفريق" },
  { name: "عبدالله عمار", role: "باحث" },
  { name: "سالي أحمد", role: "باحث" },
  { name: "كوكب معن", role: "باحث" },
];

function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--gold-2)] flex items-center justify-center font-display font-bold text-background">G</div>
          <span className="font-display text-lg font-bold tracking-wider">GEOSTRING<span className="text-[var(--gold)]">.</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#hero" className="hover:text-[var(--gold)] transition">الرئيسية</a>
          <a href="#presentation" className="hover:text-[var(--gold)] transition">العرض التقديمي</a>
          <a href="#simulation" className="hover:text-[var(--gold)] transition">المحاكاة</a>
          <a href="#team" className="hover:text-[var(--gold)] transition">الفريق</a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-[var(--cyan)]/15 blur-3xl" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 rounded-full bg-[var(--gold)]/15 blur-3xl" />

      <div className="container mx-auto px-6 py-28 md:py-40 relative">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/5 text-xs font-mono text-[var(--gold)] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-pulse" />
            CNC · POLAR GEOMETRY · STRING ART
          </div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6">
            منظومة <span className="text-gradient-gold">هندسة الأوتار</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl">
            روبوت رسم بالخيط مؤتمت يعتمد على الهندسة القطبية والتحكم الرقمي CNC — يحوّل الصور إلى لوحات فنية محبوكة من خيط واحد متصل.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#simulation"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-gradient-to-r from-[var(--gold)] to-[var(--gold-2)] text-background font-bold text-lg glow-gold hover:scale-[1.02] transition"
            >
              جرب المحاكاة الآن
              <span className="group-hover:-translate-x-1 transition">←</span>
            </a>
            <a
              href="#presentation"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-lg border border-[var(--cyan)]/50 text-[var(--cyan)] font-bold text-lg hover:bg-[var(--cyan)]/10 transition"
            >
              مشاهدة العرض التقديمي
            </a>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-16 max-w-xl">
            {[
              { v: "360°", l: "تحكم قطبي" },
              { v: "CNC", l: "تحكم رقمي" },
              { v: "1", l: "خيط متصل" },
            ].map((s) => (
              <div key={s.l} className="border-r-2 border-[var(--gold)]/60 pr-4">
                <div className="font-display text-3xl font-bold text-[var(--gold)]">{s.v}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Presentation() {
  return (
    <section id="presentation" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <div className="font-mono text-xs text-[var(--cyan)] mb-3">02 — PRESENTATION</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">العرض التقديمي للمشروع</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">تصفّح شرائح العرض مباشرة من هنا — استخدم القائمة الجانبية للتنقّل بين الشرائح.</p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-[var(--gold)]/30 bg-card shadow-2xl glow-cyan">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/60">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <span className="font-mono text-xs text-muted-foreground">Geostring_Presentation.html</span>
            <a href="/presentation.html" target="_blank" rel="noreferrer" className="text-xs text-[var(--gold)] hover:underline">فتح في نافذة جديدة ↗</a>
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
  return (
    <section id="simulation" className="py-24 relative">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-12">
          <div className="font-mono text-xs text-[var(--cyan)] mb-3">03 — SIMULATION</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient-gold">محاكاة</span> المشروع
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            جرّب أداة المحاكاة التفاعلية وحوّل صورك إلى فن الخيط رقمياً قبل الطباعة الفعلية.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            { t: "ارفع صورتك", d: "اختر أي صورة لتحويلها إلى مسار خيط واحد." },
            { t: "اضبط المعاملات", d: "عدد المسامير، كثافة الخيط، التباين والدقة." },
            { t: "صدّر المسار", d: "احصل على إحداثيات قابلة للتنفيذ على آلة CNC." },
          ].map((c, i) => (
            <div key={c.t} className="p-6 rounded-xl border border-border bg-card/60 hover:border-[var(--gold)]/50 transition">
              <div className="font-display text-2xl text-[var(--gold)] mb-2">0{i + 1}</div>
              <div className="font-bold text-lg mb-2">{c.t}</div>
              <div className="text-sm text-muted-foreground">{c.d}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden border border-[var(--cyan)]/40 bg-card shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/60">
            <span className="font-mono text-xs text-[var(--cyan)]">● LIVE SIMULATION</span>
            <a
              href="https://stringphotokr.dothome.co.kr/indexmaking.html"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--gold)] hover:underline"
            >
              فتح في نافذة كاملة ↗
            </a>
          </div>
          <iframe
            src="https://stringphotokr.dothome.co.kr/indexmaking.html"
            title="String Simulation"
            className="w-full h-[80vh] bg-white"
          />
        </div>

        <div className="text-center mt-8">
          <a
            href="https://stringphotokr.dothome.co.kr/indexmaking.html"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-gradient-to-r from-[var(--cyan)] to-[var(--gold)] text-background font-bold glow-cyan hover:scale-[1.02] transition"
          >
            افتح المحاكاة بحجم كامل
            <span>↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function Team() {
  return (
    <section id="team" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-14">
          <div className="font-mono text-xs text-[var(--cyan)] mb-3">04 — TEAM</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">فريق العمل</h2>
          <p className="text-muted-foreground">العقول التي صنعت هذه المنظومة</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {team.map((member, i) => (
            <div
              key={member.name}
              className="group relative p-6 rounded-xl border border-border bg-card/60 hover:border-[var(--gold)]/60 transition overflow-hidden"
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
            <div className="font-mono text-xs text-[var(--gold)] mb-3">SUPERVISOR · بإشراف</div>
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[var(--cyan)] to-[var(--gold)] flex items-center justify-center text-background font-bold text-2xl mb-4 glow-gold">
              م
            </div>
            <div className="font-display text-2xl font-bold">م. مفاذ يحيى ضمرة</div>
            <div className="text-sm text-muted-foreground mt-2">المشرف الأكاديمي</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10 mt-12">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-display text-sm tracking-widest text-muted-foreground">
          GEOSTRING SYSTEM © {new Date().getFullYear()}
        </div>
        <div className="font-mono text-xs text-[var(--gold)]">منظومة هندسة الأوتار · CNC POLAR ART</div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Presentation />
        <Simulation />
        <Team />
      </main>
      <Footer />
    </div>
  );
}
