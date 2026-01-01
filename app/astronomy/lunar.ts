/**
 * Lunar Astronomy Module
 * 
 * Calculates astronomically accurate Moon position and phases
 * Based on established astronomical formulas (ELP-2000/82 simplified)
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
 * Get Moon position in geocentric coordinates (Earth-centered)
 * Returns position in normalized units (scaled to existing Moon distance)
 * 
 * @param date UTC date
 * @returns Moon position as Vector3 (relative to Earth at origin)
 */
export function getMoonPosition(date: Date): THREE.Vector3 {
    const JD = dateToJulianDate(date);
    
    // Time since J2000.0 epoch (2000-01-01 12:00:00 UTC) in Julian centuries
    const T = (JD - 2451545.0) / 36525.0;
    
    // Mean longitude of the Moon (degrees)
    // L = 218.3164477 + 481267.88123421 * T - 0.0015786 * T^2
    let L = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
    L = L % 360;
    if (L < 0) L += 360;
    L = (L * Math.PI) / 180; // Convert to radians
    
    // Mean anomaly of the Moon (degrees)
    // M = 134.9633964 + 477198.8675055 * T + 0.0087414 * T^2
    let M = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
    M = M % 360;
    if (M < 0) M += 360;
    M = (M * Math.PI) / 180; // Convert to radians
    
    // Mean elongation of the Moon from the Sun (degrees)
    // D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T^2
    let D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
    D = D % 360;
    if (D < 0) D += 360;
    D = (D * Math.PI) / 180; // Convert to radians
    
    // Moon's mean distance from Earth (mean anomaly correction)
    // Simplified: F = L - D (argument of latitude approximation)
    let F = L - D;
    
    // Ecliptic longitude (simplified - main terms only)
    // Longitude = L + corrections
    // Main correction: +6.289 * sin(M) (evection)
    const longitude = L + (6.289 * Math.PI / 180) * Math.sin(M);
    
    // Ecliptic latitude (inclination ~5.145°)
    const inclination = (5.145 * Math.PI) / 180; // ~5.145 degrees
    const latitude = inclination * Math.sin(F);
    
    // Distance variation (elliptical orbit)
    // Mean distance ~384,400 km, but varies due to eccentricity
    // Simplified: distance = a * (1 - e * cos(M))
    // where a = semi-major axis, e = eccentricity (~0.0549)
    const meanDistance = 384400; // km
    const eccentricity = 0.0549;
    const distanceKm = meanDistance * (1 - eccentricity * Math.cos(M));
    
    // Normalize to our scene scale (Moon orbit radius = 2 units)
    // So 384400 km → 2 units, scale factor = 2 / 384400
    const sceneScale = 2.0 / 384400; // Convert km to scene units
    const distance = distanceKm * sceneScale;
    
    // Convert ecliptic coordinates to Cartesian
    // x = distance * cos(latitude) * cos(longitude)
    // y = distance * sin(latitude)
    // z = distance * cos(latitude) * sin(longitude)
    const cosLat = Math.cos(latitude);
    const x = distance * cosLat * Math.cos(longitude);
    const y = distance * Math.sin(latitude);
    const z = distance * cosLat * Math.sin(longitude);
    
    return new THREE.Vector3(x, y, z);
}

/**
 * Get Moon phase as a number from 0 to 1
 * 0 = New Moon, 0.5 = Full Moon, 1 = New Moon
 * 
 * @param date UTC date
 * @returns Phase value (0-1)
 */
export function getMoonPhase(date: Date): number {
    const JD = dateToJulianDate(date);
    
    // Time since J2000.0 epoch in Julian centuries
    const T = (JD - 2451545.0) / 36525.0;
    
    // Mean elongation of the Moon from the Sun (D)
    let D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
    D = D % 360;
    if (D < 0) D += 360;
    D = (D * Math.PI) / 180; // Convert to radians
    
    // Synodic month period (days from New Moon to New Moon)
    // ≈ 29.530588853 days
    const synodicMonth = 29.530588853;
    
    // Calculate phase angle (0 = New Moon, π = Full Moon, 2π = New Moon)
    // Phase angle is the elongation angle D normalized to 0-2π
    let phaseAngle = D % (2 * Math.PI);
    if (phaseAngle < 0) phaseAngle = phaseAngle + 2 * Math.PI;
    
    // Convert to 0-1 range (0 = New, 0.5 = Full, 1 = New)
    // When D = 0 (or 2π), Moon is aligned with Sun (New Moon)
    // When D = π, Moon is opposite Sun (Full Moon)
    const phase = phaseAngle / (2 * Math.PI);
    
    return phase;
}

/**
 * Get the angle between Sun→Moon and Moon→Earth vectors
 * This determines the illuminated fraction of the Moon
 * 
 * @param date UTC date
 * @returns Angle in radians (0 = New Moon, π = Full Moon)
 */
export function getMoonIlluminationAngle(date: Date): number {
    const phase = getMoonPhase(date);
    // Convert phase (0-1) to angle (0 = New, π = Full)
    return phase * 2 * Math.PI;
}

/**
 * Get Moon position relative to Earth, accounting for Earth's orbit around Sun
 * This is what we need for the scene where Earth orbits the Sun
 * 
 * @param date UTC date
 * @param earthPosition Earth's position relative to Sun (Vector3)
 * @returns Moon position in world coordinates (relative to Sun at origin)
 */
export function getMoonWorldPosition(
    date: Date,
    earthPosition: THREE.Vector3
): THREE.Vector3 {
    // Get Moon position relative to Earth (geocentric)
    const moonRelativeToEarth = getMoonPosition(date);
    
    // Add Earth's position to get Moon's world position
    return new THREE.Vector3().addVectors(earthPosition, moonRelativeToEarth);
}

/**
 * Get the angle between Sun-Moon-Earth for phase calculation
 * This is the geometric angle that determines how much of the Moon is illuminated
 * 
 * @param date UTC date
 * @param moonPosition Moon's position in world coordinates
 * @param earthPosition Earth's position in world coordinates (relative to Sun)
 * @returns Angle in radians
 */
export function getSunMoonEarthAngle(
    date: Date,
    moonPosition: THREE.Vector3,
    earthPosition: THREE.Vector3
): number {
    // Vector from Sun to Moon
    const sunToMoon = new THREE.Vector3().copy(moonPosition);
    
    // Vector from Moon to Earth
    const moonToEarth = new THREE.Vector3().subVectors(earthPosition, moonPosition);
    
    // Calculate angle between these vectors
    sunToMoon.normalize();
    moonToEarth.normalize();
    
    const dot = sunToMoon.dot(moonToEarth);
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    
    return angle;
}

/**
 * Get illuminated fraction of the Moon (0 = New, 1 = Full)
 * 
 * @param date UTC date
 * @returns Illuminated fraction (0-1)
 */
export function getMoonIllumination(date: Date): number {
    const phase = getMoonPhase(date);
    // Illuminated fraction = (1 - cos(phaseAngle)) / 2
    // At New Moon (phase=0): fraction = 0
    // At Full Moon (phase=0.5): fraction = 1
    const phaseAngle = phase * 2 * Math.PI;
    const fraction = (1 - Math.cos(phaseAngle)) / 2;
    return fraction;
}

/**
 * Get phase name for debugging
 */
export function getMoonPhaseName(date: Date): string {
    const phase = getMoonPhase(date);
    const illumination = getMoonIllumination(date);
    
    if (phase < 0.03 || phase > 0.97) return "New Moon";
    if (phase < 0.22) return "Waxing Crescent";
    if (phase < 0.28) return "First Quarter";
    if (phase < 0.47) return "Waxing Gibbous";
    if (phase < 0.53) return "Full Moon";
    if (phase < 0.72) return "Waning Gibbous";
    if (phase < 0.78) return "Last Quarter";
    return "Waning Crescent";
}

