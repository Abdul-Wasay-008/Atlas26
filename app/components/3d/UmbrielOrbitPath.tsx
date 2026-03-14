"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getPlanetOrbitPosition, URANUS_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";
import { getUmbrielPosition, UMBRIEL_ORBITAL_PERIOD_HOURS } from "@/app/astronomy/umbrielOrbit";
import { UMBRIEL_ORBIT_COLOR } from "@/app/data/satelliteOrbitColors";

const NUM_SAMPLES = 200;

const BASE_LINE_WIDTH = 0.5;
const FOCUS_MULTIPLIER = 1.4;
const BASE_OPACITY = 0.55;
const FOCUS_OPACITY = 0.8;

/**
 * Umbriel Orbit Path Visualizer
 *
 * Renders Umbriel's orbit around Uranus when Umbriel or Uranus is selected, or all orbits are shown.
 * The path is a closed ellipse centered on Uranus's current position.
 */
export default function UmbrielOrbitPath() {
    const { selectedId, showAllOrbits } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const showUmbrielOrbit = selectedId === "umbriel" || selectedId === "uranus" || showAllOrbits;

    const orbitPoints = useMemo(() => {
        if (!showUmbrielOrbit) {
            return [];
        }

        const msPerHour = 3600000;
        const periodMs = UMBRIEL_ORBITAL_PERIOD_HOURS * msPerHour;

        const uranusPositionNow = getPlanetOrbitPosition(currentDate, URANUS_ORBIT_PARAMS);

        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= NUM_SAMPLES; i++) {
            const t = i / NUM_SAMPLES;
            const date = new Date(currentDate.getTime() + t * periodMs);
            const umbrielRelativeToUranus = getUmbrielPosition(date);
            points.push(uranusPositionNow.clone().add(umbrielRelativeToUranus));
        }

        return points;
    }, [
        showUmbrielOrbit,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (!showUmbrielOrbit || orbitPoints.length === 0) {
        return null;
    }

    const isFocused = selectedId === "umbriel";
    const lineWidth = isFocused ? BASE_LINE_WIDTH * FOCUS_MULTIPLIER : BASE_LINE_WIDTH;
    const opacity = isFocused ? FOCUS_OPACITY : BASE_OPACITY;

    return (
        <Line
            points={orbitPoints}
            color={UMBRIEL_ORBIT_COLOR}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            depthTest={true}
            depthWrite={false}
        />
    );
}
