"use client";
import { useEffect, useCallback, useRef } from "react";
import type { Habit } from "@/lib/types";

const STORAGE_KEY = "axis_notifications";
// Clave para saber si ya se envió la notificación de racha hoy (evitar spam al reabrir la app)
const STREAK_NOTIF_KEY = "axis_streak_notif_date";

interface NotificationSettings {
  enabled: boolean;
  reminderHour: number;   // 0-23
  reminderMinute: number; // 0-59
  streakWarning: boolean;
}

const DEFAULTS: NotificationSettings = {
  enabled: false,
  reminderHour: 20,
  reminderMinute: 0,
  streakWarning: true,
};

export function getNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveNotificationSettings(settings: Partial<NotificationSettings>) {
  const current = getNotificationSettings();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...settings }));
}

export function useNotifications() {
  const streakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    const result = await Notification.requestPermission();
    return result === "granted";
  }, []);

  const sendNotification = useCallback((title: string, body: string, icon = "/favicon.ico") => {
    if (typeof window === "undefined" || Notification.permission !== "granted") return;
    new Notification(title, { body, icon });
  }, []);

  // Recordatorio diario genérico al montar la app
  useEffect(() => {
    const settings = getNotificationSettings();
    if (!settings.enabled || Notification.permission !== "granted") return;

    const now = new Date();
    const target = new Date();
    target.setHours(settings.reminderHour, settings.reminderMinute, 0, 0);
    if (now > target) target.setDate(target.getDate() + 1);

    const ms = target.getTime() - now.getTime();
    const timer = setTimeout(() => {
      sendNotification(
        "⚡ Axis — Recuerda tus hábitos",
        "Faltan hábitos por completar hoy. ¡No rompas la racha!"
      );
    }, ms);

    return () => clearTimeout(timer);
  }, [sendNotification]);

  // Notificación de racha en peligro — se llama con los hábitos actuales cada vez que cambian
  const scheduleStreakDanger = useCallback((habits: Habit[]) => {
    if (typeof window === "undefined") return;
    if (streakTimerRef.current) clearTimeout(streakTimerRef.current);

    const settings = getNotificationSettings();
    if (!settings.enabled || !settings.streakWarning || Notification.permission !== "granted") return;

    // Solo hábitos diarios con racha activa que aún no se completaron hoy
    const atRisk = habits.filter(h => !h.completed_today && h.streak > 0 && h.frequency === "daily");
    if (atRisk.length === 0) return;

    const maxStreak = Math.max(...atRisk.map(h => h.streak));
    const count = atRisk.length;
    const habitName = count === 1 ? `"${atRisk[0].name}"` : `${count} hábitos`;

    const fire = () => {
      // Evitar duplicados si la app se recarga varias veces el mismo día
      const today = new Date().toDateString();
      if (localStorage.getItem(STREAK_NOTIF_KEY) === today) return;
      localStorage.setItem(STREAK_NOTIF_KEY, today);

      sendNotification(
        `🔥 ¡Racha de ${maxStreak} días en peligro!`,
        `${habitName} ${count === 1 ? "no está" : "no están"} completado${count === 1 ? "" : "s"}. Medianoche acaba con tu racha.`
      );
    };

    const now = new Date();
    const danger = new Date();
    danger.setHours(21, 0, 0, 0); // 21:00

    if (now >= danger) {
      // Ya pasaron las 9pm y hay rachas sin completar → notificar inmediatamente
      fire();
    } else {
      const ms = danger.getTime() - now.getTime();
      streakTimerRef.current = setTimeout(fire, ms);
    }
  }, [sendNotification]);

  return { requestPermission, sendNotification, scheduleStreakDanger };
}
