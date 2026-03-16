"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { getProteusWorldPosition } from "@/app/astronomy/proteusOrbit";
import { getPlanetOrbitPosition, NEPTUNE_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";

const PROTEUS_RADIUS = 0.05;

/**
 * Simple deterministic pseudo-noise for vertex displacement.
 */
function pseudoNoise3D(x: number, y: number, z: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
}

function irregularNoise(x: number, y: number, z: number): number {
    const lowFreq = pseudoNoise3D(x * 2, y * 2, z * 2, 101.0) * 0.7; // large lobes
    const medFreq = pseudoNoise3D(x * 4, y * 4, z * 4, 202.0) * 0.3; // mid-scale ridges
    const highFreq = pseudoNoise3D(x * 8, y * 8, z * 8, 303.0) * 0.15; // fine craters
    return lowFreq + medFreq + highFreq;
}

export default function Proteus() {
    const proteusRef = useRef<THREE.Mesh>(null);
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

    const proteusTexture = useLoader(THREE.TextureLoader, "/textures/Neptune - Proteus.jpg");

    useEffect(() => {
        proteusTexture.colorSpace = THREE.SRGBColorSpace;
    }, [proteusTexture]);

    // Geometry with strong, multi-frequency displacement for irregular rocky shape
    const proteusGeometry = useMemo(() => {
        const baseGeometry = new THREE.IcosahedronGeometry(PROTEUS_RADIUS, 4);
        const geometry = baseGeometry.clone();

        const positionAttr = geometry.getAttribute("position");
        const positions = positionAttr.array as Float32Array;
        const vertex = new THREE.Vector3();
        const normal = new THREE.Vector3();

        // Larger relative amplitude to break the spherical silhouette
        const baseAmplitude = PROTEUS_RADIUS * 0.4;

        for (let i = 0; i < positionAttr.count; i++) {
            vertex.fromBufferAttribute(positionAttr, i);
            normal.copy(vertex).normalize();

            // Multi-frequency noise to create lumpy, potato-like form
            const noise = irregularNoise(vertex.x, vertex.y, vertex.z);
            const displacement = baseAmplitude * noise;

            positions[i * 3] += normal.x * displacement;
            positions[i * 3 + 1] += normal.y * displacement;
            positions[i * 3 + 2] += normal.z * displacement;
        }

        positionAttr.needsUpdate = true;
        geometry.computeVertexNormals();

        return geometry;
    }, []);

    const proteusMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: proteusTexture,
            metalness: 0,
            roughness: 1,
        });
    }, [proteusTexture]);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const neptunePosition = getPlanetOrbitPosition(currentDate, NEPTUNE_ORBIT_PARAMS);
        const proteusWorldPos = getProteusWorldPosition(currentDate, neptunePosition);

        if (orbitRef.current) {
            orbitRef.current.position.copy(proteusWorldPos);
        }

        // Tidal locking rotation (Proteus always faces Neptune)
        if (proteusRef.current) {
            const proteusRelativePos = new THREE.Vector3().subVectors(
                proteusWorldPos,
                neptunePosition
            );
            const rotationAngle = Math.atan2(proteusRelativePos.x, proteusRelativePos.z);
            proteusRef.current.rotation.y = rotationAngle;
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
        selectObject("proteus");
    }, [selectObject]);

    return (
        <group ref={orbitRef}>
            <group ref={groupRef}>
                <mesh
                    ref={proteusRef}
                    name="proteus"
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
                    <primitive object={proteusGeometry} attach="geometry" />
                    <primitive object={proteusMaterial} attach="material" />
                </mesh>
            </group>
        </group>
    );
}

