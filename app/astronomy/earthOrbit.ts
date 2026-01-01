/**
 * Earth-Sun Orbital Astronomy Module
 * 
 * Calculates Earth's orbital position around the Sun with correct axial tilt
 * for accurate seasonal lighting (solstices and equinoxes)
 * 
 * All calculations use UTC dates and are time-based only (no hardcoded values)
 */

import * as THREE from "three";

/**
 * Convert JavaScript Date to Julian Date
 */
function dateToJulianDate(date: Date): number {
    const time = date.getTime();
    return time / 86400000 + 2440587.5;
}

/**
 * Earth's orbital period in days (tropical year)
 * ≈ 365.2422 days (mean tropical year)
 */
const EARTH_ORBITAL_PERIOD_DAYS = 365.2422;

/**
 * Earth's axial tilt in radians (23.44 degrees)
 * This tilt is FIXED in inertial space (does NOT rotate with orbit)
 */
export const EARTH_AXIAL_TILT_RADIANS = (23.44 * Math.PI) / 180;

/**
 * Get Earth's orbital position relative to the Sun
 * Sun is at origin (0, 0, 0), Earth orbits around it
 * 
 * @param date UTC date
 * @param orbitRadius Distance from Sun (in scene units, default 4.5)
 * @returns Earth position as Vector3 (relative to Sun at origin)
 */
export function getEarthOrbitPosition(
    date: Date,
    orbitRadius: number = 4.5
): THREE.Vector3 {
    const JD = dateToJulianDate(date);
    
    // Time since J2000.0 epoch (2000-01-01 12:00:00 UTC) in days
    const daysSinceJ2000 = JD - 2451545.0;
    
    // Calculate orbital angle (0 = perihelion, but we'll use a simpler approach)
    // For a circular orbit (v1), angle = (days / period) * 2π
    // For better accuracy, we can calculate mean anomaly first
    const meanAnomaly = (daysSinceJ2000 / EARTH_ORBITAL_PERIOD_DAYS) * Math.PI * 2;
    
    // For a circular orbit, the true anomaly equals the mean anomaly
    // (For elliptical orbit, would need to solve Kepler's equation)
    const trueAnomaly = meanAnomaly;
    
    // Earth's orbit in ecliptic plane (XZ plane, Y=0)
    // Position in orbital plane
    const x = Math.cos(trueAnomaly) * orbitRadius;
    const y = 0; // Ecliptic plane
    const z = Math.sin(trueAnomaly) * orbitRadius;
    
    return new THREE.Vector3(x, y, z);
}

/**
 * Get Earth's orbital angle (in radians) at a given date
 * 0 radians corresponds to a reference point in the orbit
 * 
 * @param date UTC date
 * @returns Orbital angle in radians (0 to 2π)
 */
export function getEarthOrbitAngle(date: Date): number {
    const JD = dateToJulianDate(date);
    const daysSinceJ2000 = JD - 2451545.0;
    const meanAnomaly = (daysSinceJ2000 / EARTH_ORBITAL_PERIOD_DAYS) * Math.PI * 2;
    
    // Normalize to 0-2π range
    let angle = meanAnomaly % (Math.PI * 2);
    if (angle < 0) angle += Math.PI * 2;
    
    return angle;
}

/**
 * Get quaternion representing Earth's axial tilt
 * This tilt is FIXED in inertial space (does NOT rotate with orbit)
 * 
 * The tilt rotates Earth's north pole toward the positive Z direction
 * (when Earth is at a specific orbital position, but tilt itself is fixed)
 * 
 * @returns Quaternion representing the fixed axial tilt
 */
export function getEarthAxialTiltQuaternion(): THREE.Quaternion {
    // Create quaternion for rotation around X-axis by axial tilt
    // This tilts Earth's axis (north pole) toward positive Z direction
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(
        new THREE.Vector3(1, 0, 0), // Rotate around X-axis
        EARTH_AXIAL_TILT_RADIANS // Tilt angle
    );
    return quaternion;
}

/**
 * Get the season name based on Earth's orbital position
 * Useful for debugging and validation
 * 
 * @param date UTC date
 * @returns Season name string
 */
export function getSeason(date: Date): string {
    const angle = getEarthOrbitAngle(date);
    
    // Approximate solstice/equinox angles (these would be more precise with
    // actual calculation of solstice dates, but this is a simplified version)
    // Assuming:
    // - June solstice ~ June 21 (angle ≈ π/2 or 90°)
    // - September equinox ~ Sept 23 (angle ≈ π or 180°)
    // - December solstice ~ Dec 21 (angle ≈ 3π/2 or 270°)
    // - March equinox ~ March 20 (angle ≈ 0 or 360°)
    
    // Convert angle to approximate day of year
    const dayOfYear = (angle / (Math.PI * 2)) * EARTH_ORBITAL_PERIOD_DAYS;
    
    // Determine season (Northern Hemisphere)
    if (dayOfYear < 80 || dayOfYear >= 355) return "Winter Solstice (Dec)";
    if (dayOfYear < 172) return "Spring Equinox (Mar)";
    if (dayOfYear < 266) return "Summer Solstice (Jun)";
    return "Autumn Equinox (Sep)";
}

/**
 * Get Earth-Sun vector (direction from Earth to Sun)
 * Used for calculating lighting direction
 * 
 * @param date UTC date
 * @param orbitRadius Distance from Sun
 * @returns Normalized vector pointing from Earth toward Sun
 */
export function getEarthToSunDirection(
    date: Date,
    orbitRadius: number = 4.5
): THREE.Vector3 {
    const earthPos = getEarthOrbitPosition(date, orbitRadius);
    // Sun is at origin, so direction from Earth to Sun is -earthPos normalized
    return new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), earthPos).normalize();
}

