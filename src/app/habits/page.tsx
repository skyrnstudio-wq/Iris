"use client";

import { useState, useEffect } from "react";
import { Flame, Plus, Check, Award, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DOMAIN_BADGE_STYLES, Domain } from "@/types/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function HabitsPage() {
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDomain, setNewHabitDomain] = useState("health");
  const [newHabitFreq, setNewHabitFreq] = useState("Daily");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/habits");
      const data = await res.json();
      if (Array.isArray(data)) {
        setHabits(data);
      }
    } catch (err) {
      console.error("Error fetching habits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const toggleDay = async (habitId: string, dayIdx: number) => {
    const dayOffset = 6 - dayIdx; // 0 is today, 6 is 6 days ago

    // Optimistic toggle
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const newHist = [...(h.history || [false, false, false, false, false, false, false])];
        newHist[dayIdx] = !newHist[dayIdx];
        return { ...h, history: newHist };
      })
    );

    try {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          habitId,
          dayOffset,
        }),
      });
      fetchHabits();
    } catch (err) {
      console.error("Error toggling habit log:", err);
      fetchHabits();
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newHabitName.trim(),
          domain: newHabitDomain,
          frequency: newHabitFreq,
        }),
      });

      if (res.ok) {
        setNewHabitName("");
        setIsDialogOpen(false);
        fetchHabits();
      }
    } catch (err) {
      console.error("Error creating habit:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900">Habits</h2>
          <p className="text-xs text-stone-500 mt-0.5">Live tracking synced with Supabase</p>
        </div>

        <Button 
          onClick={() => setIsDialogOpen(true)}
          size="sm"
          className="bg-stone-900 hover:bg-stone-800 text-white text-xs h-8 px-3 font-medium rounded-md"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add habit
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-stone-400 font-medium">Active streaks</span>
            <div className="text-base font-bold text-stone-900">
              {habits.length > 0 ? `${habits.reduce((acc, h) => Math.max(acc, h.streak || 0), 0)} days` : "0 days"}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-stone-400 font-medium">Tracked routines</span>
            <div className="text-base font-bold text-stone-900">{habits.length} habits</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-stone-400 font-medium">Storage Engine</span>
            <div className="text-base font-bold text-stone-900">Supabase Cloud</div>
          </div>
        </div>
      </div>

      {/* Habit List */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-stone-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-800">Current habits</span>
          <span className="text-[11px] text-stone-400 mr-2">Past 7 days</span>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center text-xs text-stone-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
            Loading habits from Supabase...
          </div>
        ) : habits.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs font-medium text-stone-600">No habits tracked yet.</p>
            <p className="text-[11px] text-stone-400 mt-1">Click "Add habit" above to start logging your daily routines.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {habits.map((habit) => {
              const domainKey = (habit.domain as Domain) || "health";
              const badge = DOMAIN_BADGE_STYLES[domainKey] || DOMAIN_BADGE_STYLES.health;

              return (
                <div key={habit.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">
                      <span className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-700 tabular-nums">
                        {habit.streak || 0}d
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-stone-900">{habit.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border inline-flex items-center ${badge.bg} ${badge.text} ${badge.border}`}>
                          <span className="capitalize">{habit.domain}</span>
                        </span>
                        <span className="text-[11px] text-stone-400">{habit.frequency}</span>
                      </div>
                    </div>
                  </div>

                  {/* 7-day checkboxes */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {(habit.history || [false, false, false, false, false, false, false]).map((done: boolean, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => toggleDay(habit.id, idx)}
                        aria-label={`Toggle day ${DAYS[idx]}`}
                        className={`w-6.5 h-6.5 rounded-md text-[10px] font-medium flex items-center justify-center transition-colors ${
                          done
                            ? "bg-emerald-700 text-white"
                            : "bg-stone-100 hover:bg-stone-200 text-stone-400"
                        }`}
                      >
                        {done ? <Check className="w-3 h-3 stroke-[2.5]" /> : DAYS[idx]}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Habit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-stone-200 text-stone-900 max-w-sm rounded-xl">
          <form onSubmit={handleCreateHabit}>
            <DialogHeader className="pb-2 border-b border-stone-100">
              <DialogTitle className="text-sm font-semibold text-stone-900">
                Add new habit
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-stone-700">Habit Name</Label>
                <Input 
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="e.g. Drink 3L water, Morning gym"
                  required
                  className="bg-stone-50 border-stone-200 text-xs h-8.5 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-stone-700">Category</Label>
                  <Select value={newHabitDomain} onValueChange={(val) => val && setNewHabitDomain(val)}>
                    <SelectTrigger className="bg-stone-50 border-stone-200 text-xs h-8.5 rounded-md">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-stone-200">
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="chores">Chores</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-stone-700">Frequency</Label>
                  <Select value={newHabitFreq} onValueChange={(val) => val && setNewHabitFreq(val)}>
                    <SelectTrigger className="bg-stone-50 border-stone-200 text-xs h-8.5 rounded-md">
                      <SelectValue placeholder="Frequency" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-stone-200">
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="5x / week">5x / week</SelectItem>
                      <SelectItem value="3x / week">3x / week</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs h-8 px-3 rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-stone-900 hover:bg-stone-800 text-white text-xs h-8 px-3.5 font-medium rounded-md"
              >
                {isSubmitting ? "Saving..." : "Add habit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
