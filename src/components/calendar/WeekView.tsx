"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw, Loader2, LayoutGrid, CalendarDays } from "lucide-react";
import { DOMAIN_BADGE_STYLES, Domain } from "@/types/ui";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

export function WeekView() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [mobileMode, setMobileMode] = useState<"day" | "grid">("day");

  const fetchWeekEvents = async (weekStart: Date) => {
    try {
      setLoading(true);
      const weekEnd = addDays(weekStart, 7);
      const res = await fetch(`/api/calendar/events?startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setEvents(data);
      }
    } catch (err) {
      console.error("Error fetching week events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekEvents(currentWeekStart);
    // Find today in current week if available
    const today = new Date();
    const todayIndex = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
      .findIndex(d => isSameDay(d, today));
    if (todayIndex !== -1) {
      setSelectedDayIdx(todayIndex);
    }
  }, [currentWeekStart]);

  const handleSync = async () => {
    setIsSyncing(true);
    await fetchWeekEvents(currentWeekStart);
    setIsSyncing(false);
  };

  const nextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));
  const prevWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const resetToToday = () => {
    const todayStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    setCurrentWeekStart(todayStart);
    const todayIndex = Array.from({ length: 7 }, (_, i) => addDays(todayStart, i))
      .findIndex(d => isSameDay(d, new Date()));
    if (todayIndex !== -1) setSelectedDayIdx(todayIndex);
  };

  // Build the 7 days array
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(currentWeekStart, i);
    const dStr = format(d, "yyyy-MM-dd");
    return {
      dateObj: d,
      name: format(d, "EEE"),
      date: format(d, "d"),
      dateStr: dStr,
      isToday: dStr === todayStr,
      index: i,
    };
  });

  const selectedDay = days[selectedDayIdx] || days[0];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white border border-stone-200/90 rounded-xl shadow-xs overflow-hidden">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 border-b border-stone-200/80 gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              {format(currentWeekStart, "MMMM yyyy")}
            </h3>
            <span className="text-xs text-stone-400">
              {format(currentWeekStart, "MMM d")} – {format(addDays(currentWeekStart, 6), "MMM d")}
            </span>
          </div>

          {/* Mobile Day/Grid View Switcher */}
          <div className="flex sm:hidden items-center bg-stone-100 rounded-md p-0.5 border border-stone-200/60">
            <button
              onClick={() => setMobileMode("day")}
              className={`p-1 rounded text-xs transition-colors ${
                mobileMode === "day" ? "bg-white text-stone-900 shadow-2xs font-medium" : "text-stone-500"
              }`}
              title="Day view"
            >
              <CalendarDays className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobileMode("grid")}
              className={`p-1 rounded text-xs transition-colors ${
                mobileMode === "grid" ? "bg-white text-stone-900 shadow-2xs font-medium" : "text-stone-500"
              }`}
              title="7-day grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="h-7.5 text-xs border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-md"
          >
            <RefreshCw className={`w-3 h-3 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
            Sync Cal.com
          </Button>

          <div className="flex items-center gap-0.5 bg-stone-100 rounded-md p-0.5 border border-stone-200/60">
            <Button variant="ghost" size="icon" onClick={prevWeek} className="h-6.5 w-6.5 text-stone-600 hover:text-stone-900">
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={resetToToday} className="h-6.5 px-2 text-xs font-medium text-stone-800">
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={nextWeek} className="h-6.5 w-6.5 text-stone-600 hover:text-stone-900">
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Day Selector Bar (active in day mode on mobile) */}
      <div className="flex sm:hidden border-b border-stone-200/80 bg-stone-50/50 p-1.5 justify-between">
        {days.map((day) => {
          const isSelected = selectedDayIdx === day.index;
          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDayIdx(day.index)}
              className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-md transition-colors ${
                isSelected
                  ? "bg-stone-900 text-white shadow-2xs"
                  : day.isToday
                  ? "bg-stone-200/70 text-stone-900 font-semibold"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <span className={`text-[10px] font-medium uppercase ${isSelected ? "text-stone-300" : "text-stone-400"}`}>
                {day.name[0]}
              </span>
              <span className="text-xs font-bold tabular-nums mt-0.5">
                {day.date}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid Container */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20 text-xs text-stone-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
          Loading week events from Supabase & Cal.com...
        </div>
      ) : (
        <div className="flex-1 overflow-auto flex">
          {/* Hours Column */}
          <div className="w-14 sm:w-16 shrink-0 border-r border-stone-200/70 bg-stone-50/50 flex flex-col select-none">
            <div className="h-10 border-b border-stone-200/70 shrink-0 sticky top-0 bg-stone-50/90 z-20" />
            <div className="relative flex-1">
              {HOURS.map((hour) => (
                <div key={hour} className="h-16 text-[10px] sm:text-[11px] font-medium text-stone-400 text-right pr-1.5 sm:pr-2 relative">
                  <span className="absolute -top-2 right-1.5 sm:right-2 tabular-nums">
                    {hour > 12 ? `${hour - 12} PM` : hour === 12 ? `12 PM` : `${hour} AM`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Days Rendering: either Mobile Single Day or Desktop Full 7-Day Grid */}
          <div className={`flex-1 ${
            mobileMode === "day" 
              ? "flex sm:grid sm:grid-cols-7 sm:min-w-[760px]" 
              : "grid grid-cols-7 min-w-[700px]"
          } divide-x divide-stone-200/70 overflow-x-auto`}>
            {(mobileMode === "day" ? [selectedDay] : days).map((day) => {
              const dayEvents = events.filter((e) => {
                const eventDate = new Date(e.startTime);
                return format(eventDate, "yyyy-MM-dd") === day.dateStr;
              });

              return (
                <div
                  key={day.dateStr}
                  className={`flex-1 flex flex-col relative ${day.isToday ? "bg-stone-50/40" : "bg-white"}`}
                >
                  {/* Day Header (visible on desktop or in grid mode) */}
                  <div
                    className={`h-10 border-b border-stone-200/70 flex items-center justify-center shrink-0 sticky top-0 z-10 backdrop-blur-sm ${
                      day.isToday ? "bg-stone-100/90 border-b-stone-900" : "bg-white/90"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium uppercase text-stone-400">
                        {day.name}
                      </span>
                      <span
                        className={`text-xs font-semibold px-1 py-0.5 rounded ${
                          day.isToday
                            ? "bg-stone-900 text-white"
                            : "text-stone-800"
                        }`}
                      >
                        {day.date}
                      </span>
                    </div>
                  </div>

                  {/* Day Timeline Column */}
                  <div className="relative flex-1">
                    {HOURS.map((hour) => (
                      <div key={hour} className="h-16 border-b border-stone-100/80" />
                    ))}

                    {/* Real Event Blocks */}
                    {dayEvents.map((event) => {
                      const startDate = new Date(event.startTime);
                      const endDate = new Date(event.endTime);
                      const startHour = startDate.getHours() + startDate.getMinutes() / 60;
                      const durationHours = Math.max(0.5, (endDate.getTime() - startDate.getTime()) / 3600000);

                      const topOffsetPx = Math.max(0, (startHour - 7) * 64);
                      const heightPx = Math.max(28, durationHours * 64);
                      const domainKey = (event.domain as Domain) || "work";
                      const badge = DOMAIN_BADGE_STYLES[domainKey] || DOMAIN_BADGE_STYLES.work;

                      return (
                        <div
                          key={event.id}
                          style={{ top: `${topOffsetPx}px`, height: `${heightPx}px` }}
                          className={`absolute left-1 right-1 rounded-md p-1.5 border shadow-xs overflow-hidden cursor-pointer ${
                            event.source === 'calcom' ? 'bg-stone-100 border-stone-300' : `${badge.bg} ${badge.border}`
                          }`}
                        >
                          <div className="flex items-center gap-1 text-[11px] font-medium truncate text-stone-900">
                            {event.source === "calcom" && (
                              <CalendarIcon className="w-2.5 h-2.5 text-stone-600 shrink-0" />
                            )}
                            <span className="truncate">{event.title}</span>
                          </div>
                          <div className="text-[10px] text-stone-500">
                            {format(startDate, "h:mm a")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
