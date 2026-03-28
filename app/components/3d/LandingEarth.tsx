"use client";

import * as THREE from "three";
import { useRef, useEffect, useState } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";

export default function LandingEarth() {
    const earthRef = useRef<THREE.Mesh>(null);
    const cloudsRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);

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
        [
            "/textures/earth_daymap_4k.jpg",
            "/textures/earth_normal.jpg",
            "/textures/earth_specular.jpg",
            "/textures/earth_clouds.jpg",
            "/textures/earth_nightmap.jpg",
        ]
    );

    useFrame(() => {
        if (earthRef.current) earthRef.current.rotation.y += 0.0008;
        if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0006;

        if (groupRef.current) {
            const targetScale = hovered ? baseScale * 1.08 : baseScale;
            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }
    });

    return (
        <group ref={groupRef} scale={[baseScale, baseScale, baseScale]}>
            {/* Clouds */}
            <mesh ref={cloudsRef}>
                <sphereGeometry args={[0.81, 48, 48]} />
                <meshPhongMaterial
                    map={cloudsMap}
                    opacity={0.4}
                    depthWrite={false}
                    transparent
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Earth */}
            <mesh
                ref={earthRef}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <sphereGeometry args={[0.8, 64, 64]} />
                <meshPhongMaterial
                    map={colorMap}
                    normalMap={normalMap}
                    specularMap={specularMap}
                    shininess={25}
                />
            </mesh>

            {/* Night Lights */}
            <mesh>
                <sphereGeometry args={[0.75, 32, 32]} />
                <meshBasicMaterial map={nightMap} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* Atmosphere */}
            <mesh>
                <sphereGeometry args={[0.88, 48, 48]} />
                <shaderMaterial
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    side={THREE.BackSide}
                    vertexShader={`
                        varying vec3 vNormal;
                        void main() {
                            vNormal = normalize(normalMatrix * normal);
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `}
                    fragmentShader={`
                        varying vec3 vNormal;
                        void main() {
                            float intensity = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
                            gl_FragColor = vec4(0.1, 0.4, 1.0, 0.25) * intensity;
                        }
                    `}
                />
            </mesh>
        </group>
    );
}
