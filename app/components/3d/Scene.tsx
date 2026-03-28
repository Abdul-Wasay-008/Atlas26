"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect, useCallback } from "react";
import LandingEarth from "./LandingEarth";
import StarBackground from "./StarBackground";

function SceneLoader({ onReady }: { onReady: () => void }) {
    useEffect(() => {
        onReady();
    }, [onReady]);
    return null;
}

export default function Scene() {
    const [loaded, setLoaded] = useState(false);
    const handleReady = useCallback(() => setLoaded(true), []);

    return (
        <div className="absolute inset-0 z-0">
            {/* Loading indicator — visible until 3D assets resolve */}
            {!loaded && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
                    <div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-cyan-400/80 animate-spin" />
                </div>
            )}

            <Canvas
                camera={{ position: [0, 0, 3], fov: 45 }}
                shadows
            >
                <ambientLight intensity={0.3} />
                <directionalLight
                    position={[5, 2, 5]}
                    intensity={10.0}
                    color="#ffffff"
                />
                <pointLight position={[-5, -2, -5]} intensity={0.4} color="#4477ff" />

                <Suspense fallback={null}>
                    <StarBackground />
                    <LandingEarth />
                    <SceneLoader onReady={handleReady} />
                </Suspense>
            </Canvas>
        </div>
    );
}
