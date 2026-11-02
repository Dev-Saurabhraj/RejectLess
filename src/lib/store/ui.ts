"use client";

import { create } from "zustand";

interface UiState {
  assistantOpen: boolean;
  assistantFindingKey?: string;
  assistantPrefill?: string;
  /** True while a demo scenario's fictional documents are being generated. */
  demoLoading: boolean;
  openAssistant: (findingKey?: string, prefill?: string) => void;
  closeAssistant: () => void;
}

export const useUi = create<UiState>((set) => ({
  assistantOpen: false,
  demoLoading: false,
  openAssistant: (findingKey, prefill) => set({ assistantOpen: true, assistantFindingKey: findingKey, assistantPrefill: prefill }),
  closeAssistant: () => set({ assistantOpen: false }),
}));
