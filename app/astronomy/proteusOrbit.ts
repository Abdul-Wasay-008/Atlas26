/**
 * Proteus Orbit Module
 *
 * Calculates Proteus position relative to Neptune using simplified Keplerian mechanics.
 * Proteus is Neptune's second largest moon and orbits in a normal prograde direction.
 *
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 117,647 km
 * - Orbital period: 26.9 hours
 * - Eccentricity: 0.0005
 * - Inclination: ~0° (approximated)
 */

import * as THREE from "three";

/** Proteus orbital period in hours */
export const PROTEUS_ORBITAL_PERIOD_HOURS = 26.9;

/** Proteus orbital period in days */
export const PROTEUS_ORBITAL_PERIOD_DAYS = PROTEUS_ORBITAL_PERIOD_HOURS / 24;

/** Proteus semi-major axis in km */
const PROTEUS_SEMI_MAJOR_AXIS_KM = 117647;

/** Proteus orbit eccentricity */
const PROTEUS_ECCENTRICITY = 0.0005;

/**
 * Scene scale for Proteus orbit radius
 * Proteus orbits closer to Neptune than Triton.
 */
const PROTEUS_ORBIT_SCENE_RADIUS = 1.2;

/** Scale factor: km to scene units */
const SCENE_SCALE = PROTEUS_ORBIT_SCENE_RADIUS / PROTEUS_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Proteus position relative to Neptune (Neptune-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 * Prograde: mean anomaly increases with time.
 *
 * @param date Current simulation date
 * @returns Proteus position as Vector3 relative to Neptune at origin
 */
export function getProteusPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = PROTEUS_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Prograde: mean anomaly increases with time
    let meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);
    if (meanAnomaly < 0) meanAnomaly += 2 * Math.PI;

    // Apply eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + PROTEUS_ECCENTRICITY * Math.sin(meanAnomaly);

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + PROTEUS_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - PROTEUS_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r =
        (PROTEUS_SEMI_MAJOR_AXIS_KM * (1 - PROTEUS_ECCENTRICITY * PROTEUS_ECCENTRICITY)) /
        (1 + PROTEUS_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Proteus position in world coordinates (Sun-centered)
 *
 * @param date Current simulation date
 * @param neptunePosition Neptune position in world coordinates
 * @returns Proteus world position (relative to Sun at origin)
 */
export function getProteusWorldPosition(
    date: Date,
    neptunePosition: THREE.Vector3
): THREE.Vector3 {
    const proteusRelativeToNeptune = getProteusPosition(date);
    return new THREE.Vector3().addVectors(neptunePosition, proteusRelativeToNeptune);
}

