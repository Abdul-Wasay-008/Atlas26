/**
 * ISS TLE (Two-Line Element) Data
 * 
 * Current TLE for International Space Station (NORAD ID: 25544)
 * This TLE is a snapshot and sufficient for orbital calculations.
 * Used as fallback when Celestrak fetch fails.
 * 
 * TLE format:
 * Line 1: Satellite catalog number, classification, launch year, etc.
 * Line 2: Inclination, right ascension, eccentricity, argument of perigee, etc.
 */

export const ISS_TLE = {
    // ISS TLE (NORAD ID: 25544)
    // This is a snapshot TLE sufficient for orbital calculations
    // Typical ISS orbital parameters:
    // - Inclination: ~51.64°
    // - Mean motion: ~15.49 revolutions per day
    // - Eccentricity: ~0.0001 (nearly circular)
    // - Altitude: ~400 km
    line1: "1 25544U 98067A   24001.50000000  .00001429  00000+0  34174-4 0  9998",
    line2: "2 25544  51.6437  54.3833 0001250 307.1355 142.9078 15.48901431297630"
};




