"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cameraController } from "@/app/core/cameraController";

const MOVE_SPEED = 0.15;
const BOOST_MULTIPLIER = 2.5;

interface KeyState {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    boost: boolean;
}

export default function CameraKeyboardControls({ controlsRef }: { controlsRef: any }) {
    const { camera } = useThree();
    const keysRef = useRef<KeyState>({
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
        boost: false,
    });

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                (event.target as HTMLElement).isContentEditable
            ) {
                return;
            }

            const key = event.key.toLowerCase();
            switch (key) {
                case "w":
                    keysRef.current.forward = true;
                    break;
                case "s":
                    keysRef.current.backward = true;
                    break;
                case "a":
                    keysRef.current.left = true;
                    break;
                case "d":
                    keysRef.current.right = true;
                    break;
                case "q":
                    keysRef.current.down = true;
                    break;
                case "e":
                    keysRef.current.up = true;
                    break;
                case "shift":
                    keysRef.current.boost = true;
                    break;
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            switch (key) {
                case "w":
                    keysRef.current.forward = false;
                    break;
                case "s":
                    keysRef.current.backward = false;
                    break;
                case "a":
                    keysRef.current.left = false;
                    break;
                case "d":
                    keysRef.current.right = false;
                    break;
                case "q":
                    keysRef.current.down = false;
                    break;
                case "e":
                    keysRef.current.up = false;
                    break;
                case "shift":
                    keysRef.current.boost = false;
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    useFrame(() => {
        const keys = keysRef.current;
        const isMoving = keys.forward || keys.backward || keys.left || keys.right || keys.up || keys.down;

        if (!isMoving) return;

        cameraController.setUserInteracting(true);

        const speed = keys.boost ? MOVE_SPEED * BOOST_MULTIPLIER : MOVE_SPEED;

        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);

        const right = new THREE.Vector3();
        right.crossVectors(direction, camera.up).normalize();

        const movement = new THREE.Vector3();

        if (keys.forward) movement.add(direction.clone().multiplyScalar(speed));
        if (keys.backward) movement.add(direction.clone().multiplyScalar(-speed));
        if (keys.left) movement.add(right.clone().multiplyScalar(-speed));
        if (keys.right) movement.add(right.clone().multiplyScalar(speed));
        if (keys.up) movement.add(new THREE.Vector3(0, speed, 0));
        if (keys.down) movement.add(new THREE.Vector3(0, -speed, 0));

        camera.position.add(movement);

        if (controlsRef?.current) {
            controlsRef.current.target.add(movement);
            controlsRef.current.update();
        }
    });

    return null;
}
