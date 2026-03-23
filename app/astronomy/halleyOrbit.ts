import * as THREE from "three";
import { type PlanetOrbitParams } from "./planetOrbit";

export const HALLEY_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: 27500,
    semiMajorAxis: 28,
    eccentricity: 0.93,
};

const INCLINATION_RADIANS = THREE.MathUtils.degToRad(8);
const HALLEY_SPEED_MULTIPLIER = 2.5;

function dateToJulianDate(date: Date): number {
    return date.getTime() / 86400000 + 2440587.5;
}

function solveKepler(meanAnomaly: number, e: number, maxIterations = 10): number {
    let E = meanAnomaly;
    for (let i = 0; i < maxIterations; i++) {
        const dE = (E - e * Math.sin(E) - meanAnomaly) / (1 - e * Math.cos(E));
        E -= dE;
        if (Math.abs(dE) < 1e-10) break;
    }
    return E;
}

/**
 * Get Halley's Comet orbital position in heliocentric coordinates (Sun at origin).
 * Uses a local Kepler solver with phase-level speed scaling (shorter effective period
 * for mean anomaly only) so Halley moves visibly without modifying the input date.
 * 8-degree inclination applied per-position (no global rotation).
 */
export function getHalleyPosition(date: Date): THREE.Vector3 {
    const { periodDays, semiMajorAxis, eccentricity } = HALLEY_ORBIT_PARAMS;
    const effectivePeriodDays = periodDays / HALLEY_SPEED_MULTIPLIER;

    const JD = dateToJulianDate(date);
    const daysSinceJ2000 = JD - 2451545.0;

    let M = ((daysSinceJ2000 / effectivePeriodDays) * Math.PI * 2) % (2 * Math.PI);
    if (M < 0) M += 2 * Math.PI;

    const E = solveKepler(M, eccentricity);
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
        Math.sqrt(1 - eccentricity) * Math.cos(E / 2)
    );
    const r =
        (semiMajorAxis * (1 - eccentricity * eccentricity)) /
        (1 + eccentricity * Math.cos(trueAnomaly));

    const x = r * Math.cos(trueAnomaly);
    const z = r * Math.sin(trueAnomaly);

    const position = new THREE.Vector3(x, 0, z);
    position.y = z * Math.sin(INCLINATION_RADIANS);
    position.z = z * Math.cos(INCLINATION_RADIANS);
    return position;
}
