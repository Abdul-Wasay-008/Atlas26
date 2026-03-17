"use client";

import * as THREE from "three";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { timeManager } from "@/app/core/TimeManager";
import { generateAsteroidData } from "@/app/astronomy/asteroidBeltDistribution";
import {
    ASTEROID_COUNT,
    BASE_ORBITAL_PERIOD_DAYS,
    MEDIAN_RADIUS,
    GEOMETRY_DETAIL,
} from "@/app/astronomy/asteroidBeltConfig";

interface AsteroidBeltProps {
    visible?: boolean;
}

const NOOP_RAYCAST = () => {};

const DAY_MS = 86400000;

const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempRotation = new THREE.Euler();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3();

export default function AsteroidBelt({ visible = true }: AsteroidBeltProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const asteroidData = useMemo(() => generateAsteroidData(ASTEROID_COUNT), []);

    const geometry = useMemo(() => {
        return new THREE.IcosahedronGeometry(1, GEOMETRY_DETAIL);
    }, []);

    const material = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: "#8a8278",
            roughness: 0.85,
            metalness: 0.1,
            flatShading: true,
        });
    }, []);

    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const { baseAngles, radii, yOffsets, scales, rotations } = asteroidData;

        for (let i = 0; i < ASTEROID_COUNT; i++) {
            const angle = baseAngles[i];
            const r = radii[i];
            const s = scales[i];

            tempPosition.set(
                Math.cos(angle) * r,
                yOffsets[i],
                Math.sin(angle) * r,
            );

            tempRotation.set(
                rotations[i * 3],
                rotations[i * 3 + 1],
                rotations[i * 3 + 2],
            );
            tempQuaternion.setFromEuler(tempRotation);

            tempScale.set(s, s, s);

            tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
            mesh.setMatrixAt(i, tempMatrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
    }, [asteroidData]);

    useFrame(() => {
        const mesh = meshRef.current;
        if (!mesh || !visible) return;

        const currentDate = timeManager.getCurrentDate();
        const daysSinceJ2000 =
            (currentDate.getTime() / DAY_MS + 2440587.5) - 2451545.0;

        const baseMeanAnomaly =
            (daysSinceJ2000 / BASE_ORBITAL_PERIOD_DAYS) * Math.PI * 2;

        const { baseAngles, radii, yOffsets, scales, rotations } = asteroidData;

        for (let i = 0; i < ASTEROID_COUNT; i++) {
            const r = radii[i];

            // Kepler III: inner asteroids orbit faster (T ∝ r^1.5)
            const speedFactor = Math.pow(MEDIAN_RADIUS / r, 1.5);
            const angle = baseAngles[i] + baseMeanAnomaly * speedFactor;

            const s = scales[i];

            tempPosition.set(
                Math.cos(angle) * r,
                yOffsets[i],
                Math.sin(angle) * r,
            );

            tempRotation.set(
                rotations[i * 3],
                rotations[i * 3 + 1],
                rotations[i * 3 + 2],
            );
            tempQuaternion.setFromEuler(tempRotation);

            tempScale.set(s, s, s);

            tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
            mesh.setMatrixAt(i, tempMatrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
    });

    if (!visible) return null;

    return (
        <instancedMesh
            ref={meshRef}
            args={[geometry, material, ASTEROID_COUNT]}
            frustumCulled={false}
            raycast={NOOP_RAYCAST}
        />
    );
}
