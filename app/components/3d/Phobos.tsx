"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { getPhobosWorldPosition } from "@/app/astronomy/phobosOrbit";
import { getPlanetOrbitPosition, MARS_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";

export default function Phobos() {
    const phobosRef = useRef<THREE.Mesh>(null);
    const orbitRef = useRef<THREE.Group>(null);
    const groupRef = useRef<THREE.Group>(null);

    const selectObject = useSelectionStore((state) => state.selectObject);
    const [hovered, setHovered] = useState(false);

    const { size } = useThree();
    const [baseScale, setBaseScale] = useState(1);

    // Responsive sizing (Phobos is much smaller than Moon)
    useEffect(() => {
        const width = size.width;
        setBaseScale(
            width <= 480 ? 0.4 :
                width <= 768 ? 0.6 :
                    width <= 1024 ? 0.8 :
                        1.0
        );
    }, [size.width]);

    // Texture loading
    const phobosTexture = useLoader(THREE.TextureLoader, "/textures/Mars - Phobos.jpg");

    // Create material with dusty brown tint (matte, rocky appearance)
    const phobosMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: phobosTexture,
            color: new THREE.Color(0x9B8B7A), // Dusty brown-gray tint
            metalness: 0,
            roughness: 0.9,
        });
    }, [phobosTexture]);

    useFrame(() => {
        // Get current date from TimeManager (single source of truth)
        const currentDate = timeManager.getCurrentDate();

        // Get Mars's position around Sun
        const marsPosition = getPlanetOrbitPosition(currentDate, MARS_ORBIT_PARAMS);

        // Get Phobos position relative to Mars, then convert to world coords
        const phobosWorldPos = getPhobosWorldPosition(currentDate, marsPosition);

        if (orbitRef.current) {
            orbitRef.current.position.copy(phobosWorldPos);
        }

        // Phobos rotation (tidally locked to Mars)
        if (phobosRef.current) {
            const phobosRelativePos = new THREE.Vector3().subVectors(
                phobosWorldPos,
                marsPosition
            );
            const rotationAngle = Math.atan2(phobosRelativePos.x, phobosRelativePos.z);
            phobosRef.current.rotation.y = rotationAngle;
        }

        // Smooth hover scaling
        if (groupRef.current) {
            const targetScale = hovered ? baseScale * 1.12 : baseScale;
            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }
    });

    const handleClick = useCallback(() => {
        selectObject("phobos");
    }, [selectObject]);

    return (
        <group ref={orbitRef}>
            <group ref={groupRef}>
                <mesh
                    ref={phobosRef}
                    name="phobos"
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
                    <sphereGeometry args={[0.04, 32, 32]} />
                    <primitive object={phobosMaterial} attach="material" />
                </mesh>
            </group>
        </group>
    );
}
