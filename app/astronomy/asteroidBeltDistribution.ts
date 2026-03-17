import {
    ASTEROID_COUNT,
    INNER_RADIUS,
    OUTER_RADIUS,
    BELT_THICKNESS,
    MIN_SCALE,
    MAX_SCALE,
} from "./asteroidBeltConfig";

export interface AsteroidData {
    baseAngles: Float32Array;
    radii: Float32Array;
    yOffsets: Float32Array;
    scales: Float32Array;
    /** Euler x, y, z packed sequentially (length = count * 3) */
    rotations: Float32Array;
}

/**
 * Attempt a Box-Muller-ish Gaussian sample clamped to [-1, 1].
 * Falls back to uniform if the transform produces NaN.
 */
function gaussianRandom(): number {
    const u1 = Math.random() || 1e-10;
    const u2 = Math.random();
    const g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(-1, Math.min(1, g * 0.33));
}

/**
 * Generate procedural asteroid data for the belt.
 *
 * Distribution choices:
 *  - Radial: power-curve bias toward belt center (mimics Kirkwood-gap density).
 *  - Angular: full circle with small random gap sectors for natural irregularity.
 *  - Vertical: Gaussian-like spread within BELT_THICKNESS.
 *  - Scale: power-law (many small, few large).
 */
export function generateAsteroidData(count: number = ASTEROID_COUNT): AsteroidData {
    const baseAngles = new Float32Array(count);
    const radii = new Float32Array(count);
    const yOffsets = new Float32Array(count);
    const scales = new Float32Array(count);
    const rotations = new Float32Array(count * 3);

    const radialRange = OUTER_RADIUS - INNER_RADIUS;
    const midRadius = (INNER_RADIUS + OUTER_RADIUS) / 2;

    const NUM_GAPS = 3 + Math.floor(Math.random() * 4);
    const gaps: Array<{ center: number; width: number }> = [];
    for (let g = 0; g < NUM_GAPS; g++) {
        gaps.push({
            center: Math.random() * Math.PI * 2,
            width: 0.02 + Math.random() * 0.06,
        });
    }

    let i = 0;
    while (i < count) {
        const angle = Math.random() * Math.PI * 2;

        let inGap = false;
        for (const gap of gaps) {
            let diff = Math.abs(angle - gap.center);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff < gap.width) {
                inGap = true;
                break;
            }
        }
        if (inGap && Math.random() < 0.7) continue;

        // Power-curve radial distribution biased toward center
        const t = Math.random();
        const biased = 0.5 + (t - 0.5) * Math.pow(Math.abs(t - 0.5) * 2, 0.3) * Math.sign(t - 0.5);
        const radius = INNER_RADIUS + biased * radialRange;

        // Slight per-asteroid radial jitter
        const jitter = (Math.random() - 0.5) * 0.15;
        const finalRadius = Math.max(INNER_RADIUS, Math.min(OUTER_RADIUS, radius + jitter));

        baseAngles[i] = angle;
        radii[i] = finalRadius;

        yOffsets[i] = gaussianRandom() * (BELT_THICKNESS / 2);

        // Power-law scale: many small, few large
        const sRand = Math.random();
        scales[i] = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * sRand * sRand;

        rotations[i * 3] = Math.random() * Math.PI * 2;
        rotations[i * 3 + 1] = Math.random() * Math.PI * 2;
        rotations[i * 3 + 2] = Math.random() * Math.PI * 2;

        i++;
    }

    return { baseAngles, radii, yOffsets, scales, rotations };
}
