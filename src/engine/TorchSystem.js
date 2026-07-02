import * as THREE from 'three'
import { ParticleSim } from '../engine/ParticleSim.js'

export class TorchSystem {
  constructor(scene) {
    this.scene = scene
    this._torches = []
  }

  place(positions) {
    positions.forEach(({ x, z }) => {
      const light = new THREE.PointLight(0xff6600, 2.2, 7, 2)
      light.position.set(x, 3.2, z)
      light.castShadow = false
      this.scene.add(light)

      const bracketMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a })
      const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6), bracketMat)
      bracket.position.set(x, 3.0, z)
      this.scene.add(bracket)

      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.07, 0.12, 8),
        new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 })
      )
      bowl.position.set(x, 3.16, z)
      this.scene.add(bowl)

      const sim = new ParticleSim(this.scene, {
        origin: new THREE.Vector3(x, 3.25, z),
        emitterType: 'fire',
        count: 24,
        lifespan: 0.8,
        speed: 0.6,
        spread: 0.05,
      })

      this._torches.push({ light, sim, phase: Math.random() * Math.PI * 2 })
    })
  }

  update(dt) {
    const t = Date.now() * 0.001
    this._torches.forEach((torch) => {
      const flicker = 1.8 + Math.sin(t * 7 + torch.phase) * 0.3
        + Math.sin(t * 13.7 + torch.phase * 1.3) * 0.15
        + Math.sin(t * 3.1 + torch.phase * 0.7) * 0.1
      torch.light.intensity = Math.max(0.5, flicker)
      torch.sim.update(dt)
    })
  }
}
