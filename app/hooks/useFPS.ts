"use client"

import { useEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useFpsStore } from "@/app/store/fpsStore"

const SAMPLE_MS = 500

/** Inside `<Canvas>`: counts frames, updates store ~every 500ms. */
export function FpsRecorder() {
    const frames = useRef(0)
    const lastSample = useRef(0)

    useEffect(() => {
        lastSample.current = performance.now()
    }, [])

    useFrame(() => {
        frames.current += 1
        const now = performance.now()
        if (now - lastSample.current < SAMPLE_MS) return

        const elapsedSec = (now - lastSample.current) / 1000
        const fps = Math.round(frames.current / elapsedSec)
        useFpsStore.getState().setFps(fps)
        frames.current = 0
        lastSample.current = now
    })

    return null
}

/** Outside Canvas: current FPS (or `null` before first sample). */
export function useFPS() {
    return useFpsStore((s) => s.fps)
}
