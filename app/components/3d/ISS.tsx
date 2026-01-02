"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { timeManager } from "@/app/core/TimeManager";
import { getEarthOrbitPosition } from "@/app/astronomy/earthOrbit";
import { getISSWorldPosition } from "@/app/astronomy/issOrbit";

/**
 * ISS Component
 * 
 * Loads and renders the International Space Station 3D model.
 * Position is calculated using real TLE data and SGP4 propagation.
 * Fully driven by TimeManager for time-based orbital motion.
 */
export default function ISS() {
    const groupRef = useRef<THREE.Group>(null);

    // 🚀 Load ISS GLB model
    const { scene } = useGLTF("/models/iss.glb");

    // 🚀 Clone the scene once (useMemo to avoid recreating on every render)
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    // 🚀 ISS scale factor
    // Earth radius in scene: ~0.8 units
    // Real ISS size: ~109m (0.109 km)
    // Real Earth radius: 6371 km
    // Physically accurate scale: (0.109 / 6371) * 0.8 ≈ 0.0000137
    // For visual appeal while maintaining realism, using a scale that makes
    // the ISS clearly visible but still appropriately small relative to Earth
    const ISS_SCALE = 0.005;

    // 🌍 Earth's orbital radius (same as in Earth.tsx)
    const EARTH_ORBIT_RADIUS = 4.5;

    // 🚀 Update ISS position each frame based on TimeManager
    useFrame(() => {
        // Get current date from TimeManager (single source of truth)
        const currentDate = timeManager.getCurrentDate();

        // Get Earth's position around Sun (using same astronomy module as Earth)
        const earthPosition = getEarthOrbitPosition(currentDate, EARTH_ORBIT_RADIUS);

        // 🚀 Get astronomically accurate ISS position (using TLE + SGP4)
        const issWorldPos = getISSWorldPosition(currentDate, earthPosition);

        // Update ISS position in world coordinates
        if (groupRef.current) {
            groupRef.current.position.copy(issWorldPos);
        }
    });

    return (
        <group ref={groupRef} scale={[ISS_SCALE, ISS_SCALE, ISS_SCALE]}>
            <primitive object={clonedScene} />
        </group>
    );
}

