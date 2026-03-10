"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getPlanetOrbitPosition, SATURN_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";
import { getEnceladusPosition, ENCELADUS_ORBITAL_PERIOD_HOURS } from "@/app/astronomy/enceladusOrbit";
import { ENCELADUS_ORBIT_COLOR } from "@/app/data/satelliteOrbitColors";

const NUM_SAMPLES = 200;

const BASE_LINE_WIDTH = 0.5;
const FOCUS_MULTIPLIER = 1.4;
const BASE_OPACITY = 0.55;
const FOCUS_OPACITY = 0.8;

/**
 * Enceladus Orbit Path Visualizer
 *
 * Renders Enceladus's orbit around Saturn when Enceladus or Saturn is selected, or all orbits are shown.
 * The path is a closed ellipse centered on Saturn's current position.
 */
export default function EnceladusOrbitPath() {
    const { selectedId, showAllOrbits } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const showEnceladusOrbit = selectedId === "enceladus" || selectedId === "saturn" || showAllOrbits;

    const orbitPoints = useMemo(() => {
        if (!showEnceladusOrbit) {
            return [];
        }

        const msPerHour = 3600000;
        const periodMs = ENCELADUS_ORBITAL_PERIOD_HOURS * msPerHour;

        const saturnPositionNow = getPlanetOrbitPosition(currentDate, SATURN_ORBIT_PARAMS);

        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= NUM_SAMPLES; i++) {
            const t = i / NUM_SAMPLES;
            const date = new Date(currentDate.getTime() + t * periodMs);
            const enceladusRelativeToSaturn = getEnceladusPosition(date);
            points.push(saturnPositionNow.clone().add(enceladusRelativeToSaturn));
        }

        return points;
    }, [
        showEnceladusOrbit,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (!showEnceladusOrbit || orbitPoints.length === 0) {
        return null;
    }

    const isFocused = selectedId === "enceladus";
    const lineWidth = isFocused ? BASE_LINE_WIDTH * FOCUS_MULTIPLIER : BASE_LINE_WIDTH;
    const opacity = isFocused ? FOCUS_OPACITY : BASE_OPACITY;

    return (
        <Line
            points={orbitPoints}
            color={ENCELADUS_ORBIT_COLOR}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            depthTest={true}
            depthWrite={false}
        />
    );
}
