"use client";

import * as THREE from "three";
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import {
    getEarthOrbitPosition,
    EARTH_AXIAL_TILT_RADIANS,
} from "@/app/astronomy/earthOrbit";
import { createPlanetDayNightMaterial } from "./PlanetDayNightMaterial";

export default function Earth({ children }: { children?: React.ReactNode }) {
    const earthRef = useRef<THREE.Mesh>(null);
    const cloudsRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const tiltRef = useRef<THREE.Group>(null);
    const orbitRef = useRef<THREE.Group>(null);

    const selectObject = useSelectionStore((state) => state.selectObject);

    const [baseScale, setBaseScale] = useState(1);
    const [hovered, setHovered] = useState(false);
    const { size } = useThree();

    // 📱 Responsive scale
    useEffect(() => {
        const width = size.width;
        setBaseScale(
            width <= 480 ? 0.7 :
                width <= 768 ? 0.9 :
                    width <= 1024 ? 0.9 :
                        width <= 1440 ? 0.95 : 1
        );
    }, [size.width]);

    // 🌍 Load textures (original order: day, normal, specular, clouds, night)
    const [colorMap, normalMap, specularMap, cloudsMap, nightMap] = useLoader(
        THREE.TextureLoader,
        [
            "/textures/earth_daymap.jpg",
            "/textures/earth_normal.jpg",
            "/textures/earth_specular.jpg",
            "/textures/earth_clouds.jpg",
            "/textures/earth_nightmap.jpg",
        ]
    );

    // Configure texture color spaces
    useEffect(() => {
        // Color textures should use sRGB color space
        colorMap.colorSpace = THREE.SRGBColorSpace;
        nightMap.colorSpace = THREE.SRGBColorSpace;
        cloudsMap.colorSpace = THREE.SRGBColorSpace;

        // Normal and specular maps are linear (no color space conversion needed)
        normalMap.minFilter = THREE.LinearMipmapLinearFilter;
        normalMap.magFilter = THREE.LinearFilter;
        specularMap.minFilter = THREE.LinearMipmapLinearFilter;
        specularMap.magFilter = THREE.LinearFilter;

        // Enable mipmaps and set filtering for color textures
        colorMap.minFilter = THREE.LinearMipmapLinearFilter;
        colorMap.magFilter = THREE.LinearFilter;
        nightMap.minFilter = THREE.LinearMipmapLinearFilter;
        nightMap.magFilter = THREE.LinearFilter;
        cloudsMap.minFilter = THREE.LinearMipmapLinearFilter;
        cloudsMap.magFilter = THREE.LinearFilter;
    }, [colorMap, normalMap, specularMap, cloudsMap, nightMap]);

    // 🌍 Create day/night terminator material
    const dayNightMaterial = useMemo(
        () =>
            createPlanetDayNightMaterial({
                dayTexture: colorMap,
                nightTexture: nightMap,
                normalTexture: normalMap,
                specularTexture: specularMap,
                shininess: 25,
            }),
        [colorMap, nightMap, normalMap, specularMap]
    );

    const EARTH_DAY = 24 * 60 * 60; // seconds
    const ORBIT_RADIUS = 4.8; // Distance from Sun

    // 🌍 Apply axial tilt (FIXED in inertial space, does NOT rotate with orbit)
    useEffect(() => {
        if (tiltRef.current) {
            tiltRef.current.rotation.x = EARTH_AXIAL_TILT_RADIANS;
        }
    }, []);

    useFrame(() => {
        // Get current date from TimeManager (single source of truth)
        const currentDate = timeManager.getCurrentDate();
        const t = currentDate.getTime() / 1000; // Convert to seconds for rotation

        // 🌍 Earth orbital position around Sun (astronomically accurate)
        if (orbitRef.current) {
            const earthPosition = getEarthOrbitPosition(currentDate, ORBIT_RADIUS);
            orbitRef.current.position.copy(earthPosition);
        }

        // 🌍 Earth rotation (24-hour day, absolute time-based)
        if (groupRef.current) {
            groupRef.current.rotation.y = (t / EARTH_DAY) * Math.PI * 2;
        }

        // ☁️ Clouds rotate slightly faster (relative to Earth)
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y = (t / (EARTH_DAY * 0.9)) * Math.PI * 2;
        }

        // 🎯 Smooth hover scaling
        if (groupRef.current) {
            const targetScale = hovered ? baseScale * 1.08 : baseScale;
            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }

        // 🌅 Update day/night terminator based on Sun position
        if (earthRef.current && dayNightMaterial) {
            const sunWorldPos = new THREE.Vector3(0, 0, 0);
            earthRef.current.updateMatrixWorld(true);
            const earthWorldPos = new THREE.Vector3();
            earthRef.current.getWorldPosition(earthWorldPos);
            const earthToSunDir = new THREE.Vector3()
                .subVectors(sunWorldPos, earthWorldPos)
                .normalize();
            dayNightMaterial.uniforms.uSunDirection.value.copy(earthToSunDir);
        }

        // 🔍 Debug logging (dev mode only, throttled)
        if (process.env.NODE_ENV === "development") {
            const debugInterval = 5000;
            const now = Date.now();
            if (!(window as any).__earthDebugLastLog || now - (window as any).__earthDebugLastLog > debugInterval) {
                const { getSeason } = require("@/app/astronomy/earthOrbit");
                const season = getSeason(currentDate);
                console.log(
                    `🌍 Earth Debug: ${season} | UTC: ${currentDate.toISOString()}`
                );
                (window as any).__earthDebugLastLog = now;
            }
        }
    });

    return (
        <group ref={orbitRef}>
            <group ref={tiltRef}>
                <group ref={groupRef} scale={[baseScale, baseScale, baseScale]}>
                    {/* ☁️ Clouds */}
                    <mesh ref={cloudsRef}>
                        <sphereGeometry args={[0.81, 64, 64]} />
                        <meshPhongMaterial
                            map={cloudsMap}
                            opacity={0.4}
                            depthWrite={false}
                            transparent
                            side={THREE.DoubleSide}
                        />
                    </mesh>

                    {/* 🌍 Interactive Earth layer */}
                    <mesh
                        ref={earthRef}
                        name="earth"
                        onClick={() => selectObject("earth")}
                        onPointerOver={() => {
                            setHovered(true);
                            document.body.style.cursor = "pointer";
                        }}
                        onPointerOut={() => {
                            setHovered(false);
                            document.body.style.cursor = "default";
                        }}
                    >
                        <sphereGeometry args={[0.8, 128, 128]} />
                        <primitive object={dayNightMaterial} attach="material" />
                    </mesh>

                    {children}
                </group>
            </group>
        </group>
    );
}
