/**
 * Ganymede Orbit Module
 * 
 * Calculates Ganymede position relative to Jupiter using simplified Keplerian mechanics.
 * Ganymede is Jupiter's third Galilean moon and the largest moon in the solar system.
 * 
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 1,070,400 km
 * - Orbital period: 7.1546 days (~171.7 hours)
 * - Eccentricity: 0.0013 (nearly circular)
 * - Inclination: ~0.2° (approximated as 0° for simplicity)
 */

import * as THREE from "three";

/** Ganymede orbital period in hours */
export const GANYMEDE_ORBITAL_PERIOD_HOURS = 171.7; // 7.1546 days * 24

/** Ganymede orbital period in days */
export const GANYMEDE_ORBITAL_PERIOD_DAYS = GANYMEDE_ORBITAL_PERIOD_HOURS / 24;

/** Ganymede semi-major axis in km */
const GANYMEDE_SEMI_MAJOR_AXIS_KM = 1070400;

/** Ganymede orbit eccentricity (nearly circular) */
const GANYMEDE_ECCENTRICITY = 0.0013;

/** 
 * Jupiter scene radius (must match Jupiter.tsx)
 */
const JUPITER_RADIUS = 0.9;

/**
 * Scene scale for Ganymede orbit radius
 * Real Ganymede orbits at ~15x Jupiter radii, but we visually compress to 5x for layout
 * This places Ganymede visibly outside Europa's orbit (which is at 3.2x Jupiter radius)
 */
const GANYMEDE_ORBIT_SCENE_RADIUS = JUPITER_RADIUS * 4.5;

/** Scale factor: km to scene units */
const SCENE_SCALE = GANYMEDE_ORBIT_SCENE_RADIUS / GANYMEDE_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Ganymede position relative to Jupiter (Jupiter-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 * 
 * @param date Current simulation date
 * @returns Ganymede position as Vector3 relative to Jupiter at origin
 */
export function getGanymedePosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = GANYMEDE_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);

    // For nearly circular orbit, true anomaly ≈ mean anomaly
    // Apply small eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + GANYMEDE_ECCENTRICITY * Math.sin(meanAnomaly);

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + GANYMEDE_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - GANYMEDE_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r = GANYMEDE_SEMI_MAJOR_AXIS_KM * (1 - GANYMEDE_ECCENTRICITY * GANYMEDE_ECCENTRICITY) /
        (1 + GANYMEDE_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Ganymede position in world coordinates (Sun-centered)
 * 
 * @param date Current simulation date
 * @param jupiterPosition Jupiter position in world coordinates
 * @returns Ganymede world position (relative to Sun at origin)
 */
export function getGanymedeWorldPosition(
    date: Date,
    jupiterPosition: THREE.Vector3
): THREE.Vector3 {
    const ganymedeRelativeToJupiter = getGanymedePosition(date);
    return new THREE.Vector3().addVectors(jupiterPosition, ganymedeRelativeToJupiter);
}
