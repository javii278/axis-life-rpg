import Link from "next/link";

const FEATURES = [
  {
    icon: "⚔️",
    title: "Personaje RPG real",
    desc: "Tu disciplina moldea un personaje con stats genuinos. No son cosméticos — reflejan tus hábitos reales.",
  },
  {
    icon: "📊",
    title: "6 Stats de vida",
    desc: "VIT, FOC, SAB, DIS, CRE, VOL. Cada hábito alimenta el stat correcto. Los stats decaen si dejas de actuar.",
  },
  {
    icon: "🏰",
    title: "Clases desbloqueables",
    desc: "Warrior, Architect, Scholar, Monk... Tu clase emerge del patrón real de tus comportamientos.",
  },
  {
    icon: "🗺️",
    title: "Árbol de Metas",
    desc: "Desde tus metas de vida hasta las tareas del día. Todo conectado, todo con propósito.",
  },
  {
    icon: "🧠",
    title: "Coach IA narrativo",
    desc: "Un consejero que habla en lore RPG pero analiza tu progreso real con inteligencia artificial.",
  },
  {
    icon: "⚡",
    title: "Sesiones de Foco",
    desc: "Timer de deep work integrado. Cada sesión suma XP y fortalece tu stat de Foco.",
  },
];

const CLASSES = [
  { name: "Warrior",    stats: "VIT + DIS", color: "#ef4444" },
  { name: "Architect",  stats: "FOC + SAB", color: "#06b6d4" },
  { name: "Scholar",    stats: "SAB + CRE", color: "#a78bfa" },
  { name: "Monk",       stats: "VIT + FOC", color: "#10b981" },
  { name: "Explorer",   stats: "CRE + VOL", color: "#f97316" },
  { name: "Guardian",   stats: "DIS + VOL", color: "#f59e0b" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-bg-primary/80 backdrop-blur-md border-b border-[#1e1e2e]">
        <span className="text-xl font-display font-bold">
          AXIS<span className="text-accent-purple_light">.</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors font-medium px-4 py-2"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/login"
            className="text-sm bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-accent-purple/10 border border-accent-purple/30 text-accent-purple_light text-xs font-mono px-3 py-1.5 rounded-full mb-8">
          ⚔️ Tu vida como un RPG
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
          Convierte tus{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-gold">
            hábitos
          </span>{" "}
          en un personaje épico
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Axis no es un tracker de hábitos más. Es un sistema donde tu disciplina real
          moldea un personaje RPG con stats genuinos que suben y bajan según tu comportamiento.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="bg-accent-purple hover:bg-accent-purple/80 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all hover:scale-105 active:scale-95"
          >
            Crear mi personaje gratis →
          </Link>
          <a
            href="#features"
            className="border border-[#2d2d4a] text-gray-300 hover:text-white hover:border-gray-500 font-medium px-8 py-4 rounded-2xl text-base transition-colors"
          >
            Ver cómo funciona
          </a>
        </div>
      </section>

      {/* Stats preview */}
      <section className="pb-20 px-6 max-w-3xl mx-auto">
        <div className="bg-bg-card border border-[#2d2d4a] rounded-3xl p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Personaje de ejemplo</div>
            <div className="text-white font-display font-bold text-lg">Kael · Architect · Lv.12</div>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { stat: "VIT", val: 61, color: "#ef4444" },
              { stat: "FOC", val: 89, color: "#06b6d4" },
              { stat: "SAB", val: 84, color: "#a78bfa" },
              { stat: "DIS", val: 72, color: "#f59e0b" },
              { stat: "CRE", val: 55, color: "#10b981" },
              { stat: "VOL", val: 68, color: "#f97316" },
            ].map(({ stat, val, color }) => (
              <div key={stat} className="flex flex-col items-center gap-2">
                <div className="relative w-12 h-12">
                  <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#1e1e2e" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke={color} strokeWidth="3"
                      strokeDasharray={`${(val / 100) * 88} 88`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white">
                    {val}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">{stat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            No cosmético. <span className="text-accent-purple_light">Real.</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Cada función está diseñada para que el RPG refleje quién eres de verdad, no quién quieres aparentar.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-bg-card border border-[#2d2d4a] rounded-2xl p-6 hover:border-accent-purple/40 transition-colors"
            >
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-display font-bold text-white mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Classes */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            ¿Qué clase eres tú?
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Tu clase emerge de los dos stats que más desarrolles. No la eliges — la ganas.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CLASSES.map(({ name, stats, color }) => (
            <div
              key={name}
              className="bg-bg-card border border-[#2d2d4a] rounded-2xl p-4 text-center hover:border-opacity-60 transition-all"
              style={{ borderColor: `${color}33` }}
            >
              <div
                className="text-lg font-display font-bold mb-1"
                style={{ color }}
              >
                {name}
              </div>
              <div className="text-xs font-mono text-gray-500">{stats}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24 px-6 text-center max-w-2xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
          Tu aventura empieza hoy
        </h2>
        <p className="text-gray-400 mb-10 text-lg">
          Crea tu personaje en 2 minutos. Los hábitos que elijas ahora darán forma a quién serás.
        </p>
        <Link
          href="/login"
          className="inline-block bg-gradient-to-r from-accent-purple to-accent-gold text-white font-bold px-10 py-4 rounded-2xl text-lg transition-all hover:scale-105 active:scale-95"
        >
          Comenzar mi historia →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e1e2e] py-8 px-6 text-center">
        <span className="text-gray-600 text-sm font-mono">
          AXIS<span className="text-accent-purple_light">.</span> — The Life RPG
        </span>
      </footer>
    </div>
  );
}
