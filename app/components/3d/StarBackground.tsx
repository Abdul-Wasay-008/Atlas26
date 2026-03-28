"use client";

import { useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef } from "react";

export default function StarBackground() {
    const starsRef = useRef<THREE.Mesh>(null);

    const texture = useLoader(THREE.TextureLoader, "/space/stars.jpg");
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    useFrame(() => {
        if (starsRef.current) {
            starsRef.current.rotation.y += 0.00013;
        }
    });

    return (
        <mesh ref={starsRef}>
            <sphereGeometry args={[100, 48, 48]} />
            <meshBasicMaterial
                map={texture}
                side={THREE.BackSide}
            />
        </mesh>
    );
}
