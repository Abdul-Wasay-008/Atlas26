"use client";

import * as THREE from "three";
import { useRef, useEffect, useState } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";

export default function Moon() {
    const moonRef = useRef<THREE.Mesh>(null);
    const orbitRef = useRef<THREE.Group>(null);

    const { size } = useThree();
    const [scale, setScale] = useState(1);

    // 📱 Responsive moon scale
    useEffect(() => {
        const width = size.width;

        let newScale = 1;
        if (width <= 480) newScale = 0.35;
        else if (width <= 768) newScale = 0.45;
        else if (width <= 1024) newScale = 0.55;
        else newScale = 0.6;

        setScale(newScale);
    }, [size.width]);

    // 🌕 Load Moon texture
    const moonTexture = useLoader(
        THREE.TextureLoader,
        "/textures/moon.jpg"
    );

    // 🔄 Orbit animation
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const orbitRadius = 2; // distance from Earth

        const x = Math.sin(t * 0.3) * orbitRadius;
        const z = Math.cos(t * 0.3) * orbitRadius;

        if (orbitRef.current) {
            orbitRef.current.position.set(x, 0, z);
        }

        if (moonRef.current) {
            moonRef.current.rotation.y += 0.002;
        }
    });

    return (
        <group ref={orbitRef} scale={scale}>
            <mesh ref={moonRef}>
                <sphereGeometry args={[0.27, 64, 64]} />
                <meshStandardMaterial map={moonTexture} />
            </mesh>
        </group>
    );
}
