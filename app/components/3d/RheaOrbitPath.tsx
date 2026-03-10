"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getPlanetOrbitPosition, SATURN_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";
import { getRheaPosition, RHEA_ORBITAL_PERIOD_HOURS } from "@/app/astronomy/rheaOrbit";
import { RHEA_ORBIT_COLOR } from "@/app/data/satelliteOrbitColors";

const NUM_SAMPLES = 200;

const BASE_LINE_WIDTH = 0.5;
const FOCUS_MULTIPLIER = 1.4;
const BASE_OPACITY = 0.55;
const FOCUS_OPACITY = 0.8;

/**
 * Rhea Orbit Path Visualizer
 *
 * Renders Rhea's orbit around Saturn when Rhea or Saturn is selected, or all orbits are shown.
 * The path is a closed ellipse centered on Saturn's current position.
 */
export default function RheaOrbitPath() {
    const { selectedId, showAllOrbits } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const showRheaOrbit = selectedId === "rhea" || selectedId === "saturn" || showAllOrbits;

    const orbitPoints = useMemo(() => {
        if (!showRheaOrbit) {
            return [];
        }

        const msPerHour = 3600000;
        const periodMs = RHEA_ORBITAL_PERIOD_HOURS * msPerHour;

        const saturnPositionNow = getPlanetOrbitPosition(currentDate, SATURN_ORBIT_PARAMS);

        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= NUM_SAMPLES; i++) {
            const t = i / NUM_SAMPLES;
            const date = new Date(currentDate.getTime() + t * periodMs);
            const rheaRelativeToSaturn = getRheaPosition(date);
            points.push(saturnPositionNow.clone().add(rheaRelativeToSaturn));
        }

        return points;
    }, [
        showRheaOrbit,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (!showRheaOrbit || orbitPoints.length === 0) {
        return null;
    }

    const isFocused = selectedId === "rhea";
    const lineWidth = isFocused ? BASE_LINE_WIDTH * FOCUS_MULTIPLIER : BASE_LINE_WIDTH;
    const opacity = isFocused ? FOCUS_OPACITY : BASE_OPACITY;

    return (
        <Line
            points={orbitPoints}
            color={RHEA_ORBIT_COLOR}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            depthTest={true}
            depthWrite={false}
        />
    );
}
