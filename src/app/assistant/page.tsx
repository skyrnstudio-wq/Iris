"use client";

import { PlannerChat } from "@/components/chat/PlannerChat";
import { Sparkles, CalendarCheck, ShieldCheck, Zap, Brain, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { IrisLogo } from "@/components/brand/IrisLogo";

export default function AssistantPage() {
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div className="flex items-start sm:items-center gap-3">
          <IrisLogo size={42} variant="badge" className="rounded-xl shadow-xs shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-stone-900">
                IRIS Planning Assistant
              </h1>
              <span className="text-xs font-medium bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200">
                v1.0
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Conversational daily planning grounded in productivity laws, energy rhythms, and live Cal.com calendar integration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-stone-200 text-stone-600 text-xs font-medium">
            <CalendarCheck className="w-3.5 h-3.5 text-stone-700" />
            <span>Cal.com Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-stone-200 text-stone-600 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Supabase Cloud</span>
          </div>
        </div>
      </div>

      {/* Productivity Frameworks Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-white rounded-lg border border-stone-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-stone-900 font-medium text-xs mb-1">
            <Brain className="w-3.5 h-3.5 text-stone-700" />
            <span>Eat That Frog</span>
          </div>
          <p className="text-[11px] text-stone-500 leading-normal">
            Schedules your hardest, high-friction cognitive work during peak morning energy windows.
          </p>
        </div>

        <div className="p-3 bg-white rounded-lg border border-stone-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-stone-900 font-medium text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-stone-700" />
            <span>Parkinson's Law</span>
          </div>
          <p className="text-[11px] text-stone-500 leading-normal">
            Enforces tight, explicit timeboxes so tasks don't expand to devour your entire day.
          </p>
        </div>

        <div className="p-3 bg-white rounded-lg border border-stone-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-stone-900 font-medium text-xs mb-1">
            <Zap className="w-3.5 h-3.5 text-stone-700" />
            <span>Ultradian Buffers</span>
          </div>
          <p className="text-[11px] text-stone-500 leading-normal">
            Caps focus sprints at 90 minutes with 10–15m decompression buffers and transit space.
          </p>
        </div>
      </div>

      {/* Main Chat Component */}
      <PlannerChat 
        onPlanApplied={() => {
          // Can redirect to dashboard or notify
          router.push("/");
        }}
      />
    </div>
  );
}
