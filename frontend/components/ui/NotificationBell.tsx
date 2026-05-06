"use client";
import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { useNotifications, getNotificationSettings, saveNotificationSettings } from "@/hooks/useNotifications";

export function NotificationBell() {
  const { requestPermission } = useNotifications();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
    const s = getNotificationSettings();
    setEnabled(s.enabled);
    setHour(s.reminderHour);
    setMinute(s.reminderMinute);
  }, []);

  async function toggle() {
    if (!enabled) {
      const granted = await requestPermission();
      if (!granted) return;
      setPermission("granted");
      saveNotificationSettings({ enabled: true });
      setEnabled(true);
    } else {
      saveNotificationSettings({ enabled: false });
      setEnabled(false);
    }
  }

  function saveTime() {
    saveNotificationSettings({ reminderHour: hour, reminderMinute: minute });
    setOpen(false);
  }

  if (typeof window !== "undefined" && !("Notification" in window)) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`p-2 rounded-lg transition-colors ${enabled ? "text-accent-gold hover:bg-accent-gold/10" : "text-gray-500 hover:text-gray-300 hover:bg-bg-hover"}`}
        title={enabled ? "Notificaciones activas" : "Notificaciones desactivadas"}
      >
        {enabled ? <Bell size={18} /> : <BellOff size={18} />}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 bg-bg-card border border-[#2d2d4a] rounded-xl p-4 w-64 shadow-2xl">
          <p className="text-sm font-semibold text-white mb-3">Notificaciones</p>

          {/* Toggle */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-gray-400">Recordatorio diario</span>
            <button
              onClick={toggle}
              className={`w-10 h-5 rounded-full transition-colors relative ${enabled ? "bg-accent-purple" : "bg-gray-600"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${enabled ? "left-5" : "left-0.5"}`} />
            </button>
          </div>

          {/* Hora */}
          {enabled && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Hora del recordatorio</p>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} max={23} value={hour}
                  onChange={(e) => setHour(parseInt(e.target.value))}
                  className="w-14 bg-bg-secondary border border-[#2d2d4a] text-white text-sm rounded-lg px-2 py-1 text-center"
                />
                <span className="text-gray-400">:</span>
                <input
                  type="number" min={0} max={59} step={5} value={minute}
                  onChange={(e) => setMinute(parseInt(e.target.value))}
                  className="w-14 bg-bg-secondary border border-[#2d2d4a] text-white text-sm rounded-lg px-2 py-1 text-center"
                />
              </div>
              <button
                onClick={saveTime}
                className="w-full mt-2 bg-accent-purple/20 hover:bg-accent-purple/30 text-accent-purple_light text-xs py-1.5 rounded-lg transition-colors font-medium"
              >
                Guardar
              </button>
            </div>
          )}

          {permission === "denied" && (
            <p className="text-xs text-red-400 mt-2">
              Notificaciones bloqueadas en el navegador. Actívalas en la configuración del sitio.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
