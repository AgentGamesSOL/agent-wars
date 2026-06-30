import * as THREE from 'three'
import { RoomBuilder } from './RoomBuilder.js'

export class Stage {
  constructor(canvas) { this.canvas = canvas; this.scene = new THREE.Scene() }

  async init() {
    this._setupRenderer()
    this._setupCamera()
    this._setupLighting()
    await this._buildRoom()
  }

  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
  }

  _setupCamera() {
    this.camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 200)
    this.camera.position.set(0, 4.5, 9)
    this.camera.lookAt(0, 1, 0)
  }

  _setupLighting() {
    this.scene.fog = new THREE.FogExp2(0x08040c, 0.04)
    this.scene.background = new THREE.Color(0x08040c)
    this.scene.add(new THREE.AmbientLight(0x1a0d2e, 0.4))
    const moon = new THREE.DirectionalLight(0x3344aa, 0.3)
    moon.position.set(-5, 12, 3); moon.castShadow = true
    this.scene.add(moon)
    this._crystalGlow = new THREE.PointLight(0x5522ff, 2.5, 8, 2)
    this._crystalGlow.position.set(0, 1.2, 0)
    this.scene.add(this._crystalGlow)
  }

  async _buildRoom() {
    this.room = new RoomBuilder(this.scene)
    await this.room.build()
  }

  render() {
    this._crystalGlow.intensity = 2.5 + Math.sin(Date.now() * 0.002) * 0.4
    this.renderer.render(this.scene, this.camera)
  }
}
