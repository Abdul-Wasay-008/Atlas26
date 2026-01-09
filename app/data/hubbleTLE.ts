/**
 * Hubble Space Telescope TLE (Two-Line Element) Data
 * 
 * Current TLE for Hubble Space Telescope (NORAD ID: 20580)
 * This TLE is a snapshot and sufficient for orbital calculations.
 * Used as fallback when Celestrak fetch fails.
 * 
 * TLE format:
 * Line 1: Satellite catalog number, classification, launch year, etc.
 * Line 2: Inclination, right ascension, eccentricity, argument of perigee, etc.
 */

export const HUBBLE_TLE = {
    // Hubble Space Telescope TLE (NORAD ID: 20580)
    // This is a snapshot TLE sufficient for orbital calculations
    // Typical Hubble orbital parameters:
    // - Inclination: ~28.47°
    // - Mean motion: ~15.09 revolutions per day
    // - Eccentricity: ~0.0003 (nearly circular)
    // - Altitude: ~547 km
    line1: "1 20580U 90037B   24001.50000000  .00001429  00000+0  34174-4 0  9998",
    line2: "2 20580  28.4700  54.3833 0003000 307.1355 142.9078 15.09001431297630"
};
