"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Repeat2, Timer, BarChart2, Sword } from "lucide-react";

const TABS = [
  { href: "/home",      label: "Inicio",   icon: LayoutDashboard },
  { href: "/habits",    label: "Hábitos",  icon: Repeat2 },
  { href: "/focus",     label: "Foco",     icon: Timer },
  { href: "/analytics", label: "Stats",    icon: BarChart2 },
  { href: "/character", label: "Personaje",icon: Sword },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary border-t border-[#1e1e2e] flex lg:hidden safe-bottom">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 transition-colors min-h-[52px] min-w-0 ${
              active ? "text-accent-purple_light" : "text-gray-500"
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${active ? "bg-accent-purple/20" : ""}`}>
              <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
            </div>
            <span className="text-[9px] font-medium leading-none truncate w-full text-center px-0.5">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
