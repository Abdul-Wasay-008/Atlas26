"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getPlanetOrbitPosition, SATURN_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";
import { getTethysPosition, TETHYS_ORBITAL_PERIOD_HOURS } from "@/app/astronomy/tethysOrbit";
import { TETHYS_ORBIT_COLOR } from "@/app/data/satelliteOrbitColors";

const NUM_SAMPLES = 200;

const BASE_LINE_WIDTH = 0.5;
const FOCUS_MULTIPLIER = 1.4;
const BASE_OPACITY = 0.55;
const FOCUS_OPACITY = 0.8;

/**
 * Tethys Orbit Path Visualizer
 *
 * Renders Tethys's orbit around Saturn when Tethys or Saturn is selected, or all orbits are shown.
 * The path is a closed ellipse centered on Saturn's current position.
 */
export default function TethysOrbitPath() {
    const { selectedId, showAllOrbits } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const showTethysOrbit = selectedId === "tethys" || selectedId === "saturn" || showAllOrbits;

    const orbitPoints = useMemo(() => {
        if (!showTethysOrbit) {
            return [];
        }

        const msPerHour = 3600000;
        const periodMs = TETHYS_ORBITAL_PERIOD_HOURS * msPerHour;

        const saturnPositionNow = getPlanetOrbitPosition(currentDate, SATURN_ORBIT_PARAMS);

        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= NUM_SAMPLES; i++) {
            const t = i / NUM_SAMPLES;
            const date = new Date(currentDate.getTime() + t * periodMs);
            const tethysRelativeToSaturn = getTethysPosition(date);
            points.push(saturnPositionNow.clone().add(tethysRelativeToSaturn));
        }

        return points;
    }, [
        showTethysOrbit,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (!showTethysOrbit || orbitPoints.length === 0) {
        return null;
    }

    const isFocused = selectedId === "tethys";
    const lineWidth = isFocused ? BASE_LINE_WIDTH * FOCUS_MULTIPLIER : BASE_LINE_WIDTH;
    const opacity = isFocused ? FOCUS_OPACITY : BASE_OPACITY;

    return (
        <Line
            points={orbitPoints}
            color={TETHYS_ORBIT_COLOR}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            depthTest={true}
            depthWrite={false}
        />
    );
}
