type QualityTier = "low" | "mid" | "high";

interface QualitySettings {
    tier: QualityTier;
    dpr: number;
    asteroidCount: number;
    kuiperCount: number;
    antialias: boolean;
}

const TIER_SETTINGS: Record<QualityTier, Omit<QualitySettings, "tier">> = {
    low: { dpr: 1, asteroidCount: 3000, kuiperCount: 800, antialias: false },
    mid: { dpr: 1.5, asteroidCount: 3500, kuiperCount: 1000, antialias: true },
    high: { dpr: 2, asteroidCount: 5000, kuiperCount: 1500, antialias: true },
};

function detectTier(): QualityTier {
    if (typeof window === "undefined") return "high";

    const mem = (navigator as { deviceMemory?: number }).deviceMemory;
    const w = window.screen?.width ?? window.innerWidth;

    if (mem !== undefined) {
        if (mem <= 4) return "low";
        if (mem <= 6) return "mid";
        return "high";
    }

    if (w < 768) return "low";
    if (w < 1280) return "mid";
    return "high";
}

const tier = detectTier();

export const quality: QualitySettings = { tier, ...TIER_SETTINGS[tier] };
