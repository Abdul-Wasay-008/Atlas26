/**
 * Earth-Sun Orbital Astronomy Module
 * 
 * Calculates Earth's orbital position around the Sun with correct axial tilt
 * for accurate seasonal lighting (solstices and equinoxes)
 * 
 * All calculations use UTC dates and are time-based only (no hardcoded values)
 */

import * as THREE from "three";
import { getGreenwichSiderealTime } from "./siderealTime";

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
 * @param orbitRadius Distance from Sun (in scene units, default 8.0)
 * @returns Earth position as Vector3 (relative to Sun at origin)
 */
export function getEarthOrbitPosition(
    date: Date,
    orbitRadius: number = 8.0
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
 * Calculate the Sun's position in Earth-Centered Inertial (ECI) coordinates
 * 
 * In heliocentric coordinates, Sun is at origin and Earth is at earthPos.
 * In Earth-centered ECI, Sun is at -earthPos (negated Earth position).
 * 
 * Coordinate system mapping:
 * - Heliocentric: X points to vernal equinox, Y is up (north pole), Z completes right-hand
 * - ECI: X points to vernal equinox, Y points to 90° RA, Z points to north pole
 * - Scene: X is right, Y is up (north pole), Z is forward
 * 
 * @param date UTC date
 * @param orbitRadius Distance from Sun (in scene units)
 * @returns Sun position in ECI coordinates (relative to Earth center, in scene units)
 */
function getSunPositionECI(
    date: Date,
    orbitRadius: number = 8.0
): THREE.Vector3 {
    // Get Earth's position in heliocentric coordinates
    const earthPosHelio = getEarthOrbitPosition(date, orbitRadius);
    
    // In heliocentric: Earth is at earthPosHelio, Sun is at (0,0,0)
    // In Earth-centered: Sun is at -earthPosHelio
    
    // Heliocentric coordinates: Earth orbits in XZ plane (ecliptic)
    // earthPosHelio = (x, 0, z) where x = cos(angle) * radius, z = sin(angle) * radius
    
    // ECI coordinates use the same orientation as heliocentric for X and Z
    // But we need to account for Earth's axial tilt (23.44°) relative to ecliptic
    // The ecliptic plane is tilted relative to the equatorial plane
    
    // For now, we'll use a simplified model:
    // The Sun's position in ECI is the negated Earth position, rotated to account
    // for the coordinate system differences
    
    // In heliocentric: X points to vernal equinox, Y is up, Z completes right-hand
    // In ECI: X points to vernal equinox, Y points to 90° RA, Z points to north pole
    // The mapping depends on the coordinate system conventions
    
    // For the scene coordinate system:
    // - Heliocentric X -> ECI X (scene X)
    // - Heliocentric Y -> ECI Z (scene Z) 
    // - Heliocentric Z -> ECI Y (scene Y, but we need to account for tilt)
    
    // Actually, let's use a more direct approach:
    // The Sun's ecliptic longitude can be calculated from the date
    // Then convert ecliptic to equatorial coordinates
    
    const JD = dateToJulianDate(date);
    const daysSinceJ2000 = JD - 2451545.0;
    
    // Mean anomaly of the Sun (in ecliptic plane)
    const meanAnomaly = (daysSinceJ2000 / EARTH_ORBITAL_PERIOD_DAYS) * Math.PI * 2;
    
    // Sun's ecliptic longitude (approximately equal to mean anomaly for circular orbit)
    // More accurately: L = 280.4665° + 36000.7698° * T + 0.0003032° * T^2
    // where T is centuries since J2000.0
    const T = daysSinceJ2000 / 36525.0;
    const L_deg = 280.4665 + 36000.7698 * T + 0.0003032 * T * T;
    const L_rad = (L_deg * Math.PI / 180) % (2 * Math.PI);
    
    // Ecliptic latitude of Sun is approximately 0 (Sun stays in ecliptic plane)
    const beta = 0;
    
    // Convert ecliptic to equatorial coordinates
    // Right Ascension (RA) and Declination (Dec)
    const epsilon = EARTH_AXIAL_TILT_RADIANS; // Obliquity of the ecliptic
    
    const sinL = Math.sin(L_rad);
    const cosL = Math.cos(L_rad);
    const sinEpsilon = Math.sin(epsilon);
    const cosEpsilon = Math.cos(epsilon);
    
    // Right Ascension
    const RA = Math.atan2(
        cosEpsilon * sinL,
        cosL
    );
    
    // Declination
    const Dec = Math.asin(sinEpsilon * sinL);
    
    // Convert RA/Dec to Cartesian (ECI coordinates)
    // In ECI: X points to vernal equinox (RA=0), Y points to 90° RA, Z points to north pole
    // Scene mapping: X is right (vernal equinox), Y is up (north pole), Z is forward
    const cosRA = Math.cos(RA);
    const sinRA = Math.sin(RA);
    const cosDec = Math.cos(Dec);
    const sinDec = Math.sin(Dec);
    
    // ECI coordinates (unit vector, we'll scale by orbitRadius)
    // X = cos(Dec) * cos(RA)  -> points to vernal equinox
    // Y = cos(Dec) * sin(RA)  -> points to 90° RA
    // Z = sin(Dec)            -> points to north pole
    
    // Scene coordinate mapping:
    // ECI X -> Scene X
    // ECI Y -> Scene Z
    // ECI Z -> Scene Y
    
    const sunECI = new THREE.Vector3(
        cosDec * cosRA * orbitRadius,  // Scene X (ECI X)
        sinDec * orbitRadius,           // Scene Y (ECI Z, north pole)
        cosDec * sinRA * orbitRadius   // Scene Z (ECI Y)
    );
    
    return sunECI;
}

/**
 * Get Earth-Sun vector (direction from Earth to Sun) in ECEF coordinates
 * 
 * This function calculates the Sun's position in Earth-Centered Earth-Fixed (ECEF) coordinates,
 * which accounts for Earth's rotation. This ensures that the Sun direction is correct
 * relative to Earth's surface at the given UTC time.
 * 
 * IMPORTANT DIRECTION CONVENTION:
 * - This function returns: earthToSunDir = normalized vector FROM Earth center TO Sun
 * - For lighting calculations (shaders, directional lights), you typically need:
 *   sunToEarthDir = -earthToSunDir (direction FROM Sun TO Earth, i.e., direction light is coming from)
 * 
 * The Sun direction in ECEF is used for:
 * - ISS shadow detection (uses earthToSunDir directly)
 * - Earth day/night lighting (needs sunToEarthDir = -earthToSunDir)
 * - Directional light positioning (needs sunToEarthDir = -earthToSunDir)
 * 
 * @param date UTC date
 * @param orbitRadius Distance from Sun (in scene units, default 8.0)
 * @returns Normalized vector pointing from Earth toward Sun in ECEF coordinates
 */
export function getEarthToSunDirection(
    date: Date,
    orbitRadius: number = 8.0
): THREE.Vector3 {
    // Get Sun position in ECI (Earth-Centered Inertial) coordinates
    const sunECI = getSunPositionECI(date, orbitRadius);
    
    // Convert ECI to ECEF using Greenwich Sidereal Time (GST)
    // ECEF rotates with Earth, so we rotate ECI by GST around the north pole (Y-axis)
    const gst = getGreenwichSiderealTime(date);
    
    // Rotate around Y-axis (north pole) by -GST
    // (Earth rotates eastward, so we rotate coordinates westward)
    const cosGST = Math.cos(-gst);
    const sinGST = Math.sin(-gst);
    
    // ECEF coordinates:
    // ecefX = eciX * cos(GST) - eciZ * sin(GST)  (in equatorial plane)
    // ecefY = eciY                                (north pole, unchanged)
    // ecefZ = eciX * sin(GST) + eciZ * cos(GST)  (in equatorial plane)
    //
    // In scene coordinates:
    // sunECI = (x, y, z) where x=ECI X, y=ECI Z (north), z=ECI Y
    // So: ecefX = x * cos(GST) - z * sin(GST)
    //     ecefY = y (north pole)
    //     ecefZ = x * sin(GST) + z * cos(GST)
    
    const ecefX = sunECI.x * cosGST - sunECI.z * sinGST;
    const ecefY = sunECI.y;  // North pole component (unchanged)
    const ecefZ = sunECI.x * sinGST + sunECI.z * cosGST;
    
    const sunECEF = new THREE.Vector3(ecefX, ecefY, ecefZ);
    
    // Return normalized direction vector
    return sunECEF.normalize();
}

