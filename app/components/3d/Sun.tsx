"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeEngine } from "@/app/core/time";

export default function Sun() {
    const sunRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);

    const selectObject = useSelectionStore((state) => state.selectObject);
    const [hovered, setHovered] = useState(false);

    const { size } = useThree();
    const [baseScale, setBaseScale] = useState(1);

    // ☀️ Responsive sizing
    useEffect(() => {
        const width = size.width;
        setBaseScale(
            width <= 480 ? 0.9 :
                width <= 768 ? 1.0 :
                    width <= 1024 ? 1.05 :
                        1.1
        );
    }, [size.width]);

    // ☀️ Texture loading
    const sunTexture = useLoader(THREE.TextureLoader, "/textures/sun.jpg");

    // Sun rotation period at equator: approximately 25 days
    const SUN_ROTATION_PERIOD = 25 * 24 * 60 * 60; // seconds

    useFrame(() => {
        const t = timeEngine.getTime();

        // ☀️ Sun rotation (time-based)
        if (sunRef.current) {
            const rotationAngle =
                ((t % SUN_ROTATION_PERIOD) / SUN_ROTATION_PERIOD) * Math.PI * 2;
            sunRef.current.rotation.y = rotationAngle;
        }

        // ✨ Smooth hover scaling (UI animation, frame-based is OK)
        if (groupRef.current) {
            const targetScale = hovered ? baseScale * 1.1 : baseScale;
            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }
    });

    // 🔍 Selection handler
    const handleClick = useCallback(() => {
        selectObject("sun");
    }, [selectObject]);

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            <mesh
                ref={sunRef}
                name="sun"
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
                <sphereGeometry args={[1.5, 64, 64]} />
                <meshStandardMaterial
                    map={sunTexture}
                    emissive={new THREE.Color(0xffff00)}
                    emissiveIntensity={0.3}
                />
            </mesh>
        </group>
    );
}


