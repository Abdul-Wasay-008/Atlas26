"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getPlanetOrbitPosition, JUPITER_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";
import { getEuropaPosition, EUROPA_ORBITAL_PERIOD_HOURS } from "@/app/astronomy/europaOrbit";
import { EUROPA_ORBIT_COLOR } from "@/app/data/satelliteOrbitColors";

const NUM_SAMPLES = 200;

const BASE_LINE_WIDTH = 0.5;
const FOCUS_MULTIPLIER = 1.4;
const BASE_OPACITY = 0.55;
const FOCUS_OPACITY = 0.8;

/**
 * Europa Orbit Path Visualizer
 *
 * Renders Europa's orbit around Jupiter when Europa or Jupiter is selected, or all orbits are shown.
 * The path is a closed ellipse centered on Jupiter's current position.
 */
export default function EuropaOrbitPath() {
    const { selectedId, showAllOrbits } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const showEuropaOrbit = selectedId === "europa" || selectedId === "jupiter" || showAllOrbits;

    const orbitPoints = useMemo(() => {
        if (!showEuropaOrbit) {
            return [];
        }

        const msPerHour = 3600000;
        const periodMs = EUROPA_ORBITAL_PERIOD_HOURS * msPerHour;

        // Jupiter's position now - orbit is drawn centered on current Jupiter
        const jupiterPositionNow = getPlanetOrbitPosition(currentDate, JUPITER_ORBIT_PARAMS);

        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= NUM_SAMPLES; i++) {
            const t = i / NUM_SAMPLES;
            const date = new Date(currentDate.getTime() + t * periodMs);
            const europaRelativeToJupiter = getEuropaPosition(date);
            points.push(jupiterPositionNow.clone().add(europaRelativeToJupiter));
        }

        return points;
    }, [
        showEuropaOrbit,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (!showEuropaOrbit || orbitPoints.length === 0) {
        return null;
    }

    const isFocused = selectedId === "europa";
    const lineWidth = isFocused ? BASE_LINE_WIDTH * FOCUS_MULTIPLIER : BASE_LINE_WIDTH;
    const opacity = isFocused ? FOCUS_OPACITY : BASE_OPACITY;

    return (
        <Line
            points={orbitPoints}
            color={EUROPA_ORBIT_COLOR}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            depthTest={true}
            depthWrite={false}
        />
    );
}
