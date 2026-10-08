import { KanbanBoard } from "@/components/tasks/KanbanBoard";

export default function TasksPage() {
  return (
    <div className="h-full flex flex-col min-h-0">
      <KanbanBoard />
    </div>
  );
}
