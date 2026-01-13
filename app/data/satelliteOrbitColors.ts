/**
 * Satellite Orbit Color Configuration
 * 
 * Centralized color mapping for satellite orbit visualization.
 * Each satellite has a unique, consistent color for its orbit path.
 * 
 * Colors are chosen for:
 * - Readability against Earth and space backgrounds
 * - Visual distinction between satellites
 * - Cinematic, premium appearance (not neon or overly bright)
 */

/**
 * Orbit colors for each satellite
 * Key: satellite ID (matches selection store IDs)
 * Value: hex color string
 */
export const SATELLITE_ORBIT_COLORS: Record<string, string> = {
    iss: "#00E5FF",      // Cyan - matches ISS theme
    hubble: "#FFB300",   // Amber - warm, distinct from cyan
} as const;

/**
 * Default fallback color if a satellite is missing from the mapping
 * Neutral white with slight blue tint for visibility
 */
export const DEFAULT_ORBIT_COLOR = "#B0BEC5"; // Light blue-gray

/**
 * Get orbit color for a satellite
 * 
 * @param satelliteId Satellite ID (e.g., "iss", "hubble")
 * @returns Hex color string for the satellite's orbit, or fallback if not found
 */
export function getSatelliteOrbitColor(satelliteId: string | null): string {
    if (!satelliteId) {
        return DEFAULT_ORBIT_COLOR;
    }
    
    return SATELLITE_ORBIT_COLORS[satelliteId.toLowerCase()] || DEFAULT_ORBIT_COLOR;
}
