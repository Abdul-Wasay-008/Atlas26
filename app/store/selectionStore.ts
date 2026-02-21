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
    showAllOrbits: boolean;
    selectObject: (id: string) => void;
    clearSelection: () => void;
    setShowAllOrbits: (show: boolean) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
    selectedId: null,
    selected: null,
    showAllOrbits: true,

    selectObject: (id) => {
        const obj = spaceObjects.find((o) => o.id === id) || null;

        set({
            selectedId: id,
            selected: obj,
            showAllOrbits: false,
        });
    },

    clearSelection: () =>
        set({
            selectedId: null,
            selected: null,
        }),

    setShowAllOrbits: (show) =>
        set({
            showAllOrbits: show,
            selectedId: show ? null : null,
            selected: show ? null : null,
        }),
}));

