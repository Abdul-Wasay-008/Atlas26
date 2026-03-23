"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoadingStore } from "@/app/store/loadingStore";
import { orbitron, poppins } from "@/app/fonts";

const LERP_FACTOR = 0.12;
const FULL_FILL_THRESHOLD = 99.5;

export default function DashboardLoadingOverlay() {
    const { progress, isReady } = useLoadingStore();
    const [showOverlay, setShowOverlay] = useState(true);
    const displayProgressRef = useRef(0);
    const [displayProgress, setDisplayProgress] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (isReady) setShowOverlay(false);
    }, [isReady]);

    const targetProgress = Math.min(100, progress >= FULL_FILL_THRESHOLD ? 100 : progress);

    useEffect(() => {
        if (!showOverlay) return;
        let running = true;
        const animate = () => {
            if (!running) return;
            const current = displayProgressRef.current;
            const target = targetProgress;
            const diff = target - current;
            if (diff > 0) {
                displayProgressRef.current = current + diff * LERP_FACTOR;
                if (target - displayProgressRef.current < 0.5) {
                    displayProgressRef.current = target;
                }
            }
            setDisplayProgress(displayProgressRef.current);
            rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);
        return () => {
            running = false;
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [targetProgress, showOverlay]);

    const barWidth = Math.min(100, Math.max(0, displayProgress));

    return (
        <AnimatePresence>
            {showOverlay && (
                <motion.div
                    key="loading-overlay"
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    aria-busy={!isReady}
                    aria-live="polite"
                    aria-label="Loading Atlas simulation"
                >
                    <div className="w-full max-w-md px-8 flex flex-col items-center gap-6">
                        <h2
                            className={`text-xl md:text-2xl font-semibold text-white/95 tracking-wide ${orbitron.className}`}
                        >
                            Launching Atlas
                        </h2>
                        <p
                            className={`text-sm text-gray-300/80 ${poppins.className}`}
                        >
                            Loading solar system assets…
                        </p>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-linear-to-r from-[#3fa9f5] via-[#00d4ff] to-[#3fa9f5]"
                                style={{ width: `${barWidth}%` }}
                            />
                        </div>
                        <span
                            className={`text-sm font-medium text-white/70 tabular-nums ${poppins.className}`}
                        >
                            {Math.round(barWidth)}%
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
