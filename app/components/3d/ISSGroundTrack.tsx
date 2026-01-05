"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { timeManager } from "@/app/core/TimeManager";
import { getISSPosition } from "@/app/astronomy/issOrbit";
import { getEarthOrbitPosition } from "@/app/astronomy/earthOrbit";
import { eciToLatLong, latLongToSurfacePosition } from "@/app/astronomy/coordinateUtils";

/**
 * ISS Ground Track Component
 * 
 * Visualizes the ISS ground track on Earth's surface, showing:
 * - Past path (last 90 minutes)
 * - Future path (next 90 minutes)
 * 
 * The track is projected onto Earth's surface and updates with TimeManager.
 */

// Configuration
const PAST_DURATION_MINUTES = 90; // Past track duration
const FUTURE_DURATION_MINUTES = 90; // Future track duration
const SAMPLE_INTERVAL_SECONDS = 60; // Sample every 60 seconds
const TRACK_ALTITUDE_OFFSET = 0.001; // Small offset above Earth surface to avoid z-fighting

// Colors
const PAST_TRACK_COLOR = new THREE.Color(0.3, 0.5, 0.8); // Dimmer blue
const FUTURE_TRACK_COLOR = new THREE.Color(0.5, 0.7, 1.0); // Brighter blue

export default function ISSGroundTrack() {
    const groupRef = useRef<THREE.Group>(null);
    const pastLineRef = useRef<THREE.Line>(null);
    const futureLineRef = useRef<THREE.Line>(null);
    const pastGeometryRef = useRef<THREE.BufferGeometry>(null);
    const futureGeometryRef = useRef<THREE.BufferGeometry>(null);
    
    // Track recomputation state
    const lastComputedTimeRef = useRef<number>(0);
    const lastSpeedRef = useRef<number>(1);
    const recomputeThreshold = 1000; // Recompute if time changed by more than 1 second

    /**
     * Sample ISS positions for ground track
     */
    const computeGroundTrack = useMemo(() => {
        return (currentDate: Date) => {
            const pastPoints: THREE.Vector3[] = [];
            const futurePoints: THREE.Vector3[] = [];

            // Sample past track
            const pastStartTime = new Date(currentDate.getTime() - PAST_DURATION_MINUTES * 60 * 1000);
            for (let t = pastStartTime.getTime(); t <= currentDate.getTime(); t += SAMPLE_INTERVAL_SECONDS * 1000) {
                const sampleDate = new Date(t);
                try {
                    const eciPosition = getISSPosition(sampleDate);
                    const { latitude, longitude } = eciToLatLong(eciPosition, sampleDate);
                    const surfacePosition = latLongToSurfacePosition(
                        latitude,
                        longitude,
                        TRACK_ALTITUDE_OFFSET
                    );
                    pastPoints.push(surfacePosition);
                } catch (error) {
                    if (process.env.NODE_ENV === "development") {
                        console.warn("Error computing past ground track point:", error);
                    }
                }
            }

            // Sample future track
            const futureEndTime = new Date(currentDate.getTime() + FUTURE_DURATION_MINUTES * 60 * 1000);
            for (let t = currentDate.getTime(); t <= futureEndTime.getTime(); t += SAMPLE_INTERVAL_SECONDS * 1000) {
                const sampleDate = new Date(t);
                try {
                    const eciPosition = getISSPosition(sampleDate);
                    const { latitude, longitude } = eciToLatLong(eciPosition, sampleDate);
                    const surfacePosition = latLongToSurfacePosition(
                        latitude,
                        longitude,
                        TRACK_ALTITUDE_OFFSET
                    );
                    futurePoints.push(surfacePosition);
                } catch (error) {
                    if (process.env.NODE_ENV === "development") {
                        console.warn("Error computing future ground track point:", error);
                    }
                }
            }

            // Debug logging (dev only)
            if (process.env.NODE_ENV === "development") {
                const now = Date.now();
                if (!(window as any).__issTrackDebugLastLog || now - (window as any).__issTrackDebugLastLog > 5000) {
                    console.log(`🛰️ ISS Ground Track: ${pastPoints.length} past points, ${futurePoints.length} future points`);
                    if (pastPoints.length > 0 && futurePoints.length > 0) {
                        const firstPast = pastPoints[0];
                        const lastFuture = futurePoints[futurePoints.length - 1];
                        console.log(`  First past: (${firstPast.x.toFixed(3)}, ${firstPast.y.toFixed(3)}, ${firstPast.z.toFixed(3)})`);
                        console.log(`  Last future: (${lastFuture.x.toFixed(3)}, ${lastFuture.y.toFixed(3)}, ${lastFuture.z.toFixed(3)})`);
                    }
                    (window as any).__issTrackDebugLastLog = now;
                }
            }

            return { pastPoints, futurePoints };
        };
    }, []);

    // Initialize geometries
    useEffect(() => {
        if (!pastGeometryRef.current || !futureGeometryRef.current) return;

        // Set initial empty geometries
        pastGeometryRef.current.setFromPoints([]);
        futureGeometryRef.current.setFromPoints([]);
    }, []);

    // Update ground track when time changes
    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const currentTime = currentDate.getTime();
        const currentSpeed = timeManager.getSpeedMultiplier();

        // Position the ground track at Earth's location
        if (groupRef.current) {
            const earthPosition = getEarthOrbitPosition(currentDate);
            groupRef.current.position.copy(earthPosition);
        }

        // Check if we need to recompute
        const timeDelta = Math.abs(currentTime - lastComputedTimeRef.current);
        const speedChanged = currentSpeed !== lastSpeedRef.current;

        if (timeDelta > recomputeThreshold || speedChanged || !pastGeometryRef.current || !futureGeometryRef.current) {
            // Recompute ground track
            const { pastPoints, futurePoints } = computeGroundTrack(currentDate);

            // Update past track geometry
            if (pastGeometryRef.current && pastPoints.length > 0) {
                pastGeometryRef.current.setFromPoints(pastPoints);
                pastGeometryRef.current.computeBoundingSphere();
            }

            // Update future track geometry
            if (futureGeometryRef.current && futurePoints.length > 0) {
                futureGeometryRef.current.setFromPoints(futurePoints);
                futureGeometryRef.current.computeBoundingSphere();
            }

            lastComputedTimeRef.current = currentTime;
            lastSpeedRef.current = currentSpeed;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Past track (dimmer) */}
            <line ref={pastLineRef}>
                <bufferGeometry ref={pastGeometryRef} />
                <lineBasicMaterial
                    color={PAST_TRACK_COLOR}
                    linewidth={2}
                    transparent
                    opacity={0.6}
                />
            </line>

            {/* Future track (brighter) */}
            <line ref={futureLineRef}>
                <bufferGeometry ref={futureGeometryRef} />
                <lineBasicMaterial
                    color={FUTURE_TRACK_COLOR}
                    linewidth={2}
                    transparent
                    opacity={0.9}
                />
            </line>
        </group>
    );
}

