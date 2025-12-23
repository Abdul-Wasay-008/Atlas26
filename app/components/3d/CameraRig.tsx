"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cameraController } from "@/app/core/cameraController";

const SNAP_SPEED = 0.08;
const SNAP_THRESHOLD = 0.05;

export default function CameraRig() {
    const { camera, scene } = useThree();
    const targetPos = new THREE.Vector3();
    const lookAt = new THREE.Vector3();

    useFrame(() => {
        if (!cameraController.snapping) return;

        if (cameraController.target === "earth") {
            const earth = scene.getObjectByName("earth");
            if (!earth) return;

            targetPos.copy(earth.position).add(cameraController.earthOffset);
            lookAt.copy(earth.position);
        }

        if (cameraController.target === "moon") {
            const moon = scene.getObjectByName("moon");
            if (!moon) return;

            targetPos.copy(moon.position).add(cameraController.moonOffset);
            lookAt.copy(moon.position);
        }

        if (cameraController.target === "system") {
            targetPos.copy(cameraController.systemPos);
            lookAt.set(0, 0, 0);
        }

        camera.position.lerp(targetPos, SNAP_SPEED);
        camera.lookAt(lookAt);

        // 🛑 Stop snapping once close enough
        if (camera.position.distanceTo(targetPos) < SNAP_THRESHOLD) {
            cameraController.stopSnap();
        }
    });

    return null;
}