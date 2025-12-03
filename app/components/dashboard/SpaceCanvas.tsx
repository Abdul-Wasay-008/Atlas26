"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, useTexture } from "@react-three/drei"
import * as THREE from "three"
import { useEffect, useState } from "react"
import Earth from "../3d/Earth"
import Moon from "../3d/Moon"
import MoonOrbitPath from "../3d/MoonOrbitPath"

function Starfield() {
    const texture = useTexture("/space/stars.jpg")

    return (
        <mesh scale={-1}>
            <sphereGeometry args={[500, 64, 64]} />
            <meshBasicMaterial map={texture} side={THREE.BackSide} />
        </mesh>
    )
}

export default function SpaceCanvas() {

    // 🌐 RESPONSIVE CAMERA SETTINGS
    const [fov, setFov] = useState(45)
    const [cameraPos, setCameraPos] = useState<[number, number, number]>([0, 0, 8])

    useEffect(() => {
        function updateCamera() {
            const w = window.innerWidth

            if (w < 480) {
                // Mobile
                setFov(65)
                setCameraPos([0, 0, 9.5])
            }
            else if (w < 768) {
                // Tablet
                setFov(55)
                setCameraPos([0, 0, 9])
            }
            else {
                // Desktop
                setFov(45)
                setCameraPos([0, 0, 8])
            }
        }

        updateCamera()
        window.addEventListener("resize", updateCamera)
        return () => window.removeEventListener("resize", updateCamera)
    }, [])


    // 🎯 Cursor behavior for 3D area
    useEffect(() => {
        const spaceArea = document.getElementById("space-area")

        if (!spaceArea) return

        const handleEnter = () => spaceArea.style.cursor = "grab"
        const handleLeave = () => spaceArea.style.cursor = "default"
        const handleDown = () => spaceArea.style.cursor = "grabbing"
        const handleUp = () => spaceArea.style.cursor = "grab"

        spaceArea.addEventListener("mouseenter", handleEnter)
        spaceArea.addEventListener("mouseleave", handleLeave)
        spaceArea.addEventListener("mousedown", handleDown)
        spaceArea.addEventListener("mouseup", handleUp)

        return () => {
            spaceArea.removeEventListener("mouseenter", handleEnter)
            spaceArea.removeEventListener("mouseleave", handleLeave)
            spaceArea.removeEventListener("mousedown", handleDown)
            spaceArea.removeEventListener("mouseup", handleUp)
        }
    }, [])

    return (
        <Canvas
            camera={{ position: cameraPos, fov }}
            gl={{ antialias: true }}
        >
            {/* 🌌 Realistic NASA Starfield */}
            <Starfield />

            {/* 💡 Lighting */}
            <ambientLight intensity={4} />
            <directionalLight position={[5, 3, 5]} intensity={1.2} />

            {/* Earth */}
            <Earth />

            {/* Moon orbiting the earth */}
            <Moon />

            {/* Moon orbit path around the earth */}
            <MoonOrbitPath />

            {/* 🎮 Responsive Controls */}
            <OrbitControls
                enablePan={false}
                minDistance={4}
                maxDistance={14}
                rotateSpeed={window.innerWidth < 480 ? 0.6 : 1}
                zoomSpeed={window.innerWidth < 480 ? 0.7 : 1}
            />
        </Canvas>
    )
}
