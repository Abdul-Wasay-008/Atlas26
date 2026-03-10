"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { getEnceladusWorldPosition } from "@/app/astronomy/enceladusOrbit";
import { getPlanetOrbitPosition, SATURN_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";

const ENCELADUS_RADIUS = 0.055;

/**
 * Simple deterministic pseudo-noise for very subtle vertex displacement.
 * Enceladus is a smooth icy moon - displacement kept minimal so it reads icy, not rocky.
 */
function pseudoNoise3D(x: number, y: number, z: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
}

function verySubtleNoise(x: number, y: number, z: number): number {
    const lowFreq = pseudoNoise3D(x * 2, y * 2, z * 2, 40.0) * 0.8;
    const medFreq = pseudoNoise3D(x * 4, y * 4, z * 4, 41.0) * 0.2;
    return lowFreq + medFreq;
}

export default function Enceladus() {
    const enceladusRef = useRef<THREE.Mesh>(null);
    const orbitRef = useRef<THREE.Group>(null);
    const groupRef = useRef<THREE.Group>(null);

    const selectObject = useSelectionStore((state) => state.selectObject);
    const [hovered, setHovered] = useState(false);

    const { size } = useThree();
    const [baseScale, setBaseScale] = useState(1);

    useEffect(() => {
        const width = size.width;
        setBaseScale(
            width <= 480 ? 0.5 :
                width <= 768 ? 0.7 :
                    width <= 1024 ? 0.85 :
                        1.0
        );
    }, [size.width]);

    const enceladusTexture = useLoader(THREE.TextureLoader, "/textures/Saturn - Enceladus.jpg");

    useEffect(() => {
        enceladusTexture.colorSpace = THREE.SRGBColorSpace;
    }, [enceladusTexture]);

    // Geometry with very subtle displacement - Enceladus is smooth icy, not crater-heavy
    const enceladusGeometry = useMemo(() => {
        const baseGeometry = new THREE.IcosahedronGeometry(ENCELADUS_RADIUS, 5);
        const geometry = baseGeometry.clone();

        const positionAttr = geometry.getAttribute("position");
        const positions = positionAttr.array as Float32Array;
        const vertex = new THREE.Vector3();
        const normal = new THREE.Vector3();

        const displacementAmplitude = ENCELADUS_RADIUS * 0.01; // 1% - very subtle for icy moon

        for (let i = 0; i < positionAttr.count; i++) {
            vertex.fromBufferAttribute(positionAttr, i);
            normal.copy(vertex).normalize();

            const noise = verySubtleNoise(vertex.x * 15, vertex.y * 15, vertex.z * 15);
            const displacement = displacementAmplitude * noise;

            positions[i * 3] += normal.x * displacement;
            positions[i * 3 + 1] += normal.y * displacement;
            positions[i * 3 + 2] += normal.z * displacement;
        }

        positionAttr.needsUpdate = true;
        geometry.computeVertexNormals();

        return geometry;
    }, []);

    // Material: bright icy white - Enceladus is one of the brightest objects in the solar system
    const enceladusMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: enceladusTexture,
            metalness: 0,
            roughness: 0.85,
            color: new THREE.Color(0xF3F6FF), // Bright icy white with slight blue
        });
    }, [enceladusTexture]);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const saturnPosition = getPlanetOrbitPosition(currentDate, SATURN_ORBIT_PARAMS);
        const enceladusWorldPos = getEnceladusWorldPosition(currentDate, saturnPosition);

        if (orbitRef.current) {
            orbitRef.current.position.copy(enceladusWorldPos);
        }

        // Tidal locking rotation (Enceladus always faces Saturn)
        if (enceladusRef.current) {
            const enceladusRelativePos = new THREE.Vector3().subVectors(
                enceladusWorldPos,
                saturnPosition
            );
            const rotationAngle = Math.atan2(enceladusRelativePos.x, enceladusRelativePos.z);
            enceladusRef.current.rotation.y = rotationAngle;
        }

        // Smooth hover scaling
        if (groupRef.current) {
            const targetScale = hovered ? baseScale * 1.1 : baseScale;
            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }
    });

    const handleClick = useCallback(() => {
        selectObject("enceladus");
    }, [selectObject]);

    return (
        <group ref={orbitRef}>
            <group ref={groupRef}>
                <mesh
                    ref={enceladusRef}
                    name="enceladus"
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
                    <primitive object={enceladusGeometry} attach="geometry" />
                    <primitive object={enceladusMaterial} attach="material" />
                </mesh>
            </group>
        </group>
    );
}
