"use client";

import { useEffect } from "react";
import { useSelectionStore } from "@/app/store/selectionStore";

/**
 * Keyboard Shortcuts Handler
 * 
 * Provides keyboard shortcuts for satellite selection:
 * - Key "1" → Select ISS
 * - Key "2" → Select Hubble
 * - Key "Tab" → Cycle through satellites
 * 
 * Note: Escape key is handled by TimeControls.tsx for comprehensive reset
 */
export default function KeyboardShortcuts() {
    const selectObject = useSelectionStore((state) => state.selectObject);
    const selectedId = useSelectionStore((state) => state.selectedId);

    useEffect(() => {
        const satellites = ["iss", "hubble"];
        
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't interfere if user is typing in an input
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                (event.target as HTMLElement).isContentEditable
            ) {
                return;
            }

            // Handle number keys for direct selection
            if (event.key === "1") {
                event.preventDefault();
                selectObject("iss");
            } else if (event.key === "2") {
                event.preventDefault();
                selectObject("hubble");
            }

            // Handle Tab to cycle through satellites (only when not in input)
            if (event.key === "Tab" && !event.shiftKey) {
                event.preventDefault();
                const currentIndex = selectedId ? satellites.indexOf(selectedId) : -1;
                const nextIndex = (currentIndex + 1) % satellites.length;
                selectObject(satellites[nextIndex]);
            }

            // Note: Escape key is handled by TimeControls.tsx handleReset()
            // which provides comprehensive reset (camera, time, orbits, selection)
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectObject, selectedId]);

    return null;
}
