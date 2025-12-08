// "use client";

// import * as THREE from "three";
// import { useRef, useEffect, useState } from "react";
// import { useFrame, useLoader, useThree } from "@react-three/fiber";

// export default function Moon() {
//     const moonRef = useRef<THREE.Mesh>(null);
//     const orbitRef = useRef<THREE.Group>(null);

//     const { size } = useThree();
//     const [scale, setScale] = useState(1);

//     // 📱 Responsive moon size
//     useEffect(() => {
//         const width = size.width;
//         setScale(
//             width <= 480 ? 0.35 :
//                 width <= 768 ? 0.45 :
//                     width <= 1024 ? 0.55 :
//                         0.6
//         );
//     }, [size.width]);

//     // 🌕 Load texture
//     const moonTexture = useLoader(THREE.TextureLoader, "/textures/moon.jpg");

//     // 🌍 Orbit + Rotation Animation (Tidal Locking enabled!)
//     useFrame(({ clock }) => {
//         const t = clock.getElapsedTime();
//         const orbitRadius = 2;

//         // Orbital motion
//         const x = Math.sin(t * 0.3) * orbitRadius;
//         const z = Math.cos(t * 0.3) * orbitRadius;

//         if (orbitRef.current) {
//             orbitRef.current.position.set(x, 0, z);
//         }

//         // ⚖️ Moon Self-Rotation (same speed as orbital motion = tidal locking)
//         if (moonRef.current) {
//             moonRef.current.rotation.y = t * 0.3;
//         }
//     });

//     return (
//         <group ref={orbitRef} scale={scale}>
//             <mesh ref={moonRef}>
//                 <sphereGeometry args={[0.27, 64, 64]} />
//                 <meshStandardMaterial map={moonTexture} />
//             </mesh>
//         </group>
//     );
// }
"use client";

import * as THREE from "three";
import { useRef, useEffect, useState, useCallback } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useSelectionStore } from "@/app/store/selectionStore";
import { spaceObjects } from "@/app/data/spaceObjects";

export default function Moon() {
    const moonRef = useRef<THREE.Mesh>(null);
    const orbitRef = useRef<THREE.Group>(null);

    const selectObject = useSelectionStore((state) => state.selectObject);
    const [hovered, setHovered] = useState(false);

    const { size } = useThree();
    const [scale, setScale] = useState(1);

    // 📱 Responsive sizing
    useEffect(() => {
        const width = size.width;
        setScale(
            width <= 480 ? 0.3 :
                width <= 768 ? 0.45 :
                    width <= 1024 ? 0.52 :
                        0.6
        );
    }, [size.width]);

    // 🌕 Load texture
    const moonTexture = useLoader(THREE.TextureLoader, "/textures/moon.jpg");

    // 🌍 Orbit + Tidal Locked Rotation
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const orbitRadius = 2;

        const x = Math.sin(t * 0.3) * orbitRadius;
        const z = Math.cos(t * 0.3) * orbitRadius;

        if (orbitRef.current) {
            orbitRef.current.position.set(x, 0, z);
        }

        if (moonRef.current) {
            moonRef.current.rotation.y = t * 0.3;
            moonRef.current.scale.set(
                scale * (hovered ? 1.15 : 1),
                scale * (hovered ? 1.15 : 1),
                scale * (hovered ? 1.15 : 1)
            );
        }
    });

    // 🎯 Selection Handler
    const handleClick = useCallback(() => {
        const moonData = spaceObjects.find((obj) => obj.id === "moon");
        if (moonData) selectObject(moonData.id);
    }, [selectObject]);

    return (
        <group ref={orbitRef}>
            <mesh
                ref={moonRef}
                onClick={handleClick}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <sphereGeometry args={[0.27, 64, 64]} />
                <meshStandardMaterial map={moonTexture} />
            </mesh>
        </group>
    );
}
