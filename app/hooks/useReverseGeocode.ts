/**
 * React Hook: useReverseGeocode
 * 
 * Provides reverse geocoding with intelligent caching and throttling
 * to prevent excessive API calls while satellites move.
 */

import { useState, useEffect, useRef } from "react";
import { reverseGeocode, getDistanceKm } from "@/lib/geocoding/reverseGeocode";

interface UseReverseGeocodeResult {
    location: string | null;
    loading: boolean;
}

interface CachedLocation {
    lat: number;
    lon: number;
    location: string;
    timestamp: number;
}

// Throttle settings
const MIN_REQUEST_INTERVAL_MS = 60000; // 60 seconds between requests (more aggressive)
const MIN_DISTANCE_KM = 100; // Only fetch if satellite moved > 100km
const DEBOUNCE_MS = 300; // Wait 300ms for coordinates to stabilize (reduced from 1000ms)

// Round coordinates to reduce requests for nearly identical positions
function roundCoordinate(coord: number, precision: number = 2): number {
    return Math.round(coord * Math.pow(10, precision)) / Math.pow(10, precision);
}

/**
 * Hook for reverse geocoding satellite positions
 * 
 * Features:
 * - Caches last known location
 * - Throttles requests (max 1 per 60 seconds)
 * - Only fetches if satellite moved significantly (> 100km)
 * - Only fetches when enabled (e.g., when hovering)
 * - Debounces requests to let coordinates stabilize
 * - Aborts stale requests
 * - Handles errors gracefully
 * 
 * @param lat - Current latitude in degrees
 * @param lon - Current longitude in degrees
 * @param enabled - Whether to fetch location (e.g., when hovering)
 * @returns { location, loading }
 */
export function useReverseGeocode(
    lat: number | undefined,
    lon: number | undefined,
    enabled: boolean = false
): UseReverseGeocodeResult {
    const [location, setLocation] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Cache to track last fetch
    const cacheRef = useRef<CachedLocation | null>(null);

    // Abort controller to cancel in-flight requests
    const abortControllerRef = useRef<AbortController | null>(null);

    // Round coordinates outside useEffect to use in dependency array
    const latRounded = lat !== undefined ? roundCoordinate(lat, 1) : undefined;
    const lonRounded = lon !== undefined ? roundCoordinate(lon, 1) : undefined;

    useEffect(() => {
        // Only fetch when enabled (e.g., when hovering)
        if (!enabled) {
            // If disabled, don't change anything - keep current state
            // The location will persist from when it was last fetched
            setLoading(false);
            return;
        }

        // Invalid coordinates
        if (latRounded === undefined || lonRounded === undefined) {
            setLocation(null);
            setLoading(false);
            return;
        }

        // Debounce: wait for coordinates to stabilize before fetching
        const debounceTimer = setTimeout(() => {
            performFetch(latRounded, lonRounded);
        }, DEBOUNCE_MS);

        return () => {
            clearTimeout(debounceTimer);
        };
    }, [latRounded, lonRounded, enabled]); // Use rounded coords to prevent constant re-runs

    const performFetch = (latRounded: number, lonRounded: number) => {
        // Check if we should fetch
        const cache = cacheRef.current;
        const now = Date.now();

        let shouldFetch = false;

        if (!cache) {
            // First time - fetch
            shouldFetch = true;
        } else {
            // Check time throttle
            const timeSinceLastFetch = now - cache.timestamp;
            if (timeSinceLastFetch < MIN_REQUEST_INTERVAL_MS) {
                // Too soon - use cached location
                setLocation(cache.location);
                setLoading(false);
                return;
            }

            // Check distance threshold using rounded coordinates
            const distance = getDistanceKm(cache.lat, cache.lon, latRounded, lonRounded);
            if (distance > MIN_DISTANCE_KM) {
                shouldFetch = true;
            } else {
                // Moved too little - keep cached location
                setLocation(cache.location);
                setLoading(false);
                return;
            }
        }

        if (!shouldFetch) {
            return;
        }

        // Abort any in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        // Start fetch
        setLoading(true);

        // Use a flag to track if this request is still valid
        let isActive = true;

        (async () => {
            try {
                // Use rounded coordinates for consistency with server-side cache
                const result = await reverseGeocode(latRounded, lonRounded);

                // Check if this effect is still active and request wasn't aborted
                if (!isActive || abortController.signal.aborted) {
                    setLoading(false);
                    return;
                }

                // Update state
                setLocation(result);
                setLoading(false);

                // Update cache with rounded coordinates
                cacheRef.current = {
                    lat: latRounded,
                    lon: lonRounded,
                    location: result,
                    timestamp: Date.now(),
                };
            } catch (error) {
                // Check if this effect is still active and request wasn't aborted
                if (!isActive || abortController.signal.aborted) {
                    setLoading(false);
                    return;
                }

                // Don't log abort errors - they're expected
                const errorMessage = error instanceof Error ? error.message : String(error);
                const isAbortError = errorMessage.includes("abort") || errorMessage.includes("Abort");
                
                if (!isAbortError && process.env.NODE_ENV === "development") {
                    console.warn("[useReverseGeocode] Error fetching location:", errorMessage);
                }
                
                // On error, fall back to cached location or show unavailable
                if (cache && cache.location) {
                    setLocation(cache.location);
                } else {
                    setLocation("Location unavailable");
                }
                setLoading(false);
            }
        })();

        // Cleanup function for this specific fetch
        const cleanup = () => {
            isActive = false;
            abortController.abort();
        };

        // Return cleanup (though this won't be used directly, it's for documentation)
        return cleanup;
    };

    return { location, loading };
}
