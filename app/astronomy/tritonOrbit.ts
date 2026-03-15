/**
 * Triton Orbit Module
 *
 * Calculates Triton position relative to Neptune using simplified Keplerian mechanics.
 * Triton is Neptune's largest moon and has a retrograde orbit (opposite direction to most moons).
 *
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 354,760 km
 * - Orbital period: 5.876 days (~141.02 hours)
 * - Eccentricity: 0.000016
 * - Inclination: ~0° (approximated)
 * - Retrograde: orbit direction is opposite to prograde moons
 */

import * as THREE from "three";

/** Triton orbital period in hours */
export const TRITON_ORBITAL_PERIOD_HOURS = 141.024; // 5.876 days * 24

/** Triton orbital period in days */
export const TRITON_ORBITAL_PERIOD_DAYS = TRITON_ORBITAL_PERIOD_HOURS / 24;

/** Triton semi-major axis in km */
const TRITON_SEMI_MAJOR_AXIS_KM = 354760;

/** Triton orbit eccentricity */
const TRITON_ECCENTRICITY = 0.000016;

/**
 * Scene scale for Triton orbit radius
 * Triton is Neptune's dominant moon.
 */
const TRITON_ORBIT_SCENE_RADIUS = 2.5;

/** Scale factor: km to scene units */
const SCENE_SCALE = TRITON_ORBIT_SCENE_RADIUS / TRITON_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Triton position relative to Neptune (Neptune-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 * Retrograde: mean anomaly decreases with time so Triton orbits in the opposite direction.
 *
 * @param date Current simulation date
 * @returns Triton position as Vector3 relative to Neptune at origin
 */
export function getTritonPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = TRITON_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Retrograde: mean anomaly decreases with time (opposite direction to prograde moons)
    let meanAnomaly = (-(timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);
    if (meanAnomaly < 0) meanAnomaly += 2 * Math.PI;

    // Apply eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + TRITON_ECCENTRICITY * Math.sin(meanAnomaly);

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + TRITON_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - TRITON_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r =
        (TRITON_SEMI_MAJOR_AXIS_KM * (1 - TRITON_ECCENTRICITY * TRITON_ECCENTRICITY)) /
        (1 + TRITON_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Triton position in world coordinates (Sun-centered)
 *
 * @param date Current simulation date
 * @param neptunePosition Neptune position in world coordinates
 * @returns Triton world position (relative to Sun at origin)
 */
export function getTritonWorldPosition(
    date: Date,
    neptunePosition: THREE.Vector3
): THREE.Vector3 {
    const tritonRelativeToNeptune = getTritonPosition(date);
    return new THREE.Vector3().addVectors(neptunePosition, tritonRelativeToNeptune);
}
