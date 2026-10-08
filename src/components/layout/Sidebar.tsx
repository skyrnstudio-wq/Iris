"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sparkles, CheckSquare, Calendar, Flame, BarChart3, Settings, Wallet } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IrisLogo } from "@/components/brand/IrisLogo";

const navItems = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/assistant", label: "IRIS Assistant", icon: Sparkles },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/habits", label: "Habits", icon: Flame },
  { href: "/analytics", label: "Review", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];


export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-16 h-full bg-white border-r border-stone-200/80 flex-col items-center py-5 justify-between select-none shrink-0 sticky top-0">
      <div className="flex flex-col items-center w-full">
        <Link href="/" className="group mb-8 flex flex-col items-center gap-1.5 focus:outline-none">
          <IrisLogo 
            size={34} 
            variant="badge" 
            className="transition-transform duration-200 group-hover:scale-105 shadow-xs" 
          />
          <span className="text-[9px] font-semibold tracking-widest uppercase text-stone-400 group-hover:text-stone-700 transition-colors">
            IRIS
          </span>
        </Link>
        
        <nav className="flex flex-col gap-1.5 w-full px-2.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger>
                  <Link 
                    href={item.href}
                    className={`flex items-center justify-center w-11 h-10 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-stone-900 text-white' 
                        : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[1.8]" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-stone-900 text-white border-stone-800 text-xs py-1 px-2.5">
                  <p className="font-medium">{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </div>

      <div className="text-[10px] text-stone-300 font-mono">
        v1.0
      </div>
    </aside>
  );
}
