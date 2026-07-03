import * as THREE from 'three'
import { gsap } from 'gsap'
import { ParticleSim } from '../engine/ParticleSim.js'

const SPELL_DATA = {
  arcane: {
    color: 0x8833ff,
    label: 'Arcane Pulse',
    cooldown: 1.2,
    kills: 1,
    emitter: 'magic',
  },
  fire: {
    color: 0xff4400,
    label: 'Fire Surge',
    cooldown: 2.0,
    kills: 2,
    emitter: 'explosion',
  },
  vortex: {
    color: 0x00ffcc,
    label: 'Vortex Collapse',
    cooldown: 5.0,
    kills: Infinity,
    emitter: 'ghost',
  },
}

export class SpellSystem {
  constructor(scene, sound, enemyPool) {
    this.scene = scene
    this.sound = sound
    this.enemyPool = enemyPool
    this._cooldowns = { arcane: 0, fire: 0, vortex: 0 }
    this._lastTime = performance.now() * 0.001
    this._activeEffects = []
  }

  cast(gestureResult, camera) {
    const { spell } = gestureResult
    const data = SPELL_DATA[spell]
    if (!data) return null

    const now = performance.now() * 0.001
    if (now < this._cooldowns[spell]) {
      return { spell, label: data.label, blocked: true, cooldownLeft: this._cooldowns[spell] - now }
    }

    this._cooldowns[spell] = now + data.cooldown
    this._executeSpell(spell, data, camera)

    return { spell, label: data.label, color: data.color, blocked: false }
  }

  _executeSpell(spell, data, camera) {
    const origin = new THREE.Vector3(0, 1.3, 0)

    if (spell === 'arcane') {
      const target = this.enemyPool.killNearest(origin, 1)
      if (target.length) {
        this._spawnImpactEffect(target[0].mesh.position.clone(), data)
        this.sound?.playSpatial('arcane_hit', target[0].mesh.position)
      }
    } else if (spell === 'fire') {
      const targets = this.enemyPool.killNearest(origin, 2)
      targets.forEach((t) => {
        this._spawnImpactEffect(t.mesh.position.clone(), data)
        this.sound?.playSpatial('fire_hit', t.mesh.position)
      })
      if (targets.length) {
        this._spawnFireballs(targets.map((t) => t.mesh.position.clone()), camera)
      }
    } else if (spell === 'vortex') {
      this._executeVortex(origin, data)
    }
  }

  _spawnFireballs(targets, camera) {
    targets.forEach((targetPos) => {
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xff4400,
          emissive: 0xff2200,
          emissiveIntensity: 3,
        })
      )
      const camPos = camera.position.clone()
      ball.position.copy(camPos)
      this.scene.add(ball)

      const light = new THREE.PointLight(0xff4400, 3, 4)
      ball.add(light)

      gsap.to(ball.position, {
        x: targetPos.x,
        y: targetPos.y + 0.6,
        z: targetPos.z,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          this.scene.remove(ball)
        },
      })
    })
  }

  _executeVortex(origin, data) {
    const alive = this.enemyPool.getAlive()
    const vortexCenter = origin.clone()

    const pullInterval = setInterval(() => {
      this.enemyPool.pullTowards(vortexCenter, 12)
    }, 16)

    const whirlSim = new ParticleSim(this.scene, {
      origin: vortexCenter.clone().add(new THREE.Vector3(0, 1, 0)),
      emitterType: 'ghost',
      count: 60,
      lifespan: 1.5,
      speed: 2.0,
      spread: 2.0,
    })

    gsap.delayedCall(0.8, () => {
      clearInterval(pullInterval)
      alive.forEach((e) => e.kill())

      whirlSim.stop()
      setTimeout(() => whirlSim.dispose(), 3000)

      const flash = new THREE.PointLight(0x00ffcc, 15, 12)
      flash.position.copy(vortexCenter).add(new THREE.Vector3(0, 1, 0))
      this.scene.add(flash)
      gsap.to(flash, { intensity: 0, duration: 0.6, ease: 'power2.out', onComplete: () => this.scene.remove(flash) })
    })
  }

  _spawnImpactEffect(pos, data) {
    const sim = new ParticleSim(this.scene, {
      origin: pos.clone().add(new THREE.Vector3(0, 0.6, 0)),
      emitterType: data.emitter,
      count: 28,
      lifespan: 0.8,
      speed: 1.2,
      spread: 0.3,
    })
    sim.burst(28)
    sim.stop()
    setTimeout(() => sim.dispose(), 2000)

    const flash = new THREE.PointLight(data.color, 6, 5)
    flash.position.copy(pos).add(new THREE.Vector3(0, 0.8, 0))
    this.scene.add(flash)
    gsap.to(flash, { intensity: 0, duration: 0.4, ease: 'power2.out', onComplete: () => this.scene.remove(flash) })
  }

  update(dt) {
    this._activeEffects = this._activeEffects.filter((e) => {
      e.update(dt)
      return !e.done
    })
  }

  reset() {
    this._cooldowns = { arcane: 0, fire: 0, vortex: 0 }
  }

  getCooldowns() {
    const now = performance.now() * 0.001
    return Object.fromEntries(
      Object.entries(this._cooldowns).map(([k, v]) => [k, Math.max(0, v - now)])
    )
  }
}
