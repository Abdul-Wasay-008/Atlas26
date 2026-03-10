"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { getTethysWorldPosition } from "@/app/astronomy/tethysOrbit";
import { getPlanetOrbitPosition, SATURN_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";

const TETHYS_RADIUS = 0.065;

/**
 * Simple deterministic pseudo-noise for subtle vertex displacement.
 */
function pseudoNoise3D(x: number, y: number, z: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
}

function subtleNoise(x: number, y: number, z: number): number {
    const lowFreq = pseudoNoise3D(x * 3, y * 3, z * 3, 30.0) * 0.7;
    const medFreq = pseudoNoise3D(x * 6, y * 6, z * 6, 31.0) * 0.3;
    return lowFreq + medFreq;
}

export default function Tethys() {
    const tethysRef = useRef<THREE.Mesh>(null);
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

    const tethysTexture = useLoader(THREE.TextureLoader, "/textures/Saturn - Tethys.jpg");

    useEffect(() => {
        tethysTexture.colorSpace = THREE.SRGBColorSpace;
    }, [tethysTexture]);

    // Geometry with subtle displacement for icy moon surface
    const tethysGeometry = useMemo(() => {
        const baseGeometry = new THREE.IcosahedronGeometry(TETHYS_RADIUS, 5);
        const geometry = baseGeometry.clone();

        const positionAttr = geometry.getAttribute("position");
        const positions = positionAttr.array as Float32Array;
        const vertex = new THREE.Vector3();
        const normal = new THREE.Vector3();

        const displacementAmplitude = TETHYS_RADIUS * 0.02;

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

    // Material: icy moon with light grey/white coloration
    const tethysMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: tethysTexture,
            metalness: 0,
            roughness: 0.85,
            color: new THREE.Color(0xEFEFEF),
        });
    }, [tethysTexture]);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const saturnPosition = getPlanetOrbitPosition(currentDate, SATURN_ORBIT_PARAMS);
        const tethysWorldPos = getTethysWorldPosition(currentDate, saturnPosition);

        if (orbitRef.current) {
            orbitRef.current.position.copy(tethysWorldPos);
        }

        // Tidal locking rotation (Tethys always faces Saturn)
        if (tethysRef.current) {
            const tethysRelativePos = new THREE.Vector3().subVectors(
                tethysWorldPos,
                saturnPosition
            );
            const rotationAngle = Math.atan2(tethysRelativePos.x, tethysRelativePos.z);
            tethysRef.current.rotation.y = rotationAngle;
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
        selectObject("tethys");
    }, [selectObject]);

    return (
        <group ref={orbitRef}>
            <group ref={groupRef}>
                <mesh
                    ref={tethysRef}
                    name="tethys"
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
                    <primitive object={tethysGeometry} attach="geometry" />
                    <primitive object={tethysMaterial} attach="material" />
                </mesh>
            </group>
        </group>
    );
}
