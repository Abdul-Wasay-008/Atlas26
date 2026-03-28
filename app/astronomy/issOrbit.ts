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
import { getCurrentISSTLE } from "@/app/services/tleService";
import { getGreenwichSiderealTime } from "@/app/astronomy/siderealTime";

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
 * Recreates satrec when TLE is updated
 */
let satrec: satellite.SatRec | null = null;
let lastTLEHash: string | null = null;

function getSatRec(): satellite.SatRec {
    // Get current TLE (may be fetched or fallback)
    const currentTLE = getCurrentISSTLE();
    const tleHash = `${currentTLE.line1}|${currentTLE.line2}`;
    
    // Recreate satrec if TLE has changed
    if (!satrec || lastTLEHash !== tleHash) {
        satrec = satellite.twoline2satrec(currentTLE.line1, currentTLE.line2);
        lastTLEHash = tleHash;
    }
    
    return satrec;
}

/**
 * Get ISS position in Earth-centered ECEF coordinates (scene units)
 * 
 * The ISS position is calculated using SGP4 propagation from TLE data.
 * SGP4 outputs ECI (Earth-Centered Inertial) coordinates, which are then
 * converted to ECEF (Earth-Centered, Earth-Fixed) coordinates using Greenwich
 * Sidereal Time. This ensures the ISS position rotates with Earth and matches
 * N2YO and other Earth-fixed reference systems.
 * 
 * Pipeline:
 * TLE → SGP4 → ECI (km) → ECEF (km) → Scene units
 * 
 * @param date UTC date
 * @returns ISS position as Vector3 (relative to Earth center, in ECEF coordinates, scene units)
 */
export function getISSPosition(date: Date): THREE.Vector3 {
    const satrec = getSatRec();
    
    // Propagate satellite position using SGP4
    const positionAndVelocity = satellite.propagate(satrec, date);
    
    if (!positionAndVelocity || (positionAndVelocity as any).error) {
        console.warn("SGP4 propagation error");
        return new THREE.Vector3(0.85, 0, 0);
    }

    const positionEciKm = positionAndVelocity.position;
    
    if (!positionEciKm) {
        console.warn("SGP4 returned null position");
        return new THREE.Vector3(0.85, 0, 0);
    }
    
    // Get Greenwich Mean Sidereal Time (GMST) for ECI → ECEF conversion
    // Use our existing GST function (returns radians)
    const gmst = getGreenwichSiderealTime(date);
    
    // Convert ECI to ECEF using satellite.js built-in function
    // This ensures correct coordinate system handling
    const positionEcefKm = satellite.eciToEcf(positionEciKm, gmst);
    
    // Convert ECEF position from kilometers to scene units
    // ECEF coordinates are Earth-fixed (rotate with Earth)
    const ecefX = positionEcefKm.x * KM_TO_SCENE;
    const ecefY = positionEcefKm.y * KM_TO_SCENE;
    const ecefZ = positionEcefKm.z * KM_TO_SCENE;
    
    // Create ECEF position vector in scene coordinates
    // satellite.js ECEF: X toward Greenwich, Y toward 90°E, Z toward north pole
    // Atlas26 scene: X is right (Greenwich at reference), Y is up (north pole), Z is forward (90°E at reference)
    // Mapping: ECEF (X, Y, Z) -> Scene (X, Z, Y)
    // 
    // IMPORTANT: This mapping aligns with the Earth texture where:
    // - Scene X = Greenwich meridian (0° longitude)
    // - Scene Y = North pole
    // - Scene Z = 90°E meridian
    //
    // Apply longitude offset to align with Earth texture orientation
    // Many Earth textures have the prime meridian (0° longitude) at a different position
    // relative to the mesh axes. This offset rotates the ECEF coordinates to match the texture.
    // 
    // After mapping ECEF (X, Y, Z) -> Scene (X, Z, Y):
    // - Scene X = ECEF X (points toward Greenwich at reference time)
    // - Scene Y = ECEF Z (points toward north pole)
    // - Scene Z = ECEF Y (points toward 90°E at reference time)
    //
    // To align with texture, we rotate around Y-axis (north pole) in the XZ plane.
    // Adjust this offset if ISS visual placement doesn't match geographic reality.
    // Common values: 0 (no offset), -π/2 (-90°), π/2 (+90°), π (180°)
    const LONGITUDE_OFFSET = -Math.PI / 2; // Rotate -90° to align with typical Earth texture
    
    // Rotate ECEF coordinates around Y-axis (north pole) by longitude offset
    // This rotates in the equatorial plane (XZ plane in scene coordinates)
    const cosOffset = Math.cos(LONGITUDE_OFFSET);
    const sinOffset = Math.sin(LONGITUDE_OFFSET);
    
    // After mapping: Scene (X, Y, Z) = ECEF (X, Z, Y)
    // So scene X = ecefX, scene Y = ecefZ, scene Z = ecefY
    // Rotate scene X and scene Z around scene Y (north pole):
    const rotatedX = ecefX * cosOffset - ecefY * sinOffset; // Rotated scene X
    const rotatedZ = ecefX * sinOffset + ecefY * cosOffset; // Rotated scene Z
    const rotatedY = ecefZ; // Scene Y (north pole, unchanged)
    
    const ecefPosition = new THREE.Vector3(rotatedX, rotatedY, rotatedZ);
    
    // Calculate distance from Earth center to verify it's above surface
    const distance = ecefPosition.length();
    // ISS typically orbits at ~400km altitude
    // In scene units: 400km * (0.8 / 6371km) ≈ 0.05 units above Earth radius
    // Add larger safety margin to ensure visual spacing (doesn't affect physics)
    const minDistance = EARTH_RADIUS_SCENE + 0.08; // Ensure at least 0.08 units above surface (~640km visual spacing)
    
    // If somehow the ISS is too close (shouldn't happen with real TLE, but safety check),
    // normalize to minimum distance to prevent visual clipping
    if (distance < minDistance && distance > 0) {
        const scale = minDistance / distance;
        return ecefPosition.multiplyScalar(scale);
    }
    
    return ecefPosition;
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




