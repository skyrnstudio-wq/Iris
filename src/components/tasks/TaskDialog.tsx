"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: () => void;
}

export function TaskDialog({ open, onOpenChange, onTaskCreated }: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("work");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("planned");
  const [description, setDescription] = useState("");
  const [estimatedMin, setEstimatedMin] = useState("30");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          domain,
          priority,
          status,
          description: description.trim() || undefined,
          estimatedMin: parseInt(estimatedMin, 10) || 30,
        }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        onOpenChange(false);
        if (onTaskCreated) onTaskCreated();
      }
    } catch (err) {
      console.error("Error creating task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-stone-200 text-stone-900 w-[calc(100vw-2rem)] sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-md rounded-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-2 border-b border-stone-100">
            <DialogTitle className="text-sm font-semibold text-stone-900">
              Add task
            </DialogTitle>
            <p className="text-xs text-stone-400">
              Set category and time estimate. Saved directly to Supabase.
            </p>
          </DialogHeader>
          
          <div className="grid gap-3.5 py-3">
            <div className="grid gap-1">
              <Label htmlFor="title" className="text-xs font-medium text-stone-700">Title</Label>
              <Input 
                id="title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Finish quarterly presentation slides" 
                className="bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 text-xs h-8.5 rounded-md focus-visible:ring-emerald-700" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label className="text-xs font-medium text-stone-700">Category</Label>
                <Select value={domain} onValueChange={(val) => val && setDomain(val)}>
                  <SelectTrigger className="bg-stone-50 border-stone-200 text-stone-900 text-xs h-8.5 rounded-md">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200 text-stone-900 rounded-md">
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="chores">Chores</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-1">
                <Label className="text-xs font-medium text-stone-700">Priority</Label>
                <Select value={priority} onValueChange={(val) => val && setPriority(val)}>
                  <SelectTrigger className="bg-stone-50 border-stone-200 text-stone-900 text-xs h-8.5 rounded-md">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200 text-stone-900 rounded-md">
                    <SelectItem value="urgent-important">Urgent & Important</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="medium">Normal</SelectItem>
                    <SelectItem value="low">Low priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-1">
              <Label htmlFor="description" className="text-xs font-medium text-stone-700">Notes (optional)</Label>
              <Textarea 
                id="description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any details or links..." 
                className="bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 text-xs min-h-[75px] rounded-md focus-visible:ring-emerald-700" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label className="text-xs font-medium text-stone-700">Estimated time (minutes)</Label>
                <Input 
                  type="number" 
                  value={estimatedMin}
                  onChange={(e) => setEstimatedMin(e.target.value)}
                  placeholder="30" 
                  className="bg-stone-50 border-stone-200 text-stone-900 text-xs h-8.5 rounded-md focus-visible:ring-emerald-700" 
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs font-medium text-stone-700">Status</Label>
                <Select value={status} onValueChange={(val) => val && setStatus(val)}>
                  <SelectTrigger className="bg-stone-50 border-stone-200 text-stone-900 text-xs h-8.5 rounded-md">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200 text-stone-900 rounded-md">
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2.5 border-t border-stone-100">
            <Button 
              type="button"
              variant="outline" 
              size="sm"
              onClick={() => onOpenChange(false)} 
              className="border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 text-xs h-8 px-3 rounded-md"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-stone-900 hover:bg-stone-800 text-white text-xs h-8 px-3.5 font-medium rounded-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : "Save task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
