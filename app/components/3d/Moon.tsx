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
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { createMoonPhaseMaterial } from "./MoonPhaseMaterial";
import {
    getMoonWorldPosition,
    getMoonPhaseName,
    getMoonIllumination,
} from "@/app/astronomy/lunar";
import { getEarthOrbitPosition } from "@/app/astronomy/earthOrbit";

export default function Moon() {
    const moonRef = useRef<THREE.Mesh>(null);
    const orbitRef = useRef<THREE.Group>(null);
    const groupRef = useRef<THREE.Group>(null);

    const selectObject = useSelectionStore((state) => state.selectObject);
    const [hovered, setHovered] = useState(false);

    const { size, camera } = useThree();
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

    // 🌕 Texture loading
    const moonTexture = useLoader(THREE.TextureLoader, "/textures/moon.jpg");

    // 🌑 Create Moon phase material (physically correct lighting from Sun only)
    const moonPhaseMaterial = useMemo(
        () => createMoonPhaseMaterial({ moonTexture }),
        [moonTexture]
    );

    const EARTH_ORBIT_RADIUS = 8.0; // Distance from Sun

    useFrame(() => {
        // Get current date from TimeManager (single source of truth)
        const currentDate = timeManager.getCurrentDate();

        // Get Earth's position around Sun (using same astronomy module as Earth)
        const earthPosition = getEarthOrbitPosition(currentDate, EARTH_ORBIT_RADIUS);

        // 🌕 Get astronomically accurate Moon position
        const moonWorldPos = getMoonWorldPosition(currentDate, earthPosition);

        if (orbitRef.current) {
            // Set Moon position in world coordinates
            orbitRef.current.position.copy(moonWorldPos);
        }

        // 🌑 Moon rotation (tidally locked)
        // The Moon rotates to always face Earth (same face always points at Earth)
        if (moonRef.current) {
            // Get Moon's position relative to Earth
            const moonRelativePos = new THREE.Vector3().subVectors(
                moonWorldPos,
                earthPosition
            );
            
            // Calculate rotation angle so Moon's +Z axis points toward Earth
            // atan2(x, z) gives angle in XZ plane where Earth is located
            // This ensures the Moon always faces Earth (tidally locked)
            const rotationAngle = Math.atan2(moonRelativePos.x, moonRelativePos.z);
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

        // Update Moon phase lighting (physically correct, camera-independent)
        if (moonRef.current && moonPhaseMaterial) {
            const sunPosition = new THREE.Vector3(0, 0, 0); // Sun is at origin

            // Direction from Sun to Moon (world space)
            const sunToMoonDir = new THREE.Vector3()
                .subVectors(moonWorldPos, sunPosition)
                .normalize();

            // The shader normals use normalMatrix which produces view-space normals,
            // so transform the sun direction into view space to match
            const sunDirViewSpace = sunToMoonDir.clone().transformDirection(camera.matrixWorldInverse);

            moonPhaseMaterial.uniforms.uSunDirection.value.copy(sunDirViewSpace);
        }

        // 🔍 Debug logging (dev mode only, throttled)
        if (process.env.NODE_ENV === "development") {
            const debugInterval = 1000; // Log once per second
            const now = Date.now();
            if (!(window as any).__moonDebugLastLog || now - (window as any).__moonDebugLastLog > debugInterval) {
                const phase = getMoonIllumination(currentDate);
                const phaseName = getMoonPhaseName(currentDate);
                console.log(
                    `🌙 Moon Debug: ${phaseName} | Illumination: ${(phase * 100).toFixed(1)}% | UTC: ${currentDate.toISOString()}`
                );
                (window as any).__moonDebugLastLog = now;
            }
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
                    <primitive object={moonPhaseMaterial} attach="material" />
                </mesh>
            </group>
        </group>
    );
}