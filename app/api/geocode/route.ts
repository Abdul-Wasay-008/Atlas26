/**
 * Next.js API Route: Reverse Geocoding Proxy
 * 
 * Proxies requests to OpenStreetMap Nominatim API to avoid CORS issues
 * and provides server-side rate limiting.
 */

import { NextRequest, NextResponse } from "next/server";

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
 * Fallback location provider for when Nominatim is unavailable
 * Provides basic geographic descriptions based on coordinates
 */
function getFallbackLocation(lat: number, lon: number): string {
    // Major oceans
    if (Math.abs(lat) < 60) {
        if (lon >= -180 && lon < -80) return "Pacific Ocean";
        if (lon >= -80 && lon < -30) return "Atlantic Ocean";
        if (lon >= -30 && lon < 20) return "Atlantic Ocean";
        if (lon >= 20 && lon < 120) return "Indian Ocean";
        if (lon >= 120 && lon <= 180) return "Pacific Ocean";
    }

    // Polar regions
    if (lat >= 66.5) return "Arctic Region";
    if (lat <= -66.5) return "Antarctic Region";

    // General regions by latitude/longitude
    if (lat >= 0) {
        if (lon >= -10 && lon < 50) return "Over Africa or Europe";
        if (lon >= 50 && lon < 150) return "Over Asia";
        if (lon >= 150 || lon < -100) return "Over Pacific";
        return "Northern Hemisphere";
    } else {
        if (lon >= -80 && lon < -30) return "Over South America";
        if (lon >= -30 && lon < 50) return "Over Southern Africa";
        if (lon >= 50 && lon < 150) return "Over Southern Ocean";
        return "Southern Hemisphere";
    }
}

// Simple in-memory cache to prevent duplicate requests
const requestCache = new Map<string, { location: string; timestamp: number }>();
const CACHE_TTL_MS = 60000; // 60 seconds cache

// Round coordinates to reduce cache misses for nearby locations
function roundCoordinate(coord: number, precision: number = 2): number {
    return Math.round(coord * Math.pow(10, precision)) / Math.pow(10, precision);
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const lat = searchParams.get("lat");
        const lon = searchParams.get("lon");

        // Round coordinates to 2 decimal places (~1km precision) to reduce cache misses
        const latRounded = roundCoordinate(parseFloat(lat || "0"), 2);
        const lonRounded = roundCoordinate(parseFloat(lon || "0"), 2);
        const cacheKey = `${latRounded},${lonRounded}`;

        // Check cache first
        const cached = requestCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return NextResponse.json({ location: cached.location });
        }

        // Validate inputs
        if (!lat || !lon) {
            return NextResponse.json(
                { error: "Missing lat or lon parameters" },
                { status: 400 }
            );
        }

        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);

        if (isNaN(latNum) || isNaN(lonNum)) {
            return NextResponse.json(
                { error: "Invalid lat or lon values" },
                { status: 400 }
            );
        }

        if (latNum < -90 || latNum > 90) {
            return NextResponse.json(
                { error: "Latitude must be between -90 and 90" },
                { status: 400 }
            );
        }

        if (lonNum < -180 || lonNum > 180) {
            return NextResponse.json(
                { error: "Longitude must be between -180 and 180" },
                { status: 400 }
            );
        }

        // Build Nominatim API URL (use rounded coordinates for consistency with cache)
        const params = new URLSearchParams({
            format: "json",
            lat: latRounded.toFixed(6),
            lon: lonRounded.toFixed(6),
            zoom: "10", // City-level detail
        });

        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?${params.toString()}`;

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        let response: Response;
        try {
            // Fetch from Nominatim with proper User-Agent header
            response = await fetch(nominatimUrl, {
                headers: {
                    "User-Agent": "Atlas26 (contact: atlas26.local)",
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
        } catch (fetchError) {
            clearTimeout(timeoutId);
            // Handle abort errors gracefully (timeout or client disconnect)
            if (fetchError instanceof Error && fetchError.name === "AbortError") {
                return NextResponse.json(
                    { error: "Request timeout. Please try again." },
                    { status: 504 }
                );
            }
            // Handle network errors (connection refused, DNS failure, etc.)
            if (fetchError instanceof Error) {
                const errorCode = (fetchError as any).cause?.code;
                const errorName = (fetchError as any).name;
                // Handle all socket/connection errors
                if (
                    errorCode === "ECONNREFUSED" ||
                    errorCode === "ENOTFOUND" ||
                    errorCode === "ETIMEDOUT" ||
                    errorCode === "UND_ERR_SOCKET" ||
                    errorName === "SocketError"
                ) {
                    // Network error - use fallback location provider
                    const fallbackLocation = getFallbackLocation(latRounded, lonRounded);
                    // Cache the fallback result
                    requestCache.set(cacheKey, { location: fallbackLocation, timestamp: Date.now() });

                    return NextResponse.json({
                        location: fallbackLocation,
                        fallback: true // Indicate this is a fallback response
                    });
                }
            }
            // Re-throw other errors to be handled by outer catch
            throw fetchError;
        }

        if (!response.ok) {
            // If rate limited or service unavailable, return error
            if (response.status === 429 || response.status === 503) {
                return NextResponse.json(
                    { error: "Service temporarily unavailable. Please try again later." },
                    { status: 503 }
                );
            }
            return NextResponse.json(
                { error: `Nominatim API error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data: NominatimResponse = await response.json();
        let location = extractLocationLabel(data.address);

        // If our extraction gave "Unknown location", use Nominatim's display_name when present, else code fallback
        if (location === "Unknown location") {
            const displayName = (data.display_name && String(data.display_name).trim()) || undefined;
            location = displayName || getFallbackLocation(latRounded, lonRounded);
        }

        // Cache the result
        requestCache.set(cacheKey, { location, timestamp: Date.now() });
        // Clean up old cache entries (keep last 100)
        if (requestCache.size > 100) {
            const oldestKey = Array.from(requestCache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
            requestCache.delete(oldestKey);
        }

        return NextResponse.json({ location });
    } catch (error) {
        // Handle timeout or network errors gracefully
        if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
            // Don't log abort errors - they're expected (timeout or client disconnect)
            return NextResponse.json(
                { error: "Request timeout. Please try again." },
                { status: 504 }
            );
        }

        // Handle network connection errors
        if (error instanceof Error) {
            const errorCode = (error as any).cause?.code;
            if (errorCode === "ECONNREFUSED" || errorCode === "ENOTFOUND" || errorCode === "ETIMEDOUT") {
                // Network errors - don't spam logs, just return user-friendly message
                return NextResponse.json(
                    { error: "Unable to connect to geocoding service. Please check your network connection." },
                    { status: 503 }
                );
            }
        }

        // Only log unexpected errors (not network/connection issues)
        console.error("[geocode API] Unexpected error:", error);

        return NextResponse.json(
            { error: "Failed to fetch location" },
            { status: 500 }
        );
    }
}
