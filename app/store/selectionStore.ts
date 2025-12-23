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

interface SelectionState {
    selectedId: string | null;
    selected: SpaceObjectData | null;
    selectObject: (id: string) => void;
    clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
    selectedId: null,
    selected: null,

    selectObject: (id) => {
        const obj = spaceObjects.find((o) => o.id === id) || null;

        set({
            selectedId: id,
            selected: obj,
        });
    },

    clearSelection: () =>
        set({
            selectedId: null,
            selected: null,
        }),
}));

