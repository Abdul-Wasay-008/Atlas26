"use client";

import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { timeManager } from "@/app/core/TimeManager";
import { getISSPosition } from "@/app/astronomy/issOrbit";
import { getEarthOrbitPosition, getEarthToSunDirection } from "@/app/astronomy/earthOrbit";
import { isISSEclipsed } from "@/app/astronomy/eclipse";
import * as satellite from "satellite.js";
import { getCurrentISSTLE } from "@/app/services/tleService";
import { getGreenwichSiderealTime } from "@/app/astronomy/siderealTime";

/**
 * ISS Telemetry Hook
 * 
 * Provides live telemetry data for the ISS:
 * - Latitude/Longitude (degrees)
 * - Altitude (km)
 * - Velocity (km/s)
 * - Lighting state (SUNLIGHT | SHADOW)
 * 
 * Updates reactively when time changes, simulation speed changes, or time is scrubbed.
 * Throttled to avoid unnecessary re-renders.
 */

const EARTH_RADIUS_KM = 6371.0;
const EARTH_RADIUS_SCENE = 0.8;
const EARTH_ORBIT_RADIUS = 8.0;
const KM_TO_SCENE = EARTH_RADIUS_SCENE / EARTH_RADIUS_KM;
const SCENE_TO_KM = EARTH_RADIUS_KM / EARTH_RADIUS_SCENE;

// Throttle updates to avoid excessive re-renders
const UPDATE_THROTTLE_MS = 100; // Update at most every 100ms

export interface ISSTelemetry {
    latitude: number; // degrees
    longitude: number; // degrees
    altitudeKm: number; // kilometers
    speedKmS: number; // kilometers per second
    lightingState: "SUNLIGHT" | "SHADOW";
}

/**
 * Get ISS velocity from SGP4 propagation
 * 
 * Velocity is returned in km/s in ECI (Earth-Centered Inertial) coordinates.
 * The magnitude represents the orbital speed.
 */
function getISSVelocity(date: Date): THREE.Vector3 | null {
    try {
        const currentTLE = getCurrentISSTLE();
        const satrec = satellite.twoline2satrec(currentTLE.line1, currentTLE.line2);
        const positionAndVelocity = satellite.propagate(satrec, date);
        
        if (!positionAndVelocity || (positionAndVelocity as any).error) {
            return null;
        }

        const velocityEci = positionAndVelocity.velocity;
        if (!velocityEci) {
            return null;
        }
        
        return new THREE.Vector3(velocityEci.x, velocityEci.y, velocityEci.z);
    } catch (error) {
        if (process.env.NODE_ENV === "development") {
            console.warn("Error computing ISS velocity:", error);
        }
        return null;
    }
}

export function useISSTelemetry(): ISSTelemetry {
    const [telemetry, setTelemetry] = useState<ISSTelemetry>({
        latitude: 0,
        longitude: 0,
        altitudeKm: 400,
        speedKmS: 7.66, // Typical ISS orbital velocity
        lightingState: "SUNLIGHT",
    });

    const lastUpdateTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        let isMounted = true;

        const updateTelemetry = () => {
            if (!isMounted) return;

            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

            // Throttle updates
            if (timeSinceLastUpdate < UPDATE_THROTTLE_MS) {
                animationFrameRef.current = requestAnimationFrame(updateTelemetry);
                return;
            }

            try {
                const currentDate = timeManager.getCurrentDate();
                const currentSpeed = timeManager.getSpeedMultiplier();

                // Get ISS position using SGP4 propagation directly for accurate telemetry
                // This ensures we use the same calculation as the rendering
                const currentTLE = getCurrentISSTLE();
                const satrec = satellite.twoline2satrec(currentTLE.line1, currentTLE.line2);
                const positionAndVelocity = satellite.propagate(satrec, currentDate);
                
                if (positionAndVelocity && !(positionAndVelocity as any).error && positionAndVelocity.position) {
                    const positionEciKm = positionAndVelocity.position;
                    const gmst = getGreenwichSiderealTime(currentDate);
                    
                    // Convert ECI to geodetic coordinates using satellite.js built-in function
                    // This provides accurate lat/long/altitude matching N2YO
                    const geodetic = satellite.eciToGeodetic(positionEciKm, gmst);
                    
                    const latitude = satellite.degreesLat(geodetic.latitude);
                    const longitude = satellite.degreesLong(geodetic.longitude);
                    const altitudeKm = geodetic.height; // Height above Earth's surface in km
                    
                    // Get ISS velocity from SGP4 propagation
                    let speedKmS = 7.66; // Default ISS orbital velocity
                    if (positionAndVelocity.velocity) {
                        const velocityEci = positionAndVelocity.velocity;
                        speedKmS = Math.sqrt(
                            velocityEci.x * velocityEci.x +
                            velocityEci.y * velocityEci.y +
                            velocityEci.z * velocityEci.z
                        );
                    }

                    // Check lighting state (eclipse)
                    const issPositionScene = getISSPosition(currentDate);
                    const earthPosition = getEarthOrbitPosition(currentDate, EARTH_ORBIT_RADIUS);
                    const issWorldPos = new THREE.Vector3().addVectors(earthPosition, issPositionScene);
                    const sunDirection = getEarthToSunDirection(currentDate, EARTH_ORBIT_RADIUS);
                    
                    const eclipsed = isISSEclipsed({
                        earthPosition,
                        issPosition: issWorldPos,
                        sunDirection,
                        earthRadius: EARTH_RADIUS_SCENE,
                    });

                    const lightingState: "SUNLIGHT" | "SHADOW" = eclipsed ? "SHADOW" : "SUNLIGHT";

                    setTelemetry({
                        latitude,
                        longitude,
                        altitudeKm,
                        speedKmS,
                        lightingState,
                    });
                } else {
                    // Fallback if propagation fails
                    const issPositionScene = getISSPosition(currentDate);
                    const distanceKm = issPositionScene.length() * SCENE_TO_KM;
                    const altitudeKm = Math.max(0, distanceKm - EARTH_RADIUS_KM);
                    
                    setTelemetry({
                        latitude: 0,
                        longitude: 0,
                        altitudeKm,
                        speedKmS: 7.66,
                        lightingState: "SUNLIGHT",
                    });
                }

                lastUpdateTimeRef.current = now;
            } catch (error) {
                if (process.env.NODE_ENV === "development") {
                    console.warn("Error updating ISS telemetry:", error);
                }
            }

            // Schedule next update
            animationFrameRef.current = requestAnimationFrame(updateTelemetry);
        };

        // Start the update loop
        animationFrameRef.current = requestAnimationFrame(updateTelemetry);

        // Cleanup
        return () => {
            isMounted = false;
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []); // Empty deps - updates are handled by requestAnimationFrame and TimeManager

    return telemetry;
}

