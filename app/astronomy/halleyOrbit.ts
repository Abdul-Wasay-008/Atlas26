import * as THREE from "three";
import {
    getPlanetOrbitPosition,
    type PlanetOrbitParams,
} from "./planetOrbit";

export const HALLEY_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: 27500,
    semiMajorAxis: 28,
    eccentricity: 0.93,
};

const INCLINATION_RADIANS = THREE.MathUtils.degToRad(8);

/**
 * Get Halley's Comet orbital position in heliocentric coordinates (Sun at origin).
 * Uses highly elliptical orbit with 8° inclination applied per-position (no global rotation).
 */
export function getHalleyPosition(date: Date): THREE.Vector3 {
    const position = getPlanetOrbitPosition(date, HALLEY_ORBIT_PARAMS);
    const z = position.z;
    position.y = z * Math.sin(INCLINATION_RADIANS);
    position.z = z * Math.cos(INCLINATION_RADIANS);
    return position;
}
