"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { getNereidWorldPosition } from "@/app/astronomy/nereidOrbit";
import { getPlanetOrbitPosition, NEPTUNE_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";

const NEREID_RADIUS = 0.035;

function pseudoNoise3D(x: number, y: number, z: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
}

function nereidNoise(x: number, y: number, z: number): number {
    const lowFreq = pseudoNoise3D(x * 3, y * 3, z * 3, 501.0);
    const highFreq = pseudoNoise3D(x * 8, y * 8, z * 8, 902.0);
    return lowFreq * 0.006 + highFreq * 0.003;
}

export default function Nereid() {
    const nereidRef = useRef<THREE.Mesh>(null);
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

    const nereidTexture = useLoader(THREE.TextureLoader, "/textures/Neptune - Proteus.jpg");

    useEffect(() => {
        nereidTexture.colorSpace = THREE.SRGBColorSpace;
    }, [nereidTexture]);

    const nereidGeometry = useMemo(() => {
        const baseGeometry = new THREE.IcosahedronGeometry(NEREID_RADIUS, 4);
        const geometry = baseGeometry.clone();

        const positionAttr = geometry.getAttribute("position");
        const positions = positionAttr.array as Float32Array;
        const vertex = new THREE.Vector3();
        const normal = new THREE.Vector3();

        for (let i = 0; i < positionAttr.count; i++) {
            vertex.fromBufferAttribute(positionAttr, i);
            normal.copy(vertex).normalize();

            const displacement = nereidNoise(vertex.x, vertex.y, vertex.z);

            positions[i * 3] += normal.x * displacement;
            positions[i * 3 + 1] += normal.y * displacement;
            positions[i * 3 + 2] += normal.z * displacement;
        }

        positionAttr.needsUpdate = true;
        geometry.computeVertexNormals();

        return geometry;
    }, []);

    const nereidMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: nereidTexture,
            metalness: 0,
            roughness: 1,
        });
    }, [nereidTexture]);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const neptunePosition = getPlanetOrbitPosition(currentDate, NEPTUNE_ORBIT_PARAMS);
        const nereidWorldPos = getNereidWorldPosition(currentDate, neptunePosition);

        if (orbitRef.current) {
            orbitRef.current.position.copy(nereidWorldPos);
        }

        if (nereidRef.current) {
            const relative = new THREE.Vector3().subVectors(
                nereidWorldPos,
                neptunePosition
            );
            const rotationAngle = Math.atan2(relative.x, relative.z);
            nereidRef.current.rotation.y = rotationAngle;
        }

        if (groupRef.current) {
            const targetScale = hovered ? baseScale * 1.1 : baseScale;
            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }
    });

    const handleClick = useCallback(() => {
        selectObject("nereid");
    }, [selectObject]);

    return (
        <group ref={orbitRef}>
            <group ref={groupRef}>
                <mesh
                    ref={nereidRef}
                    name="nereid"
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
                    <primitive object={nereidGeometry} attach="geometry" />
                    <primitive object={nereidMaterial} attach="material" />
                </mesh>
            </group>
        </group>
    );
}

