/**
 * Rhea Orbit Module
 *
 * Calculates Rhea position relative to Saturn using simplified Keplerian mechanics.
 * Rhea is Saturn's second-largest moon, heavily cratered and icy.
 *
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 527,040 km
 * - Orbital period: 4.518 days (~108.43 hours)
 * - Eccentricity: 0.0010
 * - Inclination: ~0° (approximated)
 */

import * as THREE from "three";

/** Rhea orbital period in hours */
export const RHEA_ORBITAL_PERIOD_HOURS = 108.43; // 4.518 days * 24

/** Rhea orbital period in days */
export const RHEA_ORBITAL_PERIOD_DAYS = RHEA_ORBITAL_PERIOD_HOURS / 24;

/** Rhea semi-major axis in km */
const RHEA_SEMI_MAJOR_AXIS_KM = 527040;

/** Rhea orbit eccentricity */
const RHEA_ECCENTRICITY = 0.001;

/**
 * Saturn scene radius (must match Saturn.tsx)
 */
const SATURN_RADIUS = 0.85;

/**
 * Scene scale for Rhea orbit radius
 * Rhea orbits outside Dione (4.0); +0.5 spacing rule
 */
const RHEA_ORBIT_SCENE_RADIUS = 4.5;

/** Scale factor: km to scene units */
const SCENE_SCALE = RHEA_ORBIT_SCENE_RADIUS / RHEA_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Rhea position relative to Saturn (Saturn-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 *
 * @param date Current simulation date
 * @returns Rhea position as Vector3 relative to Saturn at origin
 */
export function getRheaPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = RHEA_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);

    // Apply eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + RHEA_ECCENTRICITY * Math.sin(meanAnomaly);

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + RHEA_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - RHEA_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r =
        (RHEA_SEMI_MAJOR_AXIS_KM * (1 - RHEA_ECCENTRICITY * RHEA_ECCENTRICITY)) /
        (1 + RHEA_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Rhea position in world coordinates (Sun-centered)
 *
 * @param date Current simulation date
 * @param saturnPosition Saturn position in world coordinates
 * @returns Rhea world position (relative to Sun at origin)
 */
export function getRheaWorldPosition(
    date: Date,
    saturnPosition: THREE.Vector3
): THREE.Vector3 {
    const rheaRelativeToSaturn = getRheaPosition(date);
    return new THREE.Vector3().addVectors(saturnPosition, rheaRelativeToSaturn);
}
