"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";

const COLUMNS = [
  { id: "backlog", title: "Backlog", desc: "To do later" },
  { id: "planned", title: "Planned", desc: "This week" },
  { id: "in_progress", title: "In Progress", desc: "Working on now" },
  { id: "blocked", title: "Blocked", desc: "Waiting" },
  { id: "done", title: "Done", desc: "Completed" }
];

export function KanbanBoard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTasks(data);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "planned" : "done";
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Error updating status:", err);
      fetchTasks();
    }
  };

  // Filter columns on mobile if specific tab selected
  const displayedColumns = activeTab === "all" 
    ? COLUMNS 
    : COLUMNS.filter(c => c.id === activeTab);

  return (
    <div className="flex flex-col h-full min-h-0 gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900">Tasks</h2>
          <p className="text-xs text-stone-500 mt-0.5">Live database synchronization with Supabase</p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setIsDialogOpen(true)} 
            size="sm"
            className="bg-stone-900 hover:bg-stone-800 text-white h-8 px-3.5 text-xs font-medium rounded-md shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add task
          </Button>
        </div>
      </div>

      {/* Mobile Column Filter Pills */}
      <div className="flex md:hidden overflow-x-auto no-scrollbar gap-1.5 pb-1">
        <button
          onClick={() => setActiveTab("all")}
          className={`text-xs font-medium px-3 py-1.5 rounded-md shrink-0 transition-colors ${
            activeTab === "all"
              ? "bg-stone-900 text-white"
              : "bg-white text-stone-600 border border-stone-200"
          }`}
        >
          All ({tasks.length})
        </button>
        {COLUMNS.map((col) => {
          const count = tasks.filter(t => t.status === col.id || (col.id === 'in_progress' && t.status === 'in-progress')).length;
          return (
            <button
              key={col.id}
              onClick={() => setActiveTab(col.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md shrink-0 transition-colors flex items-center gap-1.5 ${
                activeTab === col.id
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-600 border border-stone-200"
              }`}
            >
              <span>{col.title}</span>
              <span className={`text-[10px] px-1 py-0.2 rounded ${activeTab === col.id ? "bg-stone-800 text-stone-200" : "bg-stone-100 text-stone-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20 text-stone-400 gap-2 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
          Loading tasks from Supabase...
        </div>
      ) : (
        <div className="flex gap-3.5 h-[calc(100vh-230px)] md:h-[calc(100vh-210px)] overflow-x-auto pb-4 items-stretch snap-x snap-mandatory">
          {displayedColumns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id || (col.id === 'in_progress' && t.status === 'in-progress'));
            
            return (
              <div 
                key={col.id} 
                className={`${
                  activeTab === "all" 
                    ? "w-[85vw] max-w-[320px] md:w-72 shrink-0 snap-center" 
                    : "w-full md:w-72 shrink-0"
                } flex flex-col bg-stone-100/60 rounded-xl border border-stone-200/70 overflow-hidden`}
              >
                {/* Header */}
                <div className="p-3 border-b border-stone-200/60 bg-white/60 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-xs text-stone-800">{col.title}</h3>
                    <p className="text-[10px] text-stone-400">{col.desc}</p>
                  </div>
                  <span className="bg-stone-200 text-stone-700 text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums">
                    {colTasks.length}
                  </span>
                </div>
                
                {/* Cards */}
                <div className="flex-1 p-2.5 overflow-y-auto space-y-2">
                  {colTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onToggle={() => handleToggleStatus(task.id, task.status)}
                    />
                  ))}
                  
                  {colTasks.length === 0 && (
                    <div className="text-center py-8 px-4 border border-dashed border-stone-200 rounded-lg text-stone-400 text-xs bg-white/40">
                      No tasks in {col.title.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onTaskCreated={fetchTasks}
      />
    </div>
  );
}
