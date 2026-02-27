"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Clock, Timer, Calendar } from "lucide-react";
import { useTimeManager } from "@/app/core/useTimeManager";
import { cameraController } from "@/app/core/cameraController";
import { useSelectionStore } from "@/app/store/selectionStore";
import { poppins } from "@/app/fonts";

// Speed presets: 1x, 60x (1 min = 1 hour), 1440x (1 sec = 1 day), 30000x (1 sec ≈ 1 month)
const SPEEDS = [1, 60, 1440, 30000];
const SPEED_LABELS: Record<number, string> = {
    1: "1x",
    60: "60x",
    1440: "1d/s",
    30000: "1mo/s",
};

export default function TimeControls() {
    const {
        currentDate,
        mode,
        speedMultiplier,
        isPaused,
        setSpeed,
        toggleMode,
        togglePause,
        reset,
        setDate,
    } = useTimeManager();
    const clearSelection = useSelectionStore((state) => state.clearSelection);
    const setShowAllOrbits = useSelectionStore((state) => state.setShowAllOrbits);
    const setInfoPanelOpen = useSelectionStore((state) => state.setInfoPanelOpen);

    // Local state for date input (for scrubber)
    const [dateInputValue, setDateInputValue] = useState(
        currentDate.toISOString().slice(0, 16)
    );
    const dateInputRef = useRef<HTMLInputElement>(null);
    const isDateInputFocusedRef = useRef(false);

    // Update date input when currentDate changes (but not when user is typing)
    useEffect(() => {
        if (!isDateInputFocusedRef.current) {
            setDateInputValue(currentDate.toISOString().slice(0, 16));
        }
    }, [currentDate]);

    const handleSpeedChange = (value: number) => {
        setSpeed(value);
    };

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateInputValue(e.target.value);
    };

    const handleDateInputFocus = () => {
        isDateInputFocusedRef.current = true;
    };

    const handleDateInputBlur = () => {
        isDateInputFocusedRef.current = false;
        const newDate = new Date(dateInputValue);
        if (!isNaN(newDate.getTime())) {
            setDate(newDate);
        } else {
            // Reset to current date if invalid
            setDateInputValue(currentDate.toISOString().slice(0, 16));
        }
    };

    const formatDateCompact = (date: Date): string => {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        const hours = String(date.getUTCHours()).padStart(2, "0");
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        const seconds = String(date.getUTCSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const handleReset = useCallback(() => {
        // Reset time to now
        reset();
        // Activate all orbit paths (same as clicking "All" in sidebar)
        setShowAllOrbits(true);
        // Close the info panel
        setInfoPanelOpen(false);
        // Reset camera to default system view
        cameraController.snapToSystem();
    }, [reset, setShowAllOrbits, setInfoPanelOpen]);

    // Listen for Escape key to trigger reset
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only trigger if not typing in an input field
            if (e.key === "Escape" && document.activeElement?.tagName !== "INPUT") {
                handleReset();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleReset]);

    const isSimulationMode = mode === "SIMULATION";

    return (
        <div
            className={`
                fixed bottom-3 lg:bottom-6 z-30
                left-1/2 -translate-x-1/2
                lg:left-[calc(50%+120px)]
                w-[calc(100%-2rem)] sm:w-auto
                sm:max-w-[calc(100vw-2rem)]
                md:min-w-[520px]
                lg:max-w-[calc(100vw-280px)]
                ${poppins.className}
            `}
        >
            <div
                className={`
                    backdrop-blur-xl
                    bg-white/10
                    border border-white/15
                    shadow-[0_0_30px_rgba(0,0,0,0.4)]
                    rounded-xl lg:rounded-2xl
                    overflow-hidden
                `}
            >
                {/* Date/Time Display Section */}
                <div
                    className={`
                        flex items-center justify-between gap-3 lg:gap-5
                        px-4 py-2.5 lg:px-6 lg:py-3
                        ${isSimulationMode ? "border-b border-white/10" : ""}
                        bg-white/5
                    `}
                >
                    <div className="flex items-center gap-2 lg:gap-3">
                        <Clock size={14} strokeWidth={2} className="text-white/70 hidden sm:block" />
                        <div className="flex flex-col">
                            <span className="text-[9px] lg:text-xs text-white/50 uppercase tracking-wider">
                                UTC Time
                            </span>
                            <span className="text-xs lg:text-base font-medium text-white/95 tabular-nums">
                                {formatDateCompact(currentDate)}
                            </span>
                        </div>
                    </div>

                    {/* Mode Toggle & Reset */}
                    <div className="flex items-center gap-2 lg:gap-3">
                        <button
                            onClick={toggleMode}
                            aria-label={`Switch to ${isSimulationMode ? "real time" : "simulation"} mode`}
                            className={`
                                flex items-center justify-center gap-1.5
                                px-2.5 py-1.5 lg:px-3.5 lg:py-2
                                rounded-md lg:rounded-lg transition cursor-pointer whitespace-nowrap
                                text-[11px] lg:text-sm
                                ${isSimulationMode
                                    ? "bg-blue-500/30 text-white border border-blue-400/40 hover:bg-blue-500/40"
                                    : "bg-white/20 text-white border border-white/30 hover:bg-white/30"
                                }
                            `}
                            title={isSimulationMode ? "Simulation Mode" : "Real Time Mode"}
                        >
                            {isSimulationMode ? (
                                <>
                                    <Timer size={12} strokeWidth={2} className="lg:w-[14px] lg:h-[14px]" />
                                    <span>SIM</span>
                                </>
                            ) : (
                                <>
                                    <Clock size={12} strokeWidth={2} className="lg:w-[14px] lg:h-[14px]" />
                                    <span>REAL</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleReset}
                            aria-label="Reset to default state"
                            className={`
                                flex items-center justify-center
                                w-8 h-8 lg:w-9 lg:h-9
                                rounded-md lg:rounded-lg transition cursor-pointer
                                bg-white/10 hover:bg-white/20
                                hover:shadow-[0_0_10px_rgba(255,255,255,0.25)]
                            `}
                        >
                            <RotateCcw size={14} strokeWidth={2} className="text-white/90 lg:w-4 lg:h-4" />
                        </button>
                    </div>
                </div>

                {/* Simulation Controls Section */}
                {isSimulationMode && (
                    <div
                        className="
                            flex flex-col lg:flex-row items-stretch lg:items-center
                            gap-2.5 lg:gap-4
                            px-4 py-2.5 lg:px-6 lg:py-3.5
                        "
                    >
                        {/* Left: Play/Pause + Speed Controls */}
                        <div className="flex items-center gap-2.5 lg:gap-3">
                            {/* Play / Pause */}
                            <button
                                onClick={togglePause}
                                aria-label={isPaused ? "Resume time" : "Pause time"}
                                className={`
                                    flex items-center justify-center
                                    w-9 h-9 lg:w-11 lg:h-11
                                    rounded-lg lg:rounded-xl transition cursor-pointer
                                    ${!isPaused
                                        ? "bg-blue-500/30 text-white border border-blue-400/50 shadow-[0_0_14px_rgba(59,130,246,0.4)]"
                                        : "bg-white/15 text-white/90 border border-white/20 hover:bg-white/25"
                                    }
                                `}
                            >
                                {!isPaused ? (
                                    <Pause size={16} strokeWidth={2.5} className="lg:w-[18px] lg:h-[18px]" />
                                ) : (
                                    <Play size={16} strokeWidth={2.5} className="ml-0.5 lg:w-[18px] lg:h-[18px]" />
                                )}
                            </button>

                            {/* Divider */}
                            <div className="h-7 lg:h-8 w-px bg-white/20" />

                            {/* Speed Buttons */}
                            <div className="flex items-center gap-1.5 lg:gap-2">
                                <span className="text-[10px] lg:text-xs text-white/50 hidden sm:inline">Speed:</span>
                                <div className="flex items-center gap-1.5 lg:gap-2">
                                    {SPEEDS.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => handleSpeedChange(s)}
                                            className={`
                                                px-2 py-1.5 lg:px-3 lg:py-1.5 rounded-md lg:rounded-lg transition whitespace-nowrap cursor-pointer
                                                text-[11px] lg:text-sm font-medium
                                                ${speedMultiplier === s
                                                    ? "bg-blue-500/30 text-white border border-blue-400/50"
                                                    : "bg-white/10 text-white/70 border border-white/20 hover:bg-white/15 hover:text-white"
                                                }
                                            `}
                                        >
                                            {SPEED_LABELS[s] || `×${s}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Date Scrubber */}
                        <div className="flex items-center gap-2 lg:gap-3 flex-1 lg:flex-initial">
                            {/* Divider */}
                            <div className="hidden lg:block h-8 w-px bg-white/20" />

                            <div className="flex items-center gap-2 lg:gap-2 flex-1 lg:flex-initial">
                                <Calendar
                                    size={15}
                                    strokeWidth={2}
                                    className="text-white/60 shrink-0 lg:w-4 lg:h-4"
                                />
                                <div className="relative flex-1 lg:flex-initial">
                                    <input
                                        ref={dateInputRef}
                                        type="datetime-local"
                                        value={dateInputValue}
                                        onChange={handleDateInputChange}
                                        onFocus={handleDateInputFocus}
                                        onBlur={handleDateInputBlur}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                dateInputRef.current?.blur();
                                            }
                                        }}
                                        className={`
                                            w-full lg:w-auto
                                            px-2.5 py-1.5 lg:px-3 lg:py-2
                                            rounded-md lg:rounded-lg
                                            bg-white/10 border border-white/20
                                            text-white/95 placeholder-white/40
                                            focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50
                                            text-[11px] lg:text-sm
                                            font-mono tabular-nums
                                            min-w-0 lg:min-w-[200px]
                                            transition-all
                                        `}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}