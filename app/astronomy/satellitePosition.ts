/**
 * Shared Satellite Position Utilities
 * 
 * Common functions for computing satellite positions from TLE data using SGP4.
 * Used by ISS, Hubble, and future satellites.
 * 
 * All calculations use UTC dates and are time-based only.
 */

import * as THREE from "three";
import * as satellite from "satellite.js";
import { getGreenwichSiderealTime } from "@/app/astronomy/siderealTime";
import { TLE } from "@/app/services/tleService";

/**
 * Earth radius in kilometers
 */
export const EARTH_RADIUS_KM = 6371.0;

/**
 * Earth radius in Atlas26 scene units
 */
export const EARTH_RADIUS_SCENE = 0.8;

/**
 * Scale factor to convert kilometers to scene units
 */
export const KM_TO_SCENE = EARTH_RADIUS_SCENE / EARTH_RADIUS_KM;

/**
 * Longitude offset to align satellites with Earth texture
 * Rotates ECEF coordinates around Y-axis (north pole) in the XZ plane
 * Common values: 0 (no offset), -π/2 (-90°), π/2 (+90°), π (180°)
 */
export const LONGITUDE_OFFSET = -Math.PI / 2; // Rotate -90° to align with typical Earth texture

/**
 * Parse TLE and create satellite record (cached per satellite)
 */
const satrecCache: Map<string, satellite.SatRec> = new Map();
const tleHashCache: Map<string, string> = new Map();

/**
 * Get satellite record from TLE (cached for performance)
 * 
 * @param tle TLE data
 * @param cacheKey Unique key for caching (e.g., "iss" or "hubble")
 * @returns Satellite record for SGP4 propagation
 */
export function getSatRecFromTLE(tle: TLE, cacheKey: string): satellite.SatRec {
    const tleHash = `${tle.line1}|${tle.line2}`;
    const cachedHash = tleHashCache.get(cacheKey);
    
    // Return cached satrec if TLE hasn't changed
    if (cachedHash === tleHash && satrecCache.has(cacheKey)) {
        return satrecCache.get(cacheKey)!;
    }
    
    // Create new satrec and cache it
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    satrecCache.set(cacheKey, satrec);
    tleHashCache.set(cacheKey, tleHash);
    
    return satrec;
}

/**
 * Compute satellite ECEF position from TLE
 * 
 * Pipeline: TLE → SGP4 → ECI (km) → ECEF (km) → Scene units
 * 
 * @param tle TLE data
 * @param date UTC date
 * @param cacheKey Unique key for caching (e.g., "iss" or "hubble")
 * @returns Satellite position in ECEF coordinates (scene units, relative to Earth center)
 */
export function computeSatelliteEcefFromTle(
    tle: TLE,
    date: Date,
    cacheKey: string
): THREE.Vector3 {
    const satrec = getSatRecFromTLE(tle, cacheKey);
    
    // Propagate satellite position using SGP4
    const positionAndVelocity = satellite.propagate(satrec, date);
    
    if (!positionAndVelocity || (positionAndVelocity as any).error) {
        console.warn(`SGP4 propagation error for ${cacheKey}`);
        return new THREE.Vector3(0.85, 0, 0);
    }

    const positionEciKm = positionAndVelocity.position;
    
    if (!positionEciKm) {
        console.warn(`SGP4 returned null position for ${cacheKey}`);
        return new THREE.Vector3(0.85, 0, 0);
    }
    
    // Get Greenwich Mean Sidereal Time (GMST) for ECI → ECEF conversion
    const gmst = getGreenwichSiderealTime(date);
    
    // Convert ECI to ECEF using satellite.js built-in function
    const positionEcefKm = satellite.eciToEcf(positionEciKm, gmst);
    
    // Convert ECEF position from kilometers to scene units
    const ecefX = positionEcefKm.x * KM_TO_SCENE;
    const ecefY = positionEcefKm.y * KM_TO_SCENE;
    const ecefZ = positionEcefKm.z * KM_TO_SCENE;
    
    // Map ECEF coordinates to scene coordinates
    // satellite.js ECEF: X toward Greenwich, Y toward 90°E, Z toward north pole
    // Atlas26 scene: X is right (Greenwich at reference), Y is up (north pole), Z is forward (90°E at reference)
    // Mapping: ECEF (X, Y, Z) -> Scene (X, Z, Y)
    const sceneX = ecefX;
    const sceneY = ecefZ; // North pole
    const sceneZ = ecefY; // 90°E
    
    // Apply longitude offset to align with Earth texture
    const cosOffset = Math.cos(LONGITUDE_OFFSET);
    const sinOffset = Math.sin(LONGITUDE_OFFSET);
    
    // Rotate scene X and scene Z around scene Y (north pole)
    const rotatedX = sceneX * cosOffset - sceneZ * sinOffset;
    const rotatedZ = sceneX * sinOffset + sceneZ * cosOffset;
    const rotatedY = sceneY; // Scene Y (north pole, unchanged)
    
    const ecefPosition = new THREE.Vector3(rotatedX, rotatedY, rotatedZ);
    
    // Calculate distance from Earth center to verify it's above surface
    const distance = ecefPosition.length();
    const minDistance = EARTH_RADIUS_SCENE + 0.08; // Ensure at least 0.08 units above surface
    
    // Safety check: normalize to minimum distance if too close
    if (distance < minDistance && distance > 0) {
        const scale = minDistance / distance;
        return ecefPosition.multiplyScalar(scale);
    }
    
    return ecefPosition;
}

/**
 * Convert ECEF position to geodetic coordinates (lat/lon/alt)
 * 
 * @param tle TLE data
 * @param date UTC date
 * @param cacheKey Unique key for caching
 * @returns Geodetic coordinates { latDeg, lonDeg, altKm }
 */
export function ecefToLatLonAlt(
    tle: TLE,
    date: Date,
    cacheKey: string
): { latDeg: number; lonDeg: number; altKm: number } {
    const satrec = getSatRecFromTLE(tle, cacheKey);
    const positionAndVelocity = satellite.propagate(satrec, date);
    
    if (!positionAndVelocity || (positionAndVelocity as any).error || !positionAndVelocity.position) {
        return { latDeg: 0, lonDeg: 0, altKm: 0 };
    }

    const positionEciKm = positionAndVelocity.position;
    const gmst = getGreenwichSiderealTime(date);
    
    // Convert ECI to geodetic coordinates using satellite.js
    const geodetic = satellite.eciToGeodetic(positionEciKm, gmst);
    
    return {
        latDeg: satellite.degreesLat(geodetic.latitude),
        lonDeg: satellite.degreesLong(geodetic.longitude),
        altKm: geodetic.height, // Height above Earth's surface in km
    };
}

/**
 * Get satellite position in world coordinates (accounting for Earth's orbital position)
 * 
 * @param satellitePositionEcef Satellite position relative to Earth (in scene units)
 * @param earthPosition Earth's position around Sun (from getEarthOrbitPosition)
 * @returns Satellite position in world coordinates (relative to Sun at origin)
 */
export function satelliteLatLonAltToWorld(
    satellitePositionEcef: THREE.Vector3,
    earthPosition: THREE.Vector3
): THREE.Vector3 {
    return new THREE.Vector3().addVectors(earthPosition, satellitePositionEcef);
}
