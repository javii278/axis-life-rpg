"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Repeat2, ShoppingBag, Trophy, BookOpen } from "lucide-react";
import { hapticLight } from "@/lib/haptics";

const TABS = [
  { href: "/home",         label: "Inicio",  Icon: LayoutDashboard },
  { href: "/habits",       label: "Hábitos", Icon: Repeat2 },
  { href: "/shop",         label: "Tienda",  Icon: ShoppingBag },
  { href: "/achievements", label: "Logros",  Icon: Trophy },
  { href: "/review",       label: "Review",  Icon: BookOpen },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-[#1a1a2e]">
        {TABS.map(({ href, label, Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => hapticLight()}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[58px] relative active:opacity-70 transition-opacity duration-75"
            >
              <div className="relative flex items-center justify-center">
                {active && (
                  <span className="absolute inset-[-6px_-14px] bg-accent-purple/15 rounded-full" />
                )}
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.5}
                  className={`relative transition-colors duration-150 ${
                    active ? "text-accent-purple_light" : "text-gray-600"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-semibold leading-none transition-colors duration-150 ${
                  active ? "text-accent-purple_light" : "text-gray-600"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
