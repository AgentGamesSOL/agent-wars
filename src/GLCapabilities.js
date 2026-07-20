export function checkCapabilities(renderer) {
  const gl = renderer.getContext()
  const warnings = []

  if (!gl.getExtension('OES_texture_float')) {
    warnings.push('OES_texture_float not supported — some shader effects disabled')
  }
  if (!gl.getExtension('WEBGL_depth_texture')) {
    warnings.push('WEBGL_depth_texture missing — SSAO disabled')
  }

  const maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
  if (maxTextures < 8) {
    warnings.push(`Only ${maxTextures} texture units available — may affect post-processing`)
  }

  return { ok: warnings.length === 0, warnings }
}
