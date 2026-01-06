"use client";

import { useRef, useMemo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { timeManager } from "@/app/core/TimeManager";
import { getEarthOrbitPosition, getEarthToSunDirection } from "@/app/astronomy/earthOrbit";
import { getISSWorldPosition, getISSPosition } from "@/app/astronomy/issOrbit";
import { isISSEclipsed } from "@/app/astronomy/eclipse";
import { useSelectionStore } from "@/app/store/selectionStore";

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
    const selectObject = useSelectionStore((state) => state.selectObject);
    const [hovered, setHovered] = useState(false);

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
                    // Store original color (ensure we have a color to work with)
                    if (clonedMat.color) {
                        colorMap.set(clonedMat, clonedMat.color.clone());
                    } else {
                        // If material doesn't have a color, set a default white and store it
                        clonedMat.color = new THREE.Color(1, 1, 1);
                        colorMap.set(clonedMat, new THREE.Color(1, 1, 1));
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
            
            // Debug: Log eclipse state periodically to verify detection
            const debugInterval = 5000; // Every 5 seconds
            const now = Date.now();
            if (!(window as any).__issEclipseDebugLastLog || now - (window as any).__issEclipseDebugLastLog > debugInterval) {
                const earthToISS = new THREE.Vector3().subVectors(issWorldPos, earthPosition);
                const dotProduct = earthToISS.dot(sunDirection);
                console.log(`ISS Eclipse Debug: eclipsed=${eclipsed}, dotProduct=${dotProduct.toFixed(3)}, distanceFromEarth=${earthToISS.length().toFixed(3)}`);
                (window as any).__issEclipseDebugLastLog = now;
            }
        }

        // Update ISS position in world coordinates
        // Add visual offset to ensure ISS doesn't appear stuck in Earth
        // This is purely visual and doesn't affect orbital physics calculations
        if (groupRef.current) {
            const issRelativeToEarth = getISSPosition(currentDate);
            const distanceFromEarthCenter = issRelativeToEarth.length();
            const earthRadius = EARTH_RADIUS_SCENE;
            
            // Always apply a visual offset to ensure ISS is clearly above Earth's surface
            // The ISS model geometry might extend inward, so we push it outward visually
            if (distanceFromEarthCenter > 0) {
                const direction = issRelativeToEarth.clone().normalize();
                // Apply larger visual offset (~400km) to ensure clear separation
                // This compensates for model geometry and ensures visual clarity
                const visualOffset = direction.multiplyScalar(0.05); // ~400km visual spacing
                // Add the Earth-relative offset to the world position
                const adjustedPosition = new THREE.Vector3().addVectors(issWorldPos, visualOffset);
                groupRef.current.position.copy(adjustedPosition);
            } else {
                groupRef.current.position.copy(issWorldPos);
            }
        }

        // 🎯 Smooth hover scaling (similar to Earth, Moon, Sun)
        if (groupRef.current) {
            // Initialize scale if not set
            if (groupRef.current.scale.x === 1 && groupRef.current.scale.y === 1 && groupRef.current.scale.z === 1) {
                groupRef.current.scale.set(ISS_SCALE, ISS_SCALE, ISS_SCALE);
            }
            
            const targetScale = hovered ? ISS_SCALE * 1.08 : ISS_SCALE;
            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }

        // 🌑 Apply visual dimming when eclipsed
        clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                const materials = Array.isArray(child.material) 
                    ? child.material 
                    : [child.material];
                
                materials.forEach((mat) => {
                    // Handle all material types that have color property
                    if (mat && 'color' in mat && mat.color instanceof THREE.Color) {
                        // Get original color (must exist since we stored it during clone)
                        const originalColor = materialOriginalColors.current.get(mat);
                        
                        if (originalColor) {
                            if (eclipsed) {
                                // Dim the ISS slightly when in Earth's shadow (night region)
                                // Not too dark - just enough to show it's in shadow
                                // Restore from original first, then dim moderately
                                mat.color.copy(originalColor).multiplyScalar(0.65); // Slightly darker, but still visible
                            } else {
                                // Fully restore to original brightness when in sunlight
                                mat.color.copy(originalColor);
                            }
                            
                            // Reset emissive properties
                            if ('emissive' in mat && mat.emissive instanceof THREE.Color) {
                                mat.emissive.setScalar(0);
                            }
                            if ('emissiveIntensity' in mat) {
                                (mat as any).emissiveIntensity = 0;
                            }
                        }
                    }
                });
            }
        });
    });

    // 🔍 Selection handler
    const handleClick = useCallback(() => {
        selectObject("iss");
    }, [selectObject]);

    return (
        <group 
            ref={groupRef} 
            onClick={handleClick}
            onPointerOver={() => {
                setHovered(true);
                document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
                setHovered(false);
                document.body.style.cursor = "default";
            }}
        >
            <primitive object={clonedScene} />
        </group>
    );
}

