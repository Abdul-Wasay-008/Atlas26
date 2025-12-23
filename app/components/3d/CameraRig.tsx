"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cameraController } from "@/app/core/cameraController";

const SNAP_SPEED = 0.1;
const SNAP_THRESHOLD = 0.05;

export default function CameraRig({ controlsRef }: { controlsRef: any }) {
    const { camera } = useThree();

    useFrame(() => {
        if (!cameraController.snapping) return;

        camera.position.lerp(cameraController.targetPosition, SNAP_SPEED);

        if (controlsRef?.current) {
            controlsRef.current.target.lerp(
                cameraController.lookAtPosition,
                SNAP_SPEED
            );
            controlsRef.current.update();
        } else {
            camera.lookAt(cameraController.lookAtPosition);
        }

        if (
            camera.position.distanceTo(cameraController.targetPosition) <
            SNAP_THRESHOLD
        ) {
            cameraController.stopSnap();
        }
    });

    return null;
}