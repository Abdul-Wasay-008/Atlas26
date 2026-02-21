"use client";

import * as THREE from "three";
import React, { useRef, useEffect, useState } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import {
    getPlanetOrbitPosition,
    JUPITER_ORBIT_PARAMS,
    JUPITER_AXIAL_TILT_RADIANS,
} from "@/app/astronomy/planetOrbit";

const JUPITER_ROTATION_PERIOD_SECONDS = 10 * 60 * 60;
const JUPITER_RADIUS = 0.9;

export default function Jupiter() {
    const meshRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const tiltRef = useRef<THREE.Group>(null);
    const orbitRef = useRef<THREE.Group>(null);

    const selectObject = useSelectionStore((state) => state.selectObject);
    const [baseScale, setBaseScale] = useState(1);
    const [hovered, setHovered] = useState(false);
    const { size } = useThree();

    useEffect(() => {
        const width = size.width;
        setBaseScale(
            width <= 480 ? 0.7 :
                width <= 768 ? 0.9 :
                    width <= 1024 ? 0.9 :
                        width <= 1440 ? 0.95 : 1
        );
    }, [size.width]);

    const texture = useLoader(THREE.TextureLoader, "/textures/jupiter.jpg");

    useEffect(() => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
    }, [texture]);

    useEffect(() => {
        if (tiltRef.current) {
            tiltRef.current.rotation.x = JUPITER_AXIAL_TILT_RADIANS;
        }
    }, []);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const t = currentDate.getTime() / 1000;

        if (orbitRef.current) {
            const pos = getPlanetOrbitPosition(currentDate, JUPITER_ORBIT_PARAMS);
            orbitRef.current.position.copy(pos);
        }

        if (groupRef.current) {
            groupRef.current.rotation.y =
                (t / JUPITER_ROTATION_PERIOD_SECONDS) * Math.PI * 2;
        }

        if (groupRef.current) {
            const targetScale = hovered ? baseScale * 1.08 : baseScale;
            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }
    });

    return (
        <group ref={orbitRef}>
            <group ref={tiltRef}>
                <group ref={groupRef} scale={[baseScale, baseScale, baseScale]}>
                    <mesh
                        ref={meshRef}
                        name="jupiter"
                        onClick={() => selectObject("jupiter")}
                        onPointerOver={() => {
                            setHovered(true);
                            document.body.style.cursor = "pointer";
                        }}
                        onPointerOut={() => {
                            setHovered(false);
                            document.body.style.cursor = "default";
                        }}
                    >
                        <sphereGeometry args={[JUPITER_RADIUS, 128, 128]} />
                        <meshBasicMaterial map={texture} />
                    </mesh>
                </group>
            </group>
        </group>
    );
}
