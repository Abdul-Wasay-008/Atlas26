"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getEarthOrbitPosition } from "@/app/astronomy/earthOrbit";
import { getMoonPosition } from "@/app/astronomy/lunar";
import { MOON_ORBIT_COLOR } from "@/app/data/satelliteOrbitColors";

const EARTH_ORBIT_RADIUS = 8.0;
/** Sidereal month in days (~27.3) */
const MOON_ORBITAL_PERIOD_DAYS = 27.321661;
const NUM_SAMPLES = 400;

const BASE_LINE_WIDTH = 0.6;
const FOCUS_MULTIPLIER = 1.4;
const BASE_OPACITY = 0.55;
const FOCUS_OPACITY = 0.8;

/**
 * Moon Orbit Path Visualizer
 *
 * Renders the Moon's orbit around Earth when the Moon is selected.
 * The path is a closed ellipse centered on Earth's current position (Moon's
 * relative positions over one period), so it circles Earth correctly and
 * does not pass through it.
 */
export default function MoonOrbitPath() {
    const { selectedId, showAllOrbits } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const showMoonOrbit = selectedId === "moon" || selectedId === "earth" || showAllOrbits;

    const orbitPoints = useMemo(() => {
        if (!showMoonOrbit) {
            return [];
        }

        const msPerDay = 86400000;
        const periodMs = MOON_ORBITAL_PERIOD_DAYS * msPerDay;

        // Earth's position *now* – orbit is drawn centered on current Earth
        const earthPositionNow = getEarthOrbitPosition(currentDate, EARTH_ORBIT_RADIUS);

        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= NUM_SAMPLES; i++) {
            const t = i / NUM_SAMPLES;
            const date = new Date(currentDate.getTime() + t * periodMs);
            const moonRelativeToEarth = getMoonPosition(date);
            points.push(earthPositionNow.clone().add(moonRelativeToEarth));
        }

        return points;
    }, [
        showMoonOrbit,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (!showMoonOrbit || orbitPoints.length === 0) {
        return null;
    }

    const isFocused = selectedId === "moon";
    const lineWidth = isFocused ? BASE_LINE_WIDTH * FOCUS_MULTIPLIER : BASE_LINE_WIDTH;
    const opacity = isFocused ? FOCUS_OPACITY : BASE_OPACITY;

    return (
        <Line
            points={orbitPoints}
            color={MOON_ORBIT_COLOR}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            depthTest={true}
            depthWrite={false}
        />
    );
}
