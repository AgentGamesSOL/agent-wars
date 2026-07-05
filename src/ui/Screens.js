import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { EventEmitter } from '../utils/EventEmitter.js'

gsap.registerPlugin(Flip)

const SPELL_COLORS = {
  arcane: '#8833ff',
  fire: '#ff4400',
  vortex: '#00ffcc',
}

export class Screens extends EventEmitter {
  constructor(container) {
    super()
    this._c = container
    this._current = null
    this._screens = {}
    this._hud = null
    this._init()
  }

  _init() {
    this._c.style.cssText = `
      position: absolute; inset: 0; pointer-events: none;
      font-family: 'Courier New', monospace; color: #ddd;
      user-select: none;
    `
    this._injectStyles()
    this._buildHUD()
  }

  _injectStyles() {
    const style = document.createElement('style')
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

      .aw-screen {
        position: absolute; inset: 0;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        background: rgba(4, 2, 10, 0.88);
        pointer-events: all;
      }
      .aw-title {
        font-family: 'Share Tech Mono', monospace;
        font-size: clamp(28px, 5vw, 56px);
        letter-spacing: 0.1em;
        color: #cc88ff;
        text-shadow: 0 0 20px #8833ff, 0 0 60px #5511cc;
        margin-bottom: 0.2em;
      }
      .aw-sub {
        font-family: 'Share Tech Mono', monospace;
        font-size: clamp(10px, 1.4vw, 14px);
        color: #886699;
        letter-spacing: 0.25em;
        margin-bottom: 3em;
      }
      .aw-btn {
        font-family: 'Share Tech Mono', monospace;
        background: transparent;
        border: 1px solid #6622aa;
        color: #cc88ff;
        padding: 0.7em 2.5em;
        font-size: 1em;
        letter-spacing: 0.15em;
        cursor: pointer;
        transition: background 0.2s, box-shadow 0.2s;
        margin: 0.4em;
        pointer-events: all;
      }
      .aw-btn:hover {
        background: rgba(102, 34, 170, 0.3);
        box-shadow: 0 0 18px #6622aa;
      }
      .aw-hud {
        position: absolute; inset: 0;
        pointer-events: none;
      }
      .aw-health-bar {
        position: absolute; bottom: 32px; left: 50%;
        transform: translateX(-50%);
        width: 260px; height: 10px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(136, 51, 255, 0.4);
      }
      .aw-health-fill {
        height: 100%;
        background: linear-gradient(90deg, #5511cc, #aa44ff);
        transition: width 0.3s ease;
        box-shadow: 0 0 8px #8833ff;
      }
      .aw-wave-label {
        position: absolute; top: 24px; left: 24px;
        font-family: 'Share Tech Mono', monospace;
        font-size: 12px; letter-spacing: 0.2em;
        color: #886699;
      }
      .aw-cooldowns {
        position: absolute; bottom: 60px; left: 50%;
        transform: translateX(-50%);
        display: flex; gap: 12px;
      }
      .aw-spell-badge {
        font-family: 'Share Tech Mono', monospace;
        font-size: 10px; letter-spacing: 0.12em;
        padding: 4px 10px;
        border: 1px solid currentColor;
        opacity: 0.9;
      }
      .aw-feedback {
        position: absolute; top: 35%; left: 50%;
        transform: translate(-50%, -50%);
        font-family: 'Share Tech Mono', monospace;
        font-size: 22px; letter-spacing: 0.2em;
        pointer-events: none;
        opacity: 0;
      }
      .aw-wave-announce {
        position: absolute; top: 30%; left: 50%;
        transform: translate(-50%, -50%);
        font-family: 'Share Tech Mono', monospace;
        font-size: clamp(14px, 2.5vw, 24px);
        letter-spacing: 0.3em;
        color: #cc88ff;
        opacity: 0;
        pointer-events: none;
      }
      .aw-terminal-line {
        font-family: 'Share Tech Mono', monospace;
        font-size: 11px; color: #554466;
        letter-spacing: 0.15em; margin: 2px 0;
      }
      .aw-terminal-line span { color: #8844aa; }
    `
    document.head.appendChild(style)
  }

  _buildHUD() {
    this._hud = document.createElement('div')
    this._hud.className = 'aw-hud'
    this._hud.style.display = 'none'

    this._hud.innerHTML = `
      <div class="aw-wave-label">WAVE <span id="aw-wave-num">--</span> / 50</div>
      <div class="aw-wave-announce" id="aw-wave-announce"></div>
      <div class="aw-feedback" id="aw-feedback"></div>
      <div class="aw-health-bar">
        <div class="aw-health-fill" id="aw-hp-fill" style="width:100%"></div>
      </div>
      <div class="aw-cooldowns">
        <div class="aw-spell-badge" style="color:#8833ff">ARCANE</div>
        <div class="aw-spell-badge" style="color:#ff4400">FIRE</div>
        <div class="aw-spell-badge" style="color:#00ffcc">VORTEX</div>
      </div>
    `
    this._c.appendChild(this._hud)
  }

  showMenu() {
    this._clearScreens()
    const s = document.createElement('div')
    s.className = 'aw-screen'

    const terminalLines = [
      '> initializing agent_wars.exe',
      '> loading <span>three.js</span> renderer... ok',
      '> loading <span>xstate</span> machine... ok',
      '> connecting gesture interface... ok',
      '> room entities: <span>4 portals detected</span>',
      '> status: <span>READY</span>',
    ]

    s.innerHTML = `
      <div class="aw-title">AGENT WARS</div>
      <div class="aw-sub">// AgentBankd Systems — Arcane Defense Protocol</div>
      ${terminalLines.map((l) => `<div class="aw-terminal-line">${l}</div>`).join('')}
      <br/>
      <button class="aw-btn" id="aw-start-btn">[ INITIATE SEQUENCE ]</button>
      <button class="aw-btn" id="aw-inf-btn" style="font-size:0.8em;color:#886699">[ INFINITE MODE ]</button>
    `

    this._c.appendChild(s)
    this._current = s
    s.style.pointer = 'all'

    gsap.fromTo(s, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' })
    gsap.fromTo('.aw-terminal-line', { x: -20, opacity: 0 }, {
      x: 0, opacity: 1, duration: 0.3, stagger: 0.08, ease: 'power2.out', delay: 0.3,
    })

    s.querySelector('#aw-start-btn').addEventListener('click', () => {
      gsap.to(s, { opacity: 0, duration: 0.4, onComplete: () => { s.remove(); this._hud.style.display = 'block' } })
      this.emit('start', false)
    })
    s.querySelector('#aw-inf-btn').addEventListener('click', () => {
      gsap.to(s, { opacity: 0, duration: 0.4, onComplete: () => { s.remove(); this._hud.style.display = 'block' } })
      this.emit('start', true)
    })
  }

  showWaveAnnouncement(wave) {
    const el = document.getElementById('aw-wave-num')
    const ann = document.getElementById('aw-wave-announce')
    if (el) el.textContent = wave
    if (!ann) return

    ann.textContent = `// WAVE ${wave} INCOMING`
    gsap.fromTo(ann, { opacity: 0, y: -10 }, {
      opacity: 1, y: 0, duration: 0.4, ease: 'power2.out',
      onComplete: () => gsap.to(ann, { opacity: 0, delay: 2, duration: 0.5 }),
    })
  }

  showWaveClear() {
    const ann = document.getElementById('aw-wave-announce')
    if (!ann) return
    ann.textContent = '// WAVE CLEARED'
    ann.style.color = '#44ffcc'
    gsap.fromTo(ann, { opacity: 0, scale: 1.1 }, {
      opacity: 1, scale: 1, duration: 0.3,
      onComplete: () => gsap.to(ann, { opacity: 0, delay: 1.5, duration: 0.5, onComplete: () => { ann.style.color = '#cc88ff' } }),
    })
  }

  showSpellFeedback({ label, color, blocked }) {
    const el = document.getElementById('aw-feedback')
    if (!el) return
    el.textContent = blocked ? `${label} — RECHARGING` : `// ${label.toUpperCase()}`
    el.style.color = blocked ? '#555566' : (color ? `#${color.toString(16).padStart(6, '0')}` : '#cc88ff')
    gsap.fromTo(el, { opacity: 1, y: 0 }, { opacity: 0, y: -30, duration: 1.0, ease: 'power2.out' })
  }

  updateHealth(percent) {
    const fill = document.getElementById('aw-hp-fill')
    if (fill) fill.style.width = `${Math.max(0, percent * 100).toFixed(1)}%`
  }

  showGameOver(wave) {
    this._hud.style.display = 'none'
    this._clearScreens()
    const s = document.createElement('div')
    s.className = 'aw-screen'
    s.innerHTML = `
      <div class="aw-title" style="color:#ff3333;text-shadow:0 0 20px #ff0000">CRYSTAL DESTROYED</div>
      <div class="aw-sub">// System breach at wave ${wave}</div>
      <button class="aw-btn" id="aw-retry-btn">[ REINITIALIZE ]</button>
    `
    this._c.appendChild(s)
    this._current = s
    gsap.fromTo(s, { opacity: 0 }, { opacity: 1, duration: 0.8 })
    s.querySelector('#aw-retry-btn').addEventListener('click', () => {
      gsap.to(s, { opacity: 0, duration: 0.4, onComplete: () => s.remove() })
      this.emit('restart')
    })
  }

  showVictory() {
    this._hud.style.display = 'none'
    this._clearScreens()
    const s = document.createElement('div')
    s.className = 'aw-screen'
    s.innerHTML = `
      <div class="aw-title" style="color:#ffdd00;text-shadow:0 0 20px #ffaa00">ALL 50 WAVES CLEARED</div>
      <div class="aw-sub">// Defense protocol complete — Agent status: LEGENDARY</div>
      <button class="aw-btn" style="color:#ffdd00;border-color:#ffaa00" id="aw-inf-btn2">[ INFINITE MODE ]</button>
      <button class="aw-btn" id="aw-menu-btn">[ MAIN MENU ]</button>
    `
    this._c.appendChild(s)
    this._current = s
    gsap.fromTo(s, { opacity: 0 }, { opacity: 1, duration: 1.0 })
    s.querySelector('#aw-inf-btn2').addEventListener('click', () => {
      gsap.to(s, { opacity: 0, duration: 0.4, onComplete: () => { s.remove(); this._hud.style.display = 'block' } })
      this.emit('start', true)
    })
    s.querySelector('#aw-menu-btn').addEventListener('click', () => {
      gsap.to(s, { opacity: 0, duration: 0.4, onComplete: () => s.remove() })
      this.emit('restart')
    })
  }

  _clearScreens() {
    if (this._current) {
      this._current.remove()
      this._current = null
    }
  }
}
