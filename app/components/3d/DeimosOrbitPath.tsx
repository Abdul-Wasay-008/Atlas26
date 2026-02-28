"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { useSelectionStore } from "@/app/store/selectionStore";
import { timeManager } from "@/app/core/TimeManager";
import { getDeimosPosition, DEIMOS_ORBITAL_PERIOD_HOURS } from "@/app/astronomy/deimosOrbit";
import { getPlanetOrbitPosition, MARS_ORBIT_PARAMS } from "@/app/astronomy/planetOrbit";
import { DEIMOS_ORBIT_COLOR } from "@/app/data/satelliteOrbitColors";

extend({ Line2, LineMaterial, LineGeometry });

export default function DeimosOrbitPath() {
    const lineRef = useRef<Line2>(null);
    const selectedId = useSelectionStore((state) => state.selectedId);
    const showAllOrbits = useSelectionStore((state) => state.showAllOrbits);

    const showDeimosOrbit = selectedId === "deimos" || selectedId === "mars" || showAllOrbits;

    const orbitPoints = useMemo(() => {
        if (!showDeimosOrbit) return null;

        const points: number[] = [];
        const samples = 200;
        const msPerHour = 3600000;
        const periodMs = DEIMOS_ORBITAL_PERIOD_HOURS * msPerHour;
        const refDate = new Date(Date.UTC(2024, 0, 1, 0, 0, 0, 0));
        const startTime = refDate.getTime();

        for (let i = 0; i <= samples; i++) {
            const t = startTime + (i / samples) * periodMs;
            const date = new Date(t);
            const pos = getDeimosPosition(date);
            points.push(pos.x, pos.y, pos.z);
        }

        return points;
    }, [showDeimosOrbit]);

    const geometry = useMemo(() => {
        if (!orbitPoints) return null;
        const geo = new LineGeometry();
        geo.setPositions(orbitPoints);
        return geo;
    }, [orbitPoints]);

    const material = useMemo(() => {
        const color = new THREE.Color(DEIMOS_ORBIT_COLOR);
        return new LineMaterial({
            color: color.getHex(),
            linewidth: 0.5,
            transparent: true,
            opacity: 0.7,
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
        });
    }, []);

    useFrame(() => {
        if (lineRef.current && showDeimosOrbit) {
            const currentDate = timeManager.getCurrentDate();
            const marsPosition = getPlanetOrbitPosition(currentDate, MARS_ORBIT_PARAMS);
            lineRef.current.position.copy(marsPosition);
        }
    });

    if (!showDeimosOrbit || !geometry) return null;

    return (
        <primitive
            ref={lineRef}
            object={new Line2(geometry, material)}
        />
    );
}
