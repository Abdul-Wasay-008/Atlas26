"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { timeEngine } from "@/app/core/time";

export default function MoonOrbitPath() {
    const orbitRadius = 2;
    const groupRef = useMemo(() => new THREE.Group(), []);

    // Earth's orbital parameters (same as in Earth.tsx)
    const EARTH_ORBITAL_PERIOD = 365.25 * 24 * 60 * 60; // seconds
    const EARTH_ORBIT_RADIUS = 4.5; // Distance from Sun

    const orbitLine = useMemo(() => {
        const segments = 256;
        const points = [];

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(
                new THREE.Vector3(
                    Math.sin(angle) * orbitRadius,
                    0,
                    Math.cos(angle) * orbitRadius
                )
            );
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineDashedMaterial({
            color: "#6ea8ff",
            dashSize: 0.12,   // length of dash
            gapSize: 0.08,    // spacing
            opacity: 0.35,
            transparent: true,
        });

        const line = new THREE.Line(geometry, material);
        line.computeLineDistances(); // 🔥 REQUIRED for dashed lines

        groupRef.add(line);
        return groupRef;
    }, [groupRef]);

    // Update orbit path position to follow Earth
    useFrame(() => {
        const t = timeEngine.getTime();
        
        // Calculate Earth's position around Sun
        const earthOrbitAngle =
            ((t % EARTH_ORBITAL_PERIOD) / EARTH_ORBITAL_PERIOD) * Math.PI * 2;
        const earthX = Math.cos(earthOrbitAngle) * EARTH_ORBIT_RADIUS;
        const earthZ = Math.sin(earthOrbitAngle) * EARTH_ORBIT_RADIUS;
        
        // Move the orbit path to follow Earth
        groupRef.position.set(earthX, 0, earthZ);
    });

    return <primitive object={orbitLine} />;
}