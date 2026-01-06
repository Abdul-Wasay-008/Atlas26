"use client";

import { useEffect } from "react";
import { initializeISSTLE } from "@/app/services/tleService";

/**
 * TLE Initializer Component
 * 
 * Initializes ISS TLE data by fetching from Celestrak at app startup.
 * This component runs once when mounted and does not render anything.
 */
export default function TLEInitializer() {
    useEffect(() => {
        // Initialize ISS TLE once at app startup
        // This fetch happens asynchronously and doesn't block rendering
        initializeISSTLE().catch((error) => {
            // Error handling is done inside initializeISSTLE, but we catch here
            // to prevent unhandled promise rejection
            if (process.env.NODE_ENV === "development") {
                console.warn("TLE initialization error:", error);
            }
        });
    }, []); // Empty dependency array ensures this runs only once

    // This component doesn't render anything
    return null;
}




