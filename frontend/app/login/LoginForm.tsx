"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setAuth } from "@/lib/auth";

type Mode = "login" | "register";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let result;
      if (mode === "login") {
        result = await api.auth.login({ username, password });
      } else {
        result = await api.auth.register({
          username,
          password,
          display_name: displayName || username,
          email,
        });
      }
      setAuth(result.access_token, { user_id: result.user_id, display_name: result.display_name });
      router.push(mode === "register" ? "/onboarding" : "/home");
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  const input = "w-full bg-[#0d0d18] border border-[#2d2d4a] focus:border-[#7c3aed] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-600";

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          AXIS<span style={{ color: "#a78bfa" }}>.</span>
        </h1>
        <p className="text-gray-500 text-sm mt-2">The Life RPG</p>
      </div>

      {/* Card */}
      <div className="bg-[#14141f] border border-[#2d2d4a] rounded-2xl p-6 shadow-2xl">
        {/* Tabs */}
        <div className="flex gap-1 bg-[#0d0d18] rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => switchMode("login")}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
              background: mode === "login" ? "#7c3aed" : "transparent",
              color: mode === "login" ? "white" : "#9ca3af",
            }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
              background: mode === "register" ? "#7c3aed" : "transparent",
              color: mode === "register" ? "white" : "#9ca3af",
            }}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {mode === "register" && (
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#9ca3af", fontFamily: "monospace", marginBottom: "6px" }}>
                  Nombre del jugador
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Como quieres llamarte"
                  className={input}
                />
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "11px", color: "#9ca3af", fontFamily: "monospace", marginBottom: "6px" }}>
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="tu_usuario"
                required
                autoComplete="username"
                className={input}
              />
            </div>

            {mode === "register" && (
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#9ca3af", fontFamily: "monospace", marginBottom: "6px" }}>
                  Email <span style={{ color: "#4b5563" }}>(para recuperar contraseña)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className={input}
                />
              </div>
            )}

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "monospace" }}>
                  Contraseña
                </label>
                {mode === "login" && (
                  <a
                    href="/forgot-password"
                    style={{ fontSize: "10px", color: "#a78bfa", textDecoration: "none", fontFamily: "monospace" }}
                  >
                    ¿Olvidaste la contraseña?
                  </a>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={input}
              />
              {mode === "register" && (
                <p style={{ fontSize: "11px", color: "#4b5563", marginTop: "4px" }}>Mínimo 4 caracteres</p>
              )}
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171",
                fontSize: "12px",
                borderRadius: "10px",
                padding: "10px 12px",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#5b21b6" : "#7c3aed",
                color: "white",
                fontWeight: 700,
                padding: "12px 0",
                borderRadius: "12px",
                border: "none",
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "background 0.15s",
              }}
            >
              {loading ? "Cargando..." : mode === "login" ? "Entrar al juego" : "Crear cuenta"}
            </button>
          </div>
        </form>
      </div>

      <p style={{ textAlign: "center", color: "#4b5563", fontSize: "12px", marginTop: "24px" }}>
        {mode === "login" ? "¿Primera vez? " : "¿Ya tienes cuenta? "}
        <button
          type="button"
          onClick={() => switchMode(mode === "login" ? "register" : "login")}
          style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontSize: "12px" }}
        >
          {mode === "login" ? "Regístrate" : "Inicia sesión"}
        </button>
      </p>
    </div>
  );
}
