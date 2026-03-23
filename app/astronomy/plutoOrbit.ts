import * as THREE from "three";
import {
    getPlanetOrbitPosition,
    keplerPeriodDays,
    type PlanetOrbitParams,
} from "./planetOrbit";

const PLUTO_SEMI_MAJOR_AXIS_AU = 39.5;

export const PLUTO_ORBIT_PARAMS: PlanetOrbitParams = {
    periodDays: keplerPeriodDays(PLUTO_SEMI_MAJOR_AXIS_AU),
    semiMajorAxis: 42,
    eccentricity: 0.248,
};

/**
 * Get Pluto orbital position in heliocentric coordinates (Sun at origin).
 * Orbital plane is XZ (Y = 0), aligned with the solar system.
 */
export function getPlutoPosition(date: Date): THREE.Vector3 {
    return getPlanetOrbitPosition(date, PLUTO_ORBIT_PARAMS);
}
