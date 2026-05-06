"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setAuth } from "@/lib/auth";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;
      if (mode === "login") {
        result = await api.auth.login({ username, password });
      } else {
        result = await api.auth.register({ username, password, display_name: displayName || username });
      }
      setAuth(result.access_token, { user_id: result.user_id, display_name: result.display_name });
      // Nuevo registro → onboarding; login existente → dashboard
      router.push(mode === "register" ? "/onboarding" : "/home");
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            AXIS<span className="text-accent-purple_light">.</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2">The Life RPG</p>
        </div>

        {/* Card */}
        <div className="bg-bg-card border border-[#2d2d4a] rounded-2xl p-6 shadow-2xl">
          {/* Tabs */}
          <div className="flex gap-1 bg-bg-secondary rounded-xl p-1 mb-6">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === m ? "bg-accent-purple text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Iniciar sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display name (solo registro) */}
            {mode === "register" && (
              <div>
                <label className="text-xs text-gray-400 font-mono block mb-1.5">Nombre del jugador</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Como quieres llamarte"
                  className="w-full bg-bg-secondary border border-[#2d2d4a] focus:border-accent-purple text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                />
              </div>
            )}

            {/* Username */}
            <div>
              <label className="text-xs text-gray-400 font-mono block mb-1.5">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="tu_usuario"
                required
                autoComplete="username"
                className="w-full bg-bg-secondary border border-[#2d2d4a] focus:border-accent-purple text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-gray-400 font-mono block mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full bg-bg-secondary border border-[#2d2d4a] focus:border-accent-purple text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              />
              {mode === "register" && (
                <p className="text-xs text-gray-600 mt-1">Mínimo 4 caracteres</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {loading
                ? "Cargando..."
                : mode === "login"
                ? "Entrar al juego"
                : "Crear cuenta"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          {mode === "login"
            ? "¿Primera vez? "
            : "¿Ya tienes cuenta? "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            className="text-accent-purple_light hover:underline"
          >
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}
