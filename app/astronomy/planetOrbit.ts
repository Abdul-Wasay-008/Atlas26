/**
 * Generic Planet Orbit Module
 *
 * Keplerian orbit position for any planet. Used by Mars and any future planets.
 * Earth keeps its own getEarthOrbitPosition in earthOrbit.ts for ECI/ECEF/sidereal logic.
 */

import * as THREE from "three";

function dateToJulianDate(date: Date): number {
    return date.getTime() / 86400000 + 2440587.5;
}

export interface PlanetOrbitParams {
    /** Orbital period in Earth days */
    periodDays: number;
    /** Semi-major axis in scene units (Earth = 4.5) */
    semiMajorAxis: number;
    /** Orbital eccentricity (0 = circular) */
    eccentricity: number;
}

/**
 * Solve Kepler's equation E - e*sin(E) = M for E (eccentric anomaly) by Newton iteration.
 */
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
 * Get planet orbital position in heliocentric coordinates (Sun at origin).
 * Orbital plane is XZ (Y = 0). Same convention as Earth.
 *
 * @param date UTC date
 * @param params Planet orbital parameters
 * @returns Position as Vector3 (scene units)
 */
export function getPlanetOrbitPosition(
    date: Date,
    params: PlanetOrbitParams
): THREE.Vector3 {
    const { periodDays, semiMajorAxis, eccentricity } = params;
    const JD = dateToJulianDate(date);
    const daysSinceJ2000 = JD - 2451545.0;

    const meanAnomaly =
        (daysSinceJ2000 / periodDays) * Math.PI * 2;
    let M = meanAnomaly % (2 * Math.PI);
    if (M < 0) M += 2 * Math.PI;

    let E: number;
    let r: number;
    let trueAnomaly: number;

    if (eccentricity < 1e-6) {
        trueAnomaly = M;
        r = semiMajorAxis;
    } else {
        E = solveKepler(M, eccentricity);
        trueAnomaly = 2 * Math.atan2(
            Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
            Math.sqrt(1 - eccentricity) * Math.cos(E / 2)
        );
        r =
            (semiMajorAxis * (1 - eccentricity * eccentricity)) /
            (1 + eccentricity * Math.cos(trueAnomaly));
    }

    const x = r * Math.cos(trueAnomaly);
    const z = r * Math.sin(trueAnomaly);
    return new THREE.Vector3(x, 0, z);
}

/** Mars orbital parameters (realistic, scene-scaled) */
export const MARS_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: 687,
    semiMajorAxis: 4.5 * 1.524, // 1.524 AU, Earth = 4.5
    eccentricity: 0.0934,
};

/** Mars axial tilt in radians (25.19°) */
export const MARS_AXIAL_TILT_RADIANS = (25.19 * Math.PI) / 180;
