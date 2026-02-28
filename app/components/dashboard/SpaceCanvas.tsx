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
import CameraKeyboardControls from "../3d/CameraKeyboardControls";
import KeyboardShortcuts from "./KeyboardShortcuts";
import Sun from "../3d/Sun";
import SunLight from "../3d/SunLight";
import Earth from "../3d/Earth";
import Planet from "../3d/Planet";
import Venus from "../3d/Venus";
import Mercury from "../3d/Mercury";
import Jupiter from "../3d/Jupiter";
import Saturn from "../3d/Saturn";
import Uranus from "../3d/Uranus";
import Neptune from "../3d/Neptune";
import Moon from "../3d/Moon";
import {
    MARS_ORBIT_PARAMS,
    MARS_AXIAL_TILT_RADIANS,
} from "@/app/astronomy/planetOrbit";
import ISS from "../3d/ISS";
import Hubble from "../3d/Hubble";
import SatelliteOrbitPath from "../3d/SatelliteOrbitPath";
import PlanetOrbitPath from "../3d/PlanetOrbitPath";
import MoonOrbitPath from "../3d/MoonOrbitPath";
import Phobos from "../3d/Phobos";
import PhobosOrbitPath from "../3d/PhobosOrbitPath";
import Deimos from "../3d/Deimos";
import DeimosOrbitPath from "../3d/DeimosOrbitPath";
import Io from "../3d/Io";
import IoOrbitPath from "../3d/IoOrbitPath";

import { timeManager } from "@/app/core/TimeManager";
import { cameraController } from "@/app/core/cameraController";
/* 🌌 Starfield Background - Static in World Space
 * The starfield does NOT rotate with simulation time. It stays fixed so that
 * only planets and objects move when time is sped up. The user sees stars
 * shift only when dragging the canvas (camera movement via OrbitControls).
 */
function Starfield() {
    const texture = useTexture("/space/stars.jpg");

    return (
        <mesh scale={-1}>
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

    /* 📐 Responsive Camera - Adjusts FOV and position based on screen size */
    useEffect(() => {
        if (typeof window === "undefined") return;

        function updateCamera() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const aspectRatio = w / h;
            const basePos = cameraController.systemPos;

            if (w < 480) {
                // Mobile phones - wider FOV, pull back more
                setFov(85);
                setCameraPos([basePos.x, basePos.y * 0.85, basePos.z + 10]);
            } else if (w < 768) {
                // Tablets portrait
                setFov(75);
                setCameraPos([basePos.x, basePos.y * 0.9, basePos.z + 6]);
            } else if (w < 1024) {
                // Tablets landscape / small laptops
                setFov(68);
                setCameraPos([basePos.x, basePos.y * 0.95, basePos.z + 3]);
            } else if (w < 1440) {
                // Standard laptops - base position
                setFov(62);
                setCameraPos([basePos.x, basePos.y, basePos.z]);
            } else if (w < 1920) {
                // Large screens
                setFov(58);
                setCameraPos([basePos.x, basePos.y, basePos.z - 3]);
            } else {
                // Ultra-wide / 4K displays
                setFov(aspectRatio > 2 ? 62 : 55);
                setCameraPos([basePos.x, basePos.y, basePos.z - 5]);
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
                <CameraKeyboardControls controlsRef={controlsRef} />
                <CameraSnapHandler />

                {/* ☀️ Sun (center of solar system) */}
                <Sun />

                {/* ☿ Mercury (innermost planet) */}
                <Mercury />

                {/* 🪐 Venus (two-layer: surface + atmosphere) */}
                <Venus />

                {/* 🌍 Earth–Moon System */}
                <Earth />
                <Moon />

                {/* 🔴 Mars–Phobos System */}
                <Planet
                    id="mars"
                    orbit={{ type: "planet", params: MARS_ORBIT_PARAMS }}
                    rotationPeriodSeconds={24.6 * 60 * 60}
                    axialTiltRadians={MARS_AXIAL_TILT_RADIANS}
                    radiusScale={0.8 * 0.53}
                    textureUrls={[
                        "/textures/mars.jpg",
                        "/textures/mars.jpg",
                        "/textures/mars.jpg",
                        "/textures/mars.jpg",
                        "/textures/mars.jpg",
                    ]}
                hasClouds={false}
                terminatorWidth={0.22}
                noShadow={true}
                />
                <Phobos />
                <Deimos />

                {/* 🪐 Jupiter–Io System (largest planet, gas giant) */}
                <Jupiter />
                <Io />

                {/* 🪐 Saturn (6th planet, famous for rings) */}
                <Saturn />

                {/* 🪐 Uranus (7th planet, ice giant) */}
                <Uranus />

                {/* 🪐 Neptune (8th planet, ice giant) */}
                <Neptune />

                {/* 🚀 ISS (International Space Station) */}
                <ISS />

                {/* 🔭 Hubble Space Telescope */}
                <Hubble />

                {/* 🛰️ Satellite Orbit Path (shows orbit for selected satellite) */}
                <SatelliteOrbitPath />

                {/* 🪐 Planet Orbit Path (shows orbit around Sun for selected planet) */}
                <PlanetOrbitPath />

                {/* 🌙 Moon Orbit Path (shows orbit around Earth when Moon selected) */}
                <MoonOrbitPath />

                {/* 🌑 Phobos Orbit Path (shows orbit around Mars when Phobos selected) */}
                <PhobosOrbitPath />

                {/* 🌑 Deimos Orbit Path (shows orbit around Mars when Deimos selected) */}
                <DeimosOrbitPath />

                {/* 🌋 Io Orbit Path (shows orbit around Jupiter when Io or Jupiter selected) */}
                <IoOrbitPath />

                {/* 🎮 Orbit Controls (CONNECTED) */}
                <OrbitControls
                    ref={controlsRef}
                    enablePan={true}
                    panSpeed={0.8}
                    minDistance={0.5}
                    maxDistance={80}
                    rotateSpeed={typeof window !== "undefined" && window.innerWidth < 480 ? 0.6 : 1}
                    zoomSpeed={typeof window !== "undefined" && window.innerWidth < 480 ? 0.7 : 1.2}
                    enableDamping={true}
                    dampingFactor={0.05}
                    screenSpacePanning={true}
                />
            </Canvas>
        </>
    );
}