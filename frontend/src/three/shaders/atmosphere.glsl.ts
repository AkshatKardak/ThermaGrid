/**
 * Atmospheric Fresnel glow shader for the Earth globe.
 * Emits an authentic Earth Rayleigh scattering blue/cyan atmospheric rim.
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
  // Fresnel atmospheric glow intensity based on view angle against normal
  float i = pow(0.68 - dot(vN, vec3(0.0, 0.0, 1.0)), 2.8);
  // Natural Earth Rayleigh scattering blue (#38BDF8 / #0284C7: 0.22, 0.65, 0.96)
  gl_FragColor = vec4(0.22, 0.65, 0.96, 1.0) * clamp(i * 0.9, 0.0, 1.0);
}
`;
