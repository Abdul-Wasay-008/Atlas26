"use client";

import { useState } from "react";
import { timeEngine } from "@/app/core/time";

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
            className="
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-3 px-5 py-3
        rounded-2xl
        backdrop-blur-xl
        bg-white/10
        border border-white/15
        shadow-[0_0_30px_rgba(0,0,0,0.4)]
        text-sm text-white/90
      "
        >
            {/* ⏯ Play / Pause */}
            <button
                onClick={togglePlay}
                className="
          px-3 py-1.5 rounded-lg
          bg-white/10 hover:bg-white/20
          transition
        "
            >
                {running ? "⏸ Pause" : "▶ Play"}
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-white/20" />

            {/* Speed Buttons */}
            {SPEEDS.map((s) => (
                <button
                    key={s}
                    onClick={() => changeSpeed(s)}
                    className={`
            px-2.5 py-1.5 rounded-lg transition
            ${speed === s
                            ? "bg-white/25 text-white shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                            : "text-white/60 hover:text-white hover:bg-white/10"
                        }
          `}
                >
                    ×{s}
                </button>
            ))}

            {/* Divider */}
            <div className="h-6 w-px bg-white/20" />

            {/* Indicator */}
            <span className="text-white/60">
                Time: <span className="text-white">×{speed}</span>
            </span>
        </div>
    );
}