"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { getOberonWorldPosition } from "@/app/astronomy/oberonOrbit";
import { getPlanetOrbitPosition, URANUS_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";

const OBERON_RADIUS = 0.115;

/**
 * Simple deterministic pseudo-noise for subtle vertex displacement.
 */
function pseudoNoise3D(x: number, y: number, z: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
}

function subtleNoise(x: number, y: number, z: number): number {
    const lowFreq = pseudoNoise3D(x * 3, y * 3, z * 3, 42.0) * 0.7;
    const medFreq = pseudoNoise3D(x * 6, y * 6, z * 6, 43.0) * 0.3;
    return lowFreq + medFreq;
}

export default function Oberon() {
    const oberonRef = useRef<THREE.Mesh>(null);
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

    const oberonTexture = useLoader(THREE.TextureLoader, "/textures/Uranus - Oberon.jpg");

    useEffect(() => {
        oberonTexture.colorSpace = THREE.SRGBColorSpace;
    }, [oberonTexture]);

    // Geometry with subtle displacement for cratered moon surface
    const oberonGeometry = useMemo(() => {
        const baseGeometry = new THREE.IcosahedronGeometry(OBERON_RADIUS, 5);
        const geometry = baseGeometry.clone();

        const positionAttr = geometry.getAttribute("position");
        const positions = positionAttr.array as Float32Array;
        const vertex = new THREE.Vector3();
        const normal = new THREE.Vector3();

        const displacementAmplitude = OBERON_RADIUS * 0.02;

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

    // Material: dark cratered moon, roughness 1, metalness 0 per spec
    const oberonMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: oberonTexture,
            metalness: 0,
            roughness: 1,
        });
    }, [oberonTexture]);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const uranusPosition = getPlanetOrbitPosition(currentDate, URANUS_ORBIT_PARAMS);
        const oberonWorldPos = getOberonWorldPosition(currentDate, uranusPosition);

        if (orbitRef.current) {
            orbitRef.current.position.copy(oberonWorldPos);
        }

        // Tidal locking rotation (Oberon always faces Uranus)
        if (oberonRef.current) {
            const oberonRelativePos = new THREE.Vector3().subVectors(
                oberonWorldPos,
                uranusPosition
            );
            const rotationAngle = Math.atan2(oberonRelativePos.x, oberonRelativePos.z);
            oberonRef.current.rotation.y = rotationAngle;
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
        selectObject("oberon");
    }, [selectObject]);

    return (
        <group ref={orbitRef}>
            <group ref={groupRef}>
                <mesh
                    ref={oberonRef}
                    name="oberon"
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
                    <primitive object={oberonGeometry} attach="geometry" />
                    <primitive object={oberonMaterial} attach="material" />
                </mesh>
            </group>
        </group>
    );
}
