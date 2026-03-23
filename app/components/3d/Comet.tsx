"use client";

import * as THREE from "three";
import React, { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";

const COMET_RADIUS = 0.06;

interface CometProps {
    id: string;
    orbitFn: (date: Date) => THREE.Vector3;
}

export default function Comet({ id, orbitFn }: CometProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);
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

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();

        if (orbitRef.current) {
            const pos = orbitFn(currentDate);
            orbitRef.current.position.copy(pos);
        }

        if (groupRef.current) {
            const targetScale = hovered ? baseScale * 1.15 : baseScale;
            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }
    });

    return (
        <group ref={orbitRef}>
            <group ref={groupRef} scale={[baseScale, baseScale, baseScale]}>
                <mesh
                    ref={meshRef}
                    name={id}
                    onClick={() => selectObject(id)}
                    onPointerOver={() => {
                        setHovered(true);
                        document.body.style.cursor = "pointer";
                    }}
                    onPointerOut={() => {
                        setHovered(false);
                        document.body.style.cursor = "default";
                    }}
                >
                    <sphereGeometry args={[COMET_RADIUS, 32, 32]} />
                    <meshStandardMaterial
                        color="#e0f7ff"
                        emissive="#aeefff"
                        emissiveIntensity={0.4}
                    />
                </mesh>
            </group>
        </group>
    );
}
