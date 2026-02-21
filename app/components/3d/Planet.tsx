"use client";

import * as THREE from "three";
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { getEarthOrbitPosition } from "@/app/astronomy/earthOrbit";
import {
    getPlanetOrbitPosition,
    PlanetOrbitParams,
} from "@/app/astronomy/planetOrbit";
import { createPlanetDayNightMaterial } from "./PlanetDayNightMaterial";

export type PlanetOrbitConfig =
    | { type: "earth"; radius?: number }
    | { type: "planet"; params: PlanetOrbitParams };

export interface PlanetConfig {
    id: string;
    orbit: PlanetOrbitConfig;
    rotationPeriodSeconds: number;
    axialTiltRadians: number;
    /** Sphere radius in scene units (e.g. 0.8 for Earth) */
    radiusScale: number;
    /** [day, night, normal?, specular?, clouds?] - use same path for unused slots (e.g. Mars: 5x mars.jpg) */
    textureUrls: [string, string, string, string, string];
    hasClouds: boolean;
    /** Cloud layer radius scale relative to planet (default 1.0125) */
    cloudScale?: number;
    /** Day-night terminator softness (default 0.04). Larger = softer transition. */
    terminatorWidth?: number;
    /** If true, planet is fully lit (no shadow) */
    noShadow?: boolean;
    children?: React.ReactNode;
}

export default function Planet({
    id,
    orbit,
    rotationPeriodSeconds,
    axialTiltRadians,
    radiusScale,
    textureUrls,
    hasClouds,
    cloudScale = 1.0125,
    terminatorWidth = 0.04,
    noShadow = false,
    children,
}: PlanetConfig) {
    const planetRef = useRef<THREE.Mesh>(null);
    const cloudsRef = useRef<THREE.Mesh>(null);
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

    const [colorMap, normalMap, specularMap, cloudsMap, nightMap] = useLoader(
        THREE.TextureLoader,
        textureUrls
    );

    useEffect(() => {
        colorMap.colorSpace = THREE.SRGBColorSpace;
        nightMap.colorSpace = THREE.SRGBColorSpace;
        cloudsMap.colorSpace = THREE.SRGBColorSpace;
        normalMap.minFilter = THREE.LinearMipmapLinearFilter;
        normalMap.magFilter = THREE.LinearFilter;
        specularMap.minFilter = THREE.LinearMipmapLinearFilter;
        specularMap.magFilter = THREE.LinearFilter;
        colorMap.minFilter = THREE.LinearMipmapLinearFilter;
        colorMap.magFilter = THREE.LinearFilter;
        nightMap.minFilter = THREE.LinearMipmapLinearFilter;
        nightMap.magFilter = THREE.LinearFilter;
        cloudsMap.minFilter = THREE.LinearMipmapLinearFilter;
        cloudsMap.magFilter = THREE.LinearFilter;
    }, [colorMap, normalMap, specularMap, cloudsMap, nightMap]);

    const dayNightMaterial = useMemo(
        () =>
            createPlanetDayNightMaterial({
                dayTexture: colorMap,
                nightTexture: nightMap,
                normalTexture: normalMap,
                specularTexture: specularMap,
                shininess: 25,
                terminatorWidth,
                noShadow,
            }),
        [colorMap, nightMap, normalMap, specularMap, terminatorWidth, noShadow]
    );

    useEffect(() => {
        if (tiltRef.current) {
            tiltRef.current.rotation.x = axialTiltRadians;
        }
    }, [axialTiltRadians]);

    useFrame(() => {
        const currentDate = timeManager.getCurrentDate();
        const t = currentDate.getTime() / 1000;

        if (orbitRef.current) {
            if (orbit.type === "earth") {
                const pos = getEarthOrbitPosition(
                    currentDate,
                    orbit.radius ?? 4.8
                );
                orbitRef.current.position.copy(pos);
            } else {
                const pos = getPlanetOrbitPosition(currentDate, orbit.params);
                orbitRef.current.position.copy(pos);
            }
        }

        if (groupRef.current) {
            groupRef.current.rotation.y =
                (t / rotationPeriodSeconds) * Math.PI * 2;
        }

        if (hasClouds && cloudsRef.current) {
            cloudsRef.current.rotation.y =
                (t / (rotationPeriodSeconds * 0.9)) * Math.PI * 2;
        }

        if (groupRef.current) {
            const targetScale = hovered ? baseScale * 1.08 : baseScale;
            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }

        if (planetRef.current && dayNightMaterial) {
            const sunWorldPos = new THREE.Vector3(0, 0, 0);
            planetRef.current.updateMatrixWorld(true);
            const planetWorldPos = new THREE.Vector3();
            planetRef.current.getWorldPosition(planetWorldPos);
            const planetToSunDir = new THREE.Vector3()
                .subVectors(sunWorldPos, planetWorldPos)
                .normalize();
            dayNightMaterial.uniforms.uSunDirection.value.copy(planetToSunDir);
        }
    });

    const cloudRadius = radiusScale * cloudScale;

    return (
        <group ref={orbitRef}>
            <group ref={tiltRef}>
                <group ref={groupRef} scale={[baseScale, baseScale, baseScale]}>
                    {hasClouds && (
                        <mesh ref={cloudsRef}>
                            <sphereGeometry args={[cloudRadius, 64, 64]} />
                            <meshPhongMaterial
                                map={cloudsMap}
                                opacity={0.4}
                                depthWrite={false}
                                transparent
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                    )}

                    <mesh
                        ref={planetRef}
                        name={id}
                        onClick={() => selectObject(id)}
                        onPointerOver={() => {
                            setHovered(true);
                            document.body.style.cursor = "pointer";
                        }}
                        onPointerOut={() => {
                            setHovered(false);
                            document.body.style.cursor = "default";
                        }}
                    >
                        <sphereGeometry args={[radiusScale, 128, 128]} />
                        <primitive object={dayNightMaterial} attach="material" />
                    </mesh>

                    {children}
                </group>
            </group>
        </group>
    );
}
