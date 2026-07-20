const COLORS = {
  arcane: '#a78bfa',
  fire: '#f97316',
  vortex: '#38bdf8',
  none: 'transparent',
}

export class SpellIndicator {
  constructor(canvas) {
    this._canvas = canvas
    this.set('none')
  }

  set(spell) {
    const color = COLORS[spell] ?? COLORS.none
    this._canvas.style.boxShadow = color === 'transparent'
      ? 'none'
      : `0 0 14px 2px ${color}88, inset 0 0 6px ${color}44`
    this._canvas.style.transition = 'box-shadow 0.2s ease'
  }
}
