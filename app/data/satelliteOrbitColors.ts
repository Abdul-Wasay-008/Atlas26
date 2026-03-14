/**
 * Satellite & Planet Orbit Color Configuration
 *
 * Centralized color mapping for orbit path visualization.
 * Satellites and planets each have a distinct color for their orbit path.
 *
 * Colors are chosen for:
 * - Readability against space backgrounds
 * - Visual distinction between objects
 * - Matching object identity (e.g. blue for Earth, red/orange for Mars)
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
 * Orbit colors for planets (around the Sun)
 * Key: planet ID | Value: hex color string
 */
export const PLANET_ORBIT_COLORS: Record<string, string> = {
    mercury: "#9E9E9E",  // Gray - Mercury theme
    venus: "#d8bb93",    // Warm beige - Venus theme
    earth: "#42A5F5",    // Blue - Earth theme
    mars: "#E65100",     // Dark orange / red - Mars theme
    jupiter: "#cac7c4", // Light gray - Jupiter theme
    saturn: "#d3c6a8",  // Pale gold - Saturn theme
    uranus: "#7FDBFF",  // Cyan/blue - Uranus theme
    neptune: "#3D5AFE", // Deep blue - Neptune theme
} as const;

/** Orbit color for Moon (around Earth) - white / light gray */
export const MOON_ORBIT_COLOR = "#E0E0E0";

/** Orbit color for Phobos (around Mars) - dusty brown-gray */
export const PHOBOS_ORBIT_COLOR = "#B0A090";

/** Orbit color for Deimos (around Mars) - slightly different dusty tone */
export const DEIMOS_ORBIT_COLOR = "#A89888";

/** Orbit color for Io (around Jupiter) - sulfur yellow-orange */
export const IO_ORBIT_COLOR = "#E8C060";

/** Orbit color for Europa (around Jupiter) - icy light blue */
export const EUROPA_ORBIT_COLOR = "#B0D4E8";

/** Orbit color for Ganymede (around Jupiter) - muted brown-gray */
export const GANYMEDE_ORBIT_COLOR = "#A09080";

/** Orbit color for Callisto (around Jupiter) - muted gray, distinct from Ganymede */
export const CALLISTO_ORBIT_COLOR = "#909080";

/** Orbit color for Titan (around Saturn) - soft orange-brown to match Titan */
export const TITAN_ORBIT_COLOR = "#c47c2c";

/** Orbit color for Mimas (around Saturn) - light grey for icy moon */
export const MIMAS_ORBIT_COLOR = "#C0C0C0";

/** Orbit color for Enceladus (around Saturn) - icy blue */
export const ENCELADUS_ORBIT_COLOR = "#D6E4FF";

/** Orbit color for Tethys (around Saturn) - light grey */
export const TETHYS_ORBIT_COLOR = "#E0E0E0";

/** Orbit color for Dione (around Saturn) - light grey */
export const DIONE_ORBIT_COLOR = "#E5E5E5";

/** Orbit color for Rhea (around Saturn) - light grey */
export const RHEA_ORBIT_COLOR = "#E8E8E8";

/** Orbit color for Miranda (around Uranus) - icy/neutral tone */
export const MIRANDA_ORBIT_COLOR = "#D0D8E0";

/** Orbit color for Ariel (around Uranus) - icy blue-grey */
export const ARIEL_ORBIT_COLOR = "#C9D4DF";

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

/**
 * Get orbit color for a planet
 *
 * @param planetId Planet ID (e.g., "earth", "mars")
 * @returns Hex color string for the planet's orbit path, or fallback if not found
 */
export function getPlanetOrbitColor(planetId: string | null): string {
    if (!planetId) {
        return DEFAULT_ORBIT_COLOR;
    }
    return PLANET_ORBIT_COLORS[planetId.toLowerCase()] || DEFAULT_ORBIT_COLOR;
}
