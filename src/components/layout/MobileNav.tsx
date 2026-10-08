"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sparkles, CheckSquare, Calendar, Wallet, Settings } from "lucide-react";

const mobileNavItems = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/assistant", label: "IRIS", icon: Sparkles },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];


export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 px-2 py-1.5 shadow-lg safe-bottom"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[48px] touch-manipulation ${
                isActive
                  ? "text-stone-900 font-semibold"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              <div className={`p-1 rounded-md transition-colors ${isActive ? "bg-stone-100" : ""}`}>
                <Icon className={`w-4 h-4 stroke-[2] ${isActive ? "text-stone-900" : "text-stone-400"}`} />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? "text-stone-900 font-medium" : "text-stone-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
