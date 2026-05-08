import { getToken, clearAuth } from "@/lib/auth";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000") + "/api";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("No autenticado");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (data: { username: string; password: string; display_name?: string; email?: string }) =>
      req<{ access_token: string; user_id: number; display_name: string }>("/auth/register", {
        method: "POST", body: JSON.stringify(data),
      }),
    login: (data: { username: string; password: string }) =>
      req<{ access_token: string; user_id: number; display_name: string }>("/auth/login", {
        method: "POST", body: JSON.stringify(data),
      }),
    me: () => req<{ user_id: number; display_name: string; username: string }>("/auth/me"),
    updateProfile: (data: { display_name: string }) =>
      req<{ access_token: string; user_id: number; display_name: string }>("/auth/profile", {
        method: "PATCH", body: JSON.stringify(data),
      }),
    changePassword: (data: { current_password: string; new_password: string }) =>
      req<{ ok: boolean }>("/auth/change-password", {
        method: "POST", body: JSON.stringify(data),
      }),
    forgotPassword: (email: string) =>
      req<{ ok: boolean; message: string }>("/auth/forgot-password", {
        method: "POST", body: JSON.stringify({ email }),
      }),
    resetPassword: (token: string, new_password: string) =>
      req<{ ok: boolean }>("/auth/reset-password", {
        method: "POST", body: JSON.stringify({ token, new_password }),
      }),
    dailyCheckin: () =>
      req("/auth/daily-checkin", { method: "POST" }),
  },

  // ── Character ───────────────────────────────────────────────────────────────
  character: {
    get: () => req("/character/"),
    create: (name: string) => req("/character/", { method: "POST", body: JSON.stringify({ name }) }),
    recalculate: () => req("/character/recalculate", { method: "POST" }),
    history: (days = 30) => req(`/character/history?days=${days}`),
  },

  // ── Habits ──────────────────────────────────────────────────────────────────
  habits: {
    list: () => req("/habits/"),
    create: (data: { name: string; description?: string; stat_target: string; frequency?: string; xp_reward?: number }) =>
      req("/habits/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: { name?: string; description?: string; is_active?: boolean }) =>
      req(`/habits/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => req(`/habits/${id}`, { method: "DELETE" }),
    complete: (id: number, data: { log_date: string; notes?: string; energy_level?: number }) =>
      req(`/habits/${id}/complete`, { method: "POST", body: JSON.stringify(data) }),
    undoComplete: (id: number, logDate: string) =>
      req(`/habits/${id}/complete/${logDate}`, { method: "DELETE" }),
    useShield: (id: number) =>
      req(`/habits/${id}/shield`, { method: "POST" }),
  },

  // ── Focus ───────────────────────────────────────────────────────────────────
  focus: {
    active: () => req("/focus/active"),
    list: (limit = 20) => req(`/focus/?limit=${limit}`),
    start: (data: { title: string; goal_id?: number }) =>
      req("/focus/start", { method: "POST", body: JSON.stringify(data) }),
    end: (id: number, data: { quality: number; notes?: string }) =>
      req(`/focus/${id}/end`, { method: "POST", body: JSON.stringify(data) }),
  },

  // ── Quests ──────────────────────────────────────────────────────────────────
  quests: {
    list: (completed = false) => req(`/quests/?completed=${completed}`),
    create: (data: { title: string; description?: string; quest_type?: string; xp_reward?: number; related_goal_id?: number; due_date?: string }) =>
      req("/quests/", { method: "POST", body: JSON.stringify(data) }),
    complete: (id: number) => req(`/quests/${id}/complete`, { method: "POST" }),
    delete: (id: number) => req(`/quests/${id}`, { method: "DELETE" }),
    generateFromGoals: () => req("/quests/generate-from-goals", { method: "POST" }),
  },

  // ── Coach ───────────────────────────────────────────────────────────────────
  coach: {
    chat: (message: string) => req("/coach/chat", { method: "POST", body: JSON.stringify({ message }) }),
    weeklyInsight: () => req("/coach/weekly-insight"),
  },

  // ── Achievements ─────────────────────────────────────────────────────────────
  achievements: {
    list: () => req("/achievements/"),
    check: () => req("/achievements/check", { method: "POST" }),
  },

  // ── Analytics ────────────────────────────────────────────────────────────────
  analytics: {
    summary: () => req("/analytics/summary"),
  },

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  leaderboard: {
    weekly: () => req("/leaderboard/weekly"),
  },

  // ── Goals ───────────────────────────────────────────────────────────────────
  goals: {
    list: () => req("/goals/"),
    flat: (level?: number) => req(`/goals/flat${level !== undefined ? `?level=${level}` : ""}`),
    create: (data: { title: string; description?: string; level?: number; parent_id?: number; due_date?: string }) =>
      req("/goals/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: { title?: string; description?: string; is_completed?: boolean; due_date?: string }) =>
      req(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) => req(`/goals/${id}`, { method: "DELETE" }),
  },
};
