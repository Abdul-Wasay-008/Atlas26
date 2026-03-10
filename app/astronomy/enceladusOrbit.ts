/**
 * Enceladus Orbit Module
 *
 * Calculates Enceladus position relative to Saturn using simplified Keplerian mechanics.
 * Enceladus is Saturn's second major moon, a bright icy moon known for its south polar geysers.
 *
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 238,000 km
 * - Orbital period: 1.37 days (~32.88 hours)
 * - Eccentricity: 0.0047
 * - Inclination: ~0.0° (approximated)
 */

import * as THREE from "three";

/** Enceladus orbital period in hours */
export const ENCELADUS_ORBITAL_PERIOD_HOURS = 32.88; // 1.37 days * 24

/** Enceladus orbital period in days */
export const ENCELADUS_ORBITAL_PERIOD_DAYS = ENCELADUS_ORBITAL_PERIOD_HOURS / 24;

/** Enceladus semi-major axis in km */
const ENCELADUS_SEMI_MAJOR_AXIS_KM = 238000;

/** Enceladus orbit eccentricity */
const ENCELADUS_ECCENTRICITY = 0.0047;

/**
 * Saturn scene radius (must match Saturn.tsx)
 */
const SATURN_RADIUS = 0.85;

/**
 * Scene scale for Enceladus orbit radius
 * Enceladus orbits outside Mimas (Mimas at 2.0)
 */
const ENCELADUS_ORBIT_SCENE_RADIUS = 3.0;

/** Scale factor: km to scene units */
const SCENE_SCALE = ENCELADUS_ORBIT_SCENE_RADIUS / ENCELADUS_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Enceladus position relative to Saturn (Saturn-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 *
 * @param date Current simulation date
 * @returns Enceladus position as Vector3 relative to Saturn at origin
 */
export function getEnceladusPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = ENCELADUS_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);

    // Apply eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + ENCELADUS_ECCENTRICITY * Math.sin(meanAnomaly);

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + ENCELADUS_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - ENCELADUS_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r =
        (ENCELADUS_SEMI_MAJOR_AXIS_KM * (1 - ENCELADUS_ECCENTRICITY * ENCELADUS_ECCENTRICITY)) /
        (1 + ENCELADUS_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Enceladus position in world coordinates (Sun-centered)
 *
 * @param date Current simulation date
 * @param saturnPosition Saturn position in world coordinates
 * @returns Enceladus world position (relative to Sun at origin)
 */
export function getEnceladusWorldPosition(
    date: Date,
    saturnPosition: THREE.Vector3
): THREE.Vector3 {
    const enceladusRelativeToSaturn = getEnceladusPosition(date);
    return new THREE.Vector3().addVectors(saturnPosition, enceladusRelativeToSaturn);
}
