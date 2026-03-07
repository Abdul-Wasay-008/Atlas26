/**
 * Titan Orbit Module
 *
 * Calculates Titan position relative to Saturn using simplified Keplerian mechanics.
 * Titan is Saturn's largest moon and the second-largest moon in the solar system.
 *
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 1,221,870 km
 * - Orbital period: 15.945 days (~382.68 hours)
 * - Eccentricity: ~0.028 (slightly elliptical)
 * - Inclination: ~0.3° (approximated as 0° for simplicity)
 */

import * as THREE from "three";

/** Titan orbital period in hours */
export const TITAN_ORBITAL_PERIOD_HOURS = 382.68; // 15.945 days * 24

/** Titan orbital period in days */
export const TITAN_ORBITAL_PERIOD_DAYS = TITAN_ORBITAL_PERIOD_HOURS / 24;

/** Titan semi-major axis in km */
const TITAN_SEMI_MAJOR_AXIS_KM = 1221870;

/** Titan orbit eccentricity (slightly elliptical) */
const TITAN_ECCENTRICITY = 0.028;

/**
 * Saturn scene radius (must match Saturn.tsx)
 */
const SATURN_RADIUS = 0.85;

/**
 * Scene scale for Titan orbit radius
 * Titan orbits at 6x Saturn radius - outer large moon, clearly separated from rings
 */
const TITAN_ORBIT_SCENE_RADIUS = SATURN_RADIUS * 3.2;

/** Scale factor: km to scene units */
const SCENE_SCALE = TITAN_ORBIT_SCENE_RADIUS / TITAN_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Titan position relative to Saturn (Saturn-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 *
 * @param date Current simulation date
 * @returns Titan position as Vector3 relative to Saturn at origin
 */
export function getTitanPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = TITAN_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);

    // Apply eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + TITAN_ECCENTRICITY * Math.sin(meanAnomaly);

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + TITAN_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - TITAN_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r =
        (TITAN_SEMI_MAJOR_AXIS_KM * (1 - TITAN_ECCENTRICITY * TITAN_ECCENTRICITY)) /
        (1 + TITAN_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Titan position in world coordinates (Sun-centered)
 *
 * @param date Current simulation date
 * @param saturnPosition Saturn position in world coordinates
 * @returns Titan world position (relative to Sun at origin)
 */
export function getTitanWorldPosition(
    date: Date,
    saturnPosition: THREE.Vector3
): THREE.Vector3 {
    const titanRelativeToSaturn = getTitanPosition(date);
    return new THREE.Vector3().addVectors(saturnPosition, titanRelativeToSaturn);
}
