"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getPlanetOrbitPosition, SATURN_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";
import { getDionePosition, DIONE_ORBITAL_PERIOD_HOURS } from "@/app/astronomy/dioneOrbit";
import { DIONE_ORBIT_COLOR } from "@/app/data/satelliteOrbitColors";

const NUM_SAMPLES = 200;

const BASE_LINE_WIDTH = 0.5;
const FOCUS_MULTIPLIER = 1.4;
const BASE_OPACITY = 0.55;
const FOCUS_OPACITY = 0.8;

/**
 * Dione Orbit Path Visualizer
 *
 * Renders Dione's orbit around Saturn when Dione or Saturn is selected, or all orbits are shown.
 * The path is a closed ellipse centered on Saturn's current position.
 */
export default function DioneOrbitPath() {
    const { selectedId, showAllOrbits } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const showDioneOrbit = selectedId === "dione" || selectedId === "saturn" || showAllOrbits;

    const orbitPoints = useMemo(() => {
        if (!showDioneOrbit) {
            return [];
        }

        const msPerHour = 3600000;
        const periodMs = DIONE_ORBITAL_PERIOD_HOURS * msPerHour;

        const saturnPositionNow = getPlanetOrbitPosition(currentDate, SATURN_ORBIT_PARAMS);

        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= NUM_SAMPLES; i++) {
            const t = i / NUM_SAMPLES;
            const date = new Date(currentDate.getTime() + t * periodMs);
            const dioneRelativeToSaturn = getDionePosition(date);
            points.push(saturnPositionNow.clone().add(dioneRelativeToSaturn));
        }

        return points;
    }, [
        showDioneOrbit,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (!showDioneOrbit || orbitPoints.length === 0) {
        return null;
    }

    const isFocused = selectedId === "dione";
    const lineWidth = isFocused ? BASE_LINE_WIDTH * FOCUS_MULTIPLIER : BASE_LINE_WIDTH;
    const opacity = isFocused ? FOCUS_OPACITY : BASE_OPACITY;

    return (
        <Line
            points={orbitPoints}
            color={DIONE_ORBIT_COLOR}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            depthTest={true}
            depthWrite={false}
        />
    );
}
