/**
 * Ariel Orbit Module
 *
 * Calculates Ariel position relative to Uranus using simplified Keplerian mechanics.
 * Ariel is Uranus's second major moon, known for its bright icy surface and deep valleys.
 *
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 191,020 km
 * - Orbital period: 2.52 days (~60.48 hours)
 * - Eccentricity: 0.0012
 * - Inclination: ~0° (approximated)
 */

import * as THREE from "three";

/** Ariel orbital period in hours */
export const ARIEL_ORBITAL_PERIOD_HOURS = 60.48; // 2.52 days * 24

/** Ariel orbital period in days */
export const ARIEL_ORBITAL_PERIOD_DAYS = ARIEL_ORBITAL_PERIOD_HOURS / 24;

/** Ariel semi-major axis in km */
const ARIEL_SEMI_MAJOR_AXIS_KM = 191020;

/** Ariel orbit eccentricity */
const ARIEL_ECCENTRICITY = 0.0012;

/**
 * Scene scale for Ariel orbit radius
 * Ariel is Uranus's second major moon, outside Miranda.
 */
const ARIEL_ORBIT_SCENE_RADIUS = 2.5;

/** Scale factor: km to scene units */
const SCENE_SCALE = ARIEL_ORBIT_SCENE_RADIUS / ARIEL_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Ariel position relative to Uranus (Uranus-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 *
 * @param date Current simulation date
 * @returns Ariel position as Vector3 relative to Uranus at origin
 */
export function getArielPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = ARIEL_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);

    // Apply eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + ARIEL_ECCENTRICITY * Math.sin(meanAnomaly);

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + ARIEL_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - ARIEL_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r =
        (ARIEL_SEMI_MAJOR_AXIS_KM * (1 - ARIEL_ECCENTRICITY * ARIEL_ECCENTRICITY)) /
        (1 + ARIEL_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Ariel position in world coordinates (Sun-centered)
 *
 * @param date Current simulation date
 * @param uranusPosition Uranus position in world coordinates
 * @returns Ariel world position (relative to Sun at origin)
 */
export function getArielWorldPosition(
    date: Date,
    uranusPosition: THREE.Vector3
): THREE.Vector3 {
    const arielRelativeToUranus = getArielPosition(date);
    return new THREE.Vector3().addVectors(uranusPosition, arielRelativeToUranus);
}
