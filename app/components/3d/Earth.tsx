// "use client";

// import * as THREE from "three";
// import { useRef, useEffect, useState } from "react";
// import { useFrame, useLoader, useThree } from "@react-three/fiber";

// export default function Earth() {
//     const earthRef = useRef<THREE.Mesh>(null);
//     const cloudsRef = useRef<THREE.Mesh>(null);

//     const [scale, setScale] = useState(1);

//     // ✅ Get canvas size instead of window size
//     const { size } = useThree();

//     // ✅ Responsive scale based on canvas width
//     useEffect(() => {
//         const width = size.width;

//         let newScale = 1;

//         if (width <= 480) {
//             newScale = 0.7;       // phones
//         } else if (width > 480 && width <= 768) {
//             newScale = 0.9;      // tablets
//         } else if (width > 768 && width <= 1024) {
//             newScale = 0.9;       // small laptops
//         } else if (width > 1024 && width <= 1440) {
//             newScale = 0.95;       // large laptops
//         } else {
//             newScale = 1;         // desktops
//         }

//         setScale(newScale);
//         console.log("Canvas Width:", width, "→ Scale:", newScale); // Debug line
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

//     // 🌎 Rotation animation
//     useFrame(() => {
//         if (earthRef.current) earthRef.current.rotation.y += 0.0008;
//         if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0006;
//     });

//     return (
//         <group scale={[scale, scale, scale]}>

//             {/* ☁️ Clouds Layer */}
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

//             {/* 🌍 Earth Body */}
//             <mesh ref={earthRef}>
//                 <sphereGeometry args={[0.8, 128, 128]} />
//                 <meshPhongMaterial
//                     map={colorMap}
//                     normalMap={normalMap}
//                     specularMap={specularMap}
//                     shininess={25}
//                 />
//             </mesh>

//             {/* 🌃 Night Lights Layer */}
//             <mesh>
//                 <sphereGeometry args={[0.75, 64, 64]} />
//                 <meshBasicMaterial
//                     map={nightMap}
//                     blending={THREE.AdditiveBlending}
//                 />
//             </mesh>

//             {/* 🌌 Atmosphere Glow */}
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

    // 🌎 Rotation Animation + Hover Scale Animation
    useFrame(() => {
        if (earthRef.current) earthRef.current.rotation.y += 0.0008;
        if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0006;

        // 🎯 Apply smooth hover scaling
        if (groupRef.current) {
            const targetScale = hovered ? baseScale * 1.08 : baseScale;
            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12 // smooth animation strength
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
