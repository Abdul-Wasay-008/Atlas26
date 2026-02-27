/**
 * Phobos Orbit Module
 * 
 * Calculates Phobos position relative to Mars using simplified Keplerian mechanics.
 * Phobos is Mars's innermost moon with a very short orbital period (~7.6 hours).
 * 
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 9,376 km
 * - Orbital period: 7.6539 hours (0.31891 days)
 * - Eccentricity: 0.0151 (nearly circular)
 * - Inclination: ~1.08° (approximated as 0° for simplicity)
 */

import * as THREE from "three";

/** Phobos orbital period in hours */
export const PHOBOS_ORBITAL_PERIOD_HOURS = 7.6539;

/** Phobos orbital period in days */
export const PHOBOS_ORBITAL_PERIOD_DAYS = PHOBOS_ORBITAL_PERIOD_HOURS / 24;

/** Phobos semi-major axis in km */
const PHOBOS_SEMI_MAJOR_AXIS_KM = 9376;

/** Phobos orbit eccentricity (nearly circular) */
const PHOBOS_ECCENTRICITY = 0.0151;

/** 
 * Scene scale for Phobos orbit radius
 * Mars radius in scene is ~0.424 units (0.8 * 0.53)
 * Phobos orbits at ~2.76 Mars radii from center
 * Scene orbit radius = 0.424 * 2.76 ≈ 1.17, but we use a slightly larger value for visibility
 * Using 0.5 units to keep it close to Mars but visible
 */
const PHOBOS_ORBIT_SCENE_RADIUS = 0.5;

/** Scale factor: km to scene units */
const SCENE_SCALE = PHOBOS_ORBIT_SCENE_RADIUS / PHOBOS_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Phobos position relative to Mars (Mars-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 * 
 * @param date Current simulation date
 * @returns Phobos position as Vector3 relative to Mars at origin
 */
export function getPhobosPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = PHOBOS_ORBITAL_PERIOD_HOURS * msPerHour;
    
    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;
    
    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);
    
    // For nearly circular orbit, true anomaly ≈ mean anomaly
    // Apply small eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + PHOBOS_ECCENTRICITY * Math.sin(meanAnomaly);
    
    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + PHOBOS_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - PHOBOS_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );
    
    // Orbital radius with eccentricity
    const r = PHOBOS_SEMI_MAJOR_AXIS_KM * (1 - PHOBOS_ECCENTRICITY * PHOBOS_ECCENTRICITY) / 
              (1 + PHOBOS_ECCENTRICITY * Math.cos(trueAnomaly));
    
    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;
    
    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);
    
    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Phobos position in world coordinates (Sun-centered)
 * 
 * @param date Current simulation date
 * @param marsPosition Mars position in world coordinates
 * @returns Phobos world position (relative to Sun at origin)
 */
export function getPhobosWorldPosition(
    date: Date,
    marsPosition: THREE.Vector3
): THREE.Vector3 {
    const phobosRelativeToMars = getPhobosPosition(date);
    return new THREE.Vector3().addVectors(marsPosition, phobosRelativeToMars);
}
