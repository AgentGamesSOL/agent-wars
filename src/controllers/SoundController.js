import * as THREE from 'three'

const SOUND_POOLS = {
  demon_laugh: { count: 4, volume: 0.6, refDistance: 5 },
  demon_death: { count: 4, volume: 0.8, refDistance: 4 },
  arcane_hit: { count: 3, volume: 0.9, refDistance: 6 },
  fire_hit: { count: 3, volume: 1.0, refDistance: 6 },
  vortex_cast: { count: 1, volume: 1.0, refDistance: 10 },
  crystal_drain: { count: 2, volume: 0.4, refDistance: 3 },
  wave_start: { count: 1, volume: 0.7, refDistance: 20 },
  gesture_miss: { count: 2, volume: 0.3, refDistance: 99 },
}

export class SoundController {
  constructor(camera) {
    this._listener = new THREE.AudioListener()
    camera.add(this._listener)

    this._audioLoader = new THREE.AudioLoader()
    this._pools = {}
    this._globalSounds = {}
    this._muted = false
    this._masterVolume = 1.0

    this._ambientStarted = false
  }

  async loadAll(basePath = '/assets/audio') {
    const loads = []
    for (const [name, cfg] of Object.entries(SOUND_POOLS)) {
      const pool = []
      for (let i = 0; i < cfg.count; i++) {
        const sound = new THREE.PositionalAudio(this._listener)
        sound.setRefDistance(cfg.refDistance)
        sound.setVolume(cfg.volume)
        try {
          const buf = await this._audioLoader.loadAsync(`${basePath}/${name}.ogg`)
          sound.setBuffer(buf)
        } catch {
        }
        pool.push(sound)
      }
      this._pools[name] = { sounds: pool, next: 0, cfg }
    }
  }

  playSpatial(name, position) {
    if (this._muted) return
    const pool = this._pools[name]
    if (!pool) return

    const sound = pool.sounds[pool.next % pool.sounds.length]
    pool.next++

    if (!sound.parent) {
      const dummy = new THREE.Object3D()
      dummy.position.copy(position)
      this._listener.parent?.parent?.add(dummy) ?? document.body
      dummy.add(sound)
    } else {
      sound.parent.position.copy(position)
    }

    if (sound.isPlaying) sound.stop()
    try { sound.play() } catch {}
  }

  playGlobal(name, volume = 1.0) {
    if (this._muted) return
    const pool = this._pools[name]
    if (!pool) return
    const sound = pool.sounds[pool.next % pool.sounds.length]
    pool.next++
    if (sound.isPlaying) sound.stop()
    sound.setVolume(pool.cfg.volume * volume * this._masterVolume)
    try { sound.play() } catch {}
  }

  startAmbient() {
    if (this._ambientStarted || this._muted) return
    this._ambientStarted = true
  }

  setMuted(v) {
    this._muted = v
    if (v) this._stopAll()
  }

  setMasterVolume(v) {
    this._masterVolume = Math.max(0, Math.min(1, v))
    this._listener.setMasterVolume(this._masterVolume)
  }

  _stopAll() {
    for (const pool of Object.values(this._pools)) {
      pool.sounds.forEach((s) => { if (s.isPlaying) try { s.stop() } catch {} })
    }
  }
}
