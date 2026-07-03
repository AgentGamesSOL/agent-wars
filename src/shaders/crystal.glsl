// Crystal health indicator shader
// Fresnel-based glow with health-driven color shift

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vPos;

uniform float uTime;
uniform float uHealth;  // 0.0 = dead (red), 1.0 = full (purple-blue)

void main() {
  // Fresnel rim
  float fresnel = pow(1.0 - max(0.0, dot(normalize(vNormal), normalize(vViewDir))), 2.5);

  // Health color: purple-blue when healthy, deep red when damaged
  vec3 healthColor = mix(
    vec3(0.9, 0.05, 0.05),  // near-dead: crimson
    vec3(0.25, 0.08, 1.0),  // full health: vivid violet-blue
    uHealth
  );

  // Interior pulsing glow driven by sine wave
  float pulse = 0.5 + 0.5 * sin(uTime * 2.2 + vPos.y * 5.0);
  vec3 innerGlow = healthColor * (0.55 + 0.45 * pulse);

  // Rim blends toward white-violet
  vec3 rimColor = mix(vec3(0.85, 0.65, 1.0), healthColor, 0.35);
  vec3 col = mix(innerGlow, rimColor, fresnel * 0.75);

  float alpha = 0.72 + fresnel * 0.22;
  gl_FragColor = vec4(col, alpha);
}
