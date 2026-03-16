/**
 * Nereid Orbit Module
 *
 * Calculates Nereid's position relative to Neptune using simplified Keplerian mechanics.
 * Nereid is a distant, irregular moon of Neptune with a very eccentric orbit.
 *
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 5,513,400 km
 * - Orbital period: 360.14 hours
 * - Eccentricity: 0.75
 * - Inclination: ~0° (approximated in this 2D model)
 */

import * as THREE from "three";

/** Nereid orbital period in hours */
export const NEREID_ORBITAL_PERIOD_HOURS = 360.14;

/** Nereid orbital period in days */
export const NEREID_ORBITAL_PERIOD_DAYS = NEREID_ORBITAL_PERIOD_HOURS / 24;

/** Nereid semi-major axis in km */
const NEREID_SEMI_MAJOR_AXIS_KM = 5513400;

/** Nereid orbit eccentricity */
const NEREID_ECCENTRICITY = 0.75;

/**
 * Scene scale for Nereid orbit radius
 * Nereid orbits much farther from Neptune than Triton, and periapsis
 * should remain outside Neptune's rendered radius.
 */
const NEREID_ORBIT_SCENE_RADIUS = 4.5;

/** Scale factor: km to scene units */
const SCENE_SCALE = NEREID_ORBIT_SCENE_RADIUS / NEREID_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Nereid position relative to Neptune (Neptune-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 *
 * @param date Current simulation date
 * @returns Nereid position as Vector3 relative to Neptune at origin
 */
export function getNereidPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = NEREID_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Mean anomaly (angle in orbit, increases linearly with time)
    let meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);
    if (meanAnomaly < 0) meanAnomaly += 2 * Math.PI;

    // Solve Kepler's equation for eccentric anomaly using Newton–Raphson
    let eccentricAnomaly = meanAnomaly;
    for (let i = 0; i < 8; i++) {
        const f = eccentricAnomaly - NEREID_ECCENTRICITY * Math.sin(eccentricAnomaly) - meanAnomaly;
        const fPrime = 1 - NEREID_ECCENTRICITY * Math.cos(eccentricAnomaly);
        const delta = f / fPrime;
        eccentricAnomaly -= delta;
        if (Math.abs(delta) < 1e-6) break;
    }

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + NEREID_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - NEREID_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r =
        (NEREID_SEMI_MAJOR_AXIS_KM * (1 - NEREID_ECCENTRICITY * NEREID_ECCENTRICITY)) /
        (1 + NEREID_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Nereid position in world coordinates (Sun-centered)
 *
 * @param date Current simulation date
 * @param neptunePosition Neptune position in world coordinates
 * @returns Nereid world position (relative to Sun at origin)
 */
export function getNereidWorldPosition(
    date: Date,
    neptunePosition: THREE.Vector3
): THREE.Vector3 {
    const nereidRelativeToNeptune = getNereidPosition(date);
    return new THREE.Vector3().addVectors(neptunePosition, nereidRelativeToNeptune);
}

