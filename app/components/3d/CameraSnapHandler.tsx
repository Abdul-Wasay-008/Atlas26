"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSelectionStore } from "@/app/store/selectionStore";
import { cameraController } from "@/app/core/cameraController";

export default function CameraSnapHandler() {
    const { scene } = useThree();
    const selectedId = useSelectionStore((state) => state.selectedId);
    const lastSelectedIdRef = useRef<string | null>(null);
    const snapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const sceneRef = useRef(scene);

    // Update scene ref when it changes, but don't trigger re-render
    useEffect(() => {
        sceneRef.current = scene;
    }, [scene]);

    useEffect(() => {
        // Clear any pending snap timeout
        if (snapTimeoutRef.current) {
            clearTimeout(snapTimeoutRef.current);
            snapTimeoutRef.current = null;
        }

        // Only trigger snap if selection changed
        if (selectedId === lastSelectedIdRef.current) return;
        
        const previousSelectedId = lastSelectedIdRef.current;
        lastSelectedIdRef.current = selectedId;

        // Reset snap disabled flag when:
        // 1. First click (previousSelectedId is null and selectedId is not null)
        // 2. Switching to a different object (both are not null and different)
        if (selectedId !== null) {
            if (previousSelectedId === null || previousSelectedId !== selectedId) {
                // Always reset flags when selecting a new object (including first click)
                cameraController.resetSnapDisabled();
            }
        } else {
            // Deselecting - don't reset flags, just allow system snap if needed
        }

        // Function to attempt snap
        const attemptSnap = () => {
            // Don't snap if snapping is disabled
            if (cameraController.snapDisabled) {
                return;
            }

            if (!selectedId) {
                // If nothing is selected, snap back to system view
                cameraController.snapToSystem();
                return;
            }

            // Find the object in the scene by name
            // Try multiple ways to find the object
            let object = sceneRef.current.getObjectByName(selectedId);
            
            // If not found by name, try finding by traversing the scene
            if (!object) {
                sceneRef.current.traverse((child) => {
                    if (child.name === selectedId && !object) {
                        object = child;
                    }
                });
            }
            
            if (object) {
                // Ensure the object's matrix is up to date before getting position
                // This is critical for satellites that update position every frame
                object.updateMatrixWorld(true);
                
                // Get world position of the object at the moment of selection
                const worldPos = new THREE.Vector3();
                object.getWorldPosition(worldPos);
                
                // For satellites, compute proper framing using bounding box
                const isSatellite = selectedId === "iss" || selectedId === "hubble";
                
                if (isSatellite && !cameraController.snapDisabled) {
                    // Use appropriate camera distances for satellite viewing
                    // These distances position the camera far enough to frame the satellite
                    // while keeping Earth visible in the background
                    let distance: number;
                    
                    if (selectedId === "hubble") {
                        // Hubble is very small (scale ~0.0004)
                        // Increased for better context view
                        distance = 0.8;
                    } else {
                        // ISS scale is 0.005
                        // Increased for better context view
                        distance = 0.7;
                    }
                    
                    // Compute camera direction relative to satellite position
                    // Strategy: Position camera AWAY from Earth, beyond the satellite, looking back at it
                    
                    // Get Earth's actual position (Earth orbits the Sun, which is at origin)
                    const earthObject = sceneRef.current.getObjectByName("earth");
                    const earthCenter = new THREE.Vector3();
                    if (earthObject) {
                        earthObject.getWorldPosition(earthCenter);
                    }
                    
                    const earthToSatellite = worldPos.clone().sub(earthCenter).normalize();
                    
                    // Primary direction: Continue in the Earth-to-Satellite direction (away from Earth)
                    // This ensures Earth is in the background, not blocking the satellite
                    const primaryDirection = earthToSatellite.clone();
                    
                    // Add a slight perpendicular offset for a better viewing angle (not straight on)
                    let upVector = new THREE.Vector3(0, 1, 0);
                    if (Math.abs(earthToSatellite.y) > 0.9) {
                        upVector = new THREE.Vector3(1, 0, 0);
                    }
                    
                    const right = new THREE.Vector3().crossVectors(earthToSatellite, upVector).normalize();
                    if (right.length() < 0.1) {
                        upVector = new THREE.Vector3(0, 0, 1);
                        right.crossVectors(earthToSatellite, upVector).normalize();
                    }
                    
                    // Create viewing direction: mostly away from Earth, with slight offset for angle
                    // 80% away from Earth, 15% to the side, 5% up
                    const direction = new THREE.Vector3()
                        .addScaledVector(primaryDirection, 0.8)
                        .addScaledVector(right, 0.15)
                        .addScaledVector(upVector, 0.05)
                        .normalize();
                    
                    // Calculate camera position offset from satellite center
                    const cameraTargetPos = worldPos.clone().add(
                        direction.multiplyScalar(distance)
                    );
                    
                    // Set look-at position to satellite center (where camera will focus)
                    cameraController.lookAtPosition.copy(worldPos);
                    // Set camera position with computed offset (where camera will be)
                    cameraController.targetPosition.copy(cameraTargetPos);
                    // Set snapping flags
                    cameraController.target = selectedId as "iss" | "hubble";
                    cameraController.snapping = true;
                    cameraController.snapCompleted = false;
                } else if (!isSatellite) {
                    // For non-satellites, use existing offset logic
                    cameraController.startSnap(
                        selectedId as "sun" | "mercury" | "venus" | "earth" | "mars" | "jupiter" | "moon",
                        worldPos
                    );
                }
            } else {
                // Object not found - try again after a longer delay
                // This handles cases where the scene is still loading
                snapTimeoutRef.current = setTimeout(() => {
                    let retryObject = sceneRef.current.getObjectByName(selectedId);
                    if (!retryObject) {
                        sceneRef.current.traverse((child) => {
                            if (child.name === selectedId && !retryObject) {
                                retryObject = child;
                            }
                        });
                    }
                    if (retryObject && !cameraController.snapDisabled) {
                        // Ensure the object's matrix is up to date before getting position
                        retryObject.updateMatrixWorld(true);
                        
                        const worldPos = new THREE.Vector3();
                        retryObject.getWorldPosition(worldPos);
                        
                        // For satellites, compute proper framing using bounding box
                        const isSatellite = selectedId === "iss" || selectedId === "hubble";
                        
                        if (isSatellite && !cameraController.snapDisabled) {
                            // Use appropriate camera distances for satellite viewing
                            // These distances position the camera far enough to frame the satellite
                            // while keeping Earth visible in the background
                            let distance: number;
                            
                            if (selectedId === "hubble") {
                                // Hubble is very small (scale ~0.0004)
                                // Increased for better context view
                                distance = 0.8;
                            } else {
                                // ISS scale is 0.005
                                // Increased for better context view
                                distance = 0.7;
                            }
                            
                            // Compute camera direction relative to satellite position
                            // Strategy: Position camera AWAY from Earth, beyond the satellite, looking back at it
                            
                            // Get Earth's actual position (Earth orbits the Sun, which is at origin)
                            const earthObject = sceneRef.current.getObjectByName("earth");
                            const earthCenter = new THREE.Vector3();
                            if (earthObject) {
                                earthObject.getWorldPosition(earthCenter);
                            }
                            
                            const earthToSatellite = worldPos.clone().sub(earthCenter).normalize();
                            
                            // Primary direction: Continue in the Earth-to-Satellite direction (away from Earth)
                            // This ensures Earth is in the background, not blocking the satellite
                            const primaryDirection = earthToSatellite.clone();
                            
                            // Add a slight perpendicular offset for a better viewing angle (not straight on)
                            let upVector = new THREE.Vector3(0, 1, 0);
                            if (Math.abs(earthToSatellite.y) > 0.9) {
                                upVector = new THREE.Vector3(1, 0, 0);
                            }
                            
                            const right = new THREE.Vector3().crossVectors(earthToSatellite, upVector).normalize();
                            if (right.length() < 0.1) {
                                upVector = new THREE.Vector3(0, 0, 1);
                                right.crossVectors(earthToSatellite, upVector).normalize();
                            }
                            
                            // Create viewing direction: mostly away from Earth, with slight offset for angle
                            // 80% away from Earth, 15% to the side, 5% up
                            const direction = new THREE.Vector3()
                                .addScaledVector(primaryDirection, 0.8)
                                .addScaledVector(right, 0.15)
                                .addScaledVector(upVector, 0.05)
                                .normalize();
                            
                            // Calculate camera position offset from satellite center
                            const cameraTargetPos = worldPos.clone().add(
                                direction.multiplyScalar(distance)
                            );
                            
                            // Set look-at position to satellite center (where camera will focus)
                            cameraController.lookAtPosition.copy(worldPos);
                            // Set camera position with computed offset (where camera will be)
                            cameraController.targetPosition.copy(cameraTargetPos);
                            // Set snapping flags
                            cameraController.target = selectedId as "iss" | "hubble";
                            cameraController.snapping = true;
                            cameraController.snapCompleted = false;
                        } else if (!isSatellite) {
                            // For non-satellites, use existing offset logic
                            cameraController.startSnap(
                                selectedId as "sun" | "mercury" | "venus" | "earth" | "mars" | "jupiter" | "moon",
                                worldPos
                            );
                        }
                    }
                }, 200);
            }
        };

        // Small delay to ensure object is in scene
        snapTimeoutRef.current = setTimeout(attemptSnap, 50);

        return () => {
            if (snapTimeoutRef.current) {
                clearTimeout(snapTimeoutRef.current);
            }
        };
    }, [selectedId]); // Removed scene from dependencies

    return null;
}

