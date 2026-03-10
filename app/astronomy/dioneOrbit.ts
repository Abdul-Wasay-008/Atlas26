/**
 * Dione Orbit Module
 *
 * Calculates Dione position relative to Saturn using simplified Keplerian mechanics.
 * Dione is Saturn's fourth major moon, an icy moon with bright fracture lines.
 *
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 377,400 km
 * - Orbital period: 2.736 days (~65.66 hours)
 * - Eccentricity: 0.0022
 * - Inclination: ~0° (approximated)
 */

import * as THREE from "three";

/** Dione orbital period in hours */
export const DIONE_ORBITAL_PERIOD_HOURS = 65.66; // 2.736 days * 24

/** Dione orbital period in days */
export const DIONE_ORBITAL_PERIOD_DAYS = DIONE_ORBITAL_PERIOD_HOURS / 24;

/** Dione semi-major axis in km */
const DIONE_SEMI_MAJOR_AXIS_KM = 377400;

/** Dione orbit eccentricity */
const DIONE_ECCENTRICITY = 0.0022;

/**
 * Saturn scene radius (must match Saturn.tsx)
 */
const SATURN_RADIUS = 0.85;

/**
 * Scene scale for Dione orbit radius
 * Dione orbits outside Tethys (3.5); +0.5 spacing rule
 */
const DIONE_ORBIT_SCENE_RADIUS = 4.0;

/** Scale factor: km to scene units */
const SCENE_SCALE = DIONE_ORBIT_SCENE_RADIUS / DIONE_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Dione position relative to Saturn (Saturn-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 *
 * @param date Current simulation date
 * @returns Dione position as Vector3 relative to Saturn at origin
 */
export function getDionePosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = DIONE_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);

    // Apply eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + DIONE_ECCENTRICITY * Math.sin(meanAnomaly);

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + DIONE_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - DIONE_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r =
        (DIONE_SEMI_MAJOR_AXIS_KM * (1 - DIONE_ECCENTRICITY * DIONE_ECCENTRICITY)) /
        (1 + DIONE_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Dione position in world coordinates (Sun-centered)
 *
 * @param date Current simulation date
 * @param saturnPosition Saturn position in world coordinates
 * @returns Dione world position (relative to Sun at origin)
 */
export function getDioneWorldPosition(
    date: Date,
    saturnPosition: THREE.Vector3
): THREE.Vector3 {
    const dioneRelativeToSaturn = getDionePosition(date);
    return new THREE.Vector3().addVectors(saturnPosition, dioneRelativeToSaturn);
}
