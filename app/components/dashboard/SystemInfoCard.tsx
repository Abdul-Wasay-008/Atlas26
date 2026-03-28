"use client"

import { quality } from "@/app/store/qualityStore"
import { poppins } from "@/app/fonts"
import { useFPS } from "@/app/hooks/useFPS"

const TIER_COLOR: Record<string, string> = {
    low: "text-orange-400",
    mid: "text-yellow-400",
    high: "text-emerald-400",
}

function fpsValueClass(fps: number | null) {
    if (fps == null) return "text-white/90"
    if (fps >= 50) return "text-emerald-400"
    if (fps >= 30) return "text-yellow-400"
    return "text-red-400"
}

const staticRows = [
    { label: "Render DPR", value: quality.dpr },
    { label: "Asteroids", value: quality.asteroidCount.toLocaleString() },
    { label: "Kuiper", value: quality.kuiperCount.toLocaleString() },
    { label: "Antialias", value: quality.antialias ? "ON" : "OFF" },
]

export default function SystemInfoCard() {
    const fps = useFPS()

    return (
        <div
            className={`
                mt-2 p-3 rounded-xl
                bg-white/5 border border-white/10
                ${poppins.className}
            `}
        >
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Mode</span>
                    <span className={TIER_COLOR[quality.tier]}>{quality.tier.toUpperCase()}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50 inline-flex items-center gap-1.5">
                        <span
                            className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 animate-pulse shrink-0"
                            aria-hidden
                        />
                        FPS
                    </span>
                    <span className={fpsValueClass(fps)}>{fps == null ? "—" : fps}</span>
                </div>

                {staticRows.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                        <span className="text-white/50">{label}</span>
                        <span className="text-white/90">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
