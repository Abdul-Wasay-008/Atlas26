"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { timeManager } from "@/app/core/TimeManager";
import { getEarthOrbitPosition, getEarthToSunDirection } from "@/app/astronomy/earthOrbit";
import { getISSWorldPosition } from "@/app/astronomy/issOrbit";
import { isISSEclipsed } from "@/app/astronomy/eclipse";

/**
 * ISS Component
 * 
 * Loads and renders the International Space Station 3D model.
 * Position is calculated using real TLE data and SGP4 propagation.
 * Fully driven by TimeManager for time-based orbital motion.
 * Includes Earth shadow (eclipse) detection and visual dimming.
 */
export default function ISS() {
    const groupRef = useRef<THREE.Group>(null);
    const previousEclipsedState = useRef(false);

    // 🚀 Load ISS GLB model
    const { scene } = useGLTF("/models/iss.glb");

    // 🚀 Clone the scene once (useMemo to avoid recreating on every render)
    // Store original material colors for proper restoration during eclipse
    const materialOriginalColors = useRef<Map<THREE.Material, THREE.Color>>(new Map());
    
    const clonedScene = useMemo(() => {
        const cloned = scene.clone();
        const colorMap = new Map<THREE.Material, THREE.Color>();
        
        // Traverse and clone materials, storing original colors
        cloned.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                // Ensure material is an array for consistent handling
                const materials = Array.isArray(child.material) 
                    ? child.material 
                    : [child.material];
                
                // Clone materials and store original colors
                const clonedMaterials = materials.map((mat) => {
                    const clonedMat = mat.clone();
                    // Store original color
                    if (clonedMat.color) {
                        colorMap.set(clonedMat, clonedMat.color.clone());
                    }
                    return clonedMat;
                });
                
                child.material = clonedMaterials.length === 1 ? clonedMaterials[0] : clonedMaterials;
            }
        });
        
        materialOriginalColors.current = colorMap;
        return cloned;
    }, [scene]);

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
    
    // 🌍 Earth's radius in scene units
    const EARTH_RADIUS_SCENE = 0.8;

    // 🚀 Update ISS position and eclipse state each frame based on TimeManager
    useFrame(() => {
        // Get current date from TimeManager (single source of truth)
        const currentDate = timeManager.getCurrentDate();

        // Get Earth's position around Sun (using same astronomy module as Earth)
        const earthPosition = getEarthOrbitPosition(currentDate, EARTH_ORBIT_RADIUS);

        // 🚀 Get astronomically accurate ISS position (using TLE + SGP4)
        const issWorldPos = getISSWorldPosition(currentDate, earthPosition);

        // Get Sun direction (Earth → Sun)
        const sunDirection = getEarthToSunDirection(currentDate, EARTH_ORBIT_RADIUS);

        // 🌑 Check if ISS is in Earth's shadow
        const eclipsed = isISSEclipsed({
            earthPosition,
            issPosition: issWorldPos,
            sunDirection,
            earthRadius: EARTH_RADIUS_SCENE
        });

        // Log eclipse state changes (dev only)
        if (process.env.NODE_ENV === "development") {
            if (eclipsed !== previousEclipsedState.current) {
                if (eclipsed) {
                    console.log("ISS entered Earth's shadow");
                } else {
                    console.log("ISS exited Earth's shadow");
                }
                previousEclipsedState.current = eclipsed;
            }
        }

        // Update ISS position in world coordinates
        if (groupRef.current) {
            groupRef.current.position.copy(issWorldPos);
        }

        // 🌑 Apply visual dimming when eclipsed
        clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                const materials = Array.isArray(child.material) 
                    ? child.material 
                    : [child.material];
                
                materials.forEach((mat) => {
                    if (mat instanceof THREE.MeshStandardMaterial || 
                        mat instanceof THREE.MeshPhysicalMaterial ||
                        mat instanceof THREE.MeshPhongMaterial ||
                        mat instanceof THREE.MeshBasicMaterial) {
                        // Get original color
                        const originalColor = materialOriginalColors.current.get(mat);
                        
                        // Always restore from original first to prevent color accumulation
                        if (originalColor) {
                            mat.color.copy(originalColor);
                        }
                        
                        if (eclipsed) {
                            // Dim the ISS significantly when in shadow
                            mat.emissive.setScalar(0);
                            if ('emissiveIntensity' in mat) {
                                mat.emissiveIntensity = 0;
                            }
                            // Reduce overall brightness (multiply from restored original)
                            mat.color.multiplyScalar(0.15); // Very dark, but still visible
                        } else {
                            // Normal lighting (already restored above)
                            mat.emissive.setScalar(0);
                            if ('emissiveIntensity' in mat) {
                                mat.emissiveIntensity = 0;
                            }
                        }
                    }
                });
            }
        });
    });

    return (
        <group ref={groupRef} scale={[ISS_SCALE, ISS_SCALE, ISS_SCALE]}>
            <primitive object={clonedScene} />
        </group>
    );
}

