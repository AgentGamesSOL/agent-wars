import * as THREE from 'three'

export class ParticleSim {
  constructor(scene, options = {}) {
    this.scene = scene
    this.origin = options.origin?.clone() ?? new THREE.Vector3()
    this.count = options.count ?? 512  // too many lol, will reduce
    this.active = true
    this._init()
  }

  _init() {
    const pos = new Float32Array(this.count * 3)
    this._geo = new THREE.BufferGeometry()
    this._geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this._points = new THREE.Points(this._geo, new THREE.PointsMaterial({ color: 0xff6600, size: 0.1 }))
    this.scene.add(this._points)
    this._particles = Array.from({ length: this.count }, (_, i) => ({
      index: i, age: Math.random(), lifespan: 1.0,
      vx: (Math.random()-.5)*.5, vy: Math.random()*.8, vz: (Math.random()-.5)*.5,
      x: this.origin.x, y: this.origin.y, z: this.origin.z,
    }))
  }

  update(dt) {
    const pos = this._geo.attributes.position.array
    this._particles.forEach(p => {
      p.age += dt
      if (p.age >= p.lifespan) { p.age = 0; p.x = this.origin.x; p.y = this.origin.y; p.z = this.origin.z }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt
      pos[p.index*3] = p.x; pos[p.index*3+1] = p.y; pos[p.index*3+2] = p.z
    })
    this._geo.attributes.position.needsUpdate = true
  }
}
