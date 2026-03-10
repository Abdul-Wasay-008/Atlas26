/**
 * Tethys Orbit Module
 *
 * Calculates Tethys position relative to Saturn using simplified Keplerian mechanics.
 * Tethys is Saturn's third major moon, an icy moon known for Ithaca Chasma canyon.
 *
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 294,660 km
 * - Orbital period: 1.89 days (~45.36 hours)
 * - Eccentricity: 0.0001
 * - Inclination: ~0° (approximated)
 */

import * as THREE from "three";

/** Tethys orbital period in hours */
export const TETHYS_ORBITAL_PERIOD_HOURS = 45.36; // 1.89 days * 24

/** Tethys orbital period in days */
export const TETHYS_ORBITAL_PERIOD_DAYS = TETHYS_ORBITAL_PERIOD_HOURS / 24;

/** Tethys semi-major axis in km */
const TETHYS_SEMI_MAJOR_AXIS_KM = 294660;

/** Tethys orbit eccentricity */
const TETHYS_ECCENTRICITY = 0.0001;

/**
 * Saturn scene radius (must match Saturn.tsx)
 */
const SATURN_RADIUS = 0.85;

/**
 * Scene scale for Tethys orbit radius
 * Tethys orbits outside Enceladus (3.0); +0.5 spacing rule
 */
const TETHYS_ORBIT_SCENE_RADIUS = 3.5;

/** Scale factor: km to scene units */
const SCENE_SCALE = TETHYS_ORBIT_SCENE_RADIUS / TETHYS_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Tethys position relative to Saturn (Saturn-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 *
 * @param date Current simulation date
 * @returns Tethys position as Vector3 relative to Saturn at origin
 */
export function getTethysPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = TETHYS_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);

    // Apply eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + TETHYS_ECCENTRICITY * Math.sin(meanAnomaly);

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + TETHYS_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - TETHYS_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r =
        (TETHYS_SEMI_MAJOR_AXIS_KM * (1 - TETHYS_ECCENTRICITY * TETHYS_ECCENTRICITY)) /
        (1 + TETHYS_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Tethys position in world coordinates (Sun-centered)
 *
 * @param date Current simulation date
 * @param saturnPosition Saturn position in world coordinates
 * @returns Tethys world position (relative to Sun at origin)
 */
export function getTethysWorldPosition(
    date: Date,
    saturnPosition: THREE.Vector3
): THREE.Vector3 {
    const tethysRelativeToSaturn = getTethysPosition(date);
    return new THREE.Vector3().addVectors(saturnPosition, tethysRelativeToSaturn);
}
