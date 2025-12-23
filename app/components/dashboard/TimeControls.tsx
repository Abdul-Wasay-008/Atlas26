"use client";

import { useState } from "react";
import { Play, Pause } from "lucide-react";
import { timeEngine } from "@/app/core/time";
import { orbitron, poppins } from "@/app/fonts";

const SPEEDS = [1, 50, 200, 1000];

export default function TimeControls() {
    const [running, setRunning] = useState(timeEngine.isRunning());
    const [speed, setSpeed] = useState(timeEngine.getTimeScale());

    const togglePlay = () => {
        if (running) {
            timeEngine.pause();
        } else {
            timeEngine.resume();
        }
        setRunning(!running);
    };

    const changeSpeed = (value: number) => {
        timeEngine.setTimeScale(value);
        setSpeed(value);
    };

    return (
        <div
            className={`
        fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2 sm:gap-3
        px-3 sm:px-5 py-2.5 sm:py-3
        rounded-2xl
        backdrop-blur-xl
        bg-white/10
        border border-white/15
        shadow-[0_0_30px_rgba(0,0,0,0.4)]
        text-xs sm:text-sm text-white/90
        max-w-[95vw] ${poppins.className}
      `}
        >
            {/* ⏯ Play / Pause */}
            <button
                onClick={togglePlay}
                aria-label={running ? "Pause time" : "Play time"}
                className={`
          flex items-center justify-center
          w-9 h-9 sm:w-10 sm:h-10
          rounded-full transition cursor-pointer
          ${running
                        ? "bg-white/20 shadow-[0_0_14px_rgba(255,255,255,0.35)]"
                        : "bg-white/10 hover:bg-white/20"
                    }
        `}
            >
                {running ? (
                    <Pause size={18} strokeWidth={2} className="text-white/90" />
                ) : (
                    <Play
                        size={18}
                        strokeWidth={2}
                        className="text-white/90 ml-1px"
                    />
                )}
            </button>

            {/* Divider (hidden on very small screens) */}
            <div className="hidden sm:block h-6 w-px bg-white/20" />

            {/* ⏩ Speed Buttons */}
            <div
                className="
          flex items-center gap-1.5 sm:gap-2
          overflow-x-auto scrollbar-hide
        "
            >
                {SPEEDS.map((s) => (
                    <button
                        key={s}
                        onClick={() => changeSpeed(s)}
                        className={`
              px-2.5 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer
              ${speed === s
                                ? "bg-white/25 text-white shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                                : "text-white/60 hover:text-white hover:bg-white/10"
                            }
            `}
                    >
                        ×{s}
                    </button>
                ))}
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-6 w-px bg-white/20" />

            {/* 📊 Indicator */}
            <span className="hidden sm:inline text-white/60">
                Time: <span className="text-white">×{speed}</span>
            </span>
        </div>
    );
}