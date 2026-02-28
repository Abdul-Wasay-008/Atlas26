/**
 * Europa Orbit Module
 * 
 * Calculates Europa position relative to Jupiter using simplified Keplerian mechanics.
 * Europa is Jupiter's second Galilean moon with an orbital period of ~3.551 days.
 * 
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 670,900 km
 * - Orbital period: 3.551 days (~85.2 hours)
 * - Eccentricity: 0.009 (small but non-zero)
 * - Inclination: ~0.47° (approximated as 0° for simplicity)
 */

import * as THREE from "three";

/** Europa orbital period in hours */
export const EUROPA_ORBITAL_PERIOD_HOURS = 85.224; // 3.551 days * 24

/** Europa orbital period in days */
export const EUROPA_ORBITAL_PERIOD_DAYS = EUROPA_ORBITAL_PERIOD_HOURS / 24;

/** Europa semi-major axis in km */
const EUROPA_SEMI_MAJOR_AXIS_KM = 670900;

/** Europa orbit eccentricity (small but non-zero) */
const EUROPA_ECCENTRICITY = 0.009;

/** 
 * Jupiter scene radius (must match Jupiter.tsx)
 */
const JUPITER_RADIUS = 0.9;

/**
 * Scene scale for Europa orbit radius
 * Real Europa orbits at ~9.4x Jupiter radii, but we visually compress to 3.2x for layout
 * This places Europa visibly outside Io's orbit (which is at 2x Jupiter radius)
 */
const EUROPA_ORBIT_SCENE_RADIUS = JUPITER_RADIUS * 3.2;

/** Scale factor: km to scene units */
const SCENE_SCALE = EUROPA_ORBIT_SCENE_RADIUS / EUROPA_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Europa position relative to Jupiter (Jupiter-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 * 
 * @param date Current simulation date
 * @returns Europa position as Vector3 relative to Jupiter at origin
 */
export function getEuropaPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = EUROPA_ORBITAL_PERIOD_HOURS * msPerHour;
    
    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;
    
    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);
    
    // For nearly circular orbit, true anomaly ≈ mean anomaly
    // Apply small eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + EUROPA_ECCENTRICITY * Math.sin(meanAnomaly);
    
    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + EUROPA_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - EUROPA_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );
    
    // Orbital radius with eccentricity
    const r = EUROPA_SEMI_MAJOR_AXIS_KM * (1 - EUROPA_ECCENTRICITY * EUROPA_ECCENTRICITY) / 
              (1 + EUROPA_ECCENTRICITY * Math.cos(trueAnomaly));
    
    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;
    
    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);
    
    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Europa position in world coordinates (Sun-centered)
 * 
 * @param date Current simulation date
 * @param jupiterPosition Jupiter position in world coordinates
 * @returns Europa world position (relative to Sun at origin)
 */
export function getEuropaWorldPosition(
    date: Date,
    jupiterPosition: THREE.Vector3
): THREE.Vector3 {
    const europaRelativeToJupiter = getEuropaPosition(date);
    return new THREE.Vector3().addVectors(jupiterPosition, europaRelativeToJupiter);
}
