import { Enemy } from './Enemy.js'

const PORTALS = ['door', 'bookshelf', 'window', 'hatch']

export class EnemyPool {
  constructor(scene, size = 32) {
    this.scene = scene
    this._pool = Array.from({ length: size }, () => new Enemy(scene))
    this._active = new Set()
  }

  spawn(portalId) {
    const free = this._pool.find((e) => !this._active.has(e))
    if (!free) return null
    const portal = portalId ?? PORTALS[Math.floor(Math.random() * PORTALS.length)]
    free.spawn(portal)
    this._active.add(free)
    return free
  }

  getAlive() {
    return [...this._active].filter((e) => e.isAlive)
  }

  getAll() {
    return [...this._active]
  }

  update(dt) {
    for (const enemy of [...this._active]) {
      enemy.update(dt)
      if (enemy.state === 'DEAD' || enemy.state === 'IDLE') {
        this._active.delete(enemy)
      }
    }
  }

  killNearest(origin, count = 1) {
    const alive = this.getAlive()
    alive.sort((a, b) =>
      a.mesh.position.distanceTo(origin) - b.mesh.position.distanceTo(origin)
    )
    const targets = alive.slice(0, count)
    targets.forEach((e) => e.kill())
    return targets
  }

  killAll() {
    const alive = this.getAlive()
    alive.forEach((e) => e.kill())
    return alive
  }

  pullTowards(origin, strength = 8) {
    const alive = this.getAlive()
    alive.forEach((e) => {
      const dir = origin.clone().sub(e.mesh.position).normalize()
      e.mesh.position.addScaledVector(dir, strength * 0.016)
    })
    return alive
  }

  reset() {
    for (const enemy of this._active) {
      enemy.reset()
    }
    this._active.clear()
  }

  get activeCount() {
    return this._active.size
  }
}
