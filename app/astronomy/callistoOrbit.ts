/**
 * Callisto Orbit Module
 *
 * Calculates Callisto position relative to Jupiter using simplified Keplerian mechanics.
 * Callisto is Jupiter's fourth Galilean moon and the outermost of the four.
 *
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 1,883,000 km
 * - Orbital period: 16.689 days (~400.5 hours)
 * - Eccentricity: ~0.007 (nearly circular)
 * - Inclination: ~0.2° (approximated as 0° for simplicity)
 */

import * as THREE from "three";

/** Callisto orbital period in hours */
export const CALLISTO_ORBITAL_PERIOD_HOURS = 400.536; // 16.689 days * 24

/** Callisto orbital period in days */
export const CALLISTO_ORBITAL_PERIOD_DAYS = CALLISTO_ORBITAL_PERIOD_HOURS / 24;

/** Callisto semi-major axis in km */
const CALLISTO_SEMI_MAJOR_AXIS_KM = 1883000;

/** Callisto orbit eccentricity (nearly circular) */
const CALLISTO_ECCENTRICITY = 0.007;

/**
 * Jupiter scene radius (must match Jupiter.tsx)
 */
const JUPITER_RADIUS = 0.9;

/**
 * Scene scale for Callisto orbit radius
 * Callisto is the outermost Galilean moon; visually compress to 8.5x Jupiter radius
 */
const CALLISTO_ORBIT_SCENE_RADIUS = JUPITER_RADIUS * 8.5;

/** Scale factor: km to scene units */
const SCENE_SCALE = CALLISTO_ORBIT_SCENE_RADIUS / CALLISTO_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Callisto position relative to Jupiter (Jupiter-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 *
 * @param date Current simulation date
 * @returns Callisto position as Vector3 relative to Jupiter at origin
 */
export function getCallistoPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = CALLISTO_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);

    // For nearly circular orbit, apply eccentricity correction
    const eccentricAnomaly = meanAnomaly + CALLISTO_ECCENTRICITY * Math.sin(meanAnomaly);

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + CALLISTO_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - CALLISTO_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r =
        (CALLISTO_SEMI_MAJOR_AXIS_KM *
            (1 - CALLISTO_ECCENTRICITY * CALLISTO_ECCENTRICITY)) /
        (1 + CALLISTO_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Callisto position in world coordinates (Sun-centered)
 *
 * @param date Current simulation date
 * @param jupiterPosition Jupiter position in world coordinates
 * @returns Callisto world position (relative to Sun at origin)
 */
export function getCallistoWorldPosition(
    date: Date,
    jupiterPosition: THREE.Vector3
): THREE.Vector3 {
    const callistoRelativeToJupiter = getCallistoPosition(date);
    return new THREE.Vector3().addVectors(jupiterPosition, callistoRelativeToJupiter);
}
