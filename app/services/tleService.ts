/**
 * TLE Service
 * 
 * Fetches and manages Two-Line Element (TLE) data for satellites.
 * Supports multiple satellites via NORAD IDs from Celestrak.
 * 
 * Fetches TLE once at app startup and stores in memory for the session.
 * Caches TLE results for ~15 minutes to reduce requests.
 */

import { ISS_TLE as FALLBACK_ISS_TLE } from "@/app/data/issTLE";
import { HUBBLE_TLE as FALLBACK_HUBBLE_TLE } from "@/app/data/hubbleTLE";

/**
 * TLE data structure
 */
export interface TLE {
    line1: string;
    line2: string;
}

/**
 * Satellite NORAD IDs
 */
export const NORAD_IDS = {
    ISS: 25544,
    HUBBLE: 20580,
} as const;

/**
 * Fallback TLE data for each satellite
 */
const FALLBACK_TLES: Record<number, TLE> = {
    [NORAD_IDS.ISS]: FALLBACK_ISS_TLE,
    [NORAD_IDS.HUBBLE]: FALLBACK_HUBBLE_TLE,
};

/**
 * In-memory storage for fetched TLEs (keyed by NORAD ID)
 * Falls back to hardcoded TLE if fetch fails
 */
const tleCache: Map<number, TLE> = new Map();
const initializationPromises: Map<number, Promise<void>> = new Map();
const lastFetchTime: Map<number, number> = new Map();
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Celestrak URL template for TLE (NORAD ID)
 * Returns TLE format (two lines)
 */
function getCelestrakURL(noradId: number): string {
    return `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`;
}

/**
 * Parse TLE text response from Celestrak
 * 
 * @param text Raw text response from Celestrak
 * @param noradId Expected NORAD ID for validation
 * @returns Parsed TLE object or null if invalid
 */
function parseTLE(text: string, noradId: number): TLE | null {
    // Remove any leading/trailing whitespace
    const lines = text.trim().split("\n").map(line => line.trim()).filter(line => line.length > 0);

    // TLE format: Line 1 starts with "1 ", Line 2 starts with "2 "
    // Find the two TLE lines
    const line1 = lines.find(line => line.startsWith("1 "));
    const line2 = lines.find(line => line.startsWith("2 "));

    if (!line1 || !line2) {
        return null;
    }

    // Validate TLE format (basic checks)
    // Line 1 should have the expected NORAD ID
    const noradIdStr = noradId.toString();
    if (!line1.includes(noradIdStr)) {
        return null;
    }

    // Line 2 should also have the expected NORAD ID
    if (!line2.includes(noradIdStr)) {
        return null;
    }

    return {
        line1,
        line2
    };
}

/**
 * Fetch latest TLE from Celestrak for a given NORAD ID
 * 
 * @param noradId NORAD catalog number
 * @returns Promise resolving to TLE or null if fetch fails
 */
async function fetchTLE(noradId: number): Promise<TLE | null> {
    try {
        // Check cache first
        const cached = tleCache.get(noradId);
        const lastFetch = lastFetchTime.get(noradId);
        if (cached && lastFetch && Date.now() - lastFetch < CACHE_DURATION_MS) {
            return cached;
        }

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const url = getCelestrakURL(noradId);
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "text/plain"
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        const parsed = parseTLE(text, noradId);

        if (!parsed) {
            throw new Error("Failed to parse TLE from response");
        }

        // Cache the result
        tleCache.set(noradId, parsed);
        lastFetchTime.set(noradId, Date.now());

        return parsed;
    } catch (error) {
        // Silently fail - we'll use fallback TLE
        if (process.env.NODE_ENV === "development") {
            console.warn(`TLE fetch failed for NORAD ${noradId}:`, error);
        }
        return null;
    }
}

/**
 * Initialize TLE for a satellite by fetching from Celestrak
 * 
 * This should be called once at app startup for each satellite.
 * If fetch fails, falls back to hardcoded TLE.
 * 
 * @param noradId NORAD catalog number
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeTLE(noradId: number): Promise<void> {
    // If already initialized, return immediately
    if (tleCache.has(noradId)) {
        return;
    }

    // If initialization is in progress, wait for it
    const existingPromise = initializationPromises.get(noradId);
    if (existingPromise) {
        return existingPromise;
    }

    // Start initialization
    const promise = (async () => {
        try {
            const fetchedTLE = await fetchTLE(noradId);

            if (fetchedTLE) {
                tleCache.set(noradId, fetchedTLE);
                lastFetchTime.set(noradId, Date.now());

                // Development-only logging
                if (process.env.NODE_ENV === "development") {
                    console.log(`TLE updated from Celestrak for NORAD ${noradId}:`);
                    console.log(fetchedTLE.line1);
                    console.log(fetchedTLE.line2);
                }
            } else {
                // Use fallback TLE
                const fallback = FALLBACK_TLES[noradId];
                if (fallback) {
                    tleCache.set(noradId, fallback);
                    lastFetchTime.set(noradId, Date.now());
                }

                // Development-only logging
                if (process.env.NODE_ENV === "development") {
                    console.log(`TLE fetch failed for NORAD ${noradId}, using hardcoded fallback TLE`);
                }
            }
        } catch (error) {
            // Use fallback TLE on any error
            const fallback = FALLBACK_TLES[noradId];
            if (fallback) {
                tleCache.set(noradId, fallback);
                lastFetchTime.set(noradId, Date.now());
            }

            // Development-only logging
            if (process.env.NODE_ENV === "development") {
                console.log(`TLE fetch failed for NORAD ${noradId}, using hardcoded fallback TLE`);
            }
        } finally {
            initializationPromises.delete(noradId);
        }
    })();

    initializationPromises.set(noradId, promise);
    return promise;
}

/**
 * Get TLE for a satellite by NORAD ID
 * 
 * Returns the fetched TLE if available, otherwise returns fallback TLE.
 * 
 * @param noradId NORAD catalog number
 * @returns Current TLE object
 */
export function getTLEForSatellite(noradId: number): TLE {
    const cached = tleCache.get(noradId);
    if (cached) {
        return cached;
    }
    
    // Return fallback if available
    const fallback = FALLBACK_TLES[noradId];
    if (fallback) {
        return fallback;
    }
    
    // Should never happen, but provide a default
    console.error(`No TLE available for NORAD ${noradId}`);
    return FALLBACK_ISS_TLE;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getTLEForSatellite(NORAD_IDS.ISS) instead
 */
export function getCurrentISSTLE(): TLE {
    return getTLEForSatellite(NORAD_IDS.ISS);
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use initializeTLE(NORAD_IDS.ISS) instead
 */
export async function initializeISSTLE(): Promise<void> {
    return initializeTLE(NORAD_IDS.ISS);
}

/**
 * Check if TLE has been initialized for a satellite
 * 
 * @param noradId NORAD catalog number
 * @returns True if TLE has been initialized (fetched or fallback loaded)
 */
export function isTLEInitialized(noradId: number): boolean {
    return tleCache.has(noradId);
}

