/**
 * Eclipse Astronomy Module
 * 
 * Determines if a satellite (e.g., ISS) is inside Earth's shadow.
 * Uses geometric ray-sphere intersection to check if Earth blocks the line-of-sight
 * between the ISS and the Sun.
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
 * Uses geometric ray-sphere intersection:
 * - Cast a ray from ISS position toward the Sun
 * - Check if this ray intersects the Earth sphere
 * - If intersection exists and is between ISS and Sun, ISS is in shadow
 * 
 * @param params Eclipse detection parameters
 * @returns True if ISS is eclipsed (in Earth's shadow)
 */
export function isISSEclipsed(params: EclipseParams): boolean {
    const { earthPosition, issPosition, sunDirection, earthRadius } = params;
    
    // Sun is at origin (0, 0, 0) in world coordinates
    const sunPosition = new THREE.Vector3(0, 0, 0);
    
    // Ray from ISS toward Sun
    // Ray origin = ISS position
    const rayOrigin = issPosition.clone();
    
    // Ray direction = normalize(Sun position - ISS position)
    // Since Sun is at origin, this is simply -issPosition normalized
    const rayDirection = new THREE.Vector3()
        .subVectors(sunPosition, issPosition)
        .normalize();
    
    // Earth sphere: center = earthPosition, radius = earthRadius
    const sphereCenter = earthPosition.clone();
    const sphereRadius = earthRadius;
    
    // Ray-sphere intersection test
    // Ray equation: P(t) = O + t*D, where O is origin, D is direction, t >= 0
    // Sphere equation: |P - C|^2 = R^2, where C is center, R is radius
    // 
    // Substitute ray into sphere equation:
    // |O + t*D - C|^2 = R^2
    // 
    // Expand and rearrange:
    // (D·D)*t^2 + 2*D·(O-C)*t + (O-C)·(O-C) - R^2 = 0
    //
    // This is a quadratic: a*t^2 + b*t + c = 0
    // where:
    //   a = D·D (should be 1 since D is normalized)
    //   b = 2*D·(O-C)
    //   c = (O-C)·(O-C) - R^2
    
    const oc = new THREE.Vector3().subVectors(rayOrigin, sphereCenter);
    const a = rayDirection.dot(rayDirection); // Should be 1.0 (normalized)
    const b = 2.0 * rayDirection.dot(oc);
    const c = oc.dot(oc) - sphereRadius * sphereRadius;
    
    // Discriminant: b^2 - 4*a*c
    const discriminant = b * b - 4.0 * a * c;
    
    // If discriminant < 0, no intersection
    if (discriminant < 0) {
        return false; // Ray does not intersect Earth sphere
    }
    
    // Calculate intersection points
    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDiscriminant) / (2.0 * a);
    const t2 = (-b + sqrtDiscriminant) / (2.0 * a);
    
    // We need the closest intersection point (smallest positive t)
    // t represents distance along the ray from ISS toward Sun
    let t = Math.min(t1, t2);
    if (t < 0) {
        t = Math.max(t1, t2);
    }
    
    // If t < 0, intersection is behind the ray origin (behind ISS)
    // This means ISS is inside Earth, which shouldn't happen, but if it does,
    // we consider it as being in shadow
    if (t < 0) {
        // Check if ISS is actually inside Earth sphere
        const distanceFromEarthCenter = oc.length();
        return distanceFromEarthCenter < sphereRadius;
    }
    
    // Calculate distance from ISS to Sun
    const distanceToSun = issPosition.length();
    
    // If intersection distance (t) is less than distance to Sun,
    // then Earth blocks the Sun → ISS is in shadow
    // We also need to ensure the intersection is in front of ISS (t > 0, already checked)
    // Add a small epsilon to handle floating-point precision issues
    const EPSILON = 1e-6;
    return t < distanceToSun - EPSILON;
}

