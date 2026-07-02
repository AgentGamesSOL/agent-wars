// Dissolve effect shader — used for demon death animation
// Combines FBM noise with edge emission

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// dissolveAmount: 0.0 = fully visible, 1.0 = fully dissolved
// edgeWidth: controls the glowing edge thickness
vec4 applyDissolve(vec4 color, vec2 uv, float dissolveAmount, float edgeWidth, vec3 edgeColor) {
  float n = fbm(uv * 5.0);
  float delta = n - dissolveAmount;
  if (delta < 0.0) discard;
  float edgeFactor = smoothstep(0.0, edgeWidth, delta);
  vec3 finalColor = mix(edgeColor, color.rgb, edgeFactor);
  return vec4(finalColor, color.a * edgeFactor);
}
