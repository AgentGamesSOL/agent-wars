import { EventEmitter } from '../utils/EventEmitter.js'

const WAVE_DEFS = Array.from({ length: 50 }, (_, i) => {
  const wave = i + 1
  const baseCount = Math.min(3 + Math.floor(wave * 0.6), 18)
  const interval = Math.max(0.8, 2.5 - wave * 0.03)
  const portals = wave <= 5 ? ['door']
    : wave <= 12 ? ['door', 'bookshelf']
    : wave <= 22 ? ['door', 'bookshelf', 'window']
    : ['door', 'bookshelf', 'window', 'hatch']

  return { wave, baseCount, interval, portals }
})

export class WaveManager extends EventEmitter {
  constructor(enemyPool, crystal) {
    super()
    this._pool = enemyPool
    this._crystal = crystal
    this.currentWave = 0
    this._running = false
    this._infiniteMode = false
    this._spawnTimer = 0
    this._spawned = 0
    this._waveTarget = 0
    this._currentInterval = 2.0
    this._currentPortals = ['door']
  }

  start(infinite = false) {
    this._running = true
    this._infiniteMode = infinite
    this._nextWave()
  }

  _nextWave() {
    if (!this._infiniteMode && this.currentWave >= 50) {
      this.emit('victory')
      this._running = false
      return
    }

    this.currentWave += 1
    const def = this._infiniteMode
      ? this._makeInfiniteDef(this.currentWave)
      : WAVE_DEFS[Math.min(this.currentWave - 1, WAVE_DEFS.length - 1)]

    this._waveTarget = def.baseCount
    this._currentInterval = def.interval
    this._currentPortals = def.portals
    this._spawned = 0
    this._spawnTimer = 0

    this.emit('wave_start', this.currentWave)
  }

  _makeInfiniteDef(wave) {
    return {
      wave,
      baseCount: Math.min(5 + Math.floor(wave * 0.8), 24),
      interval: Math.max(0.5, 2.0 - wave * 0.02),
      portals: ['door', 'bookshelf', 'window', 'hatch'],
    }
  }

  update(dt) {
    if (!this._running) return

    const alive = this._pool.getAlive()

    if (this._spawned >= this._waveTarget && alive.length === 0) {
      this.emit('wave_clear')
      this._running = false
      setTimeout(() => {
        this._running = true
        this._nextWave()
      }, 3000)
      return
    }

    if (this._spawned < this._waveTarget) {
      this._spawnTimer += dt
      if (this._spawnTimer >= this._currentInterval) {
        this._spawnTimer = 0
        const portal = this._currentPortals[
          Math.floor(Math.random() * this._currentPortals.length)
        ]
        const enemy = this._pool.spawn(portal)
        if (enemy) {
          enemy.crystalDrain = 0.002 + this.currentWave * 0.0001
          this._spawned++
        }
      }
    }

    alive.forEach((enemy) => {
      if (enemy.isAlive) {
        const dist = enemy.mesh.position.distanceTo(this._crystal.mesh.position)
        if (dist < 0.9) {
          this._crystal.drain(enemy.crystalDrain * dt)
        }
      }
    })
  }

  reset() {
    this._running = false
    this.currentWave = 0
    this._spawned = 0
    this._waveTarget = 0
    this._spawnTimer = 0
  }

  toggleInfinite() {
    this._infiniteMode = !this._infiniteMode
    if (this._infiniteMode && !this._running) {
      this.start(true)
    }
    return this._infiniteMode
  }

  get isRunning() { return this._running }
  get progress() { return this._waveTarget > 0 ? this._spawned / this._waveTarget : 0 }
}
