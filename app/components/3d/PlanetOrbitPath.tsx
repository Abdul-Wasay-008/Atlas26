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
    NEPTUNE_ORBIT_PARAMS,
    PlanetOrbitParams,
} from "@/app/astronomy/planetOrbit";
import { getPlanetOrbitColor } from "@/app/data/satelliteOrbitColors";

const EARTH_ORBIT_RADIUS = 8.0;
const EARTH_ORBITAL_PERIOD_DAYS = 365.2422; // Tropical year, matches earthOrbit
const NUM_SAMPLES = 500;

const ORBIT_THICKNESS = {
    inner: 0.65,
    gas: 0.95,
    ice: 1.15,
} as const;

const FOCUS_MULTIPLIER = 1.4;
const BASE_OPACITY = 0.55;
const FOCUS_OPACITY = 0.8;

function getBaseLineWidth(planetId: string): number {
    switch (planetId) {
        case "mercury":
        case "venus":
        case "earth":
        case "mars":
            return ORBIT_THICKNESS.inner;
        case "jupiter":
        case "saturn":
            return ORBIT_THICKNESS.gas;
        case "uranus":
        case "neptune":
            return ORBIT_THICKNESS.ice;
        default:
            return ORBIT_THICKNESS.inner;
    }
}

interface PlanetOrbitConfig {
    id: string;
    params?: PlanetOrbitParams;
    isEarth?: boolean;
}

const PLANET_CONFIGS: PlanetOrbitConfig[] = [
    { id: "mercury", params: MERCURY_ORBIT_PARAMS },
    { id: "venus", params: VENUS_ORBIT_PARAMS },
    { id: "earth", isEarth: true },
    { id: "mars", params: MARS_ORBIT_PARAMS },
    { id: "jupiter", params: JUPITER_ORBIT_PARAMS },
    { id: "saturn", params: SATURN_ORBIT_PARAMS },
    { id: "uranus", params: URANUS_ORBIT_PARAMS },
    { id: "neptune", params: NEPTUNE_ORBIT_PARAMS },
];

function computeOrbitPoints(
    config: PlanetOrbitConfig,
    currentDate: Date
): THREE.Vector3[] {
    const periodDays = config.params ? config.params.periodDays : EARTH_ORBITAL_PERIOD_DAYS;
    const msPerDay = 86400000;
    const periodMs = periodDays * msPerDay;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= NUM_SAMPLES; i++) {
        const t = i / NUM_SAMPLES;
        const date = new Date(currentDate.getTime() + t * periodMs);

        if (config.isEarth) {
            points.push(getEarthOrbitPosition(date, EARTH_ORBIT_RADIUS));
        } else if (config.params) {
            points.push(getPlanetOrbitPosition(date, config.params));
        }
    }

    return points;
}

function SingleOrbitLine({
    planetId,
    points,
    isFocused
}: {
    planetId: string;
    points: THREE.Vector3[];
    isFocused: boolean;
}) {
    const orbitColor = getPlanetOrbitColor(planetId);
    const baseWidth = getBaseLineWidth(planetId);
    const lineWidth = isFocused ? baseWidth * FOCUS_MULTIPLIER : baseWidth;
    const opacity = isFocused ? FOCUS_OPACITY : BASE_OPACITY;

    return (
        <Line
            points={points}
            color={orbitColor}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            depthTest={true}
            depthWrite={false}
        />
    );
}

export default function PlanetOrbitPath() {
    const { selectedId, showAllOrbits } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const isPlanet = PLANET_CONFIGS.some(c => c.id === selectedId);

    const allOrbitData = useMemo(() => {
        if (!showAllOrbits) {
            return [];
        }

        return PLANET_CONFIGS.map(config => ({
            id: config.id,
            points: computeOrbitPoints(config, currentDate),
        }));
    }, [
        showAllOrbits,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    const singleOrbitPoints = useMemo(() => {
        if (showAllOrbits || !isPlanet || !selectedId) {
            return [];
        }

        const config = PLANET_CONFIGS.find(c => c.id === selectedId);
        if (!config) return [];

        return computeOrbitPoints(config, currentDate);
    }, [
        selectedId,
        isPlanet,
        showAllOrbits,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (showAllOrbits && allOrbitData.length > 0) {
        return (
            <>
                {allOrbitData.map(orbit => (
                    <SingleOrbitLine
                        key={orbit.id}
                        planetId={orbit.id}
                        points={orbit.points}
                        isFocused={selectedId === orbit.id}
                    />
                ))}
            </>
        );
    }

    if (!isPlanet || singleOrbitPoints.length === 0) {
        return null;
    }

    return (
        <SingleOrbitLine
            planetId={selectedId!}
            points={singleOrbitPoints}
            isFocused={true}
        />
    );
}
