import { create } from "zustand";
import { spaceObjects, SpaceObjectData } from "../data/spaceObjects";

interface SelectionState {
    selected: SpaceObjectData | null;
    selectObject: (id: string) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
    selected: null,
    selectObject: (id: string) =>
        set({
            selected: spaceObjects.find((obj) => obj.id === id) || null
        }),
}));
