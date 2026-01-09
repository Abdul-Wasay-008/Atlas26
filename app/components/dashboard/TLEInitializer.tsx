"use client";

import { useEffect } from "react";
import { initializeTLE, NORAD_IDS } from "@/app/services/tleService";

/**
 * TLE Initializer Component
 * 
 * Initializes TLE data for all satellites by fetching from Celestrak at app startup.
 * This component runs once when mounted and does not render anything.
 */
export default function TLEInitializer() {
    useEffect(() => {
        // Initialize TLE for all satellites once at app startup
        // This fetch happens asynchronously and doesn't block rendering
        Promise.all([
            initializeTLE(NORAD_IDS.ISS),
            initializeTLE(NORAD_IDS.HUBBLE),
        ]).catch((error) => {
            // Error handling is done inside initializeTLE, but we catch here
            // to prevent unhandled promise rejection
            if (process.env.NODE_ENV === "development") {
                console.warn("TLE initialization error:", error);
            }
        });
    }, []); // Empty dependency array ensures this runs only once

    // This component doesn't render anything
    return null;
}




