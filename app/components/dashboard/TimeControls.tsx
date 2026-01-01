"use client";

import { useState, useEffect, useRef } from "react";
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

    const handleReset = () => {
        // Reset time to now
        reset();
        // Clear selection
        clearSelection();
        // Reset camera to default system view
        cameraController.snapToSystem();
    };

    const isSimulationMode = mode === "SIMULATION";

    return (
        <div
            className={`
        fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50
        ${poppins.className}
      `}
        >
            <div
                className={`
          backdrop-blur-xl
          bg-white/10
          border border-white/15
          shadow-[0_0_30px_rgba(0,0,0,0.4)]
          rounded-2xl
          overflow-hidden
          max-w-[95vw]
        `}
            >
                {/* 📊 Date/Time Display Section - Always visible, prominent */}
                <div
                    className={`
            flex items-center justify-between gap-4
            px-4 py-2.5 sm:px-5 sm:py-3
            ${isSimulationMode ? "border-b border-white/10" : ""}
            bg-white/5
          `}
                >
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Clock size={16} strokeWidth={2} className="text-white/70" />
                        <div className="flex flex-col">
                            <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">
                                UTC Time
                            </span>
                            <span className="text-sm sm:text-base font-medium text-white/95 tabular-nums">
                                {formatDateCompact(currentDate)}
                            </span>
                        </div>
                    </div>

                    {/* 🔄 Mode Toggle & Reset - Compact */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleMode}
                            aria-label={`Switch to ${isSimulationMode ? "real time" : "simulation"} mode`}
                            className={`
                flex items-center justify-center gap-1.5
                px-2.5 py-1.5 sm:px-3 sm:py-1.5
                rounded-lg transition cursor-pointer whitespace-nowrap
                text-xs sm:text-sm
                ${isSimulationMode
                                    ? "bg-blue-500/30 text-white border border-blue-400/40 hover:bg-blue-500/40"
                                    : "bg-white/20 text-white border border-white/30 hover:bg-white/30"
                                }
              `}
                            title={isSimulationMode ? "Simulation Mode" : "Real Time Mode"}
                        >
                            {isSimulationMode ? (
                                <>
                                    <Timer size={14} strokeWidth={2} />
                                    <span>SIM</span>
                                </>
                            ) : (
                                <>
                                    <Clock size={14} strokeWidth={2} />
                                    <span>REAL</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleReset}
                            aria-label="Reset to default state"
                            className={`
                flex items-center justify-center
                w-8 h-8 sm:w-9 sm:h-9
                rounded-lg transition cursor-pointer
                bg-white/10 hover:bg-white/20
                hover:shadow-[0_0_10px_rgba(255,255,255,0.25)]
              `}
                        >
                            <RotateCcw size={16} strokeWidth={2} className="text-white/90" />
                        </button>
                    </div>
                </div>

                {/* 🎮 Simulation Controls Section - Only in SIMULATION mode */}
                {isSimulationMode && (
                    <div
                        className="
              flex flex-col sm:flex-row items-stretch sm:items-center
              gap-3 sm:gap-4
              px-4 py-3 sm:px-5 sm:py-3.5
            "
                    >
                        {/* Left: Play/Pause + Speed Controls */}
                        <div className="flex items-center gap-3">
                            {/* ⏯ Play / Pause */}
                            <button
                                onClick={togglePause}
                                aria-label={isPaused ? "Resume time" : "Pause time"}
                                className={`
                  flex items-center justify-center
                  w-10 h-10 sm:w-11 sm:h-11
                  rounded-xl transition cursor-pointer
                  ${!isPaused
                                        ? "bg-blue-500/30 text-white border border-blue-400/50 shadow-[0_0_14px_rgba(59,130,246,0.4)]"
                                        : "bg-white/15 text-white/90 border border-white/20 hover:bg-white/25"
                                    }
                `}
                            >
                                {!isPaused ? (
                                    <Pause size={18} strokeWidth={2.5} />
                                ) : (
                                    <Play
                                        size={18}
                                        strokeWidth={2.5}
                                        className="ml-0.5"
                                    />
                                )}
                            </button>

                            {/* Divider */}
                            <div className="h-8 w-px bg-white/20" />

                            {/* ⏩ Speed Buttons */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-white/50 hidden sm:inline">Speed:</span>
                                <div className="flex items-center gap-1.5">
                                    {SPEEDS.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => handleSpeedChange(s)}
                                            className={`
                        px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer
                        text-xs sm:text-sm font-medium
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
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial">
                            {/* Divider */}
                            <div className="hidden sm:block h-8 w-px bg-white/20" />

                            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                                <Calendar
                                    size={16}
                                    strokeWidth={2}
                                    className="text-white/60 flex-shrink-0"
                                />
                                <div className="relative flex-1 sm:flex-initial">
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
                      w-full sm:w-auto
                      px-3 py-2
                      rounded-lg
                      bg-white/10 border border-white/20
                      text-white/95 placeholder-white/40
                      focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50
                      text-xs sm:text-sm
                      font-mono tabular-nums
                      min-w-[160px] sm:min-w-[200px]
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