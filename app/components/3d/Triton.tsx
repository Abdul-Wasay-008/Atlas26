"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { getTritonWorldPosition } from "@/app/astronomy/tritonOrbit";
import { getPlanetOrbitPosition, NEPTUNE_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";

const TRITON_RADIUS = 0.15;

/**
 * Simple deterministic pseudo-noise for subtle vertex displacement.
 */
function pseudoNoise3D(x: number, y: number, z: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
}

function subtleNoise(x: number, y: number, z: number): number {
    const lowFreq = pseudoNoise3D(x * 3, y * 3, z * 3, 44.0) * 0.7;
    const medFreq = pseudoNoise3D(x * 6, y * 6, z * 6, 45.0) * 0.3;
    return lowFreq + medFreq;
}

export default function Triton() {
    const tritonRef = useRef<THREE.Mesh>(null);
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

    const tritonTexture = useLoader(THREE.TextureLoader, "/textures/Neptune - Triton.jpg");

    useEffect(() => {
        tritonTexture.colorSpace = THREE.SRGBColorSpace;
    }, [tritonTexture]);

    // Geometry with stronger displacement for Triton's rugged, fractured surface
    const tritonGeometry = useMemo(() => {
        const baseGeometry = new THREE.IcosahedronGeometry(TRITON_RADIUS, 5);
        const geometry = baseGeometry.clone();

        const positionAttr = geometry.getAttribute("position");
        const positions = positionAttr.array as Float32Array;
        const vertex = new THREE.Vector3();
        const normal = new THREE.Vector3();

        // Increase amplitude compared to other moons so Triton looks noticeably rougher
        const displacementAmplitude = TRITON_RADIUS * 0.05;

        for (let i = 0; i < positionAttr.count; i++) {
            vertex.fromBufferAttribute(positionAttr, i);
            normal.copy(vertex).normalize();

            // Slightly higher frequency sampling for more small-scale terrain variation
            const noise = subtleNoise(vertex.x * 30, vertex.y * 30, vertex.z * 30);
            const displacement = displacementAmplitude * noise;

            positions[i * 3] += normal.x * displacement;
            positions[i * 3 + 1] += normal.y * displacement;
            positions[i * 3 + 2] += normal.z * displacement;
        }

        positionAttr.needsUpdate = true;
        geometry.computeVertexNormals();

        return geometry;
    }, []);

    // Material: icy moon, roughness 1, metalness 0 per spec
    const tritonMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: tritonTexture,
            metalness: 0,
            roughness: 1,
        });
    }, [tritonTexture]);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const neptunePosition = getPlanetOrbitPosition(currentDate, NEPTUNE_ORBIT_PARAMS);
        const tritonWorldPos = getTritonWorldPosition(currentDate, neptunePosition);

        if (orbitRef.current) {
            orbitRef.current.position.copy(tritonWorldPos);
        }

        // Tidal locking rotation (Triton always faces Neptune)
        if (tritonRef.current) {
            const tritonRelativePos = new THREE.Vector3().subVectors(
                tritonWorldPos,
                neptunePosition
            );
            const rotationAngle = Math.atan2(tritonRelativePos.x, tritonRelativePos.z);
            tritonRef.current.rotation.y = rotationAngle;
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
        selectObject("triton");
    }, [selectObject]);

    return (
        <group ref={orbitRef}>
            <group ref={groupRef}>
                <mesh
                    ref={tritonRef}
                    name="triton"
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
                    <primitive object={tritonGeometry} attach="geometry" />
                    <primitive object={tritonMaterial} attach="material" />
                </mesh>
            </group>
        </group>
    );
}
