"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { timeManager } from "@/app/core/TimeManager";
import { getISSPosition } from "@/app/astronomy/issOrbit";
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
const EARTH_RADIUS_SCENE = 0.8;
const TRACK_ALTITUDE_OFFSET = EARTH_RADIUS_SCENE * 0.01; // 1% above Earth surface to avoid z-fighting

// Colors - High contrast for visibility
const PAST_TRACK_COLOR = new THREE.Color(0.0, 1.0, 1.0); // Cyan (high contrast)
const FUTURE_TRACK_COLOR = new THREE.Color(1.0, 0.0, 1.0); // Magenta (high contrast)

export default function ISSGroundTrack() {
    const groupRef = useRef<THREE.Group>(null);
    const pastLineRef = useRef<THREE.Line>(null);
    const futureLineRef = useRef<THREE.Line>(null);
    const pastGeometryRef = useRef<THREE.BufferGeometry>(null);
    const futureGeometryRef = useRef<THREE.BufferGeometry>(null);
    
    // Track recomputation state
    const lastComputedTimeRef = useRef<number>(0);
    const lastSpeedRef = useRef<number>(1);
    const hasInitializedRef = useRef<boolean>(false);
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

            // Debug logging (dev only) - Always log to verify points are generated
            if (process.env.NODE_ENV === "development") {
                console.log(`🛰️ ISS Ground Track: ${pastPoints.length} past points, ${futurePoints.length} future points`);
                if (pastPoints.length > 0 && futurePoints.length > 0) {
                    const firstPast = pastPoints[0];
                    const lastFuture = futurePoints[futurePoints.length - 1];
                    console.log(`  First past: (${firstPast.x.toFixed(3)}, ${firstPast.y.toFixed(3)}, ${firstPast.z.toFixed(3)})`);
                    console.log(`  Last future: (${lastFuture.x.toFixed(3)}, ${lastFuture.y.toFixed(3)}, ${lastFuture.z.toFixed(3)})`);
                } else {
                    console.warn("⚠️ ISS Ground Track: No points generated!");
                }
            }

            return { pastPoints, futurePoints };
        };
    }, []);

    // Initialize geometries - ensure they exist
    useEffect(() => {
        // Create geometries if they don't exist
        if (!pastGeometryRef.current) {
            pastGeometryRef.current = new THREE.BufferGeometry();
        }
        if (!futureGeometryRef.current) {
            futureGeometryRef.current = new THREE.BufferGeometry();
        }

        // Set initial empty geometries
        pastGeometryRef.current.setFromPoints([]);
        futureGeometryRef.current.setFromPoints([]);

        // Cleanup on unmount
        return () => {
            if (pastGeometryRef.current) {
                pastGeometryRef.current.dispose();
            }
            if (futureGeometryRef.current) {
                futureGeometryRef.current.dispose();
            }
        };
    }, []);

    // Update ground track when time changes
    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const currentTime = currentDate.getTime();
        const currentSpeed = timeManager.getSpeedMultiplier();

        // Ground track does NOT rotate manually - it inherits Earth's rotation
        // from the parent groupRef in Earth.tsx. This ensures perfect alignment
        // with Earth's surface and the ISS position.

        // Check if we need to recompute
        const timeDelta = Math.abs(currentTime - lastComputedTimeRef.current);
        const speedChanged = currentSpeed !== lastSpeedRef.current;
        const needsInitialization = !hasInitializedRef.current;

        if (needsInitialization || timeDelta > recomputeThreshold || speedChanged || !pastGeometryRef.current || !futureGeometryRef.current) {
            // Recompute ground track
            const { pastPoints, futurePoints } = computeGroundTrack(currentDate);

            // Update past track geometry - dispose and recreate to avoid buffer size issues
            if (pastGeometryRef.current) {
                pastGeometryRef.current.dispose();
            }
            pastGeometryRef.current = new THREE.BufferGeometry();
            if (pastPoints.length > 0) {
                pastGeometryRef.current.setFromPoints(pastPoints);
                pastGeometryRef.current.computeBoundingSphere();
            }
            // Update the line's geometry reference
            if (pastLineRef.current) {
                pastLineRef.current.geometry = pastGeometryRef.current;
            }

            // Update future track geometry - dispose and recreate to avoid buffer size issues
            if (futureGeometryRef.current) {
                futureGeometryRef.current.dispose();
            }
            futureGeometryRef.current = new THREE.BufferGeometry();
            if (futurePoints.length > 0) {
                futureGeometryRef.current.setFromPoints(futurePoints);
                futureGeometryRef.current.computeBoundingSphere();
            }
            // Update the line's geometry reference
            if (futureLineRef.current) {
                futureLineRef.current.geometry = futureGeometryRef.current;
            }

            lastComputedTimeRef.current = currentTime;
            lastSpeedRef.current = currentSpeed;
            hasInitializedRef.current = true;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Past track (cyan) - Earth-fixed coordinates, inherits Earth's rotation */}
            <line ref={pastLineRef}>
                <bufferGeometry ref={pastGeometryRef} attach="geometry" />
                <lineBasicMaterial
                    color={PAST_TRACK_COLOR}
                    depthTest={true}
                    depthWrite={false}
                />
            </line>

            {/* Future track (magenta) - Earth-fixed coordinates, inherits Earth's rotation */}
            <line ref={futureLineRef}>
                <bufferGeometry ref={futureGeometryRef} attach="geometry" />
                <lineBasicMaterial
                    color={FUTURE_TRACK_COLOR}
                    depthTest={true}
                    depthWrite={false}
                />
            </line>
        </group>
    );
}

