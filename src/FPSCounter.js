export class FPSCounter {
  constructor(container) {
    this.el = document.createElement('div')
    this.el.style.cssText = [
      'position:fixed', 'top:0.5rem', 'left:0.8rem',
      'font:0.75rem monospace', 'color:#6b7280',
      'pointer-events:none', 'opacity:0.6',
    ].join(';')
    container.appendChild(this.el)
    this._frames = 0
    this._last = performance.now()
  }

  tick() {
    this._frames++
    const now = performance.now()
    if (now - this._last >= 1000) {
      this.el.textContent = `${this._frames} fps`
      this._frames = 0
      this._last = now
    }
  }
}
