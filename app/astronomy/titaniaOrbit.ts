/**
 * Titania Orbit Module
 *
 * Calculates Titania position relative to Uranus using simplified Keplerian mechanics.
 * Titania is Uranus's largest major moon, with fault valleys and icy plains.
 *
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 435,910 km
 * - Orbital period: 8.706 days (~208.94 hours)
 * - Eccentricity: 0.0011
 * - Inclination: ~0° (approximated)
 */

import * as THREE from "three";

/** Titania orbital period in hours */
export const TITANIA_ORBITAL_PERIOD_HOURS = 208.944; // 8.706 days * 24

/** Titania orbital period in days */
export const TITANIA_ORBITAL_PERIOD_DAYS = TITANIA_ORBITAL_PERIOD_HOURS / 24;

/** Titania semi-major axis in km */
const TITANIA_SEMI_MAJOR_AXIS_KM = 435910;

/** Titania orbit eccentricity */
const TITANIA_ECCENTRICITY = 0.0011;

/**
 * Scene scale for Titania orbit radius
 * Titania is Uranus's fourth major moon, outside Umbriel.
 */
const TITANIA_ORBIT_SCENE_RADIUS = 3.5;

/** Scale factor: km to scene units */
const SCENE_SCALE = TITANIA_ORBIT_SCENE_RADIUS / TITANIA_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Titania position relative to Uranus (Uranus-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 *
 * @param date Current simulation date
 * @returns Titania position as Vector3 relative to Uranus at origin
 */
export function getTitaniaPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = TITANIA_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);

    // Apply eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + TITANIA_ECCENTRICITY * Math.sin(meanAnomaly);

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + TITANIA_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - TITANIA_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r =
        (TITANIA_SEMI_MAJOR_AXIS_KM * (1 - TITANIA_ECCENTRICITY * TITANIA_ECCENTRICITY)) /
        (1 + TITANIA_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Titania position in world coordinates (Sun-centered)
 *
 * @param date Current simulation date
 * @param uranusPosition Uranus position in world coordinates
 * @returns Titania world position (relative to Sun at origin)
 */
export function getTitaniaWorldPosition(
    date: Date,
    uranusPosition: THREE.Vector3
): THREE.Vector3 {
    const titaniaRelativeToUranus = getTitaniaPosition(date);
    return new THREE.Vector3().addVectors(uranusPosition, titaniaRelativeToUranus);
}
