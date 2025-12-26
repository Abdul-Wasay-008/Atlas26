// "use client";

// import * as THREE from "three";
// import { useRef, useEffect, useState, useCallback } from "react";
// import { useFrame, useLoader, useThree } from "@react-three/fiber";
// import { useSelectionStore } from "@/app/store/selectionStore";
// import { spaceObjects } from "@/app/data/spaceObjects";

// export default function Moon() {
//     const moonRef = useRef<THREE.Mesh>(null);
//     const orbitRef = useRef<THREE.Group>(null);
//     const groupRef = useRef<THREE.Group>(null);

//     const selectObject = useSelectionStore((state) => state.selectObject);
//     const [hovered, setHovered] = useState(false);

//     const { size } = useThree();
//     const [baseScale, setBaseScale] = useState(1);

//     // 🌕 Responsive sizing
//     useEffect(() => {
//         const width = size.width;
//         setBaseScale(
//             width <= 480 ? 0.3 :
//                 width <= 768 ? 0.45 :
//                     width <= 1024 ? 0.52 :
//                         0.6
//         );
//     }, [size.width]);

//     // 🌍 Texture loading
//     const moonTexture = useLoader(THREE.TextureLoader, "/textures/moon.jpg");

//     // 🌑 Orbit & rotation animation + smooth hover effect
//     useFrame(({ clock }) => {
//         const t = clock.getElapsedTime();
//         const orbitRadius = 2;

//         const x = Math.sin(t * 0.3) * orbitRadius;
//         const z = Math.cos(t * 0.3) * orbitRadius;

//         if (orbitRef.current) {
//             orbitRef.current.position.set(x, 0, z);
//         }

//         if (moonRef.current) {
//             moonRef.current.rotation.y = t * 0.3;
//         }

//         // ✨ Smooth scale animation
//         if (groupRef.current) {
//             const targetScale = hovered ? baseScale * 1.12 : baseScale;
//             groupRef.current.scale.lerp(
//                 new THREE.Vector3(targetScale, targetScale, targetScale),
//                 0.12
//             );
//         }
//     });

//     // 🔍 Selection handler
//     const handleClick = useCallback(() => {
//         selectObject("moon");
//     }, [selectObject]);

//     return (
//         <group ref={orbitRef}>
//             <group ref={groupRef}>
//                 <mesh
//                     ref={moonRef}
//                     onClick={handleClick}
//                     onPointerOver={() => {
//                         setHovered(true);
//                         document.body.style.cursor = "pointer";
//                     }}
//                     onPointerOut={() => {
//                         setHovered(false);
//                         document.body.style.cursor = "default";
//                     }}
//                 >
//                     <sphereGeometry args={[0.27, 64, 64]} />
//                     <meshStandardMaterial map={moonTexture} />
//                 </mesh>
//             </group>
//         </group>
//     );
// }


"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { spaceObjects } from "@/app/data/spaceObjects";
import { timeEngine } from "@/app/core/time";

export default function Moon() {
    const moonRef = useRef<THREE.Mesh>(null);
    const orbitRef = useRef<THREE.Group>(null);
    const groupRef = useRef<THREE.Group>(null);

    const selectObject = useSelectionStore((state) => state.selectObject);
    const [hovered, setHovered] = useState(false);

    const { size } = useThree();
    const [baseScale, setBaseScale] = useState(1);

    // 🌕 Responsive sizing
    useEffect(() => {
        const width = size.width;
        setBaseScale(
            width <= 480 ? 0.3 :
                width <= 768 ? 0.45 :
                    width <= 1024 ? 0.52 :
                        0.6
        );
    }, [size.width]);

    // 🌍 Texture loading
    const moonTexture = useLoader(THREE.TextureLoader, "/textures/moon.jpg");

    const MOON_ORBITAL_PERIOD = 27.3 * 24 * 60 * 60; // seconds
    const MOON_ROTATION_PERIOD = MOON_ORBITAL_PERIOD; // tidally locked
    const ORBIT_RADIUS = 2; // Moon's orbit radius around Earth
    
    // Earth's orbital parameters (same as in Earth.tsx)
    const EARTH_ORBITAL_PERIOD = 365.25 * 24 * 60 * 60; // seconds
    const EARTH_ORBIT_RADIUS = 4.5; // Distance from Sun

    useFrame(() => {
        const t = timeEngine.getTime();

        // Calculate Earth's position around Sun
        const earthOrbitAngle =
            ((t % EARTH_ORBITAL_PERIOD) / EARTH_ORBITAL_PERIOD) * Math.PI * 2;
        const earthX = Math.cos(earthOrbitAngle) * EARTH_ORBIT_RADIUS;
        const earthZ = Math.sin(earthOrbitAngle) * EARTH_ORBIT_RADIUS;

        // 🌕 Moon's orbital position around Earth (absolute, time-based)
        const moonOrbitAngle =
            ((t % MOON_ORBITAL_PERIOD) / MOON_ORBITAL_PERIOD) * Math.PI * 2;

        if (orbitRef.current) {
            // Moon's position = Earth's position + Moon's relative orbit
            orbitRef.current.position.set(
                earthX + Math.cos(moonOrbitAngle) * ORBIT_RADIUS,
                0,
                earthZ + Math.sin(moonOrbitAngle) * ORBIT_RADIUS
            );
        }

        // 🌑 Moon rotation (tidally locked)
        if (moonRef.current) {
            const rotationAngle =
                ((t % MOON_ROTATION_PERIOD) / MOON_ROTATION_PERIOD) * Math.PI * 2;

            moonRef.current.rotation.y = rotationAngle;
        }

        // ✨ Smooth hover scaling (UI animation, frame-based is OK)
        if (groupRef.current) {
            const targetScale = hovered ? baseScale * 1.12 : baseScale;
            groupRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }
    });

    // 🔍 Selection handler
    const handleClick = useCallback(() => {
        selectObject("moon");
    }, [selectObject]);

    return (
        <group ref={orbitRef}>
            <group ref={groupRef}>
                <mesh
                    ref={moonRef}
                    name="moon"
                    onClick={handleClick}
                    onPointerOver={() => {
                        setHovered(true);
                        document.body.style.cursor = "pointer";
                    }}
                    onPointerOut={() => {
                        setHovered(false);
                        document.body.style.cursor = "default";
                    }}
                >
                    <sphereGeometry args={[0.27, 64, 64]} />
                    <meshStandardMaterial map={moonTexture} />
                </mesh>
            </group>
        </group>
    );
}