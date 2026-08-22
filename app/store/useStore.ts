import {create} from "zustand";

type SetupData = {
    resume: string;
    coverLetter: string;
    portfolio: string;
    github: string;
    specifics: Specifics;
  };

type Specifics = {
    selectedRoles: Record<number, string>;
    selectedWorkPref: string;
    experienceLevel: string;
    location: string;
};

type SetupStore = {
    setupData: SetupData | null;
    setSetupData: (data: SetupData | null) => void;
    clearSetupData: () => void;
};

export const userStore = create<SetupStore>((set) => ({
    setupData: null,

    setSetupData: (data) => set({ setupData: data }),
  
    clearSetupData: () => set({ setupData: null }),
}));