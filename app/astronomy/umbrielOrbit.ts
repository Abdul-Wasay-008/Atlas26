/**
 * Umbriel Orbit Module
 *
 * Calculates Umbriel position relative to Uranus using simplified Keplerian mechanics.
 * Umbriel is Uranus's third major moon, with the darkest surface among Uranus's major moons.
 *
 * Orbital Parameters (NASA/JPL):
 * - Semi-major axis: 266,300 km
 * - Orbital period: 4.144 days (~99.46 hours)
 * - Eccentricity: 0.0039
 * - Inclination: ~0° (approximated)
 */

import * as THREE from "three";

/** Umbriel orbital period in hours */
export const UMBRIEL_ORBITAL_PERIOD_HOURS = 99.456; // 4.144 days * 24

/** Umbriel orbital period in days */
export const UMBRIEL_ORBITAL_PERIOD_DAYS = UMBRIEL_ORBITAL_PERIOD_HOURS / 24;

/** Umbriel semi-major axis in km */
const UMBRIEL_SEMI_MAJOR_AXIS_KM = 266300;

/** Umbriel orbit eccentricity */
const UMBRIEL_ECCENTRICITY = 0.0039;

/**
 * Scene scale for Umbriel orbit radius
 * Umbriel is Uranus's third major moon, outside Ariel.
 */
const UMBRIEL_ORBIT_SCENE_RADIUS = 3.0;

/** Scale factor: km to scene units */
const SCENE_SCALE = UMBRIEL_ORBIT_SCENE_RADIUS / UMBRIEL_SEMI_MAJOR_AXIS_KM;

/**
 * J2000 epoch reference (2000-01-01 12:00:00 UTC) in milliseconds
 */
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);

/**
 * Get Umbriel position relative to Uranus (Uranus-centered coordinates)
 * Uses simplified Keplerian orbit with time-based mean anomaly.
 *
 * @param date Current simulation date
 * @returns Umbriel position as Vector3 relative to Uranus at origin
 */
export function getUmbrielPosition(date: Date): THREE.Vector3 {
    const msPerHour = 3600000;
    const periodMs = UMBRIEL_ORBITAL_PERIOD_HOURS * msPerHour;

    // Time since J2000 epoch
    const timeSinceEpoch = date.getTime() - J2000_MS;

    // Mean anomaly (angle in orbit, increases linearly with time)
    const meanAnomaly = ((timeSinceEpoch / periodMs) * 2 * Math.PI) % (2 * Math.PI);

    // Apply eccentricity correction: E ≈ M + e*sin(M)
    const eccentricAnomaly = meanAnomaly + UMBRIEL_ECCENTRICITY * Math.sin(meanAnomaly);

    // True anomaly from eccentric anomaly
    const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + UMBRIEL_ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - UMBRIEL_ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
    );

    // Orbital radius with eccentricity
    const r =
        (UMBRIEL_SEMI_MAJOR_AXIS_KM * (1 - UMBRIEL_ECCENTRICITY * UMBRIEL_ECCENTRICITY)) /
        (1 + UMBRIEL_ECCENTRICITY * Math.cos(trueAnomaly));

    // Convert to scene units
    const sceneRadius = r * SCENE_SCALE;

    // Position in orbital plane (XZ plane, Y=0 for equatorial orbit)
    const x = sceneRadius * Math.cos(trueAnomaly);
    const z = sceneRadius * Math.sin(trueAnomaly);

    return new THREE.Vector3(x, 0, z);
}

/**
 * Get Umbriel position in world coordinates (Sun-centered)
 *
 * @param date Current simulation date
 * @param uranusPosition Uranus position in world coordinates
 * @returns Umbriel world position (relative to Sun at origin)
 */
export function getUmbrielWorldPosition(
    date: Date,
    uranusPosition: THREE.Vector3
): THREE.Vector3 {
    const umbrielRelativeToUranus = getUmbrielPosition(date);
    return new THREE.Vector3().addVectors(uranusPosition, umbrielRelativeToUranus);
}
