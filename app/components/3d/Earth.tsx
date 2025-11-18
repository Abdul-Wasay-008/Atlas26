"use client";

import * as THREE from "three";
import { useRef, useEffect, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";

export default function Earth() {
    const earthRef = useRef<THREE.Mesh>(null);
    const cloudsRef = useRef<THREE.Mesh>(null);
    const [scale, setScale] = useState(1); // responsive scale state

    //  Responsive scale based on screen size
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 480) setScale(0.65); // phones
            else if (width < 768) setScale(0.85); // tablets
            else setScale(1); // desktops
        };

        handleResize(); // initial call
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    //  Load textures
    const [colorMap, normalMap, specularMap, cloudsMap, nightMap] = useLoader(THREE.TextureLoader, [
        "/textures/earth_daymap.jpg",
        "/textures/earth_normal.jpg",
        "/textures/earth_specular.jpg",
        "/textures/earth_clouds.jpg",
        "/textures/earth_nightmap.jpg",
    ]);

    //  Rotation animation (Earth + Clouds)
    useFrame(() => {
        if (earthRef.current) earthRef.current.rotation.y += 0.0008;
        if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0006;
    });

    return (
        <group scale={[scale, scale, scale]}> {/* apply scale here */}
            {/* ☁️ Clouds Layer */}
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

            {/* 🌍 Earth Body */}
            <mesh ref={earthRef}>
                <sphereGeometry args={[0.8, 128, 128]} />
                <meshPhongMaterial
                    map={colorMap}
                    normalMap={normalMap}
                    specularMap={specularMap}
                    shininess={25}
                />
            </mesh>

            {/* 🌃 Night Lights Layer */}
            <mesh>
                <sphereGeometry args={[0.75, 64, 64]} />
                <meshBasicMaterial map={nightMap} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* 🌌 Atmosphere Glow */}
            <mesh>
                <sphereGeometry args={[0.88, 64, 64]} />
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
