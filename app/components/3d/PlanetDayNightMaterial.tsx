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
        uSunDirection: { value: new THREE.Vector3(1, 0, 0) }, // Earth → Sun direction in WORLD space
    };

    return new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
            varying vec3 vNormalW;
            varying vec2 vUv;
            
            void main() {
                // Calculate UV coordinates (spherical mapping)
                vec3 n = normalize(normal);
                vUv = vec2(
                    atan(n.z, n.x) / (2.0 * 3.14159265359) + 0.5,
                    acos(n.y) / 3.14159265359
                );
                
                // Calculate world-space normal using modelMatrix
                vNormalW = normalize(mat3(modelMatrix) * normal);
                
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D uDayTexture;
            uniform sampler2D uNightTexture;
            uniform vec3 uSunDirection;  // Earth → Sun direction in WORLD space
            
            varying vec3 vNormalW;
            varying vec2 vUv;
            
            void main() {
                // Sample textures
                vec3 dayTex = texture2D(uDayTexture, vUv).rgb;
                vec3 nightTex = texture2D(uNightTexture, vUv).rgb;
                
                // Normalize world-space normal
                vec3 N = normalize(vNormalW);
                
                // Sun direction: Earth → Sun (already in WORLD space)
                vec3 L = normalize(uSunDirection);
                
                // Lambert lighting: dot product between normal and Sun direction
                float ndotl = dot(N, L);
                
                // Stable terminator mask
                float terminatorWidth = 0.05;
                
                // day = 1, night = 0
                float dayMask = smoothstep(-terminatorWidth, terminatorWidth, ndotl);
                float nightMask = 1.0 - dayMask;
                
                // Lighting: ambient + diffuse
                float diffuse = max(ndotl, 0.0);
                vec3 litDay = dayTex * (0.08 + diffuse);  // ambient + diffuse (reduced ambient for darker nights)
                
                // City lights: boost night texture intensity and contrast
                vec3 city = nightTex * 2.5;
                city = pow(city, vec3(0.7));  // Increase contrast - boosts highlights without blowing blacks
                
                // Final blend: day mask shows lit day, night mask shows city lights
                vec3 finalColor = litDay * dayMask + city * nightMask;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `,
    });
}
