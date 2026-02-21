"use client";

import * as THREE from "three";
import React, { useRef, useEffect, useState } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import {
    getPlanetOrbitPosition,
    VENUS_ORBIT_PARAMS,
    VENUS_AXIAL_TILT_RADIANS,
} from "@/app/astronomy/planetOrbit";

const VENUS_ROTATION_PERIOD_SECONDS = 243 * 24 * 60 * 60;
const VENUS_RADIUS = 0.8 * 0.95;
const ATMOSPHERE_SCALE = 1.025;

export default function Venus() {
    const surfaceRef = useRef<THREE.Mesh>(null);
    const atmosphereRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const tiltRef = useRef<THREE.Group>(null);
    const orbitRef = useRef<THREE.Group>(null);

    const selectObject = useSelectionStore((state) => state.selectObject);
    const [baseScale, setBaseScale] = useState(1);
    const [hovered, setHovered] = useState(false);
    const { size } = useThree();

    useEffect(() => {
        const width = size.width;
        setBaseScale(
            width <= 480 ? 0.7 :
                width <= 768 ? 0.9 :
                    width <= 1024 ? 0.9 :
                        width <= 1440 ? 0.95 : 1
        );
    }, [size.width]);

    const [surfaceTexture, atmosphereTexture] = useLoader(
        THREE.TextureLoader,
        [
            "/textures/venus_surface.jpg",
            "/textures/venus_atmosphere.jpg",
        ]
    );

    useEffect(() => {
        surfaceTexture.colorSpace = THREE.SRGBColorSpace;
        atmosphereTexture.colorSpace = THREE.SRGBColorSpace;
        surfaceTexture.minFilter = THREE.LinearMipmapLinearFilter;
        surfaceTexture.magFilter = THREE.LinearFilter;
        atmosphereTexture.minFilter = THREE.LinearMipmapLinearFilter;
        atmosphereTexture.magFilter = THREE.LinearFilter;
    }, [surfaceTexture, atmosphereTexture]);

    useEffect(() => {
        if (tiltRef.current) {
            tiltRef.current.rotation.x = VENUS_AXIAL_TILT_RADIANS;
        }
    }, []);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const t = currentDate.getTime() / 1000;

        if (orbitRef.current) {
            const pos = getPlanetOrbitPosition(currentDate, VENUS_ORBIT_PARAMS);
            orbitRef.current.position.copy(pos);
        }

        if (groupRef.current) {
            groupRef.current.rotation.y =
                (t / VENUS_ROTATION_PERIOD_SECONDS) * Math.PI * 2;
        }

        if (atmosphereRef.current) {
            atmosphereRef.current.rotation.y =
                (t / (VENUS_ROTATION_PERIOD_SECONDS * 0.8)) * Math.PI * 2;
        }

        if (groupRef.current) {
            const targetScale = hovered ? baseScale * 1.08 : baseScale;
            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }
    });

    const atmosphereRadius = VENUS_RADIUS * ATMOSPHERE_SCALE;

    return (
        <group ref={orbitRef}>
            <group ref={tiltRef}>
                <group ref={groupRef} scale={[baseScale, baseScale, baseScale]}>
                    {/* Inner sphere: Venus surface */}
                    <mesh
                        ref={surfaceRef}
                        name="venus"
                        onClick={() => selectObject("venus")}
                        onPointerOver={() => {
                            setHovered(true);
                            document.body.style.cursor = "pointer";
                        }}
                        onPointerOut={() => {
                            setHovered(false);
                            document.body.style.cursor = "default";
                        }}
                    >
                        <sphereGeometry args={[VENUS_RADIUS, 128, 128]} />
                        <meshBasicMaterial map={surfaceTexture} />
                    </mesh>

                    {/* Outer sphere: Venus atmosphere (cloud layer) */}
                    <mesh ref={atmosphereRef}>
                        <sphereGeometry args={[atmosphereRadius, 64, 64]} />
                        <meshBasicMaterial
                            map={atmosphereTexture}
                            transparent
                            opacity={0.85}
                            depthWrite={false}
                            side={THREE.FrontSide}
                        />
                    </mesh>
                </group>
            </group>
        </group>
    );
}
