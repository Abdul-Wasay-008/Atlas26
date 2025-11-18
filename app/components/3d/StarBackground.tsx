// "use client";

// import { useLoader, useThree } from "@react-three/fiber";
// import { useEffect } from "react";
// import * as THREE from "three";
// import { EXRLoader } from "three-stdlib";

// export default function StarBackground() {
//     const { scene } = useThree();
//     const texture = useLoader(EXRLoader, "/space/stars.exr");

//     useEffect(() => {
//         texture.mapping = THREE.EquirectangularReflectionMapping;
//         scene.background = texture; // Sets HDRI as the background
//         scene.environment = texture; // Makes reflections accurate
//     }, [texture, scene]);

//     return null;
// }
"use client";

import { useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EXRLoader } from "three-stdlib";
import { useRef } from "react";

export default function StarBackground() {
    const starsRef = useRef<THREE.Mesh>(null);

    // Load the EXR environment texture
    const texture = useLoader(EXRLoader, "/space/stars.exr");
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    // Slowly rotate the background
    useFrame(() => {
        if (starsRef.current) {
            starsRef.current.rotation.y += 0.00013; // speed
        }
    });

    return (
        <mesh ref={starsRef}>
            {/* Giant inverted sphere to hold stars */}
            <sphereGeometry args={[100, 64, 64]} />
            <meshBasicMaterial
                map={texture}
                side={THREE.BackSide}
            />
        </mesh>
    );
}

