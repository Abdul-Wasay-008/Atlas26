"use client";

import { useRef, useMemo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { timeManager } from "@/app/core/TimeManager";
import { getEarthOrbitPosition, getEarthToSunDirection } from "@/app/astronomy/earthOrbit";
import { getHubbleWorldPosition, getHubblePosition } from "@/app/astronomy/hubbleOrbit";
import { isISSEclipsed } from "@/app/astronomy/eclipse";
import { useSelectionStore } from "@/app/store/selectionStore";
import { useHubbleTelemetry } from "@/app/hooks/useHubbleTelemetry";
import { useReverseGeocode } from "@/app/hooks/useReverseGeocode";

/**
 * Hubble Space Telescope Component
 * 
 * Loads and renders the Hubble Space Telescope 3D model.
 * Position is calculated using real TLE data and SGP4 propagation.
 * Fully driven by TimeManager for time-based orbital motion.
 * Includes Earth shadow (eclipse) detection and visual dimming.
 */
export default function Hubble() {
    const groupRef = useRef<THREE.Group>(null);
    const previousEclipsedState = useRef(false);
    const selectObject = useSelectionStore((state) => state.selectObject);
    const selectedId = useSelectionStore((state) => state.selectedId);
    const [hovered, setHovered] = useState(false);
    const isSelected = selectedId === "hubble";
    const telemetry = useHubbleTelemetry();
    const { location, loading: locationLoading } = useReverseGeocode(
        telemetry.latitude,
        telemetry.longitude,
        hovered && !isSelected // Only fetch when hovering
    );

    // 🔭 Load Hubble GLB model
    const { scene } = useGLTF("/models/hubble.glb");

    // 🔭 Clone the scene once (useMemo to avoid recreating on every render)
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

    // 🔭 Hubble scale factor
    // Earth radius in scene: ~0.8 units
    // Real Hubble size: ~13.2m length, ~4.2m diameter
    // Real Earth radius: 6371 km
    // Physically accurate scale: (0.0132 / 6371) * 0.8 ≈ 0.00000166
    // Adjusted to match ISS visual size (Hubble GLB model is larger in native scale than ISS model)
    // Reduced scale to match ISS visual appearance
    const HUBBLE_SCALE = 0.0004;

    // 🌍 Earth's orbital radius (same as in Earth.tsx)
    const EARTH_ORBIT_RADIUS = 4.5;

    // 🌍 Earth's radius in scene units
    const EARTH_RADIUS_SCENE = 0.8;

    // 🔭 Update Hubble position and eclipse state each frame based on TimeManager
    useFrame(() => {
        // Get current date from TimeManager (single source of truth)
        const currentDate = timeManager.getCurrentDate();

        // Get Earth's position around Sun (using same astronomy module as Earth)
        const earthPosition = getEarthOrbitPosition(currentDate, EARTH_ORBIT_RADIUS);

        // 🔭 Get astronomically accurate Hubble position (using TLE + SGP4)
        const hubbleWorldPos = getHubbleWorldPosition(currentDate, earthPosition);

        // Get Sun direction (Earth → Sun)
        const sunDirection = getEarthToSunDirection(currentDate, EARTH_ORBIT_RADIUS);

        // 🌑 Check if Hubble is in Earth's shadow
        const eclipsed = isISSEclipsed({
            earthPosition,
            issPosition: hubbleWorldPos, // Reuse same function (works for any satellite)
            sunDirection,
            earthRadius: EARTH_RADIUS_SCENE
        });

        // Log eclipse state changes (dev only)
        if (process.env.NODE_ENV === "development") {
            if (eclipsed !== previousEclipsedState.current) {
                if (eclipsed) {
                    console.log("Hubble entered Earth's shadow");
                } else {
                    console.log("Hubble exited Earth's shadow");
                }
                previousEclipsedState.current = eclipsed;
            }

            // Debug: Log Hubble state periodically to verify position
            const debugInterval = 10000; // Every 10 seconds
            const now = Date.now();
            if (!(window as any).__hubbleDebugLastLog || now - (window as any).__hubbleDebugLastLog > debugInterval) {
                const hubbleRelativeToEarth = getHubblePosition(currentDate);
                const distanceFromEarthCenter = hubbleRelativeToEarth.length();
                console.log(`Hubble Debug: UTC=${currentDate.toISOString()}, distanceFromEarth=${distanceFromEarthCenter.toFixed(3)}, eclipsed=${eclipsed}`);
                (window as any).__hubbleDebugLastLog = now;
            }
        }

        // Update Hubble position in world coordinates
        // Add visual offset to ensure Hubble doesn't appear stuck in Earth
        if (groupRef.current) {
            const hubbleRelativeToEarth = getHubblePosition(currentDate);
            const distanceFromEarthCenter = hubbleRelativeToEarth.length();

            // Always apply a visual offset to ensure Hubble is clearly above Earth's surface
            if (distanceFromEarthCenter > 0) {
                const direction = hubbleRelativeToEarth.clone().normalize();
                // Apply visual offset (~547km) to ensure clear separation
                const visualOffset = direction.multiplyScalar(0.07); // ~547km visual spacing
                const adjustedPosition = new THREE.Vector3().addVectors(hubbleWorldPos, visualOffset);
                groupRef.current.position.copy(adjustedPosition);
            } else {
                groupRef.current.position.copy(hubbleWorldPos);
            }
        }

        // 🎯 Smooth hover and selection scaling
        if (groupRef.current) {
            // Initialize scale if not set
            if (groupRef.current.scale.x === 1 && groupRef.current.scale.y === 1 && groupRef.current.scale.z === 1) {
                groupRef.current.scale.set(HUBBLE_SCALE, HUBBLE_SCALE, HUBBLE_SCALE);
            }

            // Selection highlight: 1.05x scale, hover: 1.08x scale
            const baseScale = HUBBLE_SCALE;
            const selectionScale = isSelected ? baseScale * 1.05 : baseScale;
            const targetScale = hovered ? selectionScale * 1.08 : selectionScale;

            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }

        // 🌑 Apply visual dimming when eclipsed and selection highlight
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
                                // Dim the Hubble slightly when in Earth's shadow
                                mat.color.copy(originalColor).multiplyScalar(0.65);
                            } else {
                                // Fully restore to original brightness when in sunlight
                                mat.color.copy(originalColor);
                            }

                            // Selection highlight: subtle emissive glow
                            if ('emissive' in mat && mat.emissive instanceof THREE.Color) {
                                if (isSelected && !eclipsed) {
                                    // Subtle cyan glow when selected
                                    mat.emissive.copy(originalColor).multiplyScalar(0.15);
                                    mat.emissive.lerp(new THREE.Color(0x00ffff), 0.3);
                                } else {
                                    mat.emissive.setScalar(0);
                                }
                            }
                            if ('emissiveIntensity' in mat) {
                                (mat as any).emissiveIntensity = isSelected && !eclipsed ? 0.2 : 0;
                            }
                        }
                    }
                });
            }
        });
    });

    // 🔍 Selection handler
    const handleClick = useCallback(() => {
        selectObject("hubble");
    }, [selectObject]);

    return (
        <group
            ref={groupRef}
            name="hubble"
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
            {hovered && !isSelected && (
                <Html
                    distanceFactor={10}
                    position={[0, 0.1, 0]}
                    center
                    style={{
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                >
                    <div
                        className="bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg border border-white/20 shadow-lg text-sm whitespace-nowrap"
                        style={{
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        <div className="font-semibold text-amber-400 mb-1">Hubble</div>
                        <div className="text-xs text-white/70">
                            Over: {locationLoading ? "Locating..." : location || "Location unavailable"}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}
