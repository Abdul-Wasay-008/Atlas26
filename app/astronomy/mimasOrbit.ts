/**
 * Mimas Orbit Module
 *
 * Calculates Mimas position relative to Saturn using simplified Keplerian mechanics.
 * Mimas is Saturn's smallest and innermost major moon, famous for its Herschel crater.
 *
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 185,539 km
 * - Orbital period: 0.942 days (~22.6 hours)
 * - Eccentricity: 0.0196
 * - Inclination: ~1.5° (approximated as 0° for simplicity)
 */

import * as THREE from "three";

/** Mimas orbital period in hours */
export const MIMAS_ORBITAL_PERIOD_HOURS = 22.6; // 0.942 days * 24

/** Mimas orbital period in days */
export const MIMAS_ORBITAL_PERIOD_DAYS = MIMAS_ORBITAL_PERIOD_HOURS / 24;

/** Mimas semi-major axis in km */
const MIMAS_SEMI_MAJOR_AXIS_KM = 185539;

/** Mimas orbit eccentricity */
const MIMAS_ECCENTRICITY = 0.0196;

/**
 * Saturn scene radius (must match Saturn.tsx)
 */
const SATURN_RADIUS = 0.85;

/**
 * Scene scale for Mimas orbit radius
 * Mimas is innermost Saturn moon; orbit at 2.0 (rings extend to ~1.95, Enceladus at 2.5)
 */
const MIMAS_ORBIT_SCENE_RADIUS = 2.5;

/** Scale factor: km to scene units */
const SCENE_SCALE = MIMAS_ORBIT_SCENE_RADIUS / MIMAS_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Mimas position relative to Saturn (Saturn-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 *
 * @param date Current simulation date
 * @returns Mimas position as Vector3 relative to Saturn at origin
 */
export function getMimasPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = MIMAS_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);

    // Apply eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + MIMAS_ECCENTRICITY * Math.sin(meanAnomaly);

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + MIMAS_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - MIMAS_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r =
        (MIMAS_SEMI_MAJOR_AXIS_KM * (1 - MIMAS_ECCENTRICITY * MIMAS_ECCENTRICITY)) /
        (1 + MIMAS_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Mimas position in world coordinates (Sun-centered)
 *
 * @param date Current simulation date
 * @param saturnPosition Saturn position in world coordinates
 * @returns Mimas world position (relative to Sun at origin)
 */
export function getMimasWorldPosition(
    date: Date,
    saturnPosition: THREE.Vector3
): THREE.Vector3 {
    const mimasRelativeToSaturn = getMimasPosition(date);
    return new THREE.Vector3().addVectors(saturnPosition, mimasRelativeToSaturn);
}
