/**
 * Generic Planet Orbit Module
 *
 * Keplerian orbit position for any planet. Used by Mars and any future planets.
 * Earth keeps its own getEarthOrbitPosition in earthOrbit.ts for ECI/ECEF/sidereal logic.
 *
 * KEPLER'S THIRD LAW: T² ∝ a³ (orbital period squared proportional to semi-major axis cubed)
 * Formula: T = T_earth × (a / a_earth)^(3/2)
 * Orbital periods are derived from real semi-major axes (AU) so planets move like in space.
 * Scene semi-major axis is separate (visual scaling for layout).
 */

import * as THREE from "three";

const EARTH_ORBITAL_PERIOD_DAYS = 365.2422; // Tropical year, matches earthOrbit.ts
const EARTH_SEMI_MAJOR_AXIS_AU = 1.0;

/**
 * Compute orbital period in Earth days from semi-major axis (AU) using Kepler's Third Law.
 * T² ∝ a³  =>  T = T_earth × (a / a_earth)^(3/2)
 */
export function keplerPeriodDays(semiMajorAxisAU: number): number {
    return EARTH_ORBITAL_PERIOD_DAYS * Math.pow(semiMajorAxisAU / EARTH_SEMI_MAJOR_AXIS_AU, 1.5);
}

function dateToJulianDate(date: Date): number {
    return date.getTime() / 86400000 + 2440587.5;
}

export interface PlanetOrbitParams {
    /** Orbital period in Earth days (Kepler-derived from semi-major axis AU) */
    periodDays: number;
    /** Semi-major axis in scene units for position (Earth = 8.0, visual layout) */
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

/** Semi-major axes in AU (NASA/JPL values). Used for Kepler period derivation. */
const SEMI_MAJOR_AXIS_AU = {
    mercury: 0.387098,
    venus: 0.723332,
    earth: 1.000001,
    mars: 1.523662,
    jupiter: 5.203363,
    saturn: 9.537070,
    uranus: 19.191264,
    neptune: 30.068963,
} as const;

/** Mercury: Kepler period from a=0.387 AU, scene radius 3.0 */
export const MERCURY_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: keplerPeriodDays(SEMI_MAJOR_AXIS_AU.mercury),
    semiMajorAxis: 3.0,
    eccentricity: 0.2056,
};

/** Mercury axial tilt in radians (0.034° - nearly upright) */
export const MERCURY_AXIAL_TILT_RADIANS = (0.034 * Math.PI) / 180;

/** Venus: Kepler period from a=0.723 AU, scene radius 5.0 */
export const VENUS_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: keplerPeriodDays(SEMI_MAJOR_AXIS_AU.venus),
    semiMajorAxis: 5.0,
    eccentricity: 0.0068,
};

/** Venus axial tilt in radians (2.64° - retrograde rotation) */
export const VENUS_AXIAL_TILT_RADIANS = (2.64 * Math.PI) / 180;

/** Mars: Kepler period from a=1.524 AU, scene radius 12.0 */
export const MARS_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: keplerPeriodDays(SEMI_MAJOR_AXIS_AU.mars),
    semiMajorAxis: 12.0,
    eccentricity: 0.0934,
};

/** Mars axial tilt in radians (25.19°) */
export const MARS_AXIAL_TILT_RADIANS = (25.19 * Math.PI) / 180;

/** Jupiter: Kepler period from a=5.203 AU, scene radius 18.0 */
export const JUPITER_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: keplerPeriodDays(SEMI_MAJOR_AXIS_AU.jupiter),
    semiMajorAxis: 18.0,
    eccentricity: 0.0484,
};

/** Jupiter axial tilt in radians (3.13°) */
export const JUPITER_AXIAL_TILT_RADIANS = (3.13 * Math.PI) / 180;

/** Saturn: Kepler period from a=9.537 AU, scene radius 24.0 */
export const SATURN_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: keplerPeriodDays(SEMI_MAJOR_AXIS_AU.saturn),
    semiMajorAxis: 24.0,
    eccentricity: 0.0542,
};

/** Saturn axial tilt in radians (26.73°) */
export const SATURN_AXIAL_TILT_RADIANS = (26.73 * Math.PI) / 180;

/** Uranus: Kepler period from a=19.191 AU, scene radius 30.0 */
export const URANUS_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: keplerPeriodDays(SEMI_MAJOR_AXIS_AU.uranus),
    semiMajorAxis: 30.0,
    eccentricity: 0.0472,
};

/** Uranus axial tilt in radians (97.77° - tilted on its side) */
export const URANUS_AXIAL_TILT_RADIANS = (97.77 * Math.PI) / 180;

/** Neptune: Kepler period from a=30.069 AU, scene radius 36.0 */
export const NEPTUNE_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: keplerPeriodDays(SEMI_MAJOR_AXIS_AU.neptune),
    semiMajorAxis: 36.0,
    eccentricity: 0.0086,
};

/** Neptune axial tilt in radians (28.32°) */
export const NEPTUNE_AXIAL_TILT_RADIANS = (28.32 * Math.PI) / 180;
