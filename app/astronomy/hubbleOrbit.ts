/**
 * Hubble Space Telescope Orbital Astronomy Module
 * 
 * Calculates Hubble position using TLE data and SGP4 propagation
 * Returns position in Earth-centered coordinates, scaled to Atlas26 scene units
 * 
 * All calculations use UTC dates and are time-based only
 * 
 * Verify with N2YO Hubble Space Telescope (NORAD 20580) at matching UTC time:
 * Compare lat/lon/alt to ensure accuracy.
 */

import * as THREE from "three";
import { getTLEForSatellite, NORAD_IDS } from "@/app/services/tleService";
import { getEarthOrbitPosition } from "@/app/astronomy/earthOrbit";
import {
    computeSatelliteEcefFromTle,
    satelliteLatLonAltToWorld,
    ecefToLatLonAlt,
} from "@/app/astronomy/satellitePosition";

const CACHE_KEY = "hubble";

/**
 * Get Hubble position in Earth-centered ECEF coordinates (scene units)
 * 
 * The Hubble position is calculated using SGP4 propagation from TLE data.
 * SGP4 outputs ECI (Earth-Centered Inertial) coordinates, which are then
 * converted to ECEF (Earth-Centered, Earth-Fixed) coordinates using Greenwich
 * Sidereal Time. This ensures the Hubble position rotates with Earth and matches
 * N2YO and other Earth-fixed reference systems.
 * 
 * Pipeline:
 * TLE → SGP4 → ECI (km) → ECEF (km) → Scene units
 * 
 * @param date UTC date
 * @returns Hubble position as Vector3 (relative to Earth center, in ECEF coordinates, scene units)
 */
export function getHubblePosition(date: Date): THREE.Vector3 {
    const tle = getTLEForSatellite(NORAD_IDS.HUBBLE);
    return computeSatelliteEcefFromTle(tle, date, CACHE_KEY);
}

/**
 * Get Hubble world position (accounting for Earth's orbital position around Sun)
 * 
 * This function combines:
 * 1. Hubble position relative to Earth (from SGP4)
 * 2. Earth's position around Sun (from Earth orbit calculations)
 * 
 * @param date UTC date
 * @param earthPosition Earth's position around Sun (from getEarthOrbitPosition)
 * @returns Hubble position in world coordinates (relative to Sun at origin)
 */
export function getHubbleWorldPosition(
    date: Date,
    earthPosition: THREE.Vector3
): THREE.Vector3 {
    // Get Hubble position relative to Earth
    const hubbleRelativeToEarth = getHubblePosition(date);
    
    // Add Earth's position to get world coordinates
    return satelliteLatLonAltToWorld(hubbleRelativeToEarth, earthPosition);
}

/**
 * Get Hubble state at a given time (position, lat/lon/alt, velocity)
 * 
 * @param date UTC date
 * @param earthPosition Earth's position around Sun
 * @returns Hubble state with position, geodetic coordinates, and world position
 */
export function getHubbleStateAtTime(
    date: Date,
    earthPosition: THREE.Vector3
): {
    lat: number;
    lon: number;
    altKm: number;
    worldPosition: THREE.Vector3;
    velocityKmS?: number;
} {
    const tle = getTLEForSatellite(NORAD_IDS.HUBBLE);
    
    // Get geodetic coordinates
    const geodetic = ecefToLatLonAlt(tle, date, CACHE_KEY);
    
    // Get world position
    const hubbleRelativeToEarth = getHubblePosition(date);
    const worldPosition = satelliteLatLonAltToWorld(hubbleRelativeToEarth, earthPosition);
    
    // TODO: Add velocity calculation if needed
    // For now, return basic state
    return {
        lat: geodetic.latDeg,
        lon: geodetic.lonDeg,
        altKm: geodetic.altKm,
        worldPosition,
    };
}
