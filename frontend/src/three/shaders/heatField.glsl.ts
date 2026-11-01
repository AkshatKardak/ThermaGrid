/**
 * Procedural Dynamic Heat Field GLSL Shader.
 * Generates continuous thermal convection ripples with 5-tier normative heat coloring.
 */

export const heatFieldVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vPosition;
uniform float uTime;

void main() {
  vUv = uv;
  vec3 pos = position;
  
  // Subtle vertical displacement wave simulating hot air shimmering
  float wave = sin(pos.x * 2.5 + uTime * 0.8) * cos(pos.y * 2.5 + uTime * 0.6) * 0.06;
  pos.z += wave;
  
  vPosition = pos;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const heatFieldFragmentShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vPosition;
uniform float uTime;
uniform float uIntensity;

// Normative Heat Colors
const vec3 C_SAFE      = vec3(0.184, 0.639, 0.486); // #2FA37C
const vec3 C_MODERATE  = vec3(0.910, 0.773, 0.278); // #E8C547
const vec3 C_HIGH      = vec3(0.961, 0.620, 0.043); // #F59E0B
const vec3 C_VERY_HIGH = vec3(1.000, 0.439, 0.310); // #FF704F
const vec3 C_EXTREME   = vec3(0.765, 0.114, 0.235); // #C31D3C

// Simplex-style pseudo noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
             mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
}

void main() {
  vec2 uv = vUv * 4.0;
  
  // Multi-octave convective drift
  float n1 = noise(uv + vec2(uTime * 0.05, uTime * 0.03));
  float n2 = noise(uv * 2.0 - vec2(uTime * 0.08, uTime * 0.05));
  float heatVal = clamp((n1 * 0.65 + n2 * 0.35) * uIntensity, 0.0, 1.0);
  
  // Contour isoline enhancement
  float contour = abs(fract(heatVal * 10.0) - 0.5);
  float isLine = smoothstep(0.44, 0.50, contour) * 0.25;

  // 5-Tier Color Ramp
  vec3 col = C_SAFE;
  if (heatVal < 0.25) {
    col = mix(C_SAFE, C_MODERATE, heatVal / 0.25);
  } else if (heatVal < 0.50) {
    col = mix(C_MODERATE, C_HIGH, (heatVal - 0.25) / 0.25);
  } else if (heatVal < 0.75) {
    col = mix(C_HIGH, C_VERY_HIGH, (heatVal - 0.50) / 0.25);
  } else {
    col = mix(C_VERY_HIGH, C_EXTREME, (heatVal - 0.75) / 0.25);
  }

  col += vec3(isLine);

  // Soft edge vignette
  float d = distance(vUv, vec2(0.5));
  float alpha = smoothstep(0.5, 0.2, d) * 0.78;

  gl_FragColor = vec4(col, alpha);
}
`;
