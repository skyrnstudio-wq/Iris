"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarCheck } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { IrisLogo } from "@/components/brand/IrisLogo";

export function TopBar() {
  const pathname = usePathname();
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setTime(new Date()), 0);
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => {
      clearTimeout(id);
      clearInterval(timer);
    };
  }, []);

  const getPageTitle = (path: string | null) => {
    if (!path || path === "/") return "Today";
    if (path === "/assistant") return "IRIS Assistant";
    if (path === "/finance") return "Personal & Studio Finance";
    if (path === "/tasks") return "Tasks";
    if (path === "/calendar") return "Calendar";
    if (path === "/habits") return "Habits";
    if (path === "/analytics") return "Weekly Review";
    if (path === "/settings") return "Settings";
    const name = path.substring(1).charAt(0).toUpperCase() + path.substring(2);
    return name;
  };

  return (
    <header className="h-14 bg-white border-b border-stone-200/80 flex items-center justify-between px-4 sm:px-6 md:px-8 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Mobile brand mark */}
        <Link href="/" className="md:hidden flex items-center shrink-0">
          <IrisLogo size={26} variant="badge" className="shadow-2xs rounded-[7px]" />
        </Link>
        <h1 className="text-sm font-semibold tracking-tight text-stone-900 truncate">
          {getPageTitle(pathname)}
        </h1>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-xs text-stone-500 shrink-0">
        {/* Cal.com status badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-stone-50 border border-stone-200/80 text-stone-600 font-medium text-[11px] sm:text-xs">
          <CalendarCheck className="w-3.5 h-3.5 text-stone-700 shrink-0" />
          <span className="hidden sm:inline">Cal.com connected</span>
          <span className="sm:hidden text-[10px]">Cal.com</span>
        </div>

        <div className="h-3.5 w-px bg-stone-200 hidden sm:block" />

        {/* Current Time */}
        <span className="tabular-nums font-medium text-stone-600 text-xs">
          {time ? (
            <>
              <span className="hidden sm:inline">{format(time, 'EEE, MMM d • h:mm a')}</span>
              <span className="sm:hidden">{format(time, 'h:mm a')}</span>
            </>
          ) : ''}
        </span>

        {/* Notifications */}
        <button 
          aria-label="Notifications"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors focus:outline-none"
        >
          <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.8]" />
        </button>
      </div>
    </header>
  );
}
