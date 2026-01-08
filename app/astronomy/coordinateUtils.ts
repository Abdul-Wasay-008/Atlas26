/**
 * Coordinate Conversion Utilities
 * 
 * Converts between ECI (Earth-Centered Inertial) and geodetic coordinates (lat/long)
 * Used for ground track visualization
 */

import * as THREE from "three";
import { getGreenwichSiderealTime } from "./siderealTime";

/**
 * Earth radius in scene units
 */
const EARTH_RADIUS_SCENE = 0.8;

/**
 * Convert ECI (Earth-Centered Inertial) to ECEF (Earth-Centered, Earth-Fixed) coordinates
 * 
 * ECI coordinates are fixed in space (don't rotate with Earth)
 * ECEF coordinates rotate with Earth (fixed to Earth's surface)
 * 
 * Conversion: Rotate ECI coordinates around Earth's Y-axis (north pole) by Greenwich Sidereal Time
 * 
 * Coordinate system mapping:
 * - ECI: X points to vernal equinox, Y points to 90° RA, Z points to north pole
 * - Scene: X is right, Y is up (north pole), Z is forward
 * - Mapping: ECI X -> scene X, ECI Y -> scene Z, ECI Z -> scene Y
 * 
 * @param eciPosition ECI position vector (relative to Earth center, in scene units)
 * @param date UTC date for calculating Greenwich Sidereal Time
 * @returns ECEF position vector (relative to Earth center, in scene units)
 */
export function eciToEcef(
    eciPosition: THREE.Vector3,
    date: Date
): THREE.Vector3 {
    // Get Greenwich Sidereal Time (GST) in radians
    const gst = getGreenwichSiderealTime(date);
    
    // The eciPosition is in scene coordinates:
    // eciPosition.x = ECI X (scene X)
    // eciPosition.y = ECI Z (scene Y, north pole)
    // eciPosition.z = ECI Y (scene Z)
    //
    // To convert to ECEF, rotate around the north pole axis (scene Y-axis)
    // by the GST angle. Earth rotates eastward, so we rotate the coordinate system westward.
    
    const cosGST = Math.cos(-gst);
    const sinGST = Math.sin(-gst);
    
    // Rotate around Y-axis (north pole)
    // ECEF X = ECI X * cos(GST) - ECI Y * sin(GST)  (in equatorial plane)
    // ECEF Y = ECI Z (unchanged, it's the rotation axis - north pole)
    // ECEF Z = ECI X * sin(GST) + ECI Y * cos(GST)  (in equatorial plane)
    //
    // In scene coordinates:
    // ecefX = eciPosition.x * cos(GST) - eciPosition.z * sin(GST)
    // ecefY = eciPosition.y (north pole, unchanged)
    // ecefZ = eciPosition.x * sin(GST) + eciPosition.z * cos(GST)
    const ecefX = eciPosition.x * cosGST - eciPosition.z * sinGST;
    const ecefY = eciPosition.y;  // North pole component (up)
    const ecefZ = eciPosition.x * sinGST + eciPosition.z * cosGST;
    
    return new THREE.Vector3(ecefX, ecefY, ecefZ);
}

/**
 * Convert ECI position to latitude and longitude
 * 
 * ECI (Earth-Centered Inertial) coordinates are fixed in space (don't rotate with Earth)
 * We need to convert to ECEF (Earth-Centered, Earth-Fixed) by rotating by GST
 * Then convert ECEF to geodetic (latitude/longitude)
 * 
 * Coordinate system mapping:
 * - ECI: X points to vernal equinox, Y points to 90° RA, Z points to north pole
 * - Scene: X is right, Y is up (north pole), Z is forward
 * - Mapping: ECI X -> scene X, ECI Y -> scene Z, ECI Z -> scene Y
 * 
 * NOTE: getISSPosition now returns ECEF coordinates. Use ecefToLatLong() instead
 * of this function for positions from getISSPosition().
 * 
 * @param eciPosition ECI position vector (relative to Earth center, in scene units)
 * @param date UTC date for calculating Greenwich Sidereal Time
 * @returns Object with latitude (radians) and longitude (radians)
 */
export function eciToLatLong(
    eciPosition: THREE.Vector3,
    date: Date
): { latitude: number; longitude: number } {
    // Convert ECI to ECEF first
    const ecefPosition = eciToEcef(eciPosition, date);
    
    // Convert ECEF to geodetic coordinates
    const ecefX = ecefPosition.x;
    const ecefY = ecefPosition.y;
    const ecefZ = ecefPosition.z;
    
    // Convert ECEF to geodetic coordinates
    const distance = Math.sqrt(ecefX * ecefX + ecefY * ecefY + ecefZ * ecefZ);
    
    if (distance < 0.0001) {
        return { latitude: 0, longitude: 0 };
    }
    
    // Latitude: angle from equator (positive = north)
    const latitude = Math.asin(ecefY / distance);
    
    // Longitude: angle from Greenwich meridian (positive = east)
    // In standard ECEF: longitude = atan2(Y, X) where X is toward Greenwich, Y is toward 90°E
    // In our scene mapping after rotation:
    // - ecefX is in scene X direction (toward Greenwich at GST=0)
    // - ecefZ is in scene Z direction (toward 90°E at GST=0)
    // So: longitude = atan2(ecefZ, ecefX)
    const longitude = Math.atan2(ecefZ, ecefX);
    
    return { latitude, longitude };
}

/**
 * Convert ECEF (Earth-Centered, Earth-Fixed) position to latitude and longitude
 * 
 * @param ecefPosition ECEF position vector (relative to Earth center, in scene units)
 * @returns Object with latitude (radians) and longitude (radians)
 */
export function ecefToLatLong(
    ecefPosition: THREE.Vector3
): { latitude: number; longitude: number } {
    const ecefX = ecefPosition.x;
    const ecefY = ecefPosition.y;
    const ecefZ = ecefPosition.z;
    
    // Convert ECEF to geodetic coordinates
    const distance = Math.sqrt(ecefX * ecefX + ecefY * ecefY + ecefZ * ecefZ);
    
    if (distance < 0.0001) {
        return { latitude: 0, longitude: 0 };
    }
    
    // Latitude: angle from equator (positive = north)
    const latitude = Math.asin(ecefY / distance);
    
    // Longitude: angle from Greenwich meridian (positive = east)
    // In standard ECEF: longitude = atan2(Y, X) where X is toward Greenwich, Y is toward 90°E
    // In our scene mapping:
    // - ecefX is in scene X direction (toward Greenwich at GST=0)
    // - ecefZ is in scene Z direction (toward 90°E at GST=0)
    // So: longitude = atan2(ecefZ, ecefX)
    const longitude = Math.atan2(ecefZ, ecefX);
    
    return { latitude, longitude };
}

/**
 * Convert latitude and longitude to Earth surface position (3D coordinates)
 * 
 * IMPORTANT COORDINATE CONVENTION:
 * - Scene X axis: Points toward Greenwich meridian (0° longitude) at reference time
 * - Scene Y axis: Points toward north pole
 * - Scene Z axis: Points toward 90°E meridian at reference time
 * - Longitude: Positive = east, Negative = west (standard convention)
 * - Latitude: Positive = north, Negative = south (standard convention)
 * 
 * This function converts geographic coordinates to scene coordinates that match
 * the ECEF coordinate system used by getISSPosition().
 * 
 * @param latitude Latitude in radians (positive = north, negative = south)
 * @param longitude Longitude in radians (positive = east, negative = west)
 * @param altitudeOffset Small offset above Earth surface to avoid z-fighting (in scene units)
 * @returns 3D position on Earth surface (relative to Earth center, in scene units)
 */
export function latLongToSurfacePosition(
    latitude: number,
    longitude: number,
    altitudeOffset: number = EARTH_RADIUS_SCENE * 0.01
): THREE.Vector3 {
    const radius = EARTH_RADIUS_SCENE + altitudeOffset;
    
    // Convert spherical coordinates to Cartesian
    // Scene coordinate system:
    // - X: Points toward Greenwich meridian (0° longitude)
    // - Y: Points toward north pole
    // - Z: Points toward 90°E meridian
    // 
    // Standard spherical to Cartesian mapping:
    // x = r * cos(lat) * cos(lon)  (component along Greenwich axis)
    // y = r * sin(lat)             (component along north pole axis)
    // z = r * cos(lat) * sin(lon)  (component along 90°E axis)
    
    const cosLat = Math.cos(latitude);
    const sinLat = Math.sin(latitude);
    const cosLon = Math.cos(longitude);
    const sinLon = Math.sin(longitude);
    
    const x = radius * cosLat * cosLon;
    const y = radius * sinLat;
    const z = radius * cosLat * sinLon;
    
    return new THREE.Vector3(x, y, z);
}

