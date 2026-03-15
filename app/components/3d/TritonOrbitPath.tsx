"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getPlanetOrbitPosition, NEPTUNE_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";
import { getTritonPosition, TRITON_ORBITAL_PERIOD_HOURS } from "@/app/astronomy/tritonOrbit";
import { TRITON_ORBIT_COLOR } from "@/app/data/satelliteOrbitColors";

const NUM_SAMPLES = 200;

const BASE_LINE_WIDTH = 0.5;
const FOCUS_MULTIPLIER = 1.4;
const BASE_OPACITY = 0.55;
const FOCUS_OPACITY = 0.8;

/**
 * Triton Orbit Path Visualizer
 *
 * Renders Triton's orbit around Neptune when Triton or Neptune is selected, or all orbits are shown.
 * The path is a closed ellipse centered on Neptune's current position (Triton's orbit is retrograde).
 */
export default function TritonOrbitPath() {
    const { selectedId, showAllOrbits } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const showTritonOrbit = selectedId === "triton" || selectedId === "neptune" || showAllOrbits;

    const orbitPoints = useMemo(() => {
        if (!showTritonOrbit) {
            return [];
        }

        const msPerHour = 3600000;
        const periodMs = TRITON_ORBITAL_PERIOD_HOURS * msPerHour;

        const neptunePositionNow = getPlanetOrbitPosition(currentDate, NEPTUNE_ORBIT_PARAMS);

        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= NUM_SAMPLES; i++) {
            const t = i / NUM_SAMPLES;
            const date = new Date(currentDate.getTime() + t * periodMs);
            const tritonRelativeToNeptune = getTritonPosition(date);
            points.push(neptunePositionNow.clone().add(tritonRelativeToNeptune));
        }

        return points;
    }, [
        showTritonOrbit,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (!showTritonOrbit || orbitPoints.length === 0) {
        return null;
    }

    const isFocused = selectedId === "triton";
    const lineWidth = isFocused ? BASE_LINE_WIDTH * FOCUS_MULTIPLIER : BASE_LINE_WIDTH;
    const opacity = isFocused ? FOCUS_OPACITY : BASE_OPACITY;

    return (
        <Line
            points={orbitPoints}
            color={TRITON_ORBIT_COLOR}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            depthTest={true}
            depthWrite={false}
        />
    );
}
