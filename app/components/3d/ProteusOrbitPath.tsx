"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getPlanetOrbitPosition, NEPTUNE_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";
import { getProteusPosition, PROTEUS_ORBITAL_PERIOD_HOURS } from "@/app/astronomy/proteusOrbit";
import { PROTEUS_ORBIT_COLOR } from "@/app/data/satelliteOrbitColors";

const NUM_SAMPLES = 200;

const BASE_LINE_WIDTH = 0.5;
const FOCUS_MULTIPLIER = 1.4;
const BASE_OPACITY = 0.55;
const FOCUS_OPACITY = 0.8;

/**
 * Proteus Orbit Path Visualizer
 *
 * Renders Proteus's orbit around Neptune when Proteus or Neptune is selected, or all orbits are shown.
 * The path is a closed ellipse centered on Neptune's current position.
 */
export default function ProteusOrbitPath() {
    const { selectedId, showAllOrbits } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const showProteusOrbit = selectedId === "proteus" || selectedId === "neptune" || showAllOrbits;

    const orbitPoints = useMemo(() => {
        if (!showProteusOrbit) {
            return [];
        }

        const msPerHour = 3600000;
        const periodMs = PROTEUS_ORBITAL_PERIOD_HOURS * msPerHour;

        const neptunePositionNow = getPlanetOrbitPosition(currentDate, NEPTUNE_ORBIT_PARAMS);

        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= NUM_SAMPLES; i++) {
            const t = i / NUM_SAMPLES;
            const date = new Date(currentDate.getTime() + t * periodMs);
            const proteusRelativeToNeptune = getProteusPosition(date);
            points.push(neptunePositionNow.clone().add(proteusRelativeToNeptune));
        }

        return points;
    }, [
        showProteusOrbit,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (!showProteusOrbit || orbitPoints.length === 0) {
        return null;
    }

    const isFocused = selectedId === "proteus";
    const lineWidth = isFocused ? BASE_LINE_WIDTH * FOCUS_MULTIPLIER : BASE_LINE_WIDTH;
    const opacity = isFocused ? FOCUS_OPACITY : BASE_OPACITY;

    return (
        <Line
            points={orbitPoints}
            color={PROTEUS_ORBIT_COLOR}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            depthTest={true}
            depthWrite={false}
        />
    );
}

