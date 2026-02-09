import { create } from "zustand";

type SimulationStep = "setup" | "running" | "results";

interface SimulationFormState {
  query: string;
  contentTitle: string;
  contentBody: string;
  contentType: string;
  platforms: string[];
  enableAB: boolean;
  variantBTitle: string;
  variantBBody: string;
}

interface SimulationStoreState {
  // Step flow
  currentStep: SimulationStep;
  setStep: (step: SimulationStep) => void;

  // Active simulation being tracked
  activeSimulationId: string | null;
  setActiveSimulationId: (id: string | null) => void;

  // Form state
  form: SimulationFormState;
  updateForm: (updates: Partial<SimulationFormState>) => void;
  resetForm: () => void;
}

const defaultForm: SimulationFormState = {
  query: "",
  contentTitle: "",
  contentBody: "",
  contentType: "",
  platforms: ["chatgpt", "claude", "gemini", "perplexity", "grok", "deepseek", "copilot"],
  enableAB: false,
  variantBTitle: "",
  variantBBody: "",
};

export const useSimulationStore = create<SimulationStoreState>()((set, get) => ({
  currentStep: "setup",
  setStep: (step) => set({ currentStep: step }),

  activeSimulationId: null,
  setActiveSimulationId: (id) => set({ activeSimulationId: id }),

  form: { ...defaultForm },
  updateForm: (updates) =>
    set((state) => ({
      form: { ...state.form, ...updates },
    })),
  resetForm: () =>
    set({
      form: { ...defaultForm },
      currentStep: "setup",
      activeSimulationId: null,
    }),
}));
