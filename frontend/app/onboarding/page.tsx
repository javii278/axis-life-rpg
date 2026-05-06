"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

const ONBOARDING_KEY = "axis_onboarded";

// ── Opciones de stats con descripción narrativa ───────────────────────────────
const STAT_OPTIONS = [
  { stat: "VIT", label: "Salud & Energía",   icon: "❤️",  desc: "Sueño, ejercicio, nutrición", color: "#ef4444" },
  { stat: "FOC", label: "Foco profundo",      icon: "🔵",  desc: "Deep work, sin distracciones", color: "#06b6d4" },
  { stat: "SAB", label: "Sabiduría",          icon: "📚",  desc: "Lectura, cursos, aprendizaje", color: "#a78bfa" },
  { stat: "DIS", label: "Disciplina",         icon: "🏆",  desc: "Consistencia y constancia", color: "#f59e0b" },
  { stat: "CRE", label: "Creatividad",        icon: "🎨",  desc: "Crear, idear, construir", color: "#10b981" },
  { stat: "VOL", label: "Voluntad",           icon: "⚡",  desc: "Hacer lo difícil", color: "#f97316" },
] as const;

// Hábitos sugeridos por stat
const HABIT_SUGGESTIONS: Record<string, { name: string; description: string; xp: number }[]> = {
  VIT: [
    { name: "Dormir 7-8 horas", description: "Acuéstate a la misma hora", xp: 15 },
    { name: "30 min de ejercicio", description: "Cualquier tipo de movimiento", xp: 20 },
    { name: "Beber 2L de agua", description: "Hidratación diaria", xp: 10 },
  ],
  FOC: [
    { name: "1h de deep work", description: "Sin teléfono ni notificaciones", xp: 25 },
    { name: "Meditación 10 min", description: "Mindfulness o respiración", xp: 15 },
    { name: "Sin teléfono por la mañana", description: "Primera hora sin móvil", xp: 15 },
  ],
  SAB: [
    { name: "Leer 30 minutos", description: "No ficción o técnico", xp: 15 },
    { name: "Aprender algo nuevo", description: "Curso, tutorial o artículo", xp: 15 },
    { name: "Escribir o reflexionar", description: "Journaling o notas", xp: 10 },
  ],
  DIS: [
    { name: "Levantarse a la misma hora", description: "Sin pulsar snooze", xp: 20 },
    { name: "Revisar tareas del día", description: "Planning diario", xp: 10 },
    { name: "Cumplir una tarea difícil", description: "La que más evitas", xp: 20 },
  ],
  CRE: [
    { name: "Crear algo hoy", description: "Escribir, diseñar, programar...", xp: 20 },
    { name: "Capturar 3 ideas", description: "En papel o app de notas", xp: 10 },
    { name: "Tiempo de proyecto personal", description: "Mínimo 30 minutos", xp: 20 },
  ],
  VOL: [
    { name: "Hacer algo incómodo", description: "Una cosa que evitas hacer", xp: 25 },
    { name: "Sin redes sociales", description: "Al menos 1 hora sin scroll", xp: 15 },
    { name: "Ducha fría", description: "O al menos terminar en frío", xp: 20 },
  ],
};

const CLASS_BY_STATS: Record<string, string> = {
  "FOC+SAB": "Architect",
  "SAB+FOC": "Architect",
  "VIT+DIS": "Warrior",
  "DIS+VIT": "Warrior",
  "SAB+CRE": "Scholar",
  "CRE+SAB": "Scholar",
  "VOL+FOC": "Monk",
  "FOC+VOL": "Monk",
  "VIT+CRE": "Explorer",
  "CRE+VIT": "Explorer",
  "DIS+VOL": "Guardian",
  "VOL+DIS": "Guardian",
};

const CLASS_DESCRIPTIONS: Record<string, { lore: string; emoji: string }> = {
  Architect: { lore: "Construyes sistemas. Tu mente es tu mayor activo.", emoji: "🏛️" },
  Warrior:   { lore: "Forjado a través del esfuerzo físico y la constancia.", emoji: "⚔️" },
  Scholar:   { lore: "El conocimiento es tu poder. Aprendes sin parar.", emoji: "📖" },
  Monk:      { lore: "Maestro del silencio y la concentración profunda.", emoji: "🧘" },
  Explorer:  { lore: "Curioso y vital. Creas donde otros no miran.", emoji: "🗺️" },
  Guardian:  { lore: "Voluntad de hierro. Haces lo que otros evitan.", emoji: "🛡️" },
  Novice:    { lore: "Tu historia comienza ahora. El camino está abierto.", emoji: "🌱" },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [charName, setCharName] = useState("");
  const [selectedStats, setSelectedStats] = useState<string[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());
  const [lifeGoal, setLifeGoal] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated()) {
    router.replace("/login");
    return null;
  }

  const predictedClass = (() => {
    if (selectedStats.length < 2) return "Novice";
    const key = `${selectedStats[0]}+${selectedStats[1]}`;
    return CLASS_BY_STATS[key] || "Novice";
  })();

  const suggestedHabits = selectedStats.flatMap(s => HABIT_SUGGESTIONS[s] ?? []);

  function toggleStat(stat: string) {
    setSelectedStats(prev => {
      if (prev.includes(stat)) return prev.filter(s => s !== stat);
      if (prev.length >= 2) return [prev[1], stat];
      return [...prev, stat];
    });
  }

  function toggleHabit(key: string) {
    setSelectedHabits(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function finish() {
    setLoading(true);
    try {
      // Crear personaje
      await api.character.create(charName || "Héroe");

      // Crear hábitos seleccionados
      const habitsToCreate = suggestedHabits.filter((_, i) => selectedHabits.has(`${i}`));
      await Promise.all(habitsToCreate.map(h =>
        api.habits.create({ name: h.name, description: h.description, stat_target: selectedStats[0] || "DIS", xp_reward: h.xp })
      ));

      // Crear meta de vida
      if (lifeGoal.trim()) {
        await api.goals.create({ title: lifeGoal, level: 0 });
      }

      localStorage.setItem(ONBOARDING_KEY, "1");
      router.push("/home");
    } catch (e) {
      console.error(e);
      localStorage.setItem(ONBOARDING_KEY, "1");
      router.push("/home");
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    // ── Step 0: Bienvenida + nombre ───────────────────────────────────────────
    <motion.div key="step0" className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">⚔️</div>
        <h1 className="text-3xl font-display font-bold text-white">Bienvenido a Axis</h1>
        <p className="text-white/50 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
          Vas a crear tu personaje. Tus hábitos reales alimentarán sus stats. Tu constancia lo hará crecer.
        </p>
      </div>
      <div>
        <label className="text-xs font-mono text-white/40 block mb-2">¿CÓMO SE LLAMARÁ TU PERSONAJE?</label>
        <input
          type="text"
          value={charName}
          onChange={e => setCharName(e.target.value)}
          placeholder="ej: Kael, Shadow, Max..."
          className="w-full bg-bg-secondary border border-[#2d2d4a] focus:border-accent-purple text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          maxLength={30}
        />
      </div>
      <button
        onClick={() => setStep(1)}
        disabled={!charName.trim()}
        className="w-full bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Continuar →
      </button>
    </motion.div>,

    // ── Step 1: Elegir stats ──────────────────────────────────────────────────
    <motion.div key="step1" className="space-y-5">
      <div>
        <h2 className="text-xl font-display font-bold text-white">¿En qué quieres enfocarte?</h2>
        <p className="text-white/40 text-sm mt-1">Elige las 2 áreas más importantes para ti ahora mismo</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {STAT_OPTIONS.map(({ stat, label, icon, desc, color }) => {
          const selected = selectedStats.includes(stat);
          return (
            <button
              key={stat}
              onClick={() => toggleStat(stat)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selected ? "border-current" : "border-[#2d2d4a] hover:border-[#3d3d5a]"
              }`}
              style={selected ? { borderColor: color, backgroundColor: `${color}15` } : {}}
            >
              <span className="text-2xl">{icon}</span>
              <p className="text-sm font-semibold text-white mt-1">{label}</p>
              <p className="text-xs text-white/40 mt-0.5">{desc}</p>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-white/30 text-center">{selectedStats.length}/2 seleccionados</p>
      <div className="flex gap-3">
        <button onClick={() => setStep(0)} className="flex-1 bg-bg-secondary text-white/60 py-3 rounded-xl text-sm">← Atrás</button>
        <button
          onClick={() => setStep(2)}
          disabled={selectedStats.length < 2}
          className="flex-1 bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          Continuar →
        </button>
      </div>
    </motion.div>,

    // ── Step 2: Hábitos sugeridos ─────────────────────────────────────────────
    <motion.div key="step2" className="space-y-5">
      <div>
        <h2 className="text-xl font-display font-bold text-white">Tus primeros rituales</h2>
        <p className="text-white/40 text-sm mt-1">Elige los hábitos que quieres empezar. Puedes añadir más después.</p>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {suggestedHabits.map((h, i) => {
          const key = `${i}`;
          const checked = selectedHabits.has(key);
          const stat = selectedStats[Math.floor(i / 3)] || selectedStats[0];
          const statOpt = STAT_OPTIONS.find(s => s.stat === stat);
          return (
            <button
              key={key}
              onClick={() => toggleHabit(key)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                checked ? "border-accent-purple/60 bg-accent-purple/10" : "border-[#2d2d4a] hover:border-[#3d3d5a]"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                checked ? "border-accent-purple bg-accent-purple" : "border-gray-600"
              }`}>
                {checked && <span className="text-[10px] text-white">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{h.name}</p>
                <p className="text-xs text-white/40">{h.description}</p>
              </div>
              <span className="text-xs font-mono text-accent-gold flex-shrink-0">+{h.xp}xp</span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-3">
        <button onClick={() => setStep(1)} className="flex-1 bg-bg-secondary text-white/60 py-3 rounded-xl text-sm">← Atrás</button>
        <button
          onClick={() => setStep(3)}
          className="flex-1 bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          Continuar →
        </button>
      </div>
    </motion.div>,

    // ── Step 3: Meta de vida ──────────────────────────────────────────────────
    <motion.div key="step3" className="space-y-5">
      <div>
        <h2 className="text-xl font-display font-bold text-white">Tu gran meta</h2>
        <p className="text-white/40 text-sm mt-1">¿Qué quieres lograr en tu vida? Sé específico y ambicioso.</p>
      </div>
      <textarea
        value={lifeGoal}
        onChange={e => setLifeGoal(e.target.value)}
        placeholder="ej: Construir un negocio propio que me dé libertad financiera y de tiempo"
        rows={4}
        className="w-full bg-bg-secondary border border-[#2d2d4a] focus:border-accent-purple text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none"
        maxLength={200}
      />
      <p className="text-xs text-white/25">{lifeGoal.length}/200 · Puedes añadir más metas después</p>
      <div className="flex gap-3">
        <button onClick={() => setStep(2)} className="flex-1 bg-bg-secondary text-white/60 py-3 rounded-xl text-sm">← Atrás</button>
        <button
          onClick={() => setStep(4)}
          className="flex-1 bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          Continuar →
        </button>
      </div>
    </motion.div>,

    // ── Step 4: Clase revelada + inicio ───────────────────────────────────────
    <motion.div key="step4" className="space-y-6 text-center">
      <div>
        <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-2">Tu clase ha sido determinada</p>
        <div className="text-7xl mb-3">{CLASS_DESCRIPTIONS[predictedClass]?.emoji}</div>
        <h2 className="text-3xl font-display font-bold text-white">{predictedClass}</h2>
        <p className="text-white/50 text-sm mt-2 max-w-xs mx-auto">
          {CLASS_DESCRIPTIONS[predictedClass]?.lore}
        </p>
      </div>

      <div className="bg-bg-secondary border border-[#2d2d4a] rounded-2xl p-4 text-left space-y-2">
        <p className="text-xs font-mono text-white/40 uppercase tracking-widest">Tu aventura incluye</p>
        <div className="flex gap-4 text-sm">
          <span className="text-white/60">Personaje: <span className="text-white font-semibold">{charName}</span></span>
          <span className="text-white/60">Hábitos: <span className="text-accent-gold font-semibold">{selectedHabits.size}</span></span>
        </div>
        {lifeGoal && <p className="text-xs text-white/40 italic truncate">"{lifeGoal}"</p>}
      </div>

      <button
        onClick={finish}
        disabled={loading}
        className="w-full bg-gradient-to-r from-accent-purple to-accent-purple/70 hover:opacity-90 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all text-base shadow-lg shadow-accent-purple/30"
      >
        {loading ? "Creando tu mundo..." : "⚔️ Comenzar la aventura"}
      </button>
    </motion.div>,
  ];

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-white/30 font-mono mb-2">
            <span>Configuración</span>
            <span>{step + 1} / {steps.length}</span>
          </div>
          <div className="h-1 bg-bg-card rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-purple rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
