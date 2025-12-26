"use client";

import * as THREE from "three";

interface PlanetDayNightMaterialParams {
    dayTexture: THREE.Texture;
    nightTexture: THREE.Texture;
    normalTexture?: THREE.Texture;
    specularTexture?: THREE.Texture;
    shininess?: number;
}

/**
 * Creates a reusable shader material for planets with dynamic day/night terminator
 * The material calculates lighting based on the angle between surface normal and Sun's direction
 * 
 * Usage:
 *   const material = createPlanetDayNightMaterial({ dayTexture, nightTexture, specularTexture });
 *   // Then update sun direction in useFrame:
 *   const sunDirection = new THREE.Vector3().subVectors(sunPos, planetPos).normalize();
 *   material.uniforms.uSunDirection.value.copy(sunDirection);
 */
export function createPlanetDayNightMaterial({
    dayTexture,
    nightTexture,
    normalTexture,
    specularTexture,
    shininess = 25,
}: PlanetDayNightMaterialParams): THREE.ShaderMaterial {
    const uniforms = {
        uDayTexture: { value: dayTexture },
        uNightTexture: { value: nightTexture },
        uNormalTexture: { value: normalTexture || null },
        uSpecularTexture: { value: specularTexture || null },
        uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
        uTerminatorSmoothness: { value: 0.2 },
        uNightIntensity: { value: 0.4 },
    };

    return new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            varying vec3 vWorldNormal;
            
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                
                vNormal = normal;
                vWorldNormal = normalize(normalMatrix * normal);
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D uDayTexture;
            uniform sampler2D uNightTexture;
            uniform sampler2D uNormalTexture;
            uniform sampler2D uSpecularTexture;
            uniform vec3 uSunDirection;
            uniform float uTerminatorSmoothness;
            uniform float uNightIntensity;
            
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            varying vec3 vWorldNormal;
            
            void main() {
                // Calculate UV coordinates (spherical mapping)
                vec3 n = normalize(vNormal);
                vec2 uv = vec2(
                    atan(n.z, n.x) / (2.0 * 3.14159265359) + 0.5,
                    acos(n.y) / 3.14159265359
                );
                
                // Sample textures
                vec4 dayColor = texture2D(uDayTexture, uv);
                vec4 nightColor = texture2D(uNightTexture, uv);
                
                // Calculate the angle between surface normal and Sun direction
                float dotProduct = dot(vWorldNormal, normalize(uSunDirection));
                
                // Smooth transition between day and night
                // dotProduct = 1 means facing Sun, -1 means facing away
                float dayFactor = smoothstep(-uTerminatorSmoothness, uTerminatorSmoothness, dotProduct);
                
                // Blend between day and night textures
                vec4 finalColor = mix(
                    nightColor * uNightIntensity,
                    dayColor,
                    dayFactor
                );
                
                gl_FragColor = finalColor;
            }
        `,
    });
}
