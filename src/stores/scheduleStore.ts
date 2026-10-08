import { create } from 'zustand';

export interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  domain: string;
  completed: boolean;
}

export interface DailyPlan {
  date: string;
  blocks: TimeBlock[];
}

interface ScheduleStore {
  todayPlan: DailyPlan | null;
  isLoading: boolean;
  fetchTodayPlan: () => Promise<void>;
  generatePlan: (date: string) => Promise<void>;
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  todayPlan: null,
  isLoading: false,
  fetchTodayPlan: async () => {
    set({ isLoading: true });
    setTimeout(() => set({ isLoading: false }), 500);
  },
  generatePlan: async (date) => {
    set({ isLoading: true });
    setTimeout(() => set({
      isLoading: false,
      todayPlan: {
        date,
        blocks: []
      }
    }), 500);
  }
}));
