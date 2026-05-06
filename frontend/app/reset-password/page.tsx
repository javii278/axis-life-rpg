"use client";
import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError("Enlace inválido. Solicita uno nuevo.");
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    if (password.length < 4) { setError("Mínimo 4 caracteres"); return; }
    setError("");
    setLoading(true);
    try {
      await api.auth.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message || "Error al restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-[#0d0d18] border border-[#2d2d4a] focus:border-[#7c3aed] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-600";

  return (
    <div className="bg-[#14141f] border border-[#2d2d4a] rounded-2xl p-6 shadow-2xl">
      {success ? (
        <div className="text-center py-4 space-y-3">
          <div className="text-4xl">✅</div>
          <h2 className="text-white font-display font-bold text-lg">Contraseña actualizada</h2>
          <p className="text-gray-400 text-sm">Redirigiendo al login en 3 segundos...</p>
          <Link href="/login" className="inline-block text-[#a78bfa] text-sm hover:text-white transition-colors font-mono">
            Ir al login →
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-white font-display font-bold mb-1">Nueva contraseña</h2>
          <p className="text-gray-500 text-sm mb-5">Elige una contraseña segura para tu cuenta.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-mono block mb-1.5">Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-mono block mb-1.5">Confirmar contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token || !password || !confirm}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/login" className="text-4xl font-display font-bold text-white tracking-tight hover:opacity-80 transition-opacity">
            AXIS<span className="text-[#a78bfa]">.</span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">Restablecer contraseña</p>
        </div>
        <Suspense fallback={<div className="text-gray-500 text-sm text-center">Cargando...</div>}>
          <ResetForm />
        </Suspense>
        <p className="text-center text-gray-600 text-xs mt-6">
          <Link href="/login" className="text-[#a78bfa] hover:underline">← Volver al login</Link>
        </p>
      </div>
    </div>
  );
}
