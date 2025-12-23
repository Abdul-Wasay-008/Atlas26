// "use client";

// import * as THREE from "three";
// import { useRef, useEffect, useState } from "react";
// import { useFrame, useLoader, useThree } from "@react-three/fiber";
// import { useSelectionStore } from "@/app/store/selectionStore";

// export default function Earth() {
//     const earthRef = useRef<THREE.Mesh>(null);
//     const cloudsRef = useRef<THREE.Mesh>(null);
//     const groupRef = useRef<THREE.Group>(null);

//     const selectObject = useSelectionStore((state) => state.selectObject);

//     const [baseScale, setBaseScale] = useState(1);
//     const [hovered, setHovered] = useState(false);
//     const { size } = useThree();

//     // 📱 Responsive scale
//     useEffect(() => {
//         const width = size.width;
//         setBaseScale(
//             width <= 480 ? 0.7 :
//                 width <= 768 ? 0.9 :
//                     width <= 1024 ? 0.9 :
//                         width <= 1440 ? 0.95 : 1
//         );
//     }, [size.width]);

//     // 🌍 Load textures
//     const [colorMap, normalMap, specularMap, cloudsMap, nightMap] = useLoader(
//         THREE.TextureLoader,
//         [
//             "/textures/earth_daymap.jpg",
//             "/textures/earth_normal.jpg",
//             "/textures/earth_specular.jpg",
//             "/textures/earth_clouds.jpg",
//             "/textures/earth_nightmap.jpg",
//         ]
//     );

//     // 🌎 Rotation Animation + Hover Scale Animation
//     useFrame(() => {
//         if (earthRef.current) earthRef.current.rotation.y += 0.0008;
//         if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0006;

//         // 🎯 Apply smooth hover scaling
//         if (groupRef.current) {
//             const targetScale = hovered ? baseScale * 1.08 : baseScale;
//             groupRef.current.scale.lerp(
//                 new THREE.Vector3(targetScale, targetScale, targetScale),
//                 0.12 // smooth animation strength
//             );
//         }
//     });

//     return (
//         <group ref={groupRef} scale={[baseScale, baseScale, baseScale]}>

//             {/* ☁️ Clouds */}
//             <mesh ref={cloudsRef}>
//                 <sphereGeometry args={[0.81, 64, 64]} />
//                 <meshPhongMaterial
//                     map={cloudsMap}
//                     opacity={0.4}
//                     depthWrite={false}
//                     transparent
//                     side={THREE.DoubleSide}
//                 />
//             </mesh>

//             {/* 🌍 Interactive Earth layer */}
//             <mesh
//                 ref={earthRef}
//                 onClick={() => selectObject("earth")}
//                 onPointerOver={() => {
//                     setHovered(true);
//                     document.body.style.cursor = "pointer";
//                 }}
//                 onPointerOut={() => {
//                     setHovered(false);
//                     document.body.style.cursor = "default";
//                 }}
//             >
//                 <sphereGeometry args={[0.8, 128, 128]} />
//                 <meshPhongMaterial
//                     map={colorMap}
//                     normalMap={normalMap}
//                     specularMap={specularMap}
//                     shininess={25}
//                 />
//             </mesh>

//             {/* 🌃 Night Lights */}
//             <mesh>
//                 <sphereGeometry args={[0.75, 64, 64]} />
//                 <meshBasicMaterial map={nightMap} blending={THREE.AdditiveBlending} />
//             </mesh>

//             {/* ✨ Atmosphere */}
//             <mesh>
//                 <sphereGeometry args={[0.88, 64, 64]} />
//                 <shaderMaterial
//                     transparent
//                     blending={THREE.AdditiveBlending}
//                     depthWrite={false}
//                     side={THREE.BackSide}
//                     vertexShader={`
//                         varying vec3 vNormal;
//                         void main() {
//                             vNormal = normalize(normalMatrix * normal);
//                             gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//                         }
//                     `}
//                     fragmentShader={`
//                         varying vec3 vNormal;
//                         void main() {
//                             float intensity = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
//                             gl_FragColor = vec4(0.1, 0.4, 1.0, 0.25) * intensity;
//                         }
//                     `}
//                 />
//             </mesh>

//         </group>
//     );
// }



"use client";

import * as THREE from "three";
import { useRef, useEffect, useState } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeEngine } from "@/app/core/time";

export default function Earth() {
    const earthRef = useRef<THREE.Mesh>(null);
    const cloudsRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);

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

    // 🌍 Load textures
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

    const EARTH_DAY = 24 * 60 * 60; // seconds

    useFrame(() => {
        const t = timeEngine.getTime();

        // 🌍 Earth rotation (absolute, time-based)
        if (earthRef.current) {
            earthRef.current.rotation.y = (t / EARTH_DAY) * Math.PI * 2;
        }

        // ☁️ Clouds rotate slightly faster
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y = (t / (EARTH_DAY * 0.9)) * Math.PI * 2;
        }

        // 🎯 Smooth hover scaling (still frame-based, which is OK)
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
                <meshPhongMaterial
                    map={colorMap}
                    normalMap={normalMap}
                    specularMap={specularMap}
                    shininess={25}
                />
            </mesh>

            {/* 🌃 Night Lights */}
            <mesh>
                <sphereGeometry args={[0.75, 64, 64]} />
                <meshBasicMaterial map={nightMap} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* ✨ Atmosphere */}
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