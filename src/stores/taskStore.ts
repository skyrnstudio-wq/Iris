import { create } from 'zustand';

export interface Task {
  id: string;
  title: string;
  description?: string;
  domain: string;
  priority: string;
  status: string;
  deadline?: string;
  estimatedMinutes?: number;
}

export interface CreateTaskInput extends Omit<Task, 'id'> {}
export interface UpdateTaskInput extends Partial<CreateTaskInput> {}

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  addTask: (task: CreateTaskInput) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateStatus: (id: string, status: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,
  fetchTasks: async () => {
    set({ isLoading: true });
    // Simulate API call
    setTimeout(() => set({ isLoading: false }), 500);
  },
  addTask: async (task) => {
    set((state) => ({ tasks: [...state.tasks, { ...task, id: Date.now().toString() }] }));
  },
  updateTask: async (id, data) => {
    set((state) => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...data } : t)
    }));
  },
  deleteTask: async (id) => {
    set((state) => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },
  updateStatus: async (id, status) => {
    set((state) => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, status } : t)
    }));
  }
}));
