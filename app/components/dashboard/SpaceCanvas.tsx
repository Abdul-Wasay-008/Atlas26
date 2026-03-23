"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { Suspense } from "react";
import { useLoadingStore } from "@/app/store/loadingStore";

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
import { PLUTO_ORBIT_PARAMS } from "@/app/astronomy/plutoOrbit";
import { getHalleyPosition } from "@/app/astronomy/halleyOrbit";
import { getEnckePosition } from "@/app/astronomy/enckeOrbit";
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
import Europa from "../3d/Europa";
import Ganymede from "../3d/Ganymede";
import Callisto from "../3d/Callisto";
import Titan from "../3d/Titan";
import Mimas from "../3d/Mimas";
import Enceladus from "../3d/Enceladus";
import Tethys from "../3d/Tethys";
import Dione from "../3d/Dione";
import Rhea from "../3d/Rhea";
import IoOrbitPath from "../3d/IoOrbitPath";
import EuropaOrbitPath from "../3d/EuropaOrbitPath";
import GanymedeOrbitPath from "../3d/GanymedeOrbitPath";
import CallistoOrbitPath from "../3d/CallistoOrbitPath";
import TitanOrbitPath from "../3d/TitanOrbitPath";
import MimasOrbitPath from "../3d/MimasOrbitPath";
import EnceladusOrbitPath from "../3d/EnceladusOrbitPath";
import TethysOrbitPath from "../3d/TethysOrbitPath";
import DioneOrbitPath from "../3d/DioneOrbitPath";
import RheaOrbitPath from "../3d/RheaOrbitPath";
import Miranda from "../3d/Miranda";
import MirandaOrbitPath from "../3d/MirandaOrbitPath";
import Ariel from "../3d/Ariel";
import ArielOrbitPath from "../3d/ArielOrbitPath";
import Umbriel from "../3d/Umbriel";
import UmbrielOrbitPath from "../3d/UmbrielOrbitPath";
import Titania from "../3d/Titania";
import TitaniaOrbitPath from "../3d/TitaniaOrbitPath";
import Oberon from "../3d/Oberon";
import OberonOrbitPath from "../3d/OberonOrbitPath";
import Triton from "../3d/Triton";
import TritonOrbitPath from "../3d/TritonOrbitPath";
import Proteus from "../3d/Proteus";
import ProteusOrbitPath from "../3d/ProteusOrbitPath";
import Nereid from "../3d/Nereid";
import NereidOrbitPath from "../3d/NereidOrbitPath";
import AsteroidBelt from "../3d/AsteroidBelt";
import KuiperBelt from "../3d/KuiperBelt";
import Comet from "../3d/Comet";

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

/* 📊 Progress Reporter - feeds useProgress into loadingStore for overlay */
function ProgressReporter() {
    const { progress, active } = useProgress();
    const setProgress = useLoadingStore((s) => s.setProgress);
    const setReady = useLoadingStore((s) => s.setReady);
    const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setProgress(progress, active);

        if (progress >= 100 && !active) {
            readyTimeoutRef.current = setTimeout(() => {
                setReady();
            }, 400);
        }

        return () => {
            if (readyTimeoutRef.current) {
                clearTimeout(readyTimeoutRef.current);
            }
        };
    }, [progress, active, setProgress, setReady]);

    return null;
}

/* 🌌 Scene content - all 3D objects (wrapped in Suspense for loading) */
function SceneContent({
    controlsRef,
}: {
    controlsRef: React.MutableRefObject<any>;
}) {
    return (
        <>
            <TimeTicker />
            <Starfield />
            <ambientLight intensity={3.5} />
            <SunLight />
            <CameraRig controlsRef={controlsRef} />
            <CameraKeyboardControls controlsRef={controlsRef} />
            <CameraSnapHandler />
            <Sun />
            <Mercury />
            <Venus />
            <Earth />
            <Moon />
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
            <AsteroidBelt />
            <Jupiter />
            <Io />
            <Europa />
            <Ganymede />
            <Callisto />
            <Saturn />
            <Mimas />
            <Enceladus />
            <Tethys />
            <Dione />
            <Rhea />
            <Titan />
            <Uranus />
            <Miranda />
            <Ariel />
            <Umbriel />
            <Titania />
            <Oberon />
            <Neptune />
            <Proteus />
            <Triton />
            <Nereid />
            <KuiperBelt />
            <Planet
                id="pluto"
                orbit={{ type: "planet", params: PLUTO_ORBIT_PARAMS }}
                rotationPeriodSeconds={1e12}
                axialTiltRadians={0}
                radiusScale={0.16}
                textureUrls={[
                    "/textures/Pluto.webp",
                    "/textures/Pluto.webp",
                    "/textures/Pluto.webp",
                    "/textures/Pluto.webp",
                    "/textures/Pluto.webp",
                ]}
                hasClouds={false}
                terminatorWidth={0.22}
                noShadow={true}
            />
            <Comet id="halley" orbitFn={getHalleyPosition} />
            <Comet id="encke" orbitFn={getEnckePosition} />
            <ISS />
            <Hubble />
            <SatelliteOrbitPath />
            <PlanetOrbitPath />
            <MoonOrbitPath />
            <PhobosOrbitPath />
            <DeimosOrbitPath />
            <IoOrbitPath />
            <EuropaOrbitPath />
            <GanymedeOrbitPath />
            <CallistoOrbitPath />
            <MimasOrbitPath />
            <EnceladusOrbitPath />
            <TethysOrbitPath />
            <DioneOrbitPath />
            <RheaOrbitPath />
            <TitanOrbitPath />
            <MirandaOrbitPath />
            <ArielOrbitPath />
            <UmbrielOrbitPath />
            <TitaniaOrbitPath />
            <OberonOrbitPath />
            <ProteusOrbitPath />
            <TritonOrbitPath />
            <NereidOrbitPath />
            <OrbitControls
                ref={controlsRef}
                enablePan={true}
                panSpeed={0.8}
                minDistance={0.5}
                maxDistance={80}
                rotateSpeed={
                    typeof window !== "undefined" && window.innerWidth < 480
                        ? 0.6
                        : 1
                }
                zoomSpeed={
                    typeof window !== "undefined" && window.innerWidth < 480
                        ? 0.7
                        : 1.2
                }
                enableDamping={true}
                dampingFactor={0.05}
                screenSpacePanning={true}
            />
        </>
    );
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
                <ProgressReporter />
                <Suspense fallback={null}>
                    <SceneContent controlsRef={controlsRef} />
                </Suspense>
            </Canvas>
        </>
    );
}