"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setAuth, getStoredUser, clearAuth } from "@/lib/auth";
import { User, Lock, Bell, Trash2, CheckCircle, AlertCircle } from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-card border border-[#2d2d4a] rounded-2xl p-6 space-y-4">
      <h2 className="text-sm font-mono text-gray-400 uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  );
}

function StatusMsg({ type, msg }: { type: "ok" | "err"; msg: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
      type === "ok"
        ? "bg-green-500/10 border border-green-500/30 text-green-400"
        : "bg-red-500/10 border border-red-500/30 text-red-400"
    }`}>
      {type === "ok" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
      {msg}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const user = getStoredUser();

  // Profile
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [profileStatus, setProfileStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwStatus, setPwStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Notifications
  const [notifEnabled, setNotifEnabled] = useState(
    typeof window !== "undefined" ? localStorage.getItem("axis_notif_enabled") === "true" : false
  );
  const [notifHour, setNotifHour] = useState(
    typeof window !== "undefined" ? localStorage.getItem("axis_notif_hour") ?? "20" : "20"
  );
  const [notifMin, setNotifMin] = useState(
    typeof window !== "undefined" ? localStorage.getItem("axis_notif_min") ?? "00" : "00"
  );

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileStatus(null);
    try {
      const res = await api.auth.updateProfile({ display_name: displayName });
      setAuth(res.access_token, { user_id: res.user_id, display_name: res.display_name });
      setProfileStatus({ type: "ok", msg: "Nombre actualizado correctamente" });
    } catch (err: any) {
      setProfileStatus({ type: "err", msg: err.message || "Error al actualizar" });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPwStatus(null);
    if (newPw !== confirmPw) {
      setPwStatus({ type: "err", msg: "Las contraseñas no coinciden" });
      return;
    }
    if (newPw.length < 4) {
      setPwStatus({ type: "err", msg: "La contraseña debe tener al menos 4 caracteres" });
      return;
    }
    setPwLoading(true);
    try {
      await api.auth.changePassword({ current_password: currentPw, new_password: newPw });
      setPwStatus({ type: "ok", msg: "Contraseña actualizada. Inicia sesión de nuevo." });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      setPwStatus({ type: "err", msg: err.message || "Error al cambiar contraseña" });
    } finally {
      setPwLoading(false);
    }
  }

  function saveNotifSettings() {
    localStorage.setItem("axis_notif_enabled", String(notifEnabled));
    localStorage.setItem("axis_notif_hour", notifHour);
    localStorage.setItem("axis_notif_min", notifMin);
    if (notifEnabled && typeof window !== "undefined") {
      Notification.requestPermission();
    }
  }

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona tu cuenta y preferencias</p>
      </div>

      {/* Perfil */}
      <Section title="Perfil">
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-mono block mb-1.5">Nombre del jugador</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-bg-secondary border border-[#2d2d4a] focus:border-accent-purple text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />
          </div>
          {profileStatus && <StatusMsg {...profileStatus} />}
          <button
            type="submit"
            disabled={profileLoading || !displayName.trim()}
            className="flex items-center gap-2 bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <User size={14} />
            {profileLoading ? "Guardando..." : "Guardar nombre"}
          </button>
        </form>
      </Section>

      {/* Contraseña */}
      <Section title="Cambiar contraseña">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-mono block mb-1.5">Contraseña actual</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-bg-secondary border border-[#2d2d4a] focus:border-accent-purple text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-mono block mb-1.5">Nueva contraseña</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full bg-bg-secondary border border-[#2d2d4a] focus:border-accent-purple text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-mono block mb-1.5">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full bg-bg-secondary border border-[#2d2d4a] focus:border-accent-purple text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />
          </div>
          {pwStatus && <StatusMsg {...pwStatus} />}
          <button
            type="submit"
            disabled={pwLoading || !currentPw || !newPw || !confirmPw}
            className="flex items-center gap-2 bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <Lock size={14} />
            {pwLoading ? "Actualizando..." : "Cambiar contraseña"}
          </button>
        </form>
      </Section>

      {/* Notificaciones */}
      <Section title="Notificaciones">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white font-medium">Recordatorio diario</div>
              <div className="text-xs text-gray-500 mt-0.5">Recibe una notificación del navegador cada día</div>
            </div>
            <button
              onClick={() => setNotifEnabled(!notifEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${notifEnabled ? "bg-accent-purple" : "bg-bg-secondary border border-[#2d2d4a]"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifEnabled ? "translate-x-5" : ""}`} />
            </button>
          </div>
          {notifEnabled && (
            <div className="flex items-center gap-3">
              <Bell size={14} className="text-gray-500" />
              <span className="text-xs text-gray-400">Hora del recordatorio:</span>
              <select
                value={notifHour}
                onChange={(e) => setNotifHour(e.target.value)}
                className="bg-bg-secondary border border-[#2d2d4a] text-white rounded-lg px-2 py-1 text-sm outline-none"
              >
                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span className="text-gray-500">:</span>
              <select
                value={notifMin}
                onChange={(e) => setNotifMin(e.target.value)}
                className="bg-bg-secondary border border-[#2d2d4a] text-white rounded-lg px-2 py-1 text-sm outline-none"
              >
                {["00", "15", "30", "45"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={saveNotifSettings}
            className="flex items-center gap-2 bg-bg-secondary hover:bg-bg-hover border border-[#2d2d4a] text-gray-300 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Bell size={14} />
            Guardar preferencias
          </button>
        </div>
      </Section>

      {/* Sesión */}
      <Section title="Sesión">
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Usuario conectado como <span className="text-white font-mono">{user?.display_name}</span>
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
          >
            <Trash2 size={14} />
            Cerrar sesión
          </button>
        </div>
      </Section>
    </div>
  );
}
