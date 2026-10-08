"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { DOMAIN_BADGE_STYLES, Domain } from "@/types/ui";
import { Clock } from "lucide-react";
import { format } from "date-fns";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    domain: string;
    priority: string;
    deadline?: string | Date;
    status: string;
  };
  onToggle?: () => void;
}

export function TaskCard({ task, onToggle }: TaskCardProps) {
  const domainKey = (task?.domain as Domain) || "work";
  const badge = DOMAIN_BADGE_STYLES[domainKey] || DOMAIN_BADGE_STYLES.work;

  const priorityStyles: Record<string, { label: string; text: string; bg: string }> = {
    low: { label: "Low", text: "text-stone-500", bg: "bg-stone-100" },
    medium: { label: "Med", text: "text-stone-700", bg: "bg-stone-100" },
    high: { label: "High", text: "text-amber-800", bg: "bg-amber-50" },
    urgent: { label: "Urgent", text: "text-red-700", bg: "bg-red-50" },
  };

  const priorityMeta = priorityStyles[task?.priority] || priorityStyles.medium;
  const isDone = task?.status === "done";

  let deadlineDisplay = "";
  if (task?.deadline) {
    try {
      deadlineDisplay = format(new Date(task.deadline), "MMM d");
    } catch {
      deadlineDisplay = String(task.deadline);
    }
  }

  return (
    <div className={`group bg-white rounded-lg p-3 border border-stone-200/90 hover:border-stone-300 shadow-xs transition-all ${
      isDone ? "opacity-60 bg-stone-50/70" : ""
    }`}>
      <div className="flex items-start gap-2.5">
        <Checkbox 
          checked={isDone}
          onCheckedChange={onToggle}
          className="mt-0.5 border-stone-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700 data-[state=checked]:text-white rounded-sm" 
        />
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-xs font-medium text-stone-900 group-hover:text-stone-950 leading-snug ${
            isDone ? "line-through text-stone-400" : ""
          }`}>
            {task?.title}
          </h4>
          
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {/* Domain tag */}
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border inline-flex items-center ${badge.bg} ${badge.text} ${badge.border}`}
            >
              <span className="capitalize">{task?.domain}</span>
            </span>

            {/* Priority tag */}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priorityMeta.bg} ${priorityMeta.text}`}>
              {priorityMeta.label}
            </span>

            {/* Deadline */}
            {deadlineDisplay && (
              <span className="text-[10px] text-stone-400 flex items-center gap-1 ml-auto">
                <Clock className="w-2.5 h-2.5" />
                {deadlineDisplay}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
