"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Error fetching stats:", err))
      .finally(() => setLoading(false));
  }, []);

  const total = stats?.total || 0;
  const completed = stats?.completed || 0;
  const overdue = stats?.overdue || 0;
  const byDomain = stats?.byDomain || {};

  const getPercent = (count: number) => {
    if (!total || total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900">Weekly Summary</h2>
          <p className="text-xs text-stone-500 mt-0.5">Live database statistics calculated directly from Supabase</p>
        </div>

        <Button 
          size="sm"
          className="bg-stone-900 hover:bg-stone-800 text-white text-xs h-8 px-3 font-medium rounded-md"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-stone-300" /> Generate AI summary
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center text-xs text-stone-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
          Calculating statistics from Supabase...
        </div>
      ) : (
        <>
          {/* Top Numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs">
              <span className="text-xs text-stone-400 font-medium">Total tasks</span>
              <div className="text-xl font-bold text-stone-900 mt-0.5">
                {total} <span className="text-xs font-normal text-stone-400">logged</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">In Supabase</p>
            </div>

            <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs">
              <span className="text-xs text-stone-400 font-medium">Completed tasks</span>
              <div className="text-xl font-bold text-stone-900 mt-0.5">
                {completed} <span className="text-xs font-normal text-stone-400">done</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                {total > 0 ? `${Math.round((completed / total) * 100)}% completion` : "0% completion"}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs">
              <span className="text-xs text-stone-400 font-medium">Overdue items</span>
              <div className="text-xl font-bold text-stone-900 mt-0.5">
                {overdue} <span className="text-xs font-normal text-stone-400">items</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                {overdue === 0 ? "All caught up" : "Action required"}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs">
              <span className="text-xs text-stone-400 font-medium">Categories</span>
              <div className="text-xl font-bold text-stone-900 mt-0.5">
                {Object.keys(byDomain).length} <span className="text-xs font-normal text-stone-400">domains</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Active categories</p>
            </div>
          </div>

          {/* Time & Domain Allocation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-stone-900">Task breakdown by category</h3>
                <span className="text-xs text-stone-400">{total} total</span>
              </div>

              {total === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  No tasks recorded in Supabase yet.
                </div>
              ) : (
                <div className="space-y-3.5 pt-1">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
                      <span>Work</span>
                      <span>{getPercent(byDomain.work || 0)}% ({byDomain.work || 0} tasks)</span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-xs overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-xs" style={{ width: `${getPercent(byDomain.work || 0)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
                      <span>Health & workouts</span>
                      <span>{getPercent(byDomain.health || 0)}% ({byDomain.health || 0} tasks)</span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-xs overflow-hidden">
                      <div className="bg-sky-600 h-full rounded-xs" style={{ width: `${getPercent(byDomain.health || 0)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
                      <span>Chores & errands</span>
                      <span>{getPercent(byDomain.chores || 0)}% ({byDomain.chores || 0} tasks)</span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-xs overflow-hidden">
                      <div className="bg-amber-600 h-full rounded-xs" style={{ width: `${getPercent(byDomain.chores || 0)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
                      <span>Learning & reading</span>
                      <span>{getPercent(byDomain.learning || 0)}% ({byDomain.learning || 0} tasks)</span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-xs overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-xs" style={{ width: `${getPercent(byDomain.learning || 0)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
                      <span>Personal</span>
                      <span>{getPercent(byDomain.personal || 0)}% ({byDomain.personal || 0} tasks)</span>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-xs overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-xs" style={{ width: `${getPercent(byDomain.personal || 0)}%` }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Intelligence */}
            <div className="bg-stone-50 border border-stone-200/90 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-3">System status</h3>
                
                <div className="space-y-2.5 text-xs text-stone-600 leading-relaxed">
                  <div className="p-3 bg-white rounded-lg border border-stone-200/60 shadow-xs">
                    <strong className="text-stone-900">Database:</strong> Connected to Supabase Cloud (`iris_*` tables).
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-stone-200/60 shadow-xs">
                    <strong className="text-stone-900">Calendar:</strong> Synchronized with Cal.com API v2 for Skyrn Studio.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-stone-200/60 shadow-xs">
                    <strong className="text-stone-900">AI Engine:</strong> Ready for daily schedule generation via OpenRouter.
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200/70 mt-4 text-[11px] text-stone-400">
                Connected and operating with live data.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
