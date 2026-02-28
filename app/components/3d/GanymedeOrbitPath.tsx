"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getPlanetOrbitPosition, JUPITER_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";
import { getGanymedePosition, GANYMEDE_ORBITAL_PERIOD_HOURS } from "@/app/astronomy/ganymedeOrbit";
import { GANYMEDE_ORBIT_COLOR } from "@/app/data/satelliteOrbitColors";

const NUM_SAMPLES = 200;

const BASE_LINE_WIDTH = 0.5;
const FOCUS_MULTIPLIER = 1.4;
const BASE_OPACITY = 0.55;
const FOCUS_OPACITY = 0.8;

/**
 * Ganymede Orbit Path Visualizer
 *
 * Renders Ganymede's orbit around Jupiter when Ganymede or Jupiter is selected, or all orbits are shown.
 * The path is a closed ellipse centered on Jupiter's current position.
 */
export default function GanymedeOrbitPath() {
    const { selectedId, showAllOrbits } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const showGanymedeOrbit = selectedId === "ganymede" || selectedId === "jupiter" || showAllOrbits;

    const orbitPoints = useMemo(() => {
        if (!showGanymedeOrbit) {
            return [];
        }

        const msPerHour = 3600000;
        const periodMs = GANYMEDE_ORBITAL_PERIOD_HOURS * msPerHour;

        // Jupiter's position now - orbit is drawn centered on current Jupiter
        const jupiterPositionNow = getPlanetOrbitPosition(currentDate, JUPITER_ORBIT_PARAMS);

        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= NUM_SAMPLES; i++) {
            const t = i / NUM_SAMPLES;
            const date = new Date(currentDate.getTime() + t * periodMs);
            const ganymedeRelativeToJupiter = getGanymedePosition(date);
            points.push(jupiterPositionNow.clone().add(ganymedeRelativeToJupiter));
        }

        return points;
    }, [
        showGanymedeOrbit,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (!showGanymedeOrbit || orbitPoints.length === 0) {
        return null;
    }

    const isFocused = selectedId === "ganymede";
    const lineWidth = isFocused ? BASE_LINE_WIDTH * FOCUS_MULTIPLIER : BASE_LINE_WIDTH;
    const opacity = isFocused ? FOCUS_OPACITY : BASE_OPACITY;

    return (
        <Line
            points={orbitPoints}
            color={GANYMEDE_ORBIT_COLOR}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            depthTest={true}
            depthWrite={false}
        />
    );
}
