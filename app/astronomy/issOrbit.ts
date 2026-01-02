/**
 * ISS Orbital Astronomy Module
 * 
 * Calculates ISS position using TLE data and SGP4 propagation
 * Returns position in Earth-centered coordinates, scaled to Atlas26 scene units
 * 
 * All calculations use UTC dates and are time-based only
 */

import * as THREE from "three";
import * as satellite from "satellite.js";
import { ISS_TLE } from "@/app/data/issTLE";

/**
 * Earth radius in kilometers
 */
const EARTH_RADIUS_KM = 6371.0;

/**
 * Earth radius in Atlas26 scene units
 */
const EARTH_RADIUS_SCENE = 0.8;

/**
 * Scale factor to convert kilometers to scene units
 */
const KM_TO_SCENE = EARTH_RADIUS_SCENE / EARTH_RADIUS_KM;

/**
 * Parse TLE and create satellite record (cached for performance)
 */
let satrec: satellite.SatRec | null = null;

function getSatRec(): satellite.SatRec {
    if (!satrec) {
        satrec = satellite.twoline2satrec(ISS_TLE.line1, ISS_TLE.line2);
    }
    return satrec;
}

/**
 * Get ISS position in Earth-centered coordinates (scene units)
 * 
 * The ISS position is calculated using SGP4 propagation from TLE data.
 * Position is returned relative to Earth's center (Earth is at origin in this reference frame).
 * 
 * Coordinate system:
 * - X: Points toward vernal equinox (0° right ascension)
 * - Y: Completes right-handed system
 * - Z: Points toward north celestial pole
 * 
 * @param date UTC date
 * @returns ISS position as Vector3 (relative to Earth center, in scene units)
 */
export function getISSPosition(date: Date): THREE.Vector3 {
    const satrec = getSatRec();
    
    // Propagate satellite position using SGP4
    const positionAndVelocity = satellite.propagate(satrec, date);
    
    // Check for propagation errors
    if (positionAndVelocity.error) {
        console.warn("SGP4 propagation error:", positionAndVelocity.error);
        // Return a default position (above Earth's equator) if propagation fails
        return new THREE.Vector3(0.85, 0, 0);
    }
    
    // Get position in ECI (Earth-Centered Inertial) coordinates
    // Position is in kilometers
    const positionEci = positionAndVelocity.position;
    
    if (!positionEci) {
        console.warn("SGP4 returned null position");
        return new THREE.Vector3(0.85, 0, 0);
    }
    
    // Convert ECI position from kilometers to scene units
    // ECI coordinates: X, Y, Z in kilometers
    const x = positionEci.x * KM_TO_SCENE;
    const y = positionEci.y * KM_TO_SCENE;
    const z = positionEci.z * KM_TO_SCENE;
    
    // Note: SGP4 ECI coordinates use:
    // - X: Points toward vernal equinox
    // - Y: Completes right-handed system (90° right ascension)
    // - Z: Points toward north pole
    // 
    // Atlas26 scene uses:
    // - X: Right
    // - Y: Up
    // - Z: Forward (toward camera by default)
    //
    // We need to map ECI to scene coordinates.
    // For now, we'll use a direct mapping (X->X, Y->Y, Z->Z)
    // This may need adjustment based on how Earth is oriented in the scene.
    
    return new THREE.Vector3(x, y, z);
}

/**
 * Get ISS world position (accounting for Earth's orbital position around Sun)
 * 
 * This function combines:
 * 1. ISS position relative to Earth (from SGP4)
 * 2. Earth's position around Sun (from Earth orbit calculations)
 * 
 * @param date UTC date
 * @param earthPosition Earth's position around Sun (from getEarthOrbitPosition)
 * @returns ISS position in world coordinates (relative to Sun at origin)
 */
export function getISSWorldPosition(
    date: Date,
    earthPosition: THREE.Vector3
): THREE.Vector3 {
    // Get ISS position relative to Earth
    const issRelativeToEarth = getISSPosition(date);
    
    // Add Earth's position to get world coordinates
    return new THREE.Vector3().addVectors(earthPosition, issRelativeToEarth);
}

