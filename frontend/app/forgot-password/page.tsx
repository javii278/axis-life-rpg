"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Error al enviar el email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/login" className="text-4xl font-display font-bold text-white tracking-tight hover:opacity-80 transition-opacity">
            AXIS<span className="text-[#a78bfa]">.</span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">Recuperar contraseña</p>
        </div>

        <div className="bg-[#14141f] border border-[#2d2d4a] rounded-2xl p-6 shadow-2xl">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="text-4xl">📧</div>
              <h2 className="text-white font-display font-bold text-lg">Email enviado</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Si ese email está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <p className="text-gray-600 text-xs">Revisa también tu carpeta de spam.</p>
              <Link
                href="/login"
                className="inline-block mt-2 text-[#a78bfa] text-sm hover:text-white transition-colors font-mono"
              >
                ← Volver al login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-white font-display font-bold mb-1">¿Olvidaste tu contraseña?</h2>
              <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                Introduce tu email y te enviamos un enlace para crear una nueva.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-mono block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    autoFocus
                    className="w-full bg-[#0d0d18] border border-[#2d2d4a] focus:border-[#7c3aed] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-600"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-3 py-2.5">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                </button>
              </form>
            </>
          )}
        </div>

        {!submitted && (
          <p className="text-center text-gray-600 text-xs mt-6">
            <Link href="/login" className="text-[#a78bfa] hover:underline">
              ← Volver al login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
