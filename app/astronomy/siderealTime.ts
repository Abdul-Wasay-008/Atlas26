/**
 * Sidereal Time Astronomy Module
 * 
 * Calculates sidereal time and Earth's orbital position for starfield orientation
 * Uses standard astronomical formulas for Greenwich Sidereal Time (GST)
 * 
 * All calculations use UTC dates and are time-based only (no hardcoded values)
 */

/**
 * Convert JavaScript Date to Julian Date
 */
export function getJulianDate(date: Date): number {
    const time = date.getTime();
    return time / 86400000 + 2440587.5;
}

/**
 * Calculate Greenwich Sidereal Time (GST) in radians
 * 
 * GST is the hour angle of the vernal equinox at the Greenwich meridian
 * It represents the rotation of Earth relative to the stars (not the Sun)
 * 
 * @param date UTC date
 * @returns Greenwich Sidereal Time in radians (0 to 2π)
 */
export function getGreenwichSiderealTime(date: Date): number {
    const JD = getJulianDate(date);
    
    // Julian Date for J2000.0 epoch (2000-01-01 12:00:00 UTC)
    const JD2000 = 2451545.0;
    
    // Days since J2000.0
    const daysSinceJ2000 = JD - JD2000;
    
    // Greenwich Mean Sidereal Time at 0h UTC (in seconds)
    // GMST = 24110.54841 + 8640184.812866 * T + 0.093104 * T^2 - 6.2e-6 * T^3
    // where T is centuries since J2000.0
    const T = daysSinceJ2000 / 36525.0; // Julian centuries
    const T2 = T * T;
    const T3 = T2 * T;
    
    // GMST at 0h UTC in seconds of time
    // Formula gives result in seconds (like hours:minutes:seconds format)
    const GMST0h_seconds = 24110.54841 + 8640184.812866 * T + 0.093104 * T2 - 6.2e-6 * T3;
    
    // Get UTC time of day (0-1, fraction of day)
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    const utcSeconds = date.getUTCSeconds();
    const utcMilliseconds = date.getUTCMilliseconds();
    
    const utcFractionOfDay = (utcHours * 3600 + utcMinutes * 60 + utcSeconds + utcMilliseconds / 1000) / 86400.0;
    
    // Sidereal time increases at rate of ~1.002737909 times solar time
    // Add sidereal time for the time of day
    const siderealSecondsPerSolarSecond = 1.002737909;
    const GMST_seconds = GMST0h_seconds + utcFractionOfDay * 86400.0 * siderealSecondsPerSolarSecond;
    
    // Convert seconds of time to radians
    // 24 hours = 360 degrees = 2π radians
    // 1 second of time = 1/86400 days = (2π / 86400) radians
    // Or: 1 second = 1/3600 hours, 1 hour = 15 degrees = π/12 radians
    // So: 1 second = π/(12*3600) radians = π/43200 radians
    const radians = GMST_seconds * (Math.PI / 43200.0);
    
    // Normalize to 0-2π range
    let normalizedRadians = radians % (2 * Math.PI);
    if (normalizedRadians < 0) normalizedRadians += 2 * Math.PI;
    
    return normalizedRadians;
}

/**
 * Get Earth's orbital longitude (mean anomaly) in radians
 * Represents Earth's position in its orbit around the Sun
 * 
 * This causes the seasonal shift in the night sky
 * 
 * @param date UTC date
 * @returns Orbital longitude in radians (0 to 2π)
 */
export function getEarthOrbitalLongitude(date: Date): number {
    const JD = getJulianDate(date);
    const JD2000 = 2451545.0;
    const daysSinceJ2000 = JD - JD2000;
    
    // Tropical year (mean)
    const TROPICAL_YEAR_DAYS = 365.2422;
    
    // Mean anomaly (orbital longitude)
    const meanAnomaly = (daysSinceJ2000 / TROPICAL_YEAR_DAYS) * 2 * Math.PI;
    
    // Normalize to 0-2π range
    let normalized = meanAnomaly % (2 * Math.PI);
    if (normalized < 0) normalized += 2 * Math.PI;
    
    return normalized;
}

/**
 * Get combined starfield rotation quaternion
 * Combines sidereal rotation (daily) and orbital rotation (seasonal)
 * 
 * @param date UTC date
 * @returns Quaternion representing the combined rotation
 */
export function getStarfieldRotationQuaternion(date: Date): {
    siderealRotation: number; // in radians
    orbitalRotation: number; // in radians
} {
    const siderealRotation = getGreenwichSiderealTime(date);
    const orbitalRotation = getEarthOrbitalLongitude(date);
    
    return {
        siderealRotation,
        orbitalRotation,
    };
}

