import { create } from 'zustand';

export type Language = 'ar' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'ar', // Arabic is the default language
  setLanguage: (language) => set({ language }),
}));
