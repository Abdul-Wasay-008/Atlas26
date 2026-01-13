// "use client"

// import { Canvas } from "@react-three/fiber"
// import { OrbitControls, useTexture } from "@react-three/drei"
// import * as THREE from "three"
// import { useEffect, useState } from "react"
// import Earth from "../3d/Earth"
// import Moon from "../3d/Moon"
// import MoonOrbitPath from "../3d/MoonOrbitPath"

// function Starfield() {
//     const texture = useTexture("/space/stars.jpg")

//     return (
//         <mesh scale={-1}>
//             <sphereGeometry args={[500, 64, 64]} />
//             <meshBasicMaterial
//                 map={texture}
//                 side={THREE.BackSide}
//                 depthWrite={false}
//             />
//         </mesh>
//     )
// }

// export default function SpaceCanvas() {

//     const [fov, setFov] = useState(45)
//     const [cameraPos, setCameraPos] = useState<[number, number, number]>([0, 0, 8])

//     // 📌 Ensure responsive camera only runs in client
//     useEffect(() => {
//         if (typeof window === "undefined") return

//         function updateCamera() {
//             const w = window.innerWidth

//             if (w < 480) {
//                 setFov(65)
//                 setCameraPos([0, 0, 9.5])
//             } else if (w < 768) {
//                 setFov(55)
//                 setCameraPos([0, 0, 9])
//             } else {
//                 setFov(45)
//                 setCameraPos([0, 0, 8])
//             }
//         }

//         updateCamera()
//         window.addEventListener("resize", updateCamera)
//         return () => window.removeEventListener("resize", updateCamera)
//     }, [])

//     useEffect(() => {
//         const spaceArea = document.getElementById("space-area")
//         if (!spaceArea) return

//         const onEnter = () => (spaceArea.style.cursor = "grab")
//         const onLeave = () => (spaceArea.style.cursor = "default")
//         const onDown = () => (spaceArea.style.cursor = "grabbing")
//         const onUp = () => (spaceArea.style.cursor = "grab")

//         spaceArea.addEventListener("mouseenter", onEnter)
//         spaceArea.addEventListener("mouseleave", onLeave)
//         spaceArea.addEventListener("mousedown", onDown)
//         spaceArea.addEventListener("mouseup", onUp)

//         return () => {
//             spaceArea.removeEventListener("mouseenter", onEnter)
//             spaceArea.removeEventListener("mouseleave", onLeave)
//             spaceArea.removeEventListener("mousedown", onDown)
//             spaceArea.removeEventListener("mouseup", onUp)
//         }
//     }, [])

//     return (
//         <Canvas
//             camera={{ position: cameraPos, fov }}
//             gl={{ antialias: true }}
//         >
//             {/* 🌌 Deep Space Starfield */}
//             <Starfield />

//             {/* 💡 Lighting */}
//             <ambientLight intensity={3.5} />
//             <directionalLight position={[5, 3, 5]} intensity={1.2} />

//             {/* 🌍 Earth + Moon System */}
//             <Earth />
//             <Moon />
//             <MoonOrbitPath />

//             {/* 🎮 Camera Controls */}
//             {/* ONLY adjust speeds if "window" exists */}
//             <OrbitControls
//                 enablePan={false}
//                 minDistance={4}
//                 maxDistance={14}
//                 rotateSpeed={typeof window !== "undefined" && window.innerWidth < 480 ? 0.6 : 1}
//                 zoomSpeed={typeof window !== "undefined" && window.innerWidth < 480 ? 0.7 : 1}
//             />
//         </Canvas>
//     )
// }
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";

import CameraRig from "../3d/CameraRig";
import CameraSnapHandler from "../3d/CameraSnapHandler";
import KeyboardShortcuts from "./KeyboardShortcuts";
import Sun from "../3d/Sun";
import SunLight from "../3d/SunLight";
import Earth from "../3d/Earth";
import Moon from "../3d/Moon";
import ISS from "../3d/ISS";
import Hubble from "../3d/Hubble";
import SatelliteOrbitPath from "../3d/SatelliteOrbitPath";

import { timeManager } from "@/app/core/TimeManager";
import { cameraController } from "@/app/core/cameraController";
import {
    getGreenwichSiderealTime,
    getEarthOrbitalLongitude,
} from "@/app/astronomy/siderealTime";

/* 🌌 Starfield Background - Astronomically Oriented */
function Starfield() {
    const texture = useTexture("/space/stars.jpg");
    const starfieldRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (starfieldRef.current) {
            // Get current date from TimeManager (single source of truth)
            const currentDate = timeManager.getCurrentDate();
            
            // A) Sidereal rotation (daily): Stars rotate once per sidereal day (~23h 56m)
            // This represents Earth's rotation relative to the fixed stars
            // GST gives the rotation angle of the celestial sphere due to Earth's daily rotation
            const siderealRotation = getGreenwichSiderealTime(currentDate);
            
            // B) Annual/seasonal rotation: As Earth orbits the Sun, the night sky shifts
            // This is Earth's orbital longitude (0 to 2π over a year)
            // We rotate the sphere opposite to Earth's orbital motion (negative direction)
            // so that as Earth moves in its orbit, the visible sky shifts correctly
            const orbitalRotation = -getEarthOrbitalLongitude(currentDate);
            
            // Combine both rotations around Y-axis (celestial north pole)
            // Both rotations are around the same axis, so we can simply add them
            starfieldRef.current.rotation.y = siderealRotation + orbitalRotation;
        }
    });

    return (
        <mesh ref={starfieldRef} scale={-1}>
            <sphereGeometry args={[500, 64, 64]} />
            <meshBasicMaterial
                map={texture}
                side={THREE.BackSide}
                depthWrite={false}
            />
        </mesh>
    );
}

/* ⏱ Simulation Clock Ticker */
function TimeTicker() {
    useFrame(() => {
        timeManager.update();
    });
    return null;
}

export default function SpaceCanvas() {
    // Use default system position from cameraController (slight top-right)
    const defaultPos = cameraController.systemPos;
    const [fov, setFov] = useState(45);
    const [cameraPos, setCameraPos] = useState<[number, number, number]>([
        defaultPos.x,
        defaultPos.y,
        defaultPos.z,
    ]);

    // 🔑 ADD THIS
    const controlsRef = useRef<any>(null);

    /* 📐 Responsive Camera */
    useEffect(() => {
        if (typeof window === "undefined") return;

        function updateCamera() {
            const w = window.innerWidth;
            const basePos = cameraController.systemPos;

            if (w < 480) {
                setFov(65);
                setCameraPos([basePos.x, basePos.y, basePos.z + 1.5]);
            } else if (w < 768) {
                setFov(55);
                setCameraPos([basePos.x, basePos.y, basePos.z + 1]);
            } else {
                setFov(45);
                setCameraPos([basePos.x, basePos.y, basePos.z]);
            }
        }

        updateCamera();
        window.addEventListener("resize", updateCamera);
        return () => window.removeEventListener("resize", updateCamera);
    }, []);

    /* 🖱 Cursor Behavior */
    useEffect(() => {
        const spaceArea = document.getElementById("space-area");
        if (!spaceArea) return;

        const onEnter = () => (spaceArea.style.cursor = "grab");
        const onLeave = () => (spaceArea.style.cursor = "default");
        const onDown = () => (spaceArea.style.cursor = "grabbing");
        const onUp = () => (spaceArea.style.cursor = "grab");

        spaceArea.addEventListener("mouseenter", onEnter);
        spaceArea.addEventListener("mouseleave", onLeave);
        spaceArea.addEventListener("mousedown", onDown);
        spaceArea.addEventListener("mouseup", onUp);

        return () => {
            spaceArea.removeEventListener("mouseenter", onEnter);
            spaceArea.removeEventListener("mouseleave", onLeave);
            spaceArea.removeEventListener("mousedown", onDown);
            spaceArea.removeEventListener("mouseup", onUp);
        };
    }, []);

    return (
        <>
            <KeyboardShortcuts />
            <Canvas camera={{ position: cameraPos, fov }} gl={{ antialias: true }}>
            {/* ⏱ Global Simulation Clock */}
            <TimeTicker />

            {/* 🌌 Deep Space Background */}
            <Starfield />

            {/* 💡 Lighting */}
            <ambientLight intensity={3.5} />
            {/* Dynamic Sun light - updates based on Earth-Sun geometry, world-space */}
            <SunLight />

            {/* 🔥 CAMERA RIG WITH CONTROLS REF */}
            <CameraRig controlsRef={controlsRef} />
            <CameraSnapHandler />

            {/* ☀️ Sun (center of solar system) */}
            <Sun />

            {/* 🌍 Earth–Moon System */}
            <Earth />
            <Moon />

            {/* 🚀 ISS (International Space Station) */}
            <ISS />

            {/* 🔭 Hubble Space Telescope */}
            <Hubble />

            {/* 🛰️ Satellite Orbit Path (shows orbit for selected satellite) */}
            <SatelliteOrbitPath />

            {/* 🎮 Orbit Controls (CONNECTED) */}
            <OrbitControls
                ref={controlsRef}
                enablePan={false}
                minDistance={0.1}
                maxDistance={14}
                rotateSpeed={typeof window !== "undefined" && window.innerWidth < 480 ? 0.6 : 1}
                zoomSpeed={typeof window !== "undefined" && window.innerWidth < 480 ? 0.7 : 1}
            />
        </Canvas>
        </>
    );
}