/**
 * Miranda Orbit Module
 *
 * Calculates Miranda position relative to Uranus using simplified Keplerian mechanics.
 * Miranda is Uranus's smallest and innermost major moon, with a bizarre patchwork surface.
 *
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 129,390 km
 * - Orbital period: 1.413 days (~33.91 hours)
 * - Eccentricity: 0.0013
 * - Inclination: ~0° (approximated)
 */

import * as THREE from "three";

/** Miranda orbital period in hours */
export const MIRANDA_ORBITAL_PERIOD_HOURS = 33.912; // 1.413 days * 24

/** Miranda orbital period in days */
export const MIRANDA_ORBITAL_PERIOD_DAYS = MIRANDA_ORBITAL_PERIOD_HOURS / 24;

/** Miranda semi-major axis in km */
const MIRANDA_SEMI_MAJOR_AXIS_KM = 129390;

/** Miranda orbit eccentricity */
const MIRANDA_ECCENTRICITY = 0.0013;

/**
 * Scene scale for Miranda orbit radius
 * Miranda is Uranus's innermost moon.
 */
const MIRANDA_ORBIT_SCENE_RADIUS = 2.0;

/** Scale factor: km to scene units */
const SCENE_SCALE = MIRANDA_ORBIT_SCENE_RADIUS / MIRANDA_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Miranda position relative to Uranus (Uranus-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 *
 * @param date Current simulation date
 * @returns Miranda position as Vector3 relative to Uranus at origin
 */
export function getMirandaPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = MIRANDA_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);

    // Apply eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + MIRANDA_ECCENTRICITY * Math.sin(meanAnomaly);

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + MIRANDA_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - MIRANDA_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r =
        (MIRANDA_SEMI_MAJOR_AXIS_KM * (1 - MIRANDA_ECCENTRICITY * MIRANDA_ECCENTRICITY)) /
        (1 + MIRANDA_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Miranda position in world coordinates (Sun-centered)
 *
 * @param date Current simulation date
 * @param uranusPosition Uranus position in world coordinates
 * @returns Miranda world position (relative to Sun at origin)
 */
export function getMirandaWorldPosition(
    date: Date,
    uranusPosition: THREE.Vector3
): THREE.Vector3 {
    const mirandaRelativeToUranus = getMirandaPosition(date);
    return new THREE.Vector3().addVectors(uranusPosition, mirandaRelativeToUranus);
}
