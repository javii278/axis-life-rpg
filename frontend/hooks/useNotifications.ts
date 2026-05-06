"use client";
import { useEffect, useCallback } from "react";

const STORAGE_KEY = "axis_notifications";

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

  // Comprueba si toca recordatorio (se llama al montar la app)
  useEffect(() => {
    const settings = getNotificationSettings();
    if (!settings.enabled || Notification.permission !== "granted") return;

    const now = new Date();
    const target = new Date();
    target.setHours(settings.reminderHour, settings.reminderMinute, 0, 0);

    // Si ya pasó hoy, para mañana
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

  return { requestPermission, sendNotification };
}
