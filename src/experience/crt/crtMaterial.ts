import * as THREE from "three"

/**
 * Material for the CRT glass. Takes the screen canvas and adds what a real tube does:
 * barrel curvature, scanlines, an aperture grille, phosphor glow, a rolling refresh band,
 * flicker, noise, the power-on line, and a soft reflection on the glass.
 * uGlitch (0..1+) tears lines sideways and splits the colours.
 */

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uGlitch;
  uniform float uPower;
  uniform float uLines;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  // Must match curve() in ScreenCanvas.ts, which uses it for click hit testing.
  vec2 curve(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    uv *= 1.0 + vec2(uv.y * uv.y, uv.x * uv.x) * 0.055;
    return uv * 0.5 + 0.5;
  }

  void main() {
    vec2 uv = curve(vUv);
    float p = clamp(uPower, 0.0, 1.0);

    // Glitch: whole rows jump sideways, plus a fast wobble.
    float row = floor(uv.y * 46.0);
    float frame = floor(uTime * 26.0);
    float tear = step(1.0 - min(uGlitch, 1.0) * 0.55, hash(vec2(row, frame)));
    uv.x += (hash(vec2(row * 1.7, frame)) - 0.5) * 0.14 * tear * uGlitch;
    uv.x += sin(uv.y * 220.0 + uTime * 50.0) * 0.0025 * uGlitch;
    uv.y += (hash(vec2(frame, 3.1)) - 0.5) * 0.02 * step(0.6, uGlitch);

    // Power on: the picture grows out of a bright horizontal line.
    float sy = mix(0.003, 1.0, smoothstep(0.15, 0.75, p));
    float sx = smoothstep(0.0, 0.2, p);
    vec2 c = (uv - 0.5) / vec2(max(sx, 0.001), sy) + 0.5;

    float split = 0.0011 + uGlitch * 0.012;
    vec3 col;
    col.r = texture2D(uMap, c + vec2(split, 0.0)).r;
    col.g = texture2D(uMap, c).g;
    col.b = texture2D(uMap, c - vec2(split, 0.0)).b;

    // Phosphor bleeds a little: cheap halo from a wider sample.
    vec3 halo = texture2D(uMap, c, 2.5).rgb;
    col += halo * 0.35;

    float inside = step(0.0, c.x) * step(c.x, 1.0) * step(0.0, c.y) * step(c.y, 1.0);
    col *= inside;

    // Scanlines with dark gaps, like a low resolution tube.
    float s = sin(c.y * uLines * 3.14159);
    col *= 0.45 + 0.55 * s * s;

    // Aperture grille: vertical red, green and blue stripes on the glass.
    float m = mod(gl_FragCoord.x, 3.0);
    col *= m < 1.0 ? vec3(1.0, 0.8, 0.8) : (m < 2.0 ? vec3(0.8, 1.0, 0.8) : vec3(0.8, 0.8, 1.0));

    // Rolling refresh band.
    float band = fract(c.y * 0.6 - uTime * 0.11);
    col += vec3(0.012, 0.035, 0.018) * smoothstep(0.92, 1.0, band);

    // Phosphor never goes fully black.
    col += vec3(0.006, 0.016, 0.009) * inside;

    // Static and flicker.
    float n = hash(vUv * vec2(1024.0, 768.0) + fract(uTime) * 91.0);
    col += (n - 0.5) * (0.045 + uGlitch * 0.4) * vec3(0.6, 1.0, 0.7);
    col *= 0.975 + 0.025 * sin(uTime * 113.0);

    // Edges of the tube fall off.
    vec2 v = vUv * 2.0 - 1.0;
    col *= smoothstep(1.45, 0.6, length(v * vec2(0.92, 1.08)));

    // Bright line while powering on.
    float line = (1.0 - smoothstep(0.1, 0.7, p)) * step(0.001, p);
    col += vec3(0.7, 1.0, 0.8) * line * exp(-abs(uv.y - 0.5) * 140.0) * 3.0;

    col *= step(0.001, p);

    // Glass: soft reflection top left and a faint flare from the room light.
    float refl = smoothstep(0.75, 0.0, length((vUv - vec2(0.2, 0.16)) * vec2(1.0, 1.5)));
    col += vec3(0.05, 0.055, 0.06) * refl;
    float flare = smoothstep(0.12, 0.0, abs(vUv.x + vUv.y * 0.35 - 0.88)) * smoothstep(0.9, 0.2, vUv.y);
    col += vec3(0.018) * flare;

    gl_FragColor = vec4(col * 1.45, 1.0);
    #include <colorspace_fragment>
  }
`

export function createCrtMaterial(map: THREE.Texture) {
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uMap: { value: map },
      uTime: { value: 0 },
      uGlitch: { value: 0 },
      uPower: { value: 0 },
      uLines: { value: 250 },
    },
    toneMapped: false,
  })
}
