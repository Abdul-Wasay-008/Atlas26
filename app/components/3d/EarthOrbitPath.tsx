"use client";

import { useMemo } from "react";
import * as THREE from "three";

export default function EarthOrbitPath() {
    // Earth's orbital radius (same as in Earth.tsx)
    const EARTH_ORBIT_RADIUS = 4.5; // Distance from Sun

    const orbitLine = useMemo(() => {
        const segments = 256;
        const points = [];

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(
                new THREE.Vector3(
                    Math.cos(angle) * EARTH_ORBIT_RADIUS,
                    0,
                    Math.sin(angle) * EARTH_ORBIT_RADIUS
                )
            );
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineDashedMaterial({
            color: "#52c41a", // Green color to distinguish from Moon's blue orbit
            dashSize: 0.12,   // length of dash
            gapSize: 0.08,    // spacing
            opacity: 0.35,
            transparent: true,
        });

        const line = new THREE.Line(geometry, material);
        line.computeLineDistances(); // 🔥 REQUIRED for dashed lines

        return line;
    }, []);

    return <primitive object={orbitLine} />;
}


