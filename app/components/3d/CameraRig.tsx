"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cameraController } from "@/app/core/cameraController";

const SNAP_SPEED = 0.1;
const RESET_SPEED = 0.04; // Slower speed for reset animations
const SNAP_THRESHOLD = 0.05;

// Easing function for smoother animation (ease-out)
function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

export default function CameraRig({ controlsRef }: { controlsRef: any }) {
    const { camera, gl } = useThree();
    const isSnappingRef = useRef(false);

    // Detect user interaction via DOM events and OrbitControls
    useEffect(() => {
        const canvas = gl.domElement;
        if (!canvas) return;

        let mouseDownTime = 0;
        let isDragging = false;

        const handleMouseDown = () => {
            // Just track that mouse is down - don't set interaction yet
            // This allows 3D object clicks to work without interference
            mouseDownTime = Date.now();
            isDragging = false;
        };

        const handleMouseMove = () => {
            // Only set interaction if mouse is down AND moving (actual dragging)
            // This prevents simple clicks from being treated as interaction
            if (mouseDownTime > 0) {
                isDragging = true;
                // User is dragging - immediately stop all camera manipulation
                cameraController.setUserInteracting(true);
            }
        };

        const handleMouseUp = () => {
            // Only set interaction if there was actual dragging (not just a click)
            if (isDragging) {
                cameraController.setUserInteracting(true);
            }
            mouseDownTime = 0;
            isDragging = false;
        };

        const handleWheel = () => {
            // Wheel always means user interaction - immediately stop all manipulation
            cameraController.setUserInteracting(true);
        };

        const handleTouchStart = () => {
            // Touch always means user interaction - immediately stop all manipulation
            cameraController.setUserInteracting(true);
        };

        // Also listen to OrbitControls events if available
        const handleControlsStart = () => {
            cameraController.setUserInteracting(true);
        };

        // Listen to interaction events
        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseup", handleMouseUp);
        canvas.addEventListener("wheel", handleWheel, { passive: true });
        canvas.addEventListener("touchstart", handleTouchStart);

        // Try to listen to OrbitControls events
        if (controlsRef?.current) {
            const controls = controlsRef.current;
            if (controls.addEventListener) {
                controls.addEventListener("start", handleControlsStart);
            }
        }

        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseup", handleMouseUp);
            canvas.removeEventListener("wheel", handleWheel);
            canvas.removeEventListener("touchstart", handleTouchStart);
            
            if (controlsRef?.current?.removeEventListener) {
                controlsRef.current.removeEventListener("start", handleControlsStart);
            }
        };
    }, [gl, controlsRef]);

    useFrame(() => {
        // Completely stop if user is interacting
        if (cameraController.userInteracting) {
            return;
        }

        // Only snap if explicitly snapping
        if (!cameraController.snapping) {
            isSnappingRef.current = false;
            return;
        }

        isSnappingRef.current = true;

        // Calculate distance to target
        const distanceToTarget = camera.position.distanceTo(cameraController.targetPosition);
        
        if (distanceToTarget < SNAP_THRESHOLD) {
            // Close enough - stop snapping
            cameraController.stopSnap();
            isSnappingRef.current = false;
            return;
        }

        // Use slower speed for reset animations, normal speed for object snaps
        const currentSpeed = cameraController.isResetting ? RESET_SPEED : SNAP_SPEED;
        
        // Apply easing for smoother animation (especially for reset)
        // Ease out as we get closer to target
        const maxDistance = 10; // Approximate max distance
        const normalizedDistance = Math.min(distanceToTarget / maxDistance, 1);
        const easedProgress = easeOutCubic(1 - normalizedDistance);
        const easedSpeed = currentSpeed * (0.5 + easedProgress * 0.5); // Vary between 50% and 100% of speed

        // Smoothly lerp camera position
        camera.position.lerp(cameraController.targetPosition, easedSpeed);

        // Update OrbitControls target for smooth look-at
        if (controlsRef?.current) {
            controlsRef.current.target.lerp(
                cameraController.lookAtPosition,
                easedSpeed
            );
            controlsRef.current.update();
        } else {
            camera.lookAt(cameraController.lookAtPosition);
        }
    });

    return null;
}