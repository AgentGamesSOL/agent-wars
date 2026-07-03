export class GameLoop {
  constructor({ stage, waveManager, crystal, enemyPool, spells, sound }) {
    this.stage = stage
    this.waveManager = waveManager
    this.crystal = crystal
    this.enemyPool = enemyPool
    this.spells = spells
    this.sound = sound

    this._rafId = null
    this._lastTime = 0
    this._running = false
  }

  start() {
    if (this._running) return
    this._running = true
    this._lastTime = performance.now()
    this._tick()
  }

  _tick() {
    if (!this._running) return
    this._rafId = requestAnimationFrame((t) => {
      const dt = Math.min((t - this._lastTime) / 1000, 0.05)
      this._lastTime = t
      this._update(dt)
      this._tick()
    })
  }

  _update(dt) {
    this.enemyPool.update(dt)
    this.waveManager.update(dt)
    this.crystal.update(dt)
    this.spells.update(dt)
    this.stage.render(dt)
  }

  stop() {
    this._running = false
    if (this._rafId) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
  }
}
