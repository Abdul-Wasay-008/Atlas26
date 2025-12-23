// import { create } from "zustand";
// import { spaceObjects, SpaceObjectData } from "../data/spaceObjects";

// interface SelectionState {
//     selected: SpaceObjectData | null;
//     selectObject: (id: string) => void;
// }

// export const useSelectionStore = create<SelectionState>((set) => ({
//     selected: null,
//     selectObject: (id: string) =>
//         set({
//             selected: spaceObjects.find((obj) => obj.id === id) || null
//         }),
// }));
import { create } from "zustand";
import { spaceObjects, SpaceObjectData } from "../data/spaceObjects";
import { cameraController } from "@/app/core/cameraController";

interface SelectionState {
    selectedId: string | null;
    selected: SpaceObjectData | null;
    selectObject: (id: string) => void;
    clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
    selectedId: null,
    selected: null,

    selectObject: (id: string) => {
        const obj = spaceObjects.find((o) => o.id === id) || null;

        // 🔭 Camera intent
        if (id === "earth") cameraController.setTarget("earth");
        else if (id === "moon") cameraController.setTarget("moon");

        set({
            selectedId: id,
            selected: obj,
        });
    },

    clearSelection: () => {
        cameraController.setTarget("system");
        set({ selectedId: null, selected: null });
    },
}));