"use client";

import * as THREE from "three";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { timeManager } from "@/app/core/TimeManager";
import { generateAsteroidData } from "@/app/astronomy/asteroidBeltDistribution";
import {
    ASTEROID_COUNT,
    BASE_ORBITAL_PERIOD_DAYS,
    GEOMETRY_DETAIL,
} from "@/app/astronomy/asteroidBeltConfig";

interface AsteroidBeltProps {
    visible?: boolean;
}

const NOOP_RAYCAST = () => { };

const BELT_ORBITAL_PERIOD_SECONDS = BASE_ORBITAL_PERIOD_DAYS * 86400;
const VARIATION_AMPLITUDE = 0.00002;

const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempRotation = new THREE.Euler();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3();

export default function AsteroidBelt({ visible = true }: AsteroidBeltProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const beltRef = useRef<THREE.Group>(null);

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
        if (!beltRef.current || !visible) return;
        const t = timeManager.getCurrentDate().getTime() / 1000;
        beltRef.current.rotation.y =
            (t / BELT_ORBITAL_PERIOD_SECONDS) * Math.PI * 2
            + Math.sin(t * 0.0000002) * VARIATION_AMPLITUDE;
    });

    if (!visible) return null;

    return (
        <group ref={beltRef} rotation={[0.02, 0, 0]}>
            <instancedMesh
                ref={meshRef}
                args={[geometry, material, ASTEROID_COUNT]}
                frustumCulled={false}
                raycast={NOOP_RAYCAST}
            />
        </group>
    );
}
