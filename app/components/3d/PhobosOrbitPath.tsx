"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getPlanetOrbitPosition, MARS_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";
import { getPhobosPosition, PHOBOS_ORBITAL_PERIOD_HOURS } from "@/app/astronomy/phobosOrbit";
import { PHOBOS_ORBIT_COLOR } from "@/app/data/satelliteOrbitColors";

const NUM_SAMPLES = 200;

const BASE_LINE_WIDTH = 0.5;
const FOCUS_MULTIPLIER = 1.4;
const BASE_OPACITY = 0.55;
const FOCUS_OPACITY = 0.8;

/**
 * Phobos Orbit Path Visualizer
 *
 * Renders Phobos's orbit around Mars when Phobos is selected or all orbits are shown.
 * The path is a closed ellipse centered on Mars's current position.
 */
export default function PhobosOrbitPath() {
    const { selectedId, showAllOrbits } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const showPhobosOrbit = selectedId === "phobos" || selectedId === "mars" || showAllOrbits;

    const orbitPoints = useMemo(() => {
        if (!showPhobosOrbit) {
            return [];
        }

        const msPerHour = 3600000;
        const periodMs = PHOBOS_ORBITAL_PERIOD_HOURS * msPerHour;

        // Mars's position now - orbit is drawn centered on current Mars
        const marsPositionNow = getPlanetOrbitPosition(currentDate, MARS_ORBIT_PARAMS);

        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= NUM_SAMPLES; i++) {
            const t = i / NUM_SAMPLES;
            const date = new Date(currentDate.getTime() + t * periodMs);
            const phobosRelativeToMars = getPhobosPosition(date);
            points.push(marsPositionNow.clone().add(phobosRelativeToMars));
        }

        return points;
    }, [
        showPhobosOrbit,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (!showPhobosOrbit || orbitPoints.length === 0) {
        return null;
    }

    const isFocused = selectedId === "phobos";
    const lineWidth = isFocused ? BASE_LINE_WIDTH * FOCUS_MULTIPLIER : BASE_LINE_WIDTH;
    const opacity = isFocused ? FOCUS_OPACITY : BASE_OPACITY;

    return (
        <Line
            points={orbitPoints}
            color={PHOBOS_ORBIT_COLOR}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            depthTest={true}
            depthWrite={false}
        />
    );
}
