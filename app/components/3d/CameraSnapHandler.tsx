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
                // Get world position of the object at the moment of selection
                const worldPos = new THREE.Vector3();
                object.getWorldPosition(worldPos);
                
                // Trigger camera snap - startSnap will check if user is interacting
                cameraController.startSnap(
                    selectedId as "earth" | "moon",
                    worldPos
                );
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
                        const worldPos = new THREE.Vector3();
                        retryObject.getWorldPosition(worldPos);
                        cameraController.startSnap(
                            selectedId as "earth" | "moon",
                            worldPos
                        );
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

