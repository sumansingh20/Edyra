import { create } from 'zustand';

interface ExamState {
  examData: any | null;
  questions: any[];
  answers: Record<string, any>;
  currentQuestionIndex: number;
  timeRemaining: number | null;
  isSubmitting: boolean;
  setExamData: (data: any) => void;
  setQuestions: (questions: any[]) => void;
  setAnswer: (questionId: string, answer: any) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  setTimeRemaining: (time: number) => void;
  submitExam: () => Promise<void>;
}

export const useExamStore = create<ExamState>((set, get) => ({
  examData: null,
  questions: [],
  answers: {},
  currentQuestionIndex: 0,
  timeRemaining: null,
  isSubmitting: false,

  setExamData: (data) => set({ examData: data }),
  
  setQuestions: (questions) => set({ questions }),
  
  setAnswer: (questionId, answer) => 
    set((state) => ({ answers: { ...state.answers, [questionId]: answer } })),
  
  nextQuestion: () => 
    set((state) => ({
      currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.questions.length - 1)
    })),
    
  prevQuestion: () => 
    set((state) => ({
      currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0)
    })),
    
  jumpToQuestion: (index) => set({ currentQuestionIndex: index }),
  
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  
  submitExam: async () => {
    set({ isSubmitting: true });
    // Implementation will call API
    // await api.post('/exam/submit', { answers: get().answers });
    set({ isSubmitting: false });
  }
}));
