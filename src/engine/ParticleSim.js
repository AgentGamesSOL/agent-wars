import * as THREE from 'three'
import { createNoise3D } from 'simplex-noise'

const noise3D = createNoise3D()

const EMITTER_CONFIGS = {
  fire: {
    colorA: new THREE.Color(0xff4400),
    colorB: new THREE.Color(0xffaa00),
    sizeStart: 0.12,
    sizeEnd: 0.0,
    gravity: new THREE.Vector3(0, 0.9, 0),
    noiseScale: 1.2,
    noiseStrength: 0.3,
    alphaStart: 0.9,
    alphaEnd: 0.0,
  },
  smoke: {
    colorA: new THREE.Color(0x221a2a),
    colorB: new THREE.Color(0x3a2e44),
    sizeStart: 0.08,
    sizeEnd: 0.35,
    gravity: new THREE.Vector3(0, 0.3, 0),
    noiseScale: 0.6,
    noiseStrength: 0.5,
    alphaStart: 0.4,
    alphaEnd: 0.0,
  },
  magic: {
    colorA: new THREE.Color(0x6600ff),
    colorB: new THREE.Color(0xaa44ff),
    sizeStart: 0.1,
    sizeEnd: 0.0,
    gravity: new THREE.Vector3(0, 0.1, 0),
    noiseScale: 2.0,
    noiseStrength: 0.8,
    alphaStart: 1.0,
    alphaEnd: 0.0,
  },
  dust: {
    colorA: new THREE.Color(0x3a2a4a),
    colorB: new THREE.Color(0x2a1a3a),
    sizeStart: 0.06,
    sizeEnd: 0.0,
    gravity: new THREE.Vector3(0, -0.05, 0),
    noiseScale: 0.8,
    noiseStrength: 0.2,
    alphaStart: 0.6,
    alphaEnd: 0.0,
  },
  explosion: {
    colorA: new THREE.Color(0xff2200),
    colorB: new THREE.Color(0xffff00),
    sizeStart: 0.25,
    sizeEnd: 0.0,
    gravity: new THREE.Vector3(0, -0.4, 0),
    noiseScale: 3.0,
    noiseStrength: 0.4,
    alphaStart: 1.0,
    alphaEnd: 0.0,
  },
  ghost: {
    colorA: new THREE.Color(0x44ffcc),
    colorB: new THREE.Color(0x22aaff),
    sizeStart: 0.15,
    sizeEnd: 0.4,
    gravity: new THREE.Vector3(0, 0.15, 0),
    noiseScale: 1.5,
    noiseStrength: 1.0,
    alphaStart: 0.7,
    alphaEnd: 0.0,
  },
  victory: {
    colorA: new THREE.Color(0xffdd00),
    colorB: new THREE.Color(0xff44aa),
    sizeStart: 0.18,
    sizeEnd: 0.0,
    gravity: new THREE.Vector3(0, 0.6, 0),
    noiseScale: 2.5,
    noiseStrength: 1.2,
    alphaStart: 1.0,
    alphaEnd: 0.0,
  },
}

export class ParticleSim {
  constructor(scene, options = {}) {
    this.scene = scene
    this.origin = options.origin?.clone() ?? new THREE.Vector3()
    this.config = EMITTER_CONFIGS[options.emitterType ?? 'fire']
    this.count = options.count ?? 64
    this.lifespan = options.lifespan ?? 1.0
    this.speed = options.speed ?? 1.0
    this.spread = options.spread ?? 0.2
    this.active = true

    this._t = 0
    this._particles = []
    this._initGeometry()
  }

  _initGeometry() {
    const positions = new Float32Array(this.count * 3)
    const colors = new Float32Array(this.count * 3)
    const sizes = new Float32Array(this.count)
    const alphas = new Float32Array(this.count)

    this._geo = new THREE.BufferGeometry()
    this._geo.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage))
    this._geo.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage))
    this._geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage))
    this._geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1).setUsage(THREE.DynamicDrawUsage))

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: this._makeSprite() } },
      vertexShader: `
        attribute float aSize;
        attribute float aAlpha;
        attribute vec3 color;
        varying vec4 vColor;
        void main() {
          vColor = vec4(color, aAlpha);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (300.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        varying vec4 vColor;
        void main() {
          vec4 t = texture2D(uTex, gl_PointCoord);
          gl_FragColor = vec4(vColor.rgb, vColor.a * t.a);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })

    this._points = new THREE.Points(this._geo, mat)
    this.scene.add(this._points)

    for (let i = 0; i < this.count; i++) {
      this._particles.push(this._spawnParticle(i, Math.random()))
    }
  }

  _makeSprite() {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.8)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(canvas)
    return tex
  }

  _spawnParticle(index, ageOffset = 0) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    const r = Math.random() * this.spread
    return {
      index,
      age: ageOffset * this.lifespan,
      lifespan: this.lifespan * (0.8 + Math.random() * 0.4),
      vx: Math.sin(phi) * Math.cos(theta) * this.speed * 0.5,
      vy: (0.5 + Math.random() * 0.5) * this.speed,
      vz: Math.sin(phi) * Math.sin(theta) * this.speed * 0.5,
      ox: this.origin.x + (Math.random() - 0.5) * r,
      oy: this.origin.y,
      oz: this.origin.z + (Math.random() - 0.5) * r,
      x: this.origin.x,
      y: this.origin.y,
      z: this.origin.z,
      seed: Math.random() * 100,
    }
  }

  update(dt) {
    if (!this.active && this._particles.every((p) => p.age >= p.lifespan)) {
      this._points.visible = false
      return
    }

    const pos = this._geo.attributes.position.array
    const col = this._geo.attributes.color.array
    const siz = this._geo.attributes.aSize.array
    const alp = this._geo.attributes.aAlpha.array
    const cfg = this.config

    this._t += dt

    this._particles.forEach((p) => {
      p.age += dt
      if (p.age >= p.lifespan) {
        if (this.active) {
          Object.assign(p, this._spawnParticle(p.index, 0))
        } else {
          pos[p.index * 3] = 0
          pos[p.index * 3 + 1] = -999
          pos[p.index * 3 + 2] = 0
          siz[p.index] = 0
          alp[p.index] = 0
          return
        }
      }

      const progress = p.age / p.lifespan
      const nx = noise3D(p.x * cfg.noiseScale, p.seed, this._t * 0.3) * cfg.noiseStrength
      const nz = noise3D(p.seed, p.z * cfg.noiseScale, this._t * 0.3) * cfg.noiseStrength

      p.x += (p.vx + nx) * dt
      p.y += (p.vy + cfg.gravity.y * progress) * dt
      p.z += (p.vz + nz) * dt

      pos[p.index * 3] = p.x
      pos[p.index * 3 + 1] = p.y
      pos[p.index * 3 + 2] = p.z

      const eased = 1 - Math.pow(1 - progress, 2)
      const c = cfg.colorA.clone().lerp(cfg.colorB, eased)
      col[p.index * 3] = c.r
      col[p.index * 3 + 1] = c.g
      col[p.index * 3 + 2] = c.b

      siz[p.index] = THREE.MathUtils.lerp(cfg.sizeStart, cfg.sizeEnd, progress)
      alp[p.index] = THREE.MathUtils.lerp(cfg.alphaStart, cfg.alphaEnd, progress)
    })

    this._geo.attributes.position.needsUpdate = true
    this._geo.attributes.color.needsUpdate = true
    this._geo.attributes.aSize.needsUpdate = true
    this._geo.attributes.aAlpha.needsUpdate = true
  }

  burst(count = 40) {
    for (let i = 0; i < Math.min(count, this._particles.length); i++) {
      Object.assign(this._particles[i], this._spawnParticle(this._particles[i].index, 0))
    }
  }

  stop() {
    this.active = false
  }

  dispose() {
    this._geo.dispose()
    this._points.material.dispose()
    this.scene.remove(this._points)
  }
}
