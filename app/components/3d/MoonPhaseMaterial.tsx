"use client";

import * as THREE from "three";

/**
 * Creates a shader material for the Moon with physically correct phases
 * The Moon is lit ONLY by the Sun's directional light - no ambient contribution
 * 
 * Usage:
 *   const material = createMoonPhaseMaterial({ moonTexture });
 *   // Then update sun direction in useFrame:
 *   const sunDirection = new THREE.Vector3().subVectors(sunPos, moonPos).normalize();
 *   material.uniforms.uSunDirection.value.copy(sunDirection);
 */
interface MoonPhaseMaterialParams {
    moonTexture: THREE.Texture;
}

export function createMoonPhaseMaterial({
    moonTexture,
}: MoonPhaseMaterialParams): THREE.ShaderMaterial {
    const uniforms = {
        uMoonTexture: { value: moonTexture },
        uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
        uTerminatorSharpness: { value: 0.02 }, // How sharp the day/night boundary is
    };

    return new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vWorldNormal;
            
            void main() {
                vNormal = normal;
                vWorldNormal = normalize(normalMatrix * normal);
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D uMoonTexture;
            uniform vec3 uSunDirection;
            uniform float uTerminatorSharpness;
            
            varying vec3 vNormal;
            varying vec3 vWorldNormal;
            
            void main() {
                // Calculate UV coordinates from sphere normal (spherical mapping)
                vec3 n = normalize(vNormal);
                vec2 uv = vec2(
                    atan(n.z, n.x) / (2.0 * 3.14159265359) + 0.5,
                    acos(n.y) / 3.14159265359
                );
                
                // Sample Moon texture
                vec4 moonColor = texture2D(uMoonTexture, uv);
                
                // Calculate angle between surface normal and Sun direction
                // vWorldNormal is the world-space normal (accounts for all transformations)
                float dotProduct = dot(vWorldNormal, normalize(uSunDirection));
                
                // Only show Moon texture where it's lit by the Sun
                // dotProduct > 0 means facing Sun, dotProduct < 0 means facing away
                // Use smoothstep for a slightly soft edge (more physically accurate)
                float lightFactor = smoothstep(-uTerminatorSharpness, uTerminatorSharpness, dotProduct);
                
                // Completely dark on the night side (no ambient light)
                // Only show texture on the day side
                vec4 finalColor = moonColor * lightFactor;
                
                gl_FragColor = finalColor;
            }
        `,
    });
}

