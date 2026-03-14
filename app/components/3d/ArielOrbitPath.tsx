"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getPlanetOrbitPosition, URANUS_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";
import { getArielPosition, ARIEL_ORBITAL_PERIOD_HOURS } from "@/app/astronomy/arielOrbit";
import { ARIEL_ORBIT_COLOR } from "@/app/data/satelliteOrbitColors";

const NUM_SAMPLES = 200;

const BASE_LINE_WIDTH = 0.5;
const FOCUS_MULTIPLIER = 1.4;
const BASE_OPACITY = 0.55;
const FOCUS_OPACITY = 0.8;

/**
 * Ariel Orbit Path Visualizer
 *
 * Renders Ariel's orbit around Uranus when Ariel or Uranus is selected, or all orbits are shown.
 * The path is a closed ellipse centered on Uranus's current position.
 */
export default function ArielOrbitPath() {
    const { selectedId, showAllOrbits } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const showArielOrbit = selectedId === "ariel" || selectedId === "uranus" || showAllOrbits;

    const orbitPoints = useMemo(() => {
        if (!showArielOrbit) {
            return [];
        }

        const msPerHour = 3600000;
        const periodMs = ARIEL_ORBITAL_PERIOD_HOURS * msPerHour;

        const uranusPositionNow = getPlanetOrbitPosition(currentDate, URANUS_ORBIT_PARAMS);

        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= NUM_SAMPLES; i++) {
            const t = i / NUM_SAMPLES;
            const date = new Date(currentDate.getTime() + t * periodMs);
            const arielRelativeToUranus = getArielPosition(date);
            points.push(uranusPositionNow.clone().add(arielRelativeToUranus));
        }

        return points;
    }, [
        showArielOrbit,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (!showArielOrbit || orbitPoints.length === 0) {
        return null;
    }

    const isFocused = selectedId === "ariel";
    const lineWidth = isFocused ? BASE_LINE_WIDTH * FOCUS_MULTIPLIER : BASE_LINE_WIDTH;
    const opacity = isFocused ? FOCUS_OPACITY : BASE_OPACITY;

    return (
        <Line
            points={orbitPoints}
            color={ARIEL_ORBIT_COLOR}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            depthTest={true}
            depthWrite={false}
        />
    );
}
