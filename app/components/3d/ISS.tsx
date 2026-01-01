"use client";

import { useRef, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * ISS Component
 * 
 * Loads and renders the International Space Station 3D model.
 * Position is TEMPORARY for visual validation only.
 * No orbital mechanics or time-based logic yet.
 */
export default function ISS() {
    const groupRef = useRef<THREE.Group>(null);

    // 🚀 Load ISS GLB model
    const { scene } = useGLTF("/models/iss.glb");

    // 🚀 Clone the scene once (useMemo to avoid recreating on every render)
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    // 🚀 ISS scale factor (TEMPORARILY LARGE for visibility testing)
    // Earth radius in scene: ~0.8 units
    // Real ISS size: ~109m (0.109 km)
    // Real Earth radius: 6371 km
    // Physically accurate scale: (0.109 / 6371) * 0.8 ≈ 0.0000137
    // TEMPORARY: Using 0.01 for testing visibility (will be adjusted to realistic size later)
    const ISS_SCALE = 0.01;

    // 🚀 TEMPORARY position: Place ISS near Earth for visual validation
    // This will be replaced with orbital calculations later
    // Earth orbits at radius 4.5 from Sun (at origin)
    // Earth radius in scene: ~0.8 units
    // ISS should be ~1.0-1.2 units away from Earth's center (above Earth's surface)
    // Position: Offset from Earth's typical position to place ISS above Earth
    // Using a position that's clearly outside Earth (Earth is ~4.5 units from origin)
    // ISS at ~5.7 units puts it ~1.2 units from Earth's center, above Earth's surface
    const TEMP_POSITION = new THREE.Vector3(5.7, 0.5, 0);

    return (
        <group ref={groupRef} position={TEMP_POSITION} scale={[ISS_SCALE, ISS_SCALE, ISS_SCALE]}>
            <primitive object={clonedScene} />
        </group>
    );
}

