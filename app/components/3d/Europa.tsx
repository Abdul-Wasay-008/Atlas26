"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { getEuropaWorldPosition } from "@/app/astronomy/europaOrbit";
import { getPlanetOrbitPosition, JUPITER_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";

const EUROPA_RADIUS = 0.068;

/**
 * Simple deterministic pseudo-noise function for minimal vertex displacement.
 * Europa is highly spherical, so displacement is extremely subtle.
 */
function pseudoNoise3D(x: number, y: number, z: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
}

/**
 * Extremely subtle noise for Europa's smooth icy surface
 */
function subtleNoise(x: number, y: number, z: number): number {
    const lowFreq = pseudoNoise3D(x * 2, y * 2, z * 2, 20.0) * 0.6;
    const medFreq = pseudoNoise3D(x * 5, y * 5, z * 5, 21.0) * 0.4;
    return lowFreq + medFreq;
}

export default function Europa() {
    const europaRef = useRef<THREE.Mesh>(null);
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

    const europaTexture = useLoader(THREE.TextureLoader, "/textures/Jupiter - Europa.jpg");

    // Create geometry with extremely subtle displacement (Europa is highly spherical)
    const europaGeometry = useMemo(() => {
        const baseGeometry = new THREE.IcosahedronGeometry(EUROPA_RADIUS, 5);
        const geometry = baseGeometry.clone();
        
        const positionAttr = geometry.getAttribute("position");
        const positions = positionAttr.array as Float32Array;
        const vertex = new THREE.Vector3();
        const normal = new THREE.Vector3();
        
        // Extremely subtle displacement: 1.5% of radius (Europa is smooth and icy)
        const displacementAmplitude = EUROPA_RADIUS * 0.015;
        
        for (let i = 0; i < positionAttr.count; i++) {
            vertex.fromBufferAttribute(positionAttr, i);
            normal.copy(vertex).normalize();
            
            const noise = subtleNoise(vertex.x * 25, vertex.y * 25, vertex.z * 25);
            const displacement = displacementAmplitude * noise;
            
            positions[i * 3] += normal.x * displacement;
            positions[i * 3 + 1] += normal.y * displacement;
            positions[i * 3 + 2] += normal.z * displacement;
        }
        
        positionAttr.needsUpdate = true;
        geometry.computeVertexNormals();
        
        return geometry;
    }, []);

    // Material: icy surface with subtle cool blue-white tint
    const europaMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: europaTexture,
            metalness: 0,
            roughness: 0.88,
            color: new THREE.Color(0xE8F0F8), // Subtle icy blue-white tint
        });
    }, [europaTexture]);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const jupiterPosition = getPlanetOrbitPosition(currentDate, JUPITER_ORBIT_PARAMS);
        const europaWorldPos = getEuropaWorldPosition(currentDate, jupiterPosition);

        if (orbitRef.current) {
            orbitRef.current.position.copy(europaWorldPos);
        }

        // Tidal locking rotation (Europa always faces Jupiter)
        if (europaRef.current) {
            const europaRelativePos = new THREE.Vector3().subVectors(
                europaWorldPos,
                jupiterPosition
            );
            const rotationAngle = Math.atan2(europaRelativePos.x, europaRelativePos.z);
            europaRef.current.rotation.y = rotationAngle;
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
        selectObject("europa");
    }, [selectObject]);

    return (
        <group ref={orbitRef}>
            <group ref={groupRef}>
                <mesh
                    ref={europaRef}
                    name="europa"
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
                    <primitive object={europaGeometry} attach="geometry" />
                    <primitive object={europaMaterial} attach="material" />
                </mesh>
            </group>
        </group>
    );
}
