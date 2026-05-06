"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard, Repeat2, Timer, Target, Sword,
  CalendarCheck, ScrollText, MessageCircle, Trophy, LogOut, BarChart2, Settings
} from "lucide-react";
import { isAuthenticated, clearAuth, getStoredUser } from "@/lib/auth";
import { BottomNav } from "@/components/ui/BottomNav";

const NAV = [
  { href: "/home",         label: "Dashboard", icon: LayoutDashboard },
  { href: "/habits",       label: "Hábitos",   icon: Repeat2 },
  { href: "/focus",        label: "Foco",      icon: Timer },
  { href: "/goals",        label: "Metas",     icon: Target },
  { href: "/quests",       label: "Misiones",  icon: ScrollText },
  { href: "/character",    label: "Personaje", icon: Sword },
  { href: "/achievements", label: "Logros",    icon: Trophy },
  { href: "/analytics",   label: "Analytics", icon: BarChart2 },
  { href: "/review",      label: "Review",    icon: CalendarCheck },
  { href: "/coach",        label: "Consejero", icon: MessageCircle },
  { href: "/settings",    label: "Ajustes",   icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const user = getStoredUser();

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/login");
  }, [router]);

  function logout() {
    clearAuth();
    router.push("/login");
  }

  if (!isAuthenticated()) return null;

  return (
    <div className="flex min-h-screen min-h-dvh">
      {/* ── Sidebar (solo desktop) ───────────────────────────────── */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 bg-bg-secondary border-r border-[#1e1e2e] flex-col py-6 px-3">
        <div className="px-3 mb-8">
          <span className="text-lg font-display font-bold text-white">AXIS</span>
          <span className="text-accent-purple_light text-lg">.</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link
                key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent-purple/20 text-accent-purple_light"
                    : "text-gray-400 hover:text-white hover:bg-bg-hover"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#1e1e2e] pt-4 mt-4 px-3">
          {user && <p className="text-xs text-gray-500 truncate mb-2">{user.display_name}</p>}
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors w-full"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">
        {children}
      </main>

      {/* ── Bottom nav (solo móvil) ──────────────────────────────── */}
      <BottomNav />
    </div>
  );
}
