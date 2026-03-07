"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { getCallistoWorldPosition } from "@/app/astronomy/callistoOrbit";
import { getPlanetOrbitPosition, JUPITER_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";

// Callisto ≈ Mercury × 0.988 (Callisto 2410 km vs Mercury 2440 km; almost same size, slightly smaller)
const MERCURY_SCENE_RADIUS = 0.8 * 0.38;
const CALLISTO_RADIUS = MERCURY_SCENE_RADIUS * 0.988;

/**
 * Simple deterministic pseudo-noise function for minimal vertex displacement.
 * Callisto is heavily cratered but roughly spherical.
 */
function pseudoNoise3D(x: number, y: number, z: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
}

/**
 * Extremely subtle noise for Callisto's cratered icy-rock surface
 */
function subtleNoise(x: number, y: number, z: number): number {
    const lowFreq = pseudoNoise3D(x * 2, y * 2, z * 2, 40.0) * 0.6;
    const medFreq = pseudoNoise3D(x * 4, y * 4, z * 4, 41.0) * 0.4;
    return lowFreq + medFreq;
}

export default function Callisto() {
    const callistoRef = useRef<THREE.Mesh>(null);
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

    const callistoTexture = useLoader(THREE.TextureLoader, "/textures/Jupiter - Callisto.jpg");

    // Create geometry with extremely subtle displacement (Callisto is roughly spherical)
    const callistoGeometry = useMemo(() => {
        const baseGeometry = new THREE.IcosahedronGeometry(CALLISTO_RADIUS, 5);
        const geometry = baseGeometry.clone();

        const positionAttr = geometry.getAttribute("position");
        const positions = positionAttr.array as Float32Array;
        const vertex = new THREE.Vector3();
        const normal = new THREE.Vector3();

        // Extremely subtle displacement: 1% of radius (Callisto is heavily cratered but round)
        const displacementAmplitude = CALLISTO_RADIUS * 0.01;

        for (let i = 0; i < positionAttr.count; i++) {
            vertex.fromBufferAttribute(positionAttr, i);
            normal.copy(vertex).normalize();

            const noise = subtleNoise(vertex.x * 20, vertex.y * 20, vertex.z * 20);
            const displacement = displacementAmplitude * noise;

            positions[i * 3] += normal.x * displacement;
            positions[i * 3 + 1] += normal.y * displacement;
            positions[i * 3 + 2] += normal.z * displacement;
        }

        positionAttr.needsUpdate = true;
        geometry.computeVertexNormals();

        return geometry;
    }, []);

    // Material: icy-rock surface, subtle neutral tint if texture is grayscale
    const callistoMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: callistoTexture,
            metalness: 0,
            roughness: 0.9,
            color: new THREE.Color(0xE8E4DC), // Very subtle neutral warm-gray tint
        });
    }, [callistoTexture]);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const jupiterPosition = getPlanetOrbitPosition(currentDate, JUPITER_ORBIT_PARAMS);
        const callistoWorldPos = getCallistoWorldPosition(currentDate, jupiterPosition);

        if (orbitRef.current) {
            orbitRef.current.position.copy(callistoWorldPos);
        }

        // Tidal locking rotation (Callisto always faces Jupiter)
        if (callistoRef.current) {
            const callistoRelativePos = new THREE.Vector3().subVectors(
                callistoWorldPos,
                jupiterPosition
            );
            const rotationAngle = Math.atan2(callistoRelativePos.x, callistoRelativePos.z);
            callistoRef.current.rotation.y = rotationAngle;
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
        selectObject("callisto");
    }, [selectObject]);

    return (
        <group ref={orbitRef}>
            <group ref={groupRef}>
                <mesh
                    ref={callistoRef}
                    name="callisto"
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
                    <primitive object={callistoGeometry} attach="geometry" />
                    <primitive object={callistoMaterial} attach="material" />
                </mesh>
            </group>
        </group>
    );
}
