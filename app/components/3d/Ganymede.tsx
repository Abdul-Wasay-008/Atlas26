"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { getGanymedeWorldPosition } from "@/app/astronomy/ganymedeOrbit";
import { getPlanetOrbitPosition, JUPITER_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";

// Ganymede is ~8% larger than Mercury visually (Mercury radius = 0.8 * 0.38 = 0.304)
const MERCURY_SCENE_RADIUS = 0.8 * 0.38;
const GANYMEDE_RADIUS = MERCURY_SCENE_RADIUS * 1.08;

/**
 * Simple deterministic pseudo-noise function for minimal vertex displacement.
 * Ganymede is highly spherical, so displacement is extremely subtle.
 */
function pseudoNoise3D(x: number, y: number, z: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
}

/**
 * Extremely subtle noise for Ganymede's smooth icy-rock surface
 */
function subtleNoise(x: number, y: number, z: number): number {
    const lowFreq = pseudoNoise3D(x * 2, y * 2, z * 2, 30.0) * 0.6;
    const medFreq = pseudoNoise3D(x * 4, y * 4, z * 4, 31.0) * 0.4;
    return lowFreq + medFreq;
}

export default function Ganymede() {
    const ganymedeRef = useRef<THREE.Mesh>(null);
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

    const ganymedeTexture = useLoader(THREE.TextureLoader, "/textures/Jupiter - Ganymede.jpg");

    // Create geometry with extremely subtle displacement (Ganymede is highly spherical)
    const ganymedeGeometry = useMemo(() => {
        const baseGeometry = new THREE.IcosahedronGeometry(GANYMEDE_RADIUS, 5);
        const geometry = baseGeometry.clone();
        
        const positionAttr = geometry.getAttribute("position");
        const positions = positionAttr.array as Float32Array;
        const vertex = new THREE.Vector3();
        const normal = new THREE.Vector3();
        
        // Extremely subtle displacement: 1% of radius (Ganymede is smooth)
        const displacementAmplitude = GANYMEDE_RADIUS * 0.01;
        
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

    // Material: color-corrected grayscale texture with warm brown-gray tint
    const ganymedeMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: ganymedeTexture,
            metalness: 0,
            roughness: 0.9,
            color: new THREE.Color(0xD0C8B8), // Subtle warm brown-gray tint for ancient ice-rock
        });
    }, [ganymedeTexture]);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const jupiterPosition = getPlanetOrbitPosition(currentDate, JUPITER_ORBIT_PARAMS);
        const ganymedeWorldPos = getGanymedeWorldPosition(currentDate, jupiterPosition);

        if (orbitRef.current) {
            orbitRef.current.position.copy(ganymedeWorldPos);
        }

        // Tidal locking rotation (Ganymede always faces Jupiter)
        if (ganymedeRef.current) {
            const ganymedeRelativePos = new THREE.Vector3().subVectors(
                ganymedeWorldPos,
                jupiterPosition
            );
            const rotationAngle = Math.atan2(ganymedeRelativePos.x, ganymedeRelativePos.z);
            ganymedeRef.current.rotation.y = rotationAngle;
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
        selectObject("ganymede");
    }, [selectObject]);

    return (
        <group ref={orbitRef}>
            <group ref={groupRef}>
                <mesh
                    ref={ganymedeRef}
                    name="ganymede"
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
                    <primitive object={ganymedeGeometry} attach="geometry" />
                    <primitive object={ganymedeMaterial} attach="material" />
                </mesh>
            </group>
        </group>
    );
}
