/**
 * Reverse Geocoding Utility
 * 
 * Converts latitude/longitude coordinates to human-readable location names
 * using OpenStreetMap Nominatim API.
 */

interface NominatimAddress {
    ocean?: string;
    sea?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    region?: string;
    country?: string;
    country_code?: string;
}

interface NominatimResponse {
    address?: NominatimAddress;
    display_name?: string;
}

/**
 * Extracts the best human-readable location label from Nominatim response
 * Priority order:
 * 1. Ocean/Sea name
 * 2. City/Town/Village + Country
 * 3. State/Region + Country
 * 4. Country only
 * 5. Fallback to "Unknown location"
 */
function extractLocationLabel(address: NominatimAddress | undefined): string {
    if (!address) {
        return "Unknown location";
    }

    // Priority 1: Ocean or sea
    if (address.ocean) {
        return address.ocean;
    }
    if (address.sea) {
        return address.sea;
    }

    // Priority 2: City/Town/Village + Country
    const locality = address.city || address.town || address.village;
    if (locality && address.country) {
        return `${locality}, ${address.country}`;
    }

    // Priority 3: State/Region + Country
    const region = address.state || address.region;
    if (region && address.country) {
        return `${region}, ${address.country}`;
    }

    // Priority 4: Country only
    if (address.country) {
        return address.country;
    }

    // Fallback
    return "Unknown location";
}

/**
 * Performs reverse geocoding using Nominatim API
 * 
 * @param lat - Latitude in degrees (-90 to 90)
 * @param lon - Longitude in degrees (-180 to 180)
 * @returns Human-readable location string
 * @throws Error if the request fails
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
    // Validate inputs
    if (lat < -90 || lat > 90) {
        throw new Error(`Invalid latitude: ${lat}`);
    }
    if (lon < -180 || lon > 180) {
        throw new Error(`Invalid longitude: ${lon}`);
    }

    // Build API URL
    const params = new URLSearchParams({
        format: "json",
        lat: lat.toFixed(6),
        lon: lon.toFixed(6),
        zoom: "10", // City-level detail
    });

    const url = `https://nominatim.openstreetmap.org/reverse?${params.toString()}`;

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Atlas26 (contact: atlas26.local)",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: NominatimResponse = await response.json();
        return extractLocationLabel(data.address);
    } catch (error) {
        console.error("[reverseGeocode] Request failed:", error);
        throw error;
    }
}

/**
 * Calculates approximate distance between two lat/lon points in kilometers
 * Uses simple Haversine formula
 */
export function getDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
