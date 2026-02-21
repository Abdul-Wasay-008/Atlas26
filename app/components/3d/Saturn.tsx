"use client";

import * as THREE from "three";
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import {
    getPlanetOrbitPosition,
    SATURN_ORBIT_PARAMS,
    SATURN_AXIAL_TILT_RADIANS,
} from "@/app/astronomy/planetOrbit";

const SATURN_ROTATION_PERIOD_SECONDS = 10.7 * 60 * 60;
const SATURN_RADIUS = 0.85;
const RING_INNER_RADIUS = SATURN_RADIUS * 1.2;
const RING_OUTER_RADIUS = SATURN_RADIUS * 2.3;

export default function Saturn() {
    const meshRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
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

    const planetTexture = useLoader(THREE.TextureLoader, "/textures/saturn.jpg");
    const ringTexture = useLoader(THREE.TextureLoader, "/textures/saturn_ring.png");

    useEffect(() => {
        planetTexture.colorSpace = THREE.SRGBColorSpace;
        planetTexture.minFilter = THREE.LinearMipmapLinearFilter;
        planetTexture.magFilter = THREE.LinearFilter;
    }, [planetTexture]);

    useEffect(() => {
        ringTexture.colorSpace = THREE.SRGBColorSpace;
        ringTexture.minFilter = THREE.LinearMipmapLinearFilter;
        ringTexture.magFilter = THREE.LinearFilter;
    }, [ringTexture]);

    useEffect(() => {
        if (tiltRef.current) {
            tiltRef.current.rotation.x = SATURN_AXIAL_TILT_RADIANS;
        }
    }, []);

    const ringGeometry = useMemo(() => {
        const geometry = new THREE.RingGeometry(RING_INNER_RADIUS, RING_OUTER_RADIUS, 128);
        const pos = geometry.attributes.position;
        const uv = geometry.attributes.uv;

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const dist = Math.sqrt(x * x + y * y);
            const u = (dist - RING_INNER_RADIUS) / (RING_OUTER_RADIUS - RING_INNER_RADIUS);
            uv.setXY(i, u, 0.5);
        }

        return geometry;
    }, []);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const t = currentDate.getTime() / 1000;

        if (orbitRef.current) {
            const pos = getPlanetOrbitPosition(currentDate, SATURN_ORBIT_PARAMS);
            orbitRef.current.position.copy(pos);
        }

        if (groupRef.current) {
            groupRef.current.rotation.y =
                (t / SATURN_ROTATION_PERIOD_SECONDS) * Math.PI * 2;
        }

        if (groupRef.current) {
            const targetScale = hovered ? baseScale * 1.08 : baseScale;
            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }
    });

    const handleClick = () => selectObject("saturn");
    const handlePointerOver = () => {
        setHovered(true);
        document.body.style.cursor = "pointer";
    };
    const handlePointerOut = () => {
        setHovered(false);
        document.body.style.cursor = "default";
    };

    return (
        <group ref={orbitRef}>
            <group ref={tiltRef}>
                <group ref={groupRef} scale={[baseScale, baseScale, baseScale]}>
                    <mesh
                        ref={meshRef}
                        name="saturn"
                        onClick={handleClick}
                        onPointerOver={handlePointerOver}
                        onPointerOut={handlePointerOut}
                    >
                        <sphereGeometry args={[SATURN_RADIUS, 128, 128]} />
                        <meshBasicMaterial map={planetTexture} />
                    </mesh>

                    <mesh
                        ref={ringRef}
                        rotation-x={Math.PI / 2}
                        onClick={handleClick}
                        onPointerOver={handlePointerOver}
                        onPointerOut={handlePointerOut}
                    >
                        <primitive object={ringGeometry} attach="geometry" />
                        <meshBasicMaterial
                            map={ringTexture}
                            side={THREE.DoubleSide}
                            transparent
                            opacity={0.9}
                        />
                    </mesh>
                </group>
            </group>
        </group>
    );
}
