import * as THREE from 'three'
import { gsap } from 'gsap'
import { EventEmitter } from '../utils/EventEmitter.js'

const CRYSTAL_VERT = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPos;
  uniform float uTime;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;
    pos.y += sin(pos.x * 4.0 + uTime) * 0.015 + sin(pos.z * 3.0 + uTime * 1.3) * 0.012;
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    vPos = pos;
    gl_Position = projectionMatrix * mvPos;
  }
`

const CRYSTAL_FRAG = `
  uniform float uTime;
  uniform float uHealth;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPos;

  void main() {
    float fresnel = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 2.5);
    vec3 healthColor = mix(vec3(1.0, 0.1, 0.05), vec3(0.3, 0.1, 1.0), uHealth);
    vec3 innerGlow = healthColor * (0.6 + 0.4 * sin(uTime * 2.0 + vPos.y * 6.0));
    vec3 fresnelColor = mix(vec3(0.8, 0.6, 1.0), healthColor, 0.4);
    vec3 col = mix(innerGlow, fresnelColor, fresnel * 0.7);
    float alpha = 0.75 + fresnel * 0.2;
    gl_FragColor = vec4(col, alpha);
  }
`

export class Crystal extends EventEmitter {
  constructor(scene) {
    super()
    this.scene = scene
    this._hp = 1.0
    this._maxHp = 1.0
    this._dead = false
    this._time = 0
    this._build()
  }

  _build() {
    const geo = new THREE.OctahedronGeometry(0.55, 2)
    this._mat = new THREE.ShaderMaterial({
      vertexShader: CRYSTAL_VERT,
      fragmentShader: CRYSTAL_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uHealth: { value: 1.0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
    })
    this.mesh = new THREE.Mesh(geo, this._mat)
    this.mesh.position.set(0, 1.55, 0)
    this.mesh.castShadow = true
    this.scene.add(this.mesh)

    const innerGeo = new THREE.OctahedronGeometry(0.3, 1)
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x8833ff,
      emissive: 0x5511ff,
      emissiveIntensity: 4,
      transparent: true,
      opacity: 0.6,
    })
    this._inner = new THREE.Mesh(innerGeo, innerMat)
    this._inner.position.set(0, 1.55, 0)
    this.scene.add(this._inner)
  }

  drain(amount) {
    if (this._dead) return
    this._hp = Math.max(0, this._hp - amount)
    this._mat.uniforms.uHealth.value = this._hp

    this._hitFlash()

    if (this._hp <= 0) {
      this._dead = true
      this.emit('dead')
      this._explode()
    }
  }

  _hitFlash() {
    gsap.to(this._mat.uniforms.uHealth, {
      value: this._hp * 0.7,
      duration: 0.08,
      yoyo: true,
      repeat: 1,
    })
  }

  _explode() {
    gsap.to(this.mesh.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 0.3, ease: 'back.out' })
    gsap.to(this.mesh.scale, { x: 0, y: 0, z: 0, duration: 0.5, delay: 0.3, ease: 'power2.in' })
    gsap.to(this._inner.scale, { x: 0, y: 0, z: 0, duration: 0.6, delay: 0.3, ease: 'power2.in' })
  }

  update(dt) {
    this._time += dt
    this._mat.uniforms.uTime.value = this._time
    this.mesh.rotation.y += dt * 0.4
    this._inner.rotation.y -= dt * 0.7
    this._inner.rotation.x += dt * 0.2

    if (this._dead) return
    const alive = this.scene.children.filter(
      (c) => c.userData?.portalId !== undefined && c.userData?.isEnemy
    )
    alive.forEach(() => this.drain(0.003 * dt))
  }

  get health() { return this._hp }
  get healthPercent() { return this._hp / this._maxHp }
  get isDead() { return this._dead }

  reset() {
    this._hp = this._maxHp
    this._dead = false
    this._mat.uniforms.uHealth.value = 1.0
    this.mesh.scale.set(1, 1, 1)
    this._inner.scale.set(1, 1, 1)
  }
}
