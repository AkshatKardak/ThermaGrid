/**
 * Atmospheric Fresnel glow shader for the Earth globe.
 * Emits an ethereal Amethyst (#9B6FD8) halo around the planet rim.
 */

export const atmosphereVertexShader = /* glsl */ `
varying vec3 vN;

void main() {
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const atmosphereFragmentShader = /* glsl */ `
varying vec3 vN;

void main() {
  // Fresnel glow intensity based on view angle against normal
  float i = pow(0.72 - dot(vN, vec3(0.0, 0.0, 1.0)), 3.2);
  // Amethyst tint (#9B6FD8: 0.61, 0.44, 0.85)
  gl_FragColor = vec4(0.608, 0.435, 0.847, 1.0) * clamp(i, 0.0, 1.0);
}
`;
