"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getPlanetOrbitPosition, NEPTUNE_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";
import { getNereidPosition, NEREID_ORBITAL_PERIOD_HOURS } from "@/app/astronomy/nereidOrbit";
import { NEREID_ORBIT_COLOR } from "@/app/data/satelliteOrbitColors";

const NUM_SAMPLES = 200;

const BASE_LINE_WIDTH = 0.5;
const FOCUS_MULTIPLIER = 1.4;
const BASE_OPACITY = 0.55;
const FOCUS_OPACITY = 0.8;

export default function NereidOrbitPath() {
    const { selectedId, showAllOrbits } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const showNereidOrbit = selectedId === "nereid" || selectedId === "neptune" || showAllOrbits;

    const orbitPoints = useMemo(() => {
        if (!showNereidOrbit) {
            return [];
        }

        const msPerHour = 3600000;
        const periodMs = NEREID_ORBITAL_PERIOD_HOURS * msPerHour;

        const neptunePositionNow = getPlanetOrbitPosition(currentDate, NEPTUNE_ORBIT_PARAMS);

        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= NUM_SAMPLES; i++) {
            const t = i / NUM_SAMPLES;
            const date = new Date(currentDate.getTime() + t * periodMs);
            const nereidRelativeToNeptune = getNereidPosition(date);
            points.push(neptunePositionNow.clone().add(nereidRelativeToNeptune));
        }

        return points;
    }, [
        showNereidOrbit,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (!showNereidOrbit || orbitPoints.length === 0) {
        return null;
    }

    const isFocused = selectedId === "nereid";
    const lineWidth = isFocused ? BASE_LINE_WIDTH * FOCUS_MULTIPLIER : BASE_LINE_WIDTH;
    const opacity = isFocused ? FOCUS_OPACITY : BASE_OPACITY;

    return (
        <Line
            points={orbitPoints}
            color={NEREID_ORBIT_COLOR}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            depthTest={true}
            depthWrite={false}
        />
    );
}

