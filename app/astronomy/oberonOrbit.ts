/**
 * Oberon Orbit Module
 *
 * Calculates Oberon position relative to Uranus using simplified Keplerian mechanics.
 * Oberon is Uranus's outermost major moon, heavily cratered with dark ancient terrain.
 *
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 583,520 km
 * - Orbital period: 13.463 days (~323.11 hours)
 * - Eccentricity: 0.0014
 * - Inclination: ~0° (approximated)
 */

import * as THREE from "three";

/** Oberon orbital period in hours */
export const OBERON_ORBITAL_PERIOD_HOURS = 323.112; // 13.463 days * 24

/** Oberon orbital period in days */
export const OBERON_ORBITAL_PERIOD_DAYS = OBERON_ORBITAL_PERIOD_HOURS / 24;

/** Oberon semi-major axis in km */
const OBERON_SEMI_MAJOR_AXIS_KM = 583520;

/** Oberon orbit eccentricity */
const OBERON_ECCENTRICITY = 0.0014;

/**
 * Scene scale for Oberon orbit radius
 * Oberon is Uranus's fifth and outermost major moon.
 */
const OBERON_ORBIT_SCENE_RADIUS = 4.0;

/** Scale factor: km to scene units */
const SCENE_SCALE = OBERON_ORBIT_SCENE_RADIUS / OBERON_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Oberon position relative to Uranus (Uranus-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 *
 * @param date Current simulation date
 * @returns Oberon position as Vector3 relative to Uranus at origin
 */
export function getOberonPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = OBERON_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);

    // Apply eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + OBERON_ECCENTRICITY * Math.sin(meanAnomaly);

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + OBERON_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - OBERON_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r =
        (OBERON_SEMI_MAJOR_AXIS_KM * (1 - OBERON_ECCENTRICITY * OBERON_ECCENTRICITY)) /
        (1 + OBERON_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Oberon position in world coordinates (Sun-centered)
 *
 * @param date Current simulation date
 * @param uranusPosition Uranus position in world coordinates
 * @returns Oberon world position (relative to Sun at origin)
 */
export function getOberonWorldPosition(
    date: Date,
    uranusPosition: THREE.Vector3
): THREE.Vector3 {
    const oberonRelativeToUranus = getOberonPosition(date);
    return new THREE.Vector3().addVectors(uranusPosition, oberonRelativeToUranus);
}
