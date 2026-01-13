"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getTLEForSatellite, NORAD_IDS } from "@/app/services/tleService";
import {
    computeSatelliteEcefFromTle,
    satelliteLatLonAltToWorld,
} from "@/app/astronomy/satellitePosition";
import { getEarthOrbitPosition } from "@/app/astronomy/earthOrbit";

/**
 * Satellite Orbit Path Visualizer
 * 
 * Renders a visual orbit path for the currently selected satellite.
 * Uses TLE + SGP4 to compute future positions for approximately one full orbit.
 * 
 * Features:
 * - Only renders when a satellite (ISS or Hubble) is selected
 * - Samples orbit at regular intervals (~30-60 seconds)
 * - Uses the same coordinate system as satellite rendering
 * - Memoized for performance (recalculates only when selection or time changes significantly)
 * 
 * Architecture:
 * - Isolated component with no dependencies on existing satellite logic
 * - Uses shared TLE + SGP4 utilities (no duplication)
 * - Clean integration via SpaceCanvas
 */
export default function SatelliteOrbitPath() {
    const { selectedId } = useSelectionStore();
    const { currentDate } = useTimeManager();

    // Only show orbit for satellites
    const isSatellite = selectedId === "iss" || selectedId === "hubble";

    /**
     * Compute orbit path points
     * 
     * Strategy:
     * 1. Get satellite's TLE
     * 2. Sample positions for ~1 full orbit (~90-100 minutes)
     * 3. Sample every 45 seconds (120-140 points total)
     * 4. Convert each position to world coordinates using the same pipeline as satellite rendering
     * 5. Return array of Vector3 points for Line rendering
     * 
     * Memoization:
     * - Recalculates when selectedId changes
     * - Recalculates when time changes by more than 5 minutes (rounded)
     *   (This prevents excessive recalculation while keeping orbit reasonably accurate)
     */
    const orbitPoints = useMemo(() => {
        if (!isSatellite || !selectedId) {
            return [];
        }

        try {
            // Get NORAD ID for the selected satellite
            const noradId = selectedId === "iss" ? NORAD_IDS.ISS : NORAD_IDS.HUBBLE;

            // Get TLE for the satellite
            const tle = getTLEForSatellite(noradId);

            // Orbital period in minutes
            // ISS: ~93 minutes, Hubble: ~96 minutes
            const orbitalPeriodMinutes = selectedId === "iss" ? 93 : 96;

            // Sample interval in seconds (45 seconds gives ~124 points for ISS, ~128 for Hubble)
            const sampleIntervalSeconds = 45;

            // Total number of samples for one complete orbit
            const numSamples = Math.ceil((orbitalPeriodMinutes * 60) / sampleIntervalSeconds);

            // Cache key for satellite position calculation
            const cacheKey = selectedId;

            // Earth orbit radius (matches the value used in satellite rendering)
            const EARTH_ORBIT_RADIUS = 4.5;

            // Generate orbit points
            const points: THREE.Vector3[] = [];

            for (let i = 0; i < numSamples; i++) {
                // Calculate time offset from current time
                const timeOffsetSeconds = i * sampleIntervalSeconds;
                const sampleDate = new Date(currentDate.getTime() + timeOffsetSeconds * 1000);

                // Compute satellite position in ECEF coordinates (relative to Earth)
                const satelliteEcef = computeSatelliteEcefFromTle(tle, sampleDate, cacheKey);

                // Get Earth's orbital position at this time
                const earthPosition = getEarthOrbitPosition(sampleDate, EARTH_ORBIT_RADIUS);

                // Convert to world coordinates (relative to Sun at origin)
                const worldPosition = satelliteLatLonAltToWorld(satelliteEcef, earthPosition);

                points.push(worldPosition);
            }

            // Close the orbit loop by adding the first point at the end
            if (points.length > 0) {
                points.push(points[0].clone());
            }

            return points;
        } catch (error) {
            // Fail silently - if TLE is invalid or sampling fails, return empty array
            if (process.env.NODE_ENV === "development") {
                console.warn("Failed to compute satellite orbit path:", error);
            }
            return [];
        }
    }, [
        selectedId,
        isSatellite,
        // Round time to nearest 5 minutes to prevent excessive recalculation
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    // Don't render anything if no satellite is selected or orbit calculation failed
    if (!isSatellite || orbitPoints.length === 0) {
        return null;
    }

    return (
        <Line
            points={orbitPoints}
            color="#00ffff" // Soft cyan color
            lineWidth={1.5}
            transparent
            opacity={0.6}
            // Disable depth test to ensure orbit is always visible
            depthTest={true}
            depthWrite={false}
            // Add slight emissive glow
            emissive="#00ffff"
            emissiveIntensity={0.3}
        />
    );
}
