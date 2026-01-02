/**
 * Eclipse Astronomy Module
 * 
 * Determines if a satellite (e.g., ISS) is inside Earth's shadow.
 * Uses a cylindrical shadow model (umbra only).
 * 
 * This is purely geometric and physically motivated.
 */

import * as THREE from "three";

/**
 * Eclipse detection parameters
 */
export interface EclipseParams {
    /** Earth's position in world coordinates */
    earthPosition: THREE.Vector3;
    /** ISS position in world coordinates */
    issPosition: THREE.Vector3;
    /** Normalized direction vector from Earth toward Sun */
    sunDirection: THREE.Vector3;
    /** Earth's radius in scene units */
    earthRadius: number;
}

/**
 * Determine if ISS is inside Earth's shadow (eclipse)
 * 
 * Uses a cylindrical shadow model:
 * - ISS is behind Earth relative to the Sun
 * - AND its perpendicular distance from the Earth-Sun axis is less than Earth's radius
 * 
 * @param params Eclipse detection parameters
 * @returns True if ISS is eclipsed (in Earth's shadow)
 */
export function isISSEclipsed(params: EclipseParams): boolean {
    const { earthPosition, issPosition, sunDirection, earthRadius } = params;
    
    // Vector from Earth to ISS
    const earthToISS = new THREE.Vector3().subVectors(issPosition, earthPosition);
    
    // Check if ISS is behind Earth relative to the Sun
    // If dot product is negative, ISS is on the opposite side of Earth from the Sun
    const dotProduct = earthToISS.dot(sunDirection);
    
    if (dotProduct >= 0) {
        // ISS is not behind Earth (it's on the sunlit side)
        return false;
    }
    
    // ISS is behind Earth, now check if it's within the shadow cylinder
    
    // Project ISS position onto the Earth-Sun axis
    // The projection gives us the point on the axis closest to ISS
    const projectionLength = dotProduct; // Already negative, but we need the magnitude
    const projectionPoint = new THREE.Vector3()
        .copy(sunDirection)
        .multiplyScalar(projectionLength)
        .add(earthPosition);
    
    // Calculate perpendicular distance from ISS to the Earth-Sun axis
    const perpendicularVector = new THREE.Vector3().subVectors(issPosition, projectionPoint);
    const perpendicularDistance = perpendicularVector.length();
    
    // ISS is eclipsed if perpendicular distance is less than Earth's radius
    return perpendicularDistance < earthRadius;
}

