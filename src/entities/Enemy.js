import * as THREE from 'three'
import { createMachine, interpret } from 'xstate'
import { gsap } from 'gsap'
import { ParticleSim } from '../engine/ParticleSim.js'

const PORTALS = {
  door: new THREE.Vector3(0, 0, -6.5),
  bookshelf: new THREE.Vector3(-6.5, 0, 0),
  window: new THREE.Vector3(0, 0, 6.5),
  hatch: new THREE.Vector3(3.5, 0, 3.5),
}

const DISSOLVE_VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const DISSOLVE_FRAG = `
  uniform float uDissolve;
  uniform vec3 uEdgeColor;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i); float b = hash(i + vec2(1.,0.));
    float c = hash(i + vec2(0.,1.)); float d = hash(i + vec2(1.,1.));
    vec2 u = f*f*(3.-2.*f);
    return mix(a, b, u.x) + (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
  }
  float fbm(vec2 p) {
    float v = 0.; float a = 0.5;
    for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.; a*=0.5; }
    return v;
  }

  void main() {
    float n = fbm(vUv * 6.0 + vec2(uTime * 0.3));
    float d = n - uDissolve;
    if(d < 0.0) discard;
    float edge = smoothstep(0.0, 0.08, d);
    vec3 baseColor = vec3(0.15, 0.08, 0.22);
    vec3 light = normalize(vec3(0., 1., 1.));
    float diff = max(0., dot(vNormal, light));
    vec3 shaded = baseColor * (0.3 + 0.7 * diff);
    vec3 col = mix(uEdgeColor, shaded, edge);
    gl_FragColor = vec4(col, 1.0);
  }
`

function buildEnemyMachine(actions) {
  return createMachine({
    id: 'enemy',
    initial: 'IDLE',
    states: {
      IDLE: { on: { SPAWN: 'ANIMATING_IN' } },
      ANIMATING_IN: {
        entry: actions.onAnimatingIn,
        on: { READY: 'ALIVE' },
      },
      ALIVE: {
        entry: actions.onAlive,
        on: { TAG: 'TAGGED' },
      },
      TAGGED: {
        entry: actions.onTagged,
        on: { KILL: 'DEAD' },
      },
      DEAD: {
        entry: actions.onDead,
        type: 'final',
      },
    },
  })
}

export class Enemy {
  constructor(scene) {
    this.scene = scene
    this._buildMesh()
    this._particles = new ParticleSim(scene, {
      emitterType: 'smoke',
      count: 20,
      lifespan: 0.9,
      speed: 0.3,
      spread: 0.1,
    })
    this._machine = null
    this._service = null
    this.isAlive = false
    this.crystalDrain = 0.003
    this.portalId = null
    this.targetPos = new THREE.Vector3()
    this.crystalPos = new THREE.Vector3(0, 1.3, 0)
    this._dissolveValue = 1.0
    this._moveSpeed = 0.8 + Math.random() * 0.4
  }

  _buildMesh() {
    const geo = new THREE.CapsuleGeometry(0.28, 0.7, 6, 12)
    this._mat = new THREE.ShaderMaterial({
      vertexShader: DISSOLVE_VERT,
      fragmentShader: DISSOLVE_FRAG,
      uniforms: {
        uDissolve: { value: 1.0 },
        uEdgeColor: { value: new THREE.Color(0xff3300) },
        uTime: { value: 0 },
      },
      side: THREE.DoubleSide,
    })
    this.mesh = new THREE.Mesh(geo, this._mat)
    this.mesh.castShadow = true
    this.mesh.visible = false

    const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8)
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 3 })
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
    eyeL.position.set(-0.12, 0.55, 0.26)
    eyeR.position.set(0.12, 0.55, 0.26)
    this.mesh.add(eyeL, eyeR)

    this.scene.add(this.mesh)
  }

  spawn(portalId) {
    this.portalId = portalId
    const portal = PORTALS[portalId] ?? PORTALS.door
    this.mesh.position.copy(portal)
    this.mesh.position.y = 0.65
    this.mesh.visible = true
    this.isAlive = false
    this._dissolveValue = 1.0
    this._mat.uniforms.uDissolve.value = 1.0
    this._particles.active = true
    this._particles.origin.copy(this.mesh.position).add(new THREE.Vector3(0, 0.5, 0))

    const actions = {
      onAnimatingIn: () => this._animateIn(),
      onAlive: () => { this.isAlive = true },
      onTagged: () => this._onTagged(),
      onDead: () => this._onDead(),
    }

    this._machine = buildEnemyMachine(actions)
    this._service = interpret(this._machine).start()
    this._service.send({ type: 'SPAWN' })
  }

  _animateIn() {
    gsap.fromTo(this.mesh.scale, { x: 0, y: 0, z: 0 }, {
      x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(1.7)',
      onComplete: () => this._service?.send({ type: 'READY' }),
    })
    gsap.to(this._mat.uniforms.uDissolve, { value: 0.0, duration: 0.7, ease: 'power2.out' })
  }

  _onTagged() {
    this._mat.uniforms.uEdgeColor.value.set(0x00ffff)
    gsap.to(this.mesh.scale, { x: 1.15, y: 0.88, z: 1.15, duration: 0.08, yoyo: true, repeat: 3 })
    gsap.delayedCall(0.3, () => this._service?.send({ type: 'KILL' }))
  }

  _onDead() {
    this.isAlive = false
    const deathSim = new ParticleSim(this.scene, {
      origin: this.mesh.position.clone().add(new THREE.Vector3(0, 0.6, 0)),
      emitterType: 'ghost',
      count: 30,
      lifespan: 1.2,
      speed: 0.7,
      spread: 0.3,
    })

    gsap.to(this._mat.uniforms.uDissolve, {
      value: 1.0, duration: 0.8, ease: 'power2.in',
      onComplete: () => {
        this.mesh.visible = false
        this.mesh.scale.set(1, 1, 1)
        this._mat.uniforms.uDissolve.value = 1.0
        this._mat.uniforms.uEdgeColor.value.set(0xff3300)
        deathSim.stop()
        setTimeout(() => deathSim.dispose(), 2000)
      },
    })
    this._particles.stop()
  }

  kill() {
    if (this._service?.getSnapshot().value === 'ALIVE') {
      this._service.send({ type: 'TAG' })
    }
  }

  update(dt) {
    if (!this.mesh.visible) return

    this._mat.uniforms.uTime.value += dt

    const snap = this._service?.getSnapshot()
    if (snap?.value === 'ALIVE') {
      const dir = this.crystalPos.clone().sub(this.mesh.position)
      const dist = dir.length()
      if (dist > 0.6) {
        dir.normalize()
        this.mesh.position.addScaledVector(dir, this._moveSpeed * dt)
        this.mesh.lookAt(this.crystalPos)
      }
      this._particles.origin.copy(this.mesh.position).add(new THREE.Vector3(0, 0.6, 0))
    }

    this._particles.update(dt)
  }

  get state() {
    return this._service?.getSnapshot().value ?? 'IDLE'
  }

  reset() {
    this._service?.stop()
    this._service = null
    this.mesh.visible = false
    this.isAlive = false
    this._particles.stop()
    this._particles.active = true
  }
}
