import { create } from "zustand"

interface FpsState {
    fps: number | null
    setFps: (fps: number) => void
}

export const useFpsStore = create<FpsState>((set, get) => ({
    fps: null,
    setFps: (fps) => {
        if (get().fps === fps) return
        set({ fps })
    },
}))
