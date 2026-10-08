import { WeekView } from "@/components/calendar/WeekView";

export default function CalendarPage() {
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-xl font-semibold text-zinc-100">Calendar</h2>
      </div>
      <WeekView />
    </div>
  );
}
