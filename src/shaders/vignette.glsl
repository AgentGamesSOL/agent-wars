// Post-processing vignette pass
// Applied as final composer step

varying vec2 vUv;

uniform sampler2D tDiffuse;
uniform float uOffset;
uniform float uDarkness;

void main() {
  vec4 texel = texture2D(tDiffuse, vUv);
  vec2 uv = (vUv - vec2(0.5)) * vec2(uOffset);
  float vignette = 1.0 - dot(uv, uv);
  texel.rgb *= clamp(pow(vignette, uDarkness), 0.0, 1.0);
  gl_FragColor = texel;
}
