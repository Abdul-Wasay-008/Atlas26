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
const MIN_REQUEST_INTERVAL_MS = 25000; // 25 seconds between requests
const MIN_DISTANCE_KM = 75; // Only fetch if satellite moved > 75km

/**
 * Hook for reverse geocoding satellite positions
 * 
 * Features:
 * - Caches last known location
 * - Throttles requests (max 1 per 25 seconds)
 * - Only fetches if satellite moved significantly (> 75km)
 * - Aborts stale requests
 * - Handles errors gracefully
 * 
 * @param lat - Current latitude in degrees
 * @param lon - Current longitude in degrees
 * @returns { location, loading }
 */
export function useReverseGeocode(
    lat: number | undefined,
    lon: number | undefined
): UseReverseGeocodeResult {
    const [location, setLocation] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Cache to track last fetch
    const cacheRef = useRef<CachedLocation | null>(null);

    // Abort controller to cancel in-flight requests
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        // Invalid coordinates
        if (lat === undefined || lon === undefined) {
            setLocation(null);
            setLoading(false);
            return;
        }

        // Check if we should fetch
        const cache = cacheRef.current;
        const now = Date.now();

        let shouldFetch = false;

        if (!cache) {
            // First time - always fetch
            shouldFetch = true;
        } else {
            // Check time throttle
            const timeSinceLastFetch = now - cache.timestamp;
            if (timeSinceLastFetch < MIN_REQUEST_INTERVAL_MS) {
                // Too soon - use cached location
                if (location !== cache.location) {
                    setLocation(cache.location);
                }
                return;
            }

            // Check distance threshold
            const distance = getDistanceKm(cache.lat, cache.lon, lat, lon);
            if (distance > MIN_DISTANCE_KM) {
                shouldFetch = true;
            } else {
                // Moved too little - keep cached location
                if (location !== cache.location) {
                    setLocation(cache.location);
                }
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

        (async () => {
            try {
                const result = await reverseGeocode(lat, lon);

                // Check if request was aborted
                if (abortController.signal.aborted) {
                    return;
                }

                // Update state
                setLocation(result);
                setLoading(false);

                // Update cache
                cacheRef.current = {
                    lat,
                    lon,
                    location: result,
                    timestamp: Date.now(),
                };
            } catch (error) {
                // Check if request was aborted
                if (abortController.signal.aborted) {
                    return;
                }

                console.error("[useReverseGeocode] Failed to fetch location:", error);

                // On error, fall back to cached location or show unavailable
                if (cache && cache.location) {
                    setLocation(cache.location);
                } else {
                    setLocation("Location unavailable");
                }
                setLoading(false);
            }
        })();

        // Cleanup
        return () => {
            abortController.abort();
        };
    }, [lat, lon, location]);

    return { location, loading };
}
