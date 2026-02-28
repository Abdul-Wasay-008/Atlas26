/**
 * Io Orbit Module
 * 
 * Calculates Io position relative to Jupiter using simplified Keplerian mechanics.
 * Io is Jupiter's innermost Galilean moon with an orbital period of ~1.769 days.
 * 
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 421,700 km
 * - Orbital period: 1.769 days (~42.5 hours)
 * - Eccentricity: 0.004 (small but non-zero)
 * - Inclination: ~0.05° (approximated as 0° for simplicity)
 */

import * as THREE from "three";

/** Io orbital period in hours */
export const IO_ORBITAL_PERIOD_HOURS = 42.456; // 1.769 days * 24

/** Io orbital period in days */
export const IO_ORBITAL_PERIOD_DAYS = IO_ORBITAL_PERIOD_HOURS / 24;

/** Io semi-major axis in km */
const IO_SEMI_MAJOR_AXIS_KM = 421700;

/** Io orbit eccentricity (small but non-zero) */
const IO_ECCENTRICITY = 0.004;

/** 
 * Jupiter scene radius (must match Jupiter.tsx)
 */
const JUPITER_RADIUS = 0.9;

/**
 * Scene scale for Io orbit radius
 * Real Io orbits at ~6x Jupiter radii, but we visually compress to 2x for layout
 */
const IO_ORBIT_SCENE_RADIUS = JUPITER_RADIUS * 2;

/** Scale factor: km to scene units */
const SCENE_SCALE = IO_ORBIT_SCENE_RADIUS / IO_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Io position relative to Jupiter (Jupiter-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 * 
 * @param date Current simulation date
 * @returns Io position as Vector3 relative to Jupiter at origin
 */
export function getIoPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = IO_ORBITAL_PERIOD_HOURS * msPerHour;
    
    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;
    
    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);
    
    // For nearly circular orbit, true anomaly ≈ mean anomaly
    // Apply small eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + IO_ECCENTRICITY * Math.sin(meanAnomaly);
    
    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + IO_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - IO_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );
    
    // Orbital radius with eccentricity
    const r = IO_SEMI_MAJOR_AXIS_KM * (1 - IO_ECCENTRICITY * IO_ECCENTRICITY) / 
              (1 + IO_ECCENTRICITY * Math.cos(trueAnomaly));
    
    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;
    
    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);
    
    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Io position in world coordinates (Sun-centered)
 * 
 * @param date Current simulation date
 * @param jupiterPosition Jupiter position in world coordinates
 * @returns Io world position (relative to Sun at origin)
 */
export function getIoWorldPosition(
    date: Date,
    jupiterPosition: THREE.Vector3
): THREE.Vector3 {
    const ioRelativeToJupiter = getIoPosition(date);
    return new THREE.Vector3().addVectors(jupiterPosition, ioRelativeToJupiter);
}
