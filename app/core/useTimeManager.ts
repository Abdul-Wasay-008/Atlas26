"use client";

import { useEffect, useState } from "react";
import { timeManager, TimeMode } from "./TimeManager";

/**
 * React hook for accessing TimeManager state
 * Automatically subscribes to time changes and re-renders component
 */
export function useTimeManager() {
    const [currentDate, setCurrentDate] = useState(timeManager.getCurrentDate());
    const [mode, setMode] = useState<TimeMode>(timeManager.getMode());
    const [speedMultiplier, setSpeedMultiplier] = useState(
        timeManager.getSpeedMultiplier()
    );
    const [isPaused, setIsPaused] = useState(timeManager.getIsPaused());

    useEffect(() => {
        // Subscribe to time changes
        const unsubscribe = timeManager.subscribe(() => {
            setCurrentDate(timeManager.getCurrentDate());
            setMode(timeManager.getMode());
            setSpeedMultiplier(timeManager.getSpeedMultiplier());
            setIsPaused(timeManager.getIsPaused());
        });

        return unsubscribe;
    }, []);

    return {
        currentDate,
        mode,
        speedMultiplier,
        isPaused,
        setDate: (date: Date) => timeManager.setDate(date),
        setSpeed: (multiplier: number) => timeManager.setSpeed(multiplier),
        toggleMode: () => timeManager.toggleMode(),
        pause: () => timeManager.pause(),
        resume: () => timeManager.resume(),
        togglePause: () => timeManager.togglePause(),
        reset: () => timeManager.reset(),
        getTime: () => timeManager.getTime(),
    };
}

