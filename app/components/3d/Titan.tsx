"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { getTitanWorldPosition } from "@/app/astronomy/titanOrbit";
import { getPlanetOrbitPosition, SATURN_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";

// Titan is ~5.5% larger than Mercury (Mercury radius = 0.8 * 0.38 = 0.304)
const MERCURY_SCENE_RADIUS = 0.8 * 0.38;
const TITAN_RADIUS = MERCURY_SCENE_RADIUS * 1.055;

export default function Titan() {
    const titanRef = useRef<THREE.Mesh>(null);
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

    const titanTexture = useLoader(THREE.TextureLoader, "/textures/Saturn - Titan.jpg");

    useEffect(() => {
        titanTexture.colorSpace = THREE.SRGBColorSpace;
    }, [titanTexture]);

    // Geometry: Titan is roughly spherical, no vertex displacement
    const titanGeometry = useMemo(() => {
        return new THREE.IcosahedronGeometry(TITAN_RADIUS, 5);
    }, []);

    // Material: matte appearance due to thick atmospheric haze
    const titanMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: titanTexture,
            metalness: 0,
            roughness: 0.9,
        });
    }, [titanTexture]);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const saturnPosition = getPlanetOrbitPosition(currentDate, SATURN_ORBIT_PARAMS);
        const titanWorldPos = getTitanWorldPosition(currentDate, saturnPosition);

        if (orbitRef.current) {
            orbitRef.current.position.copy(titanWorldPos);
        }

        // Tidal locking rotation (Titan always faces Saturn)
        if (titanRef.current) {
            const titanRelativePos = new THREE.Vector3().subVectors(
                titanWorldPos,
                saturnPosition
            );
            const rotationAngle = Math.atan2(titanRelativePos.x, titanRelativePos.z);
            titanRef.current.rotation.y = rotationAngle;
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
        selectObject("titan");
    }, [selectObject]);

    return (
        <group ref={orbitRef}>
            <group ref={groupRef}>
                <mesh
                    ref={titanRef}
                    name="titan"
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
                    <primitive object={titanGeometry} attach="geometry" />
                    <primitive object={titanMaterial} attach="material" />
                </mesh>
            </group>
        </group>
    );
}
