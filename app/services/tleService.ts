/**
 * TLE Service
 * 
 * Fetches and manages Two-Line Element (TLE) data for satellites.
 * Currently supports ISS (NORAD ID: 25544) from Celestrak.
 * 
 * Fetches TLE once at app startup and stores in memory for the session.
 */

import { ISS_TLE as FALLBACK_ISS_TLE } from "@/app/data/issTLE";

/**
 * ISS TLE data structure
 */
export interface ISSTLE {
    line1: string;
    line2: string;
}

/**
 * In-memory storage for fetched ISS TLE
 * Falls back to hardcoded TLE if fetch fails
 */
let currentISSTLE: ISSTLE = FALLBACK_ISS_TLE;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Celestrak URL for ISS TLE (NORAD ID: 25544)
 * Returns TLE format (two lines)
 */
const CELESTRAK_ISS_URL = "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE";

/**
 * Parse TLE text response from Celestrak
 * 
 * @param text Raw text response from Celestrak
 * @returns Parsed TLE object or null if invalid
 */
function parseTLE(text: string): ISSTLE | null {
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
    // Line 1 should have NORAD ID 25544
    if (!line1.includes("25544")) {
        return null;
    }
    
    // Line 2 should also have NORAD ID 25544
    if (!line2.includes("25544")) {
        return null;
    }
    
    return {
        line1,
        line2
    };
}

/**
 * Fetch latest ISS TLE from Celestrak
 * 
 * @returns Promise resolving to ISS TLE or null if fetch fails
 */
async function fetchISSTLE(): Promise<ISSTLE | null> {
    try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(CELESTRAK_ISS_URL, {
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
        const parsed = parseTLE(text);
        
        if (!parsed) {
            throw new Error("Failed to parse TLE from response");
        }
        
        return parsed;
    } catch (error) {
        // Silently fail - we'll use fallback TLE
        if (process.env.NODE_ENV === "development") {
            console.warn("ISS TLE fetch failed:", error);
        }
        return null;
    }
}

/**
 * Initialize ISS TLE by fetching from Celestrak
 * 
 * This should be called once at app startup.
 * If fetch fails, falls back to hardcoded TLE.
 * 
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeISSTLE(): Promise<void> {
    // If already initialized, return immediately
    if (isInitialized) {
        return;
    }
    
    // If initialization is in progress, wait for it
    if (initializationPromise) {
        return initializationPromise;
    }
    
    // Start initialization
    initializationPromise = (async () => {
        try {
            const fetchedTLE = await fetchISSTLE();
            
            if (fetchedTLE) {
                currentISSTLE = fetchedTLE;
                isInitialized = true;
                
                // Development-only logging
                if (process.env.NODE_ENV === "development") {
                    console.log("ISS TLE updated from Celestrak:");
                    console.log(fetchedTLE.line1);
                    console.log(fetchedTLE.line2);
                }
            } else {
                // Use fallback TLE
                currentISSTLE = FALLBACK_ISS_TLE;
                isInitialized = true;
                
                // Development-only logging
                if (process.env.NODE_ENV === "development") {
                    console.log("ISS TLE fetch failed, using hardcoded fallback TLE");
                }
            }
        } catch (error) {
            // Use fallback TLE on any error
            currentISSTLE = FALLBACK_ISS_TLE;
            isInitialized = true;
            
            // Development-only logging
            if (process.env.NODE_ENV === "development") {
                console.log("ISS TLE fetch failed, using hardcoded fallback TLE");
            }
        }
    })();
    
    return initializationPromise;
}

/**
 * Get current ISS TLE
 * 
 * Returns the fetched TLE if available, otherwise returns fallback TLE.
 * 
 * @returns Current ISS TLE object
 */
export function getCurrentISSTLE(): ISSTLE {
    return currentISSTLE;
}

/**
 * Check if TLE has been initialized
 * 
 * @returns True if TLE has been initialized (fetched or fallback loaded)
 */
export function isISSTLEInitialized(): boolean {
    return isInitialized;
}

