"use client";

import { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Plus, 
  Droplets, 
  AlertCircle,
  RefreshCw,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DOMAIN_BADGE_STYLES, Domain } from "@/types/ui";
import { format } from "date-fns";
import { PlannerChat } from "@/components/chat/PlannerChat";
import { IrisLogo } from "@/components/brand/IrisLogo";

export function DashboardClient() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [dailyPlan, setDailyPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<Domain>("work");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const [tasksRes, calRes, planRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch(`/api/calendar/events?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`),
        fetch(`/api/schedule?date=${startOfDay.toISOString()}`),
      ]);

      const tasksData = await tasksRes.json();
      const calData = await calRes.json();
      const planData = await planRes.json();

      if (Array.isArray(tasksData)) setTasks(tasksData);
      if (Array.isArray(calData)) setCalendarEvents(calData);
      if (planData && planData.timeBlocksJson) {
        try {
          const blocks = JSON.parse(planData.timeBlocksJson);
          setDailyPlan({ ...planData, blocks });
        } catch {
          setDailyPlan(planData);
        }
      } else {
        setDailyPlan(null);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "planned" : "done";
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));

    try {
      await fetch(`/api/tasks/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      loadData();
    } catch (err) {
      console.error("Error toggling task status:", err);
      loadData();
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          domain: selectedDomain,
          status: "planned",
          priority: "medium",
          estimatedMin: 30,
        }),
      });

      if (res.ok) {
        setNewTaskTitle("");
        loadData();
      }
    } catch (err) {
      console.error("Error creating quick task:", err);
    }
  };

  const completedCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Next meeting from live calendar events
  const now = new Date();
  const nextMeeting = calendarEvents.find((e) => new Date(e.startTime) >= now && e.source === "calcom");

  // Deadlines
  const overdueOrSoon = tasks.filter((t) => t.status !== "done" && t.deadline).slice(0, 3);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Top Day Overview */}
      <section className="bg-white rounded-xl border border-stone-200/90 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-100">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900">
              Good day, Abhi
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {totalCount > 0 
                ? `You have ${tasks.filter(t => t.status !== 'done').length} open tasks in Supabase and ${calendarEvents.length} calendar events today.`
                : "No tasks created yet. Use the planning assistant or quick add to start."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowAssistant(!showAssistant)}
              className="bg-stone-900 hover:bg-stone-800 text-white h-8 px-3 text-xs font-medium rounded-md gap-1.5 shadow-2xs"
            >
              <IrisLogo size={14} variant="badge" className="rounded-[3px] shrink-0" />
              <span>{showAssistant ? "Close Assistant" : "Plan Day with IRIS"}</span>
              {showAssistant ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              onClick={() => {
                setIsRefreshing(true);
                loadData().finally(() => setIsRefreshing(false));
              }}
              className="border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 h-8 px-3 text-xs font-medium rounded-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics from live DB */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-5">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-stone-400">Tasks completed</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-stone-900">
                {completedCount} <span className="text-sm font-normal text-stone-400">/ {totalCount}</span>
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full bg-stone-100 h-1.5 rounded-xs mt-2 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-xs transition-all duration-300" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-stone-400">Schedule Status</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-bold text-stone-900">
                {dailyPlan?.blocks?.length ? `${dailyPlan.blocks.length} Blocks Planned` : "Ready to Plan"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-stone-600 font-medium">
              <Brain className="w-3.5 h-3.5 text-stone-500" />
              <span>{dailyPlan?.aiGenerated ? "AI Scheduled" : "Live Sync"}</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-stone-400">Next meeting</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-bold text-stone-900 truncate">
                {nextMeeting ? format(new Date(nextMeeting.startTime), "h:mm a") : "No meetings today"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-stone-600">
              <CalendarIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{nextMeeting ? nextMeeting.title : "Cal.com synced"}</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-stone-400">Day balance</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-bold text-stone-900">
                {totalCount > 0 ? `${totalCount} active items` : "Inbox clear"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
              <span>Work: {tasks.filter(t => t.domain === 'work').length}</span>
              <span>•</span>
              <span>Health: {tasks.filter(t => t.domain === 'health').length}</span>
              <span>•</span>
              <span>Chores: {tasks.filter(t => t.domain === 'chores').length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Expandable Assistant Planning Section */}
      {showAssistant && (
        <section className="transition-all duration-200">
          <PlannerChat 
            onPlanApplied={() => {
              loadData();
            }} 
          />
        </section>
      )}

      {/* Main Working Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Schedule Timeline */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900">Today's Schedule & Tasks</h3>
            <span className="text-xs text-stone-400">Live from Supabase & Cal.com</span>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-stone-200/90 p-8 flex items-center justify-center text-xs text-stone-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
              Loading real data...
            </div>
          ) : tasks.length === 0 && calendarEvents.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200/90 p-8 text-center flex flex-col items-center">
              <IrisLogo size={42} variant="badge" className="rounded-xl shadow-xs mb-3" />
              <p className="text-xs font-medium text-stone-600">No tasks or events scheduled for today yet.</p>
              <p className="text-[11px] text-stone-400 mt-1 max-w-sm">
                Tell IRIS your intentions for the day and she will build a realistic, high-quality schedule based on your energy rhythm and commitments.
              </p>
              <Button
                size="sm"
                onClick={() => setShowAssistant(true)}
                className="mt-4 bg-stone-900 hover:bg-stone-800 text-white h-8 px-4 text-xs font-medium rounded-md gap-1.5"
              >
                <IrisLogo size={14} variant="badge" className="rounded-[3px] shrink-0" />
                Plan my day with IRIS
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs flex flex-col divide-y divide-stone-100">
              {/* Render Cal.com events */}
              {calendarEvents.map((event) => (
                <div key={event.id} className="py-3 first:pt-1 flex items-start gap-3.5">
                  <div className="w-20 shrink-0 pt-0.5">
                    <span className="text-xs font-medium text-stone-800 block tabular-nums">
                      {format(new Date(event.startTime), "h:mm a")}
                    </span>
                    <span className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-stone-300" />
                      30m
                    </span>
                  </div>

                  <div className="mt-0.5 w-4.5 h-4.5 rounded-sm border border-stone-200 bg-stone-50 flex items-center justify-center">
                    <CalendarIcon className="w-3 h-3 text-stone-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-medium text-stone-900 truncate">
                        {event.title}
                      </h4>
                      <span className="text-[10px] font-medium bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200/60 inline-flex items-center gap-1">
                        Cal.com
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Render real database tasks */}
              {tasks.map((task) => {
                const domainKey = (task.domain as Domain) || "work";
                const badge = DOMAIN_BADGE_STYLES[domainKey] || DOMAIN_BADGE_STYLES.work;
                const isDone = task.status === "done";

                return (
                  <div
                    key={task.id}
                    className={`py-3 first:pt-1 last:pb-1 flex items-start gap-3.5 transition-opacity ${
                      isDone ? "opacity-50" : ""
                    }`}
                  >
                    <div className="w-20 shrink-0 pt-0.5">
                      <span className="text-xs font-medium text-stone-800 block tabular-nums">
                        {task.scheduledTime || `${task.estimatedMin || 30}m`}
                      </span>
                      <span className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5 capitalize">
                        {task.priority}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleTask(task.id, task.status)}
                      aria-label={`Mark ${task.title} as ${isDone ? 'incomplete' : 'complete'}`}
                      className={`mt-0.5 w-4.5 h-4.5 rounded-sm border flex items-center justify-center transition-colors focus:outline-none ${
                        isDone
                          ? "bg-emerald-700 border-emerald-700 text-white"
                          : "border-stone-300 hover:border-stone-400 bg-white"
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-xs font-medium text-stone-900 truncate ${
                          isDone ? "line-through text-stone-400" : ""
                        }`}
                      >
                        {task.title}
                      </h4>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className="capitalize">{task.domain}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side Column */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Quick Add */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs">
            <h4 className="text-xs font-semibold text-stone-900 mb-1">Add task</h4>
            <p className="text-[11px] text-stone-400 mb-3">Persists straight to Supabase</p>

            <form onSubmit={handleQuickAdd} className="space-y-2.5">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="What do you need to do?"
                className="bg-stone-50 border-stone-200 text-stone-800 placeholder:text-stone-400 text-xs h-8.5 rounded-md focus-visible:ring-emerald-700"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 flex-wrap">
                  {(["work", "health", "chores", "personal"] as Domain[]).map((dom) => (
                    <button
                      type="button"
                      key={dom}
                      onClick={() => setSelectedDomain(dom)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
                        selectedDomain === dom
                          ? "bg-stone-900 text-white"
                          : "text-stone-500 hover:text-stone-800 bg-stone-100"
                      }`}
                    >
                      {dom[0].toUpperCase() + dom.slice(1)}
                    </button>
                  ))}
                </div>

                <Button
                  type="submit"
                  size="sm"
                  className="bg-stone-900 hover:bg-stone-800 text-white h-7 px-2.5 text-xs font-medium rounded-md"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>
            </form>
          </div>

          {/* Assistant Trigger Card */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <IrisLogo size={18} variant="badge" className="rounded-[4px] shrink-0" />
              <h4 className="text-xs font-semibold text-stone-900">Planning Assistant</h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed mb-3">
              Need to map out your day? Let IRIS organize your deep work, meetings, and habits with realistic buffers.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssistant(true)}
              className="w-full border-stone-200 text-stone-800 hover:bg-stone-50 text-xs h-8 font-medium rounded-md"
            >
              Open Planning Chat
            </Button>
          </div>

          {/* Due Soon */}
          {overdueOrSoon.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-stone-900">Upcoming deadlines</h4>
                <span className="text-[10px] text-stone-400">{overdueOrSoon.length} pending</span>
              </div>

              <div className="space-y-2">
                {overdueOrSoon.map((task) => (
                  <div key={task.id} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/60 flex items-start justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-medium text-stone-800">{task.title}</h5>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {task.deadline ? format(new Date(task.deadline), "MMM d") : ""}
                      </p>
                    </div>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Reminder */}
          <div className="bg-stone-50 rounded-xl border border-stone-200/80 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Droplets className="w-4 h-4 text-stone-700" />
              <h4 className="text-xs font-semibold text-stone-900">
                Hydration & Energy
              </h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Have a glass of water between focus blocks to maintain cognitive sharpness.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
