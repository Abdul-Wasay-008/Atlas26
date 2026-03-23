import { create } from "zustand";

interface LoadingState {
    progress: number;
    active: boolean;
    isReady: boolean;
    setProgress: (progress: number, active: boolean) => void;
    setReady: () => void;
    reset: () => void;
}

const initialState = {
    progress: 0,
    active: false,
    isReady: false,
};

export const useLoadingStore = create<LoadingState>((set) => ({
    ...initialState,

    setProgress: (progress, active) =>
        set({
            progress,
            active,
        }),

    setReady: () =>
        set({
            isReady: true,
        }),

    reset: () => set(initialState),
}));
