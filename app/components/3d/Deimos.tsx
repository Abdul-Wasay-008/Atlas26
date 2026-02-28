"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { getDeimosWorldPosition } from "@/app/astronomy/deimosOrbit";
import { getPlanetOrbitPosition, MARS_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";

const DEIMOS_RADIUS = 0.026;

/**
 * Simple deterministic pseudo-noise function for vertex displacement.
 * Uses a seed-based approach to create reproducible variation.
 */
function pseudoNoise3D(x: number, y: number, z: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
}

/**
 * Multi-octave noise for smoother rocky variation (less rugged than Phobos)
 */
function smoothRockyNoise(x: number, y: number, z: number): number {
    const lowFreq = pseudoNoise3D(x * 2, y * 2, z * 2, 5.0) * 0.65;
    const medFreq = pseudoNoise3D(x * 4, y * 4, z * 4, 6.0) * 0.25;
    const highFreq = pseudoNoise3D(x * 8, y * 8, z * 8, 7.0) * 0.10;
    
    return lowFreq + medFreq + highFreq;
}

export default function Deimos() {
    const deimosRef = useRef<THREE.Mesh>(null);
    const orbitRef = useRef<THREE.Group>(null);
    const groupRef = useRef<THREE.Group>(null);

    const selectObject = useSelectionStore((state) => state.selectObject);
    const [hovered, setHovered] = useState(false);

    const { size } = useThree();
    const [baseScale, setBaseScale] = useState(1);

    useEffect(() => {
        const width = size.width;
        setBaseScale(
            width <= 480 ? 0.4 :
                width <= 768 ? 0.6 :
                    width <= 1024 ? 0.8 :
                        1.0
        );
    }, [size.width]);

    const deimosTexture = useLoader(THREE.TextureLoader, "/textures/Mars - Deimos.jpg");

    // Create irregular geometry (smoother than Phobos - 7% displacement vs 12%)
    const irregularGeometry = useMemo(() => {
        const baseGeometry = new THREE.IcosahedronGeometry(DEIMOS_RADIUS, 5);
        const geometry = baseGeometry.clone();
        
        const positionAttr = geometry.getAttribute("position");
        const positions = positionAttr.array as Float32Array;
        const vertex = new THREE.Vector3();
        const normal = new THREE.Vector3();
        
        const displacementAmplitude = DEIMOS_RADIUS * 0.07;
        
        for (let i = 0; i < positionAttr.count; i++) {
            vertex.fromBufferAttribute(positionAttr, i);
            normal.copy(vertex).normalize();
            
            const noise = smoothRockyNoise(vertex.x * 30, vertex.y * 30, vertex.z * 30);
            const displacement = displacementAmplitude * noise;
            
            positions[i * 3] += normal.x * displacement;
            positions[i * 3 + 1] += normal.y * displacement;
            positions[i * 3 + 2] += normal.z * displacement;
        }
        
        positionAttr.needsUpdate = true;
        geometry.computeVertexNormals();
        
        return geometry;
    }, []);

    // Natural material with minimal tint
    const deimosMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: deimosTexture,
            color: new THREE.Color(0xE8E0D8),
            metalness: 0,
            roughness: 0.9,
        });
    }, [deimosTexture]);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const marsPosition = getPlanetOrbitPosition(currentDate, MARS_ORBIT_PARAMS);
        const deimosWorldPos = getDeimosWorldPosition(currentDate, marsPosition);

        if (orbitRef.current) {
            orbitRef.current.position.copy(deimosWorldPos);
        }

        // Tidal locking rotation
        if (deimosRef.current) {
            const deimosRelativePos = new THREE.Vector3().subVectors(
                deimosWorldPos,
                marsPosition
            );
            const rotationAngle = Math.atan2(deimosRelativePos.x, deimosRelativePos.z);
            deimosRef.current.rotation.y = rotationAngle;
        }

        if (groupRef.current) {
            const targetScale = hovered ? baseScale * 1.12 : baseScale;
            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }
    });

    const handleClick = useCallback(() => {
        selectObject("deimos");
    }, [selectObject]);

    // Subtle non-uniform scale (smoother than Phobos)
    const irregularScale = useMemo(() => new THREE.Vector3(1.05, 0.92, 0.98), []);

    return (
        <group ref={orbitRef}>
            <group ref={groupRef}>
                <mesh
                    ref={deimosRef}
                    name="deimos"
                    scale={irregularScale}
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
                    <primitive object={irregularGeometry} attach="geometry" />
                    <primitive object={deimosMaterial} attach="material" />
                </mesh>
            </group>
        </group>
    );
}
