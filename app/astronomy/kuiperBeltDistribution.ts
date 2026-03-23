import {
    KUIPER_COUNT,
    INNER_RADIUS,
    OUTER_RADIUS,
    BELT_THICKNESS,
    MIN_SCALE,
    MAX_SCALE,
} from "./kuiperBeltConfig";

export interface KuiperData {
    baseAngles: Float32Array;
    radii: Float32Array;
    yOffsets: Float32Array;
    scales: Float32Array;
    /** Euler x, y, z packed sequentially (length = count * 3) */
    rotations: Float32Array;
}

/**
 * Generate procedural Kuiper Belt object data.
 *
 * Compared to the asteroid belt distribution this produces:
 *  - Stronger center-weighting via power-curve exponent 1.5
 *  - More and wider angular gaps for a sparser feel
 *  - Greater vertical spread matching the thicker belt
 */
export function generateKuiperData(count: number = KUIPER_COUNT): KuiperData {
    const baseAngles = new Float32Array(count);
    const radii = new Float32Array(count);
    const yOffsets = new Float32Array(count);
    const scales = new Float32Array(count);
    const rotations = new Float32Array(count * 3);

    const radialRange = OUTER_RADIUS - INNER_RADIUS;

    const NUM_GAPS = 5 + Math.floor(Math.random() * 4);
    const gaps: Array<{ center: number; width: number }> = [];
    for (let g = 0; g < NUM_GAPS; g++) {
        gaps.push({
            center: Math.random() * Math.PI * 2,
            width: 0.04 + Math.random() * 0.10,
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

        const radius = INNER_RADIUS + radialRange * Math.pow(Math.random(), 1.5);

        const jitter = (Math.random() - 0.5) * 0.25;
        const finalRadius = Math.max(INNER_RADIUS, Math.min(OUTER_RADIUS, radius + jitter));

        baseAngles[i] = angle;
        radii[i] = finalRadius;

        yOffsets[i] = (Math.random() - 0.5) * BELT_THICKNESS;

        const sRand = Math.random();
        scales[i] = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * sRand * sRand;

        rotations[i * 3] = Math.random() * Math.PI * 2;
        rotations[i * 3 + 1] = Math.random() * Math.PI * 2;
        rotations[i * 3 + 2] = Math.random() * Math.PI * 2;

        i++;
    }

    return { baseAngles, radii, yOffsets, scales, rotations };
}
