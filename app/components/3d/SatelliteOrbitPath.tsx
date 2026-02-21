"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

import { useSelectionStore } from "@/app/store/selectionStore";
import { useTimeManager } from "@/app/core/useTimeManager";
import { getTLEForSatellite, NORAD_IDS } from "@/app/services/tleService";
import {
    computeSatelliteEcefFromTle,
    satelliteLatLonAltToWorld,
} from "@/app/astronomy/satellitePosition";
import { getEarthOrbitPosition } from "@/app/astronomy/earthOrbit";
import { getSatelliteOrbitColor } from "@/app/data/satelliteOrbitColors";

const EARTH_ORBIT_RADIUS = 8.0;

const BASE_LINE_WIDTH = 0.6;
const FOCUS_MULTIPLIER = 1.4;
const BASE_OPACITY = 0.55;
const FOCUS_OPACITY = 0.8;

interface SatelliteConfig {
    id: string;
    noradId: number;
    orbitalPeriodMinutes: number;
}

const SATELLITE_CONFIGS: SatelliteConfig[] = [
    { id: "iss", noradId: NORAD_IDS.ISS, orbitalPeriodMinutes: 93 },
    { id: "hubble", noradId: NORAD_IDS.HUBBLE, orbitalPeriodMinutes: 96 },
];

function computeSatelliteOrbitPoints(
    config: SatelliteConfig,
    currentDate: Date
): THREE.Vector3[] {
    try {
        const tle = getTLEForSatellite(config.noradId);
        const orbitalPeriodSeconds = config.orbitalPeriodMinutes * 60;
        const sampleIntervalSeconds = 10;
        const numSamples = Math.ceil(orbitalPeriodSeconds / sampleIntervalSeconds);
        const halfPeriod = orbitalPeriodSeconds / 2;

        const rawPoints: THREE.Vector3[] = [];

        for (let i = 0; i < numSamples; i++) {
            const timeOffsetSeconds = -halfPeriod + (i * orbitalPeriodSeconds) / numSamples;
            const sampleDate = new Date(currentDate.getTime() + timeOffsetSeconds * 1000);

            const satelliteEcef = computeSatelliteEcefFromTle(tle, sampleDate, config.id);
            const earthPosition = getEarthOrbitPosition(sampleDate, EARTH_ORBIT_RADIUS);
            const worldPosition = satelliteLatLonAltToWorld(satelliteEcef, earthPosition);

            rawPoints.push(worldPosition);
        }

        if (rawPoints.length < 4) {
            return [];
        }

        const curve = new THREE.CatmullRomCurve3(rawPoints, true, "centripetal");
        return curve.getPoints(1000);
    } catch (error) {
        if (process.env.NODE_ENV === "development") {
            console.warn(`Failed to compute orbit for ${config.id}:`, error);
        }
        return [];
    }
}

function SingleSatelliteOrbitLine({ 
    satelliteId, 
    points,
    isFocused 
}: { 
    satelliteId: string; 
    points: THREE.Vector3[];
    isFocused: boolean;
}) {
    const orbitColor = getSatelliteOrbitColor(satelliteId);
    const lineWidth = isFocused ? BASE_LINE_WIDTH * FOCUS_MULTIPLIER : BASE_LINE_WIDTH;
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

export default function SatelliteOrbitPath() {
    const { selectedId, showAllOrbits } = useSelectionStore();
    const { currentDate } = useTimeManager();

    const isSatellite = selectedId === "iss" || selectedId === "hubble";

    const allOrbitData = useMemo(() => {
        if (!showAllOrbits) {
            return [];
        }

        return SATELLITE_CONFIGS.map(config => ({
            id: config.id,
            points: computeSatelliteOrbitPoints(config, currentDate),
        })).filter(orbit => orbit.points.length > 0);
    }, [
        showAllOrbits,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    const singleOrbitPoints = useMemo(() => {
        if (showAllOrbits || !isSatellite || !selectedId) {
            return [];
        }

        const config = SATELLITE_CONFIGS.find(c => c.id === selectedId);
        if (!config) return [];

        return computeSatelliteOrbitPoints(config, currentDate);
    }, [
        selectedId,
        isSatellite,
        showAllOrbits,
        Math.floor(currentDate.getTime() / (5 * 60 * 1000)),
    ]);

    if (showAllOrbits && allOrbitData.length > 0) {
        return (
            <>
                {allOrbitData.map(orbit => (
                    <SingleSatelliteOrbitLine
                        key={orbit.id}
                        satelliteId={orbit.id}
                        points={orbit.points}
                        isFocused={selectedId === orbit.id}
                    />
                ))}
            </>
        );
    }

    if (!isSatellite || singleOrbitPoints.length === 0) {
        return null;
    }

    return (
        <SingleSatelliteOrbitLine 
            satelliteId={selectedId!} 
            points={singleOrbitPoints} 
            isFocused={true}
        />
    );
}
