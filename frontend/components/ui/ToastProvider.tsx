"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ToastType = "achievement" | "success" | "warning" | "info";

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  icon?: string;
  rarity?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, "id">) => void;
  showAchievement: (achievement: { name: string; icon: string; rarity: string }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const RARITY_COLORS: Record<string, string> = {
  bronze: "from-amber-700 to-amber-500 border-amber-400",
  silver: "from-slate-500 to-slate-300 border-slate-200",
  gold:   "from-yellow-600 to-yellow-300 border-yellow-200",
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => dismiss(id), toast.duration ?? 4000);
  }, [dismiss]);

  const showAchievement = useCallback((achievement: { name: string; icon: string; rarity: string }) => {
    showToast({
      type: "achievement",
      title: "¡Logro Desbloqueado!",
      message: achievement.name,
      icon: achievement.icon,
      rarity: achievement.rarity,
      duration: 6000,
    });
    // Notificación del navegador si tiene permiso
    if (typeof window !== "undefined" && Notification.permission === "granted") {
      new Notification(`${achievement.icon} ¡Logro desbloqueado!`, {
        body: achievement.name,
        icon: "/favicon.ico",
      });
    }
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showAchievement }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const rarityClass = toast.rarity ? RARITY_COLORS[toast.rarity] ?? RARITY_COLORS.bronze : "";

  if (toast.type === "achievement") {
    return (
      <div
        className={`pointer-events-auto animate-slide-in bg-gradient-to-r ${rarityClass} border rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 min-w-64 cursor-pointer`}
        onClick={() => onDismiss(toast.id)}
      >
        <span className="text-3xl">{toast.icon}</span>
        <div>
          <p className="text-xs font-bold text-white/70 uppercase tracking-widest">{toast.title}</p>
          <p className="text-sm font-bold text-white">{toast.message}</p>
        </div>
      </div>
    );
  }

  const bgMap: Record<ToastType, string> = {
    success: "bg-emerald-800 border-emerald-500",
    warning: "bg-amber-800 border-amber-500",
    info:    "bg-indigo-800 border-indigo-500",
    achievement: "",
  };

  return (
    <div
      className={`pointer-events-auto animate-slide-in ${bgMap[toast.type]} border rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 min-w-64 cursor-pointer`}
      onClick={() => onDismiss(toast.id)}
    >
      {toast.icon && <span className="text-xl">{toast.icon}</span>}
      <div>
        <p className="text-sm font-semibold text-white">{toast.title}</p>
        {toast.message && <p className="text-xs text-white/70">{toast.message}</p>}
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
