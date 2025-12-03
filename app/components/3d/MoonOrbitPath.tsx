"use client";

import { useMemo, useEffect } from "react";
import * as THREE from "three";

export default function MoonOrbitPath() {
    const orbitRadius = 2;

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

        return line;
    }, []);

    return <primitive object={orbitLine} />;
}