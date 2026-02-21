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
import { getSatelliteOrbitColor } from "@/app/data/satelliteOrbitColors";

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
     * Compute smooth orbit path points
     * 
     * Strategy:
     * 1. Get satellite's TLE
     * 2. Sample positions for ~1 full orbit (~90-100 minutes) at high resolution
     * 3. Sample every 10 seconds (~540-600 points for raw samples)
     * 4. Convert each position to world coordinates using the same pipeline as satellite rendering
     * 5. Create a smooth Catmull-Rom curve from the sampled points
     * 6. Generate dense interpolated points (1000 points) from the curve for smooth rendering
     * 
     * This approach eliminates visible kinks by:
     * - Higher sampling resolution (more accurate representation)
     * - Curve interpolation (smooth transitions between samples)
     * - Dense final point set (visually continuous line)
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

            // Convert orbital period to seconds
            const orbitalPeriodSeconds = orbitalPeriodMinutes * 60;

            // Increased sampling resolution: sample every 10 seconds
            // This gives ~540-600 raw samples per orbit (much higher than before)
            const sampleIntervalSeconds = 10;

            // Total number of samples for one complete orbit
            const numSamples = Math.ceil(orbitalPeriodSeconds / sampleIntervalSeconds);

            // Cache key for satellite position calculation
            const cacheKey = selectedId;

            // Earth orbit radius (matches the value used in satellite rendering)
            const EARTH_ORBIT_RADIUS = 4.8;

            // Sample symmetrically around current time to avoid seam near satellite
            // Sampling window: [-halfPeriod, +halfPeriod]
            // This places the loop closure on the opposite side of the orbit
            const halfPeriod = orbitalPeriodSeconds / 2;

            // Generate raw sampled orbit points
            const rawPoints: THREE.Vector3[] = [];

            for (let i = 0; i < numSamples; i++) {
                // Calculate time offset from current time, centered symmetrically
                // Maps i from [0, numSamples-1] to [-halfPeriod, +halfPeriod]
                const timeOffsetSeconds = -halfPeriod + (i * orbitalPeriodSeconds) / numSamples;
                const sampleDate = new Date(currentDate.getTime() + timeOffsetSeconds * 1000);

                // Compute satellite position in ECEF coordinates (relative to Earth)
                const satelliteEcef = computeSatelliteEcefFromTle(tle, sampleDate, cacheKey);

                // Get Earth's orbital position at this time
                const earthPosition = getEarthOrbitPosition(sampleDate, EARTH_ORBIT_RADIUS);

                // Convert to world coordinates (relative to Sun at origin)
                const worldPosition = satelliteLatLonAltToWorld(satelliteEcef, earthPosition);

                rawPoints.push(worldPosition);
            }

            // Need at least 4 points for Catmull-Rom curve
            if (rawPoints.length < 4) {
                return [];
            }

            // Create a smooth Catmull-Rom spline curve from the sampled points
            // Catmull-Rom creates smooth curves that pass through all control points
            // 
            // Parameters:
            // - rawPoints: control points (no duplication needed)
            // - true: closed curve (handles loop closure automatically)
            // - "centripetal": prevents overshoot and sharp curvature at joins
            // 
            // Using centripetal mode eliminates tangent discontinuity at the loop closure
            const curve = new THREE.CatmullRomCurve3(rawPoints, true, "centripetal");

            // Generate dense interpolated points from the curve for smooth rendering
            // 1000 points provides excellent visual smoothness
            const smoothPoints = curve.getPoints(1000);

            return smoothPoints;
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

    // Get satellite-specific orbit color from centralized config
    const orbitColor = getSatelliteOrbitColor(selectedId);

    return (
        <Line
            points={orbitPoints}
            color={orbitColor}
            lineWidth={1.5}
            transparent
            opacity={0.6}
            // Disable depth test to ensure orbit is always visible
            depthTest={true}
            depthWrite={false}
            // Add slight emissive glow using the same color
            emissive={orbitColor}
            emissiveIntensity={0.3}
        />
    );
}
