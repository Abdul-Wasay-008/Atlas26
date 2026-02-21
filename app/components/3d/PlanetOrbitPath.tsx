"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getEarthOrbitPosition } from "@/app/astronomy/earthOrbit";
import {
    getPlanetOrbitPosition,
    MERCURY_ORBIT_PARAMS,
    MARS_ORBIT_PARAMS,
    VENUS_ORBIT_PARAMS,
    JUPITER_ORBIT_PARAMS,
    SATURN_ORBIT_PARAMS,
    URANUS_ORBIT_PARAMS,
} from "@/app/astronomy/planetOrbit";
import { getPlanetOrbitColor } from "@/app/data/satelliteOrbitColors";

const EARTH_ORBIT_RADIUS = 8.0;
const EARTH_ORBITAL_PERIOD_DAYS = 365.2422;
const MERCURY_ORBITAL_PERIOD_DAYS = 88;
const VENUS_ORBITAL_PERIOD_DAYS = 225;
const MARS_ORBITAL_PERIOD_DAYS = 687;
const JUPITER_ORBITAL_PERIOD_DAYS = 4333;
const SATURN_ORBITAL_PERIOD_DAYS = 10759;
const URANUS_ORBITAL_PERIOD_DAYS = 30687;
const NUM_SAMPLES = 500;

/**
 * Planet Orbit Path Visualizer
 *
 * Renders the orbital path around the Sun for the currently selected planet
 * (Earth or Mars). Same show/hide behavior as satellite orbit paths:
 * visible only when that planet is selected, hidden when another object is
 * selected or selection is cleared.
 */
export default function PlanetOrbitPath() {
    const { selectedId } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const isPlanet = selectedId === "mercury" || selectedId === "venus" || selectedId === "earth" || selectedId === "mars" || selectedId === "jupiter" || selectedId === "saturn" || selectedId === "uranus";

    const orbitPoints = useMemo(() => {
        if (!isPlanet || !selectedId) {
            return [];
        }

        const periodDays =
            selectedId === "mercury" ? MERCURY_ORBITAL_PERIOD_DAYS :
            selectedId === "venus" ? VENUS_ORBITAL_PERIOD_DAYS :
            selectedId === "earth" ? EARTH_ORBITAL_PERIOD_DAYS :
            selectedId === "mars" ? MARS_ORBITAL_PERIOD_DAYS :
            selectedId === "jupiter" ? JUPITER_ORBITAL_PERIOD_DAYS :
            selectedId === "saturn" ? SATURN_ORBITAL_PERIOD_DAYS : URANUS_ORBITAL_PERIOD_DAYS;
        const msPerDay = 86400000;
        const periodMs = periodDays * msPerDay;

        const points: THREE.Vector3[] = [];

        for (let i = 0; i <= NUM_SAMPLES; i++) {
            const t = i / NUM_SAMPLES;
            const date = new Date(currentDate.getTime() + t * periodMs);

            if (selectedId === "mercury") {
                points.push(getPlanetOrbitPosition(date, MERCURY_ORBIT_PARAMS));
            } else if (selectedId === "venus") {
                points.push(getPlanetOrbitPosition(date, VENUS_ORBIT_PARAMS));
            } else if (selectedId === "earth") {
                points.push(getEarthOrbitPosition(date, EARTH_ORBIT_RADIUS));
            } else if (selectedId === "mars") {
                points.push(getPlanetOrbitPosition(date, MARS_ORBIT_PARAMS));
            } else if (selectedId === "jupiter") {
                points.push(getPlanetOrbitPosition(date, JUPITER_ORBIT_PARAMS));
            } else if (selectedId === "saturn") {
                points.push(getPlanetOrbitPosition(date, SATURN_ORBIT_PARAMS));
            } else {
                points.push(getPlanetOrbitPosition(date, URANUS_ORBIT_PARAMS));
            }
        }

        return points;
    }, [
        selectedId,
        isPlanet,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (!isPlanet || orbitPoints.length === 0) {
        return null;
    }

    const orbitColor = getPlanetOrbitColor(selectedId);

    return (
        <Line
            points={orbitPoints}
            color={orbitColor}
            lineWidth={1.5}
            transparent
            opacity={0.6}
            depthTest={true}
            depthWrite={false}
        />
    );
}
