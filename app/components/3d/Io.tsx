"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { getIoWorldPosition } from "@/app/astronomy/ioOrbit";
import { getPlanetOrbitPosition, JUPITER_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";

const IO_RADIUS = 0.08;

/**
 * Simple deterministic pseudo-noise function for subtle vertex displacement.
 * Io is nearly spherical, so displacement is minimal.
 */
function pseudoNoise3D(x: number, y: number, z: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
}

/**
 * Very subtle noise for Io's nearly spherical shape
 */
function subtleNoise(x: number, y: number, z: number): number {
    const lowFreq = pseudoNoise3D(x * 3, y * 3, z * 3, 10.0) * 0.7;
    const medFreq = pseudoNoise3D(x * 6, y * 6, z * 6, 11.0) * 0.3;
    return lowFreq + medFreq;
}

export default function Io() {
    const ioRef = useRef<THREE.Mesh>(null);
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

    const ioTexture = useLoader(THREE.TextureLoader, "/textures/Jupiter - IO.jpg");

    // Create geometry with very subtle displacement (Io is nearly spherical)
    const ioGeometry = useMemo(() => {
        const baseGeometry = new THREE.IcosahedronGeometry(IO_RADIUS, 5);
        const geometry = baseGeometry.clone();
        
        const positionAttr = geometry.getAttribute("position");
        const positions = positionAttr.array as Float32Array;
        const vertex = new THREE.Vector3();
        const normal = new THREE.Vector3();
        
        // Very subtle displacement: 2.5% of radius (Io is nearly spherical)
        const displacementAmplitude = IO_RADIUS * 0.025;
        
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

    // Material: let sulfur colors from texture dominate, no artificial tint
    const ioMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: ioTexture,
            metalness: 0,
            roughness: 0.85,
        });
    }, [ioTexture]);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const jupiterPosition = getPlanetOrbitPosition(currentDate, JUPITER_ORBIT_PARAMS);
        const ioWorldPos = getIoWorldPosition(currentDate, jupiterPosition);

        if (orbitRef.current) {
            orbitRef.current.position.copy(ioWorldPos);
        }

        // Tidal locking rotation (Io always faces Jupiter)
        if (ioRef.current) {
            const ioRelativePos = new THREE.Vector3().subVectors(
                ioWorldPos,
                jupiterPosition
            );
            const rotationAngle = Math.atan2(ioRelativePos.x, ioRelativePos.z);
            ioRef.current.rotation.y = rotationAngle;
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
        selectObject("io");
    }, [selectObject]);

    return (
        <group ref={orbitRef}>
            <group ref={groupRef}>
                <mesh
                    ref={ioRef}
                    name="io"
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
                    <primitive object={ioGeometry} attach="geometry" />
                    <primitive object={ioMaterial} attach="material" />
                </mesh>
            </group>
        </group>
    );
}
