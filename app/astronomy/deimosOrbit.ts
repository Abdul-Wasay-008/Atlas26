/**
 * Deimos Orbit Module
 * 
 * Calculates Deimos position relative to Mars using simplified Keplerian mechanics.
 * Deimos is Mars's outer moon with a longer orbital period (~30.3 hours).
 * 
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 23,463 km
 * - Orbital period: 30.3 hours (1.2625 days)
 * - Eccentricity: 0.0002 (extremely circular)
 * - Inclination: ~1.79° (approximated as 0° for simplicity)
 */

import * as THREE from "three";

/** Deimos orbital period in hours */
export const DEIMOS_ORBITAL_PERIOD_HOURS = 30.3;

/** Deimos orbital period in days */
export const DEIMOS_ORBITAL_PERIOD_DAYS = DEIMOS_ORBITAL_PERIOD_HOURS / 24;

/** Deimos semi-major axis in km */
const DEIMOS_SEMI_MAJOR_AXIS_KM = 23463;

/** Deimos orbit eccentricity (extremely circular) */
const DEIMOS_ECCENTRICITY = 0.0002;

/** 
 * Scene scale for Deimos orbit radius
 * Phobos orbit = 0.5 units at 9,376 km
 * Deimos orbit = 0.5 * (23463 / 9376) ≈ 1.25 units
 */
const DEIMOS_ORBIT_SCENE_RADIUS = 1.25;

/** Scale factor: km to scene units */
const SCENE_SCALE = DEIMOS_ORBIT_SCENE_RADIUS / DEIMOS_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Deimos position relative to Mars (Mars-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 * 
 * @param date Current simulation date
 * @returns Deimos position as Vector3 relative to Mars at origin
 */
export function getDeimosPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = DEIMOS_ORBITAL_PERIOD_HOURS * msPerHour;
    
    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;
    
    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);
    
    // For nearly circular orbit, true anomaly ≈ mean anomaly
    // Apply tiny eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + DEIMOS_ECCENTRICITY * Math.sin(meanAnomaly);
    
    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + DEIMOS_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - DEIMOS_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );
    
    // Orbital radius with eccentricity
    const r = DEIMOS_SEMI_MAJOR_AXIS_KM * (1 - DEIMOS_ECCENTRICITY * DEIMOS_ECCENTRICITY) / 
              (1 + DEIMOS_ECCENTRICITY * Math.cos(trueAnomaly));
    
    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;
    
    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);
    
    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Deimos position in world coordinates (Sun-centered)
 * 
 * @param date Current simulation date
 * @param marsPosition Mars position in world coordinates
 * @returns Deimos world position (relative to Sun at origin)
 */
export function getDeimosWorldPosition(
    date: Date,
    marsPosition: THREE.Vector3
): THREE.Vector3 {
    const deimosRelativeToMars = getDeimosPosition(date);
    return new THREE.Vector3().addVectors(marsPosition, deimosRelativeToMars);
}
