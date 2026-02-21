"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { timeManager } from "@/app/core/TimeManager";
import { getEarthOrbitPosition, getEarthToSunDirection } from "@/app/astronomy/earthOrbit";

/**
 * SunLight Component
 * 
 * Dynamic directional light that follows Earth-Sun geometry.
 * Light direction is computed from Earth→Sun vector and updated each frame.
 * This ensures lighting is world-space and NOT affected by camera movement.
 * 
 * The light is positioned far along the Earth→Sun direction vector,
 * ensuring correct lighting for Earth, Moon, and ISS.
 */
export default function SunLight() {
    const lightRef = useRef<THREE.DirectionalLight>(null);
    
    // Earth's orbital radius (same as in Earth.tsx)
    const EARTH_ORBIT_RADIUS = 8.0;
    
    // Distance to position the light (far enough to be effectively directional)
    const LIGHT_DISTANCE = 100;

    useFrame(() => {
        if (!lightRef.current) return;

        // Get current date from TimeManager (single source of truth)
        const currentDate = timeManager.getCurrentDate();

        // Get Earth's position around Sun
        const earthPosition = getEarthOrbitPosition(currentDate, EARTH_ORBIT_RADIUS);

        // Get Sun direction: FROM Earth TO Sun (in ECEF coordinates)
        const earthToSunDir = getEarthToSunDirection(currentDate, EARTH_ORBIT_RADIUS);

        // For DirectionalLight, the direction is calculated as: target - position
        // We want light coming FROM Sun TO Earth (direction light is coming from)
        // Convert earthToSunDir to sunToEarthDir by negating
        const sunToEarthDir = earthToSunDir.clone().negate();
        const lightDirection = sunToEarthDir;

        // Position the light far along the direction (doesn't matter where, as long as it's far)
        // DirectionalLight direction is independent of position, but we set it for consistency
        const lightPosition = new THREE.Vector3()
            .copy(earthPosition)
            .add(lightDirection.clone().multiplyScalar(LIGHT_DISTANCE));

        // Update light position
        lightRef.current.position.copy(lightPosition);

        // Set target such that direction = target - position = lightDirection
        // target = position + lightDirection
        const targetPosition = new THREE.Vector3()
            .copy(lightPosition)
            .add(lightDirection);
        
        lightRef.current.target.position.copy(targetPosition);
        
        // CRITICAL: Update matrices to ensure world-space calculation
        lightRef.current.updateMatrixWorld();
        lightRef.current.target.updateMatrixWorld();
    });

    return (
        <directionalLight
            ref={lightRef}
            intensity={1.2}
            color="#ffffff"
            castShadow={false}
        />
    );
}

