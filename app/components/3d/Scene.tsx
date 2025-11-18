// Old startfield scene from drei
// "use client";

// import { Canvas } from "@react-three/fiber";
// import { Suspense } from "react";
// import Starfield from "./Starfield";
// import Earth from "./Earth";

// export default function Scene() {
//     return (
//         <div className="absolute inset-0 z-0">
//             <Canvas
//                 camera={{ position: [0, 0, 3], fov: 45 }}
//                 shadows
//             >
//                 {/* Lighting setup */}
//                 <ambientLight intensity={0.3} />
//                 <directionalLight
//                     position={[5, 2, 5]}
//                     intensity={10.0}
//                     color="#ffffff"
//                 />
//                 <pointLight position={[-5, -2, -5]} intensity={0.4} color="#4477ff" />

//                 {/* 🌌 3D scene */}
//                 <Suspense fallback={null}>
//                     <Starfield />
//                     <Earth />
//                 </Suspense>
//             </Canvas>
//         </div>
//     );
// }



// New starfield scene from NASA
"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import Earth from "./Earth";
import StarBackground from "./StarBackground";

export default function Scene() {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas
                camera={{ position: [0, 0, 3], fov: 45 }}
                shadows
            >
                {/* Lighting setup */}
                <ambientLight intensity={0.3} />
                <directionalLight
                    position={[5, 2, 5]}
                    intensity={10.0}
                    color="#ffffff"
                />
                <pointLight position={[-5, -2, -5]} intensity={0.4} color="#4477ff" />

                {/* 🌌 3D scene */}
                <Suspense fallback={null}>
                    <StarBackground />
                    <Earth />
                </Suspense>
            </Canvas>
        </div>
    );
}