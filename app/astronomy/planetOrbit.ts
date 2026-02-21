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
    /** Semi-major axis in scene units (Earth = 8.0) */
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
    semiMajorAxis: 12.0, // Visual distance from Sun (scene units)
    eccentricity: 0.0934,
};

/** Mars axial tilt in radians (25.19°) */
export const MARS_AXIAL_TILT_RADIANS = (25.19 * Math.PI) / 180;

/** Venus orbital parameters (realistic, scene-scaled) */
export const VENUS_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: 225,
    semiMajorAxis: 5.0, // Visual distance from Sun (scene units)
    eccentricity: 0.0067,
};

/** Venus axial tilt in radians (177.4° - nearly upside down, but we simplify for now) */
export const VENUS_AXIAL_TILT_RADIANS = (2.64 * Math.PI) / 180;

/** Mercury orbital parameters (realistic, scene-scaled) */
export const MERCURY_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: 88,
    semiMajorAxis: 3.0, // Visual distance from Sun (scene units)
    eccentricity: 0.205,
};

/** Mercury axial tilt in radians (0.034° - nearly upright) */
export const MERCURY_AXIAL_TILT_RADIANS = (0.034 * Math.PI) / 180;

/** Jupiter orbital parameters (realistic, scene-scaled) */
export const JUPITER_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: 4333,
    semiMajorAxis: 18.0, // Visual distance from Sun (scene units)
    eccentricity: 0.049,
};

/** Jupiter axial tilt in radians (3.13°) */
export const JUPITER_AXIAL_TILT_RADIANS = (3.13 * Math.PI) / 180;

/** Saturn orbital parameters (realistic, scene-scaled) */
export const SATURN_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: 10759,
    semiMajorAxis: 24.0, // Visual distance from Sun (scene units)
    eccentricity: 0.054,
};

/** Saturn axial tilt in radians (26.73°) */
export const SATURN_AXIAL_TILT_RADIANS = (26.73 * Math.PI) / 180;

/** Uranus orbital parameters (realistic, scene-scaled) */
export const URANUS_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: 30687,
    semiMajorAxis: 30.0, // Visual distance from Sun (scene units)
    eccentricity: 0.046,
};

/** Uranus axial tilt in radians (97.77° - tilted on its side) */
export const URANUS_AXIAL_TILT_RADIANS = (97.77 * Math.PI) / 180;

/** Neptune orbital parameters (realistic, scene-scaled) */
export const NEPTUNE_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: 60190,
    semiMajorAxis: 36.0, // Visual distance from Sun (scene units)
    eccentricity: 0.009,
};

/** Neptune axial tilt in radians (28.32°) */
export const NEPTUNE_AXIAL_TILT_RADIANS = (28.32 * Math.PI) / 180;
