"use client";

import React, { useRef } from "react";
import { Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Starfield() {
    const starsRef = useRef<THREE.Points | null>(null);

    useFrame(() => {
        if (starsRef.current) {
            starsRef.current.rotation.y += 0.0005; // left-to-right spin
        }
    });

    return (
        <Stars
            ref={starsRef}
            radius={300}
            depth={60}
            count={18000}
            factor={7}
            saturation={0}
            fade
            speed={1}
        />
    );
}
