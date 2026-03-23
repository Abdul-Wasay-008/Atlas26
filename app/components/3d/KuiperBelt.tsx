"use client";

import * as THREE from "three";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { timeManager } from "@/app/core/TimeManager";
import { generateKuiperData } from "@/app/astronomy/kuiperBeltDistribution";
import {
    KUIPER_COUNT,
    BASE_ORBITAL_PERIOD_DAYS,
    KUIPER_VISUAL_SPEED_MULTIPLIER,
    GEOMETRY_DETAIL,
} from "@/app/astronomy/kuiperBeltConfig";

interface KuiperBeltProps {
    visible?: boolean;
}

const NOOP_RAYCAST = () => {};

const KUIPER_ORBITAL_PERIOD_SECONDS = BASE_ORBITAL_PERIOD_DAYS * 86400;

const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempRotation = new THREE.Euler();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3();

export default function KuiperBelt({ visible = true }: KuiperBeltProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const beltRef = useRef<THREE.Group>(null);

    const kuiperData = useMemo(() => generateKuiperData(KUIPER_COUNT), []);

    const geometry = useMemo(() => {
        return new THREE.IcosahedronGeometry(1, GEOMETRY_DETAIL);
    }, []);

    const material = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: "#aeb6c1",
            roughness: 0.9,
            metalness: 0.05,
            flatShading: true,
        });
    }, []);

    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const { baseAngles, radii, yOffsets, scales, rotations } = kuiperData;

        for (let i = 0; i < KUIPER_COUNT; i++) {
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
    }, [kuiperData]);

    useFrame(() => {
        if (!beltRef.current || !visible) return;
        const t = timeManager.getCurrentDate().getTime() / 1000;
        beltRef.current.rotation.y =
            (t / KUIPER_ORBITAL_PERIOD_SECONDS) * Math.PI * 2 * KUIPER_VISUAL_SPEED_MULTIPLIER;
    });

    if (!visible) return null;

    return (
        <group ref={beltRef} rotation={[0, 0, 0]}>
            <instancedMesh
                ref={meshRef}
                args={[geometry, material, KUIPER_COUNT]}
                frustumCulled={false}
                raycast={NOOP_RAYCAST}
            />
        </group>
    );
}
