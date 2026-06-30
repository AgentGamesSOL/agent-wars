import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js'
import { gsap } from 'gsap'
import { RoomBuilder } from './RoomBuilder.js'
import { TorchSystem } from './TorchSystem.js'

const CAMERA_PRESETS = {
  playing: {
    position: new THREE.Vector3(0, 4.5, 9),
    target: new THREE.Vector3(0, 1, 0),
    fov: 65,
  },
  overhead: {
    position: new THREE.Vector3(0, 18, 0.001),
    target: new THREE.Vector3(0, 0, 0),
    fov: 55,
  },
  paused: {
    position: new THREE.Vector3(6, 6, 8),
    target: new THREE.Vector3(0, 1.5, 0),
    fov: 50,
  },
  crystalIntro: {
    position: new THREE.Vector3(0, 1.2, 2.2),
    target: new THREE.Vector3(0, 1.2, 0),
    fov: 45,
  },
  vortex: {
    position: new THREE.Vector3(0, 12, 0.001),
    target: new THREE.Vector3(0, 0, 0),
    fov: 70,
  },
}

export class Stage {
  constructor(canvas) {
    this.canvas = canvas
    this.scene = new THREE.Scene()
    this._cameraTarget = new THREE.Vector3()
    this._activeTween = null
  }

  async init() {
    this._setupRenderer()
    this._setupCamera()
    this._setupLighting()
    await this._buildRoom()
    this._setupPostProcessing()
    this._setupResizeHandler()
  }

  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.9
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
  }

  _setupCamera() {
    const aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 200)
    const preset = CAMERA_PRESETS.playing
    this.camera.position.copy(preset.position)
    this._cameraTarget.copy(preset.target)
    this.camera.lookAt(this._cameraTarget)
  }

  _setupLighting() {
    this.scene.fog = new THREE.FogExp2(0x08040c, 0.04)
    this.scene.background = new THREE.Color(0x08040c)

    const ambient = new THREE.AmbientLight(0x1a0d2e, 0.4)
    this.scene.add(ambient)

    const moonlight = new THREE.DirectionalLight(0x3344aa, 0.3)
    moonlight.position.set(-5, 12, 3)
    moonlight.castShadow = true
    moonlight.shadow.mapSize.set(2048, 2048)
    moonlight.shadow.camera.near = 0.5
    moonlight.shadow.camera.far = 40
    moonlight.shadow.camera.left = -12
    moonlight.shadow.camera.right = 12
    moonlight.shadow.camera.top = 12
    moonlight.shadow.camera.bottom = -12
    moonlight.shadow.bias = -0.0005
    this.scene.add(moonlight)

    const crystalGlow = new THREE.PointLight(0x5522ff, 2.5, 8, 2)
    crystalGlow.position.set(0, 1.2, 0)
    crystalGlow.castShadow = true
    this.scene.add(crystalGlow)
    this._crystalGlow = crystalGlow
  }

  async _buildRoom() {
    this.room = new RoomBuilder(this.scene)
    await this.room.build()
    this.torches = new TorchSystem(this.scene)
    this.torches.place([
      { x: -5, z: -5 },
      { x: 5, z: -5 },
      { x: -5, z: 5 },
      { x: 5, z: 5 },
    ])
  }

  _setupPostProcessing() {
    const size = new THREE.Vector2(window.innerWidth, window.innerHeight)
    this.composer = new EffectComposer(this.renderer)

    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    this.ssaoPass = new SSAOPass(this.scene, this.camera, size.x, size.y)
    this.ssaoPass.kernelRadius = 0.4
    this.ssaoPass.minDistance = 0.001
    this.ssaoPass.maxDistance = 0.04
    this.composer.addPass(this.ssaoPass)

    this.bloomPass = new UnrealBloomPass(size, 0.8, 0.5, 0.3)
    this.composer.addPass(this.bloomPass)

    const vignetteShader = {
      uniforms: {
        tDiffuse: { value: null },
        offset: { value: 0.95 },
        darkness: { value: 0.5 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float offset;
        uniform float darkness;
        varying vec2 vUv;
        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
          float vignette = 1.0 - dot(uv, uv);
          texel.rgb *= clamp(pow(vignette, darkness), 0.0, 1.0);
          gl_FragColor = texel;
        }
      `,
    }
    const vignettePass = new ShaderPass(vignetteShader)
    this.composer.addPass(vignettePass)
  }

  _setupResizeHandler() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth
      const h = window.innerHeight
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(w, h)
      this.composer.setSize(w, h)
      this.ssaoPass.setSize(w, h)
    })
  }

  transitionCamera(presetName, duration = 1.0) {
    const preset = CAMERA_PRESETS[presetName]
    if (!preset) return Promise.resolve()

    if (this._activeTween) this._activeTween.kill()

    return new Promise((resolve) => {
      const proxy = {
        px: this.camera.position.x,
        py: this.camera.position.y,
        pz: this.camera.position.z,
        tx: this._cameraTarget.x,
        ty: this._cameraTarget.y,
        tz: this._cameraTarget.z,
        fov: this.camera.fov,
      }

      this._activeTween = gsap.to(proxy, {
        px: preset.position.x,
        py: preset.position.y,
        pz: preset.position.z,
        tx: preset.target.x,
        ty: preset.target.y,
        tz: preset.target.z,
        fov: preset.fov,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          this.camera.position.set(proxy.px, proxy.py, proxy.pz)
          this._cameraTarget.set(proxy.tx, proxy.ty, proxy.tz)
          this.camera.lookAt(this._cameraTarget)
          this.camera.fov = proxy.fov
          this.camera.updateProjectionMatrix()
        },
        onComplete: resolve,
      })
    })
  }

  render(dt) {
    this._crystalGlow.intensity = 2.5 + Math.sin(Date.now() * 0.002) * 0.4
    this.torches?.update(dt)
    this.composer.render()
  }

  pulseCrystalGlow(intensity = 8, duration = 0.3) {
    gsap.to(this._crystalGlow, {
      intensity,
      duration: duration * 0.3,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
    })
  }
}
