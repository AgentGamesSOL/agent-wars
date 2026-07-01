import { EventEmitter } from '../utils/EventEmitter.js'

const MIN_POINTS = 12
const SAMPLE_RATE = 8
const MATCH_THRESHOLD = 0.72

const SPELL_TEMPLATES = {
  arcane: buildTemplate_loop(),
  fire: buildTemplate_zigzag(),
  vortex: buildTemplate_omega(),
}

function buildTemplate_loop() {
  const pts = []
  const cx = 0.5, cy = 0.5, r = 0.25
  for (let i = 0; i <= 40; i++) {
    const t = (i / 40) * Math.PI * 2
    pts.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r })
  }
  pts.push({ x: cx, y: cy + r * 0.3 })
  pts.push({ x: cx, y: cy - r * 0.4 })
  return pts
}

function buildTemplate_zigzag() {
  return [
    { x: 0.1, y: 0.4 },
    { x: 0.3, y: 0.6 },
    { x: 0.5, y: 0.3 },
    { x: 0.7, y: 0.6 },
    { x: 0.9, y: 0.4 },
  ]
}

function buildTemplate_omega() {
  const pts = []
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * Math.PI * 2
    const r = 0.2 + 0.05 * Math.cos(t * 3)
    pts.push({ x: 0.5 + Math.cos(t) * r, y: 0.5 + Math.sin(t) * r * 0.6 })
  }
  pts.push({ x: 0.3, y: 0.75 })
  pts.push({ x: 0.7, y: 0.75 })
  return pts
}

function resample(points, n = 64) {
  let totalLen = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    totalLen += Math.sqrt(dx * dx + dy * dy)
  }
  const interval = totalLen / (n - 1)
  let accumulated = 0
  const result = [points[0]]
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    const segLen = Math.sqrt(dx * dx + dy * dy)
    let remaining = segLen
    while (accumulated + remaining >= interval) {
      const t = (interval - accumulated) / remaining
      const nx = points[i - 1].x + t * dx
      const ny = points[i - 1].y + t * dy
      result.push({ x: nx, y: ny })
      remaining = accumulated + remaining - interval
      accumulated = 0
      if (result.length === n) return result
    }
    accumulated += remaining
  }
  return result
}

function normalize(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  const scale = Math.max(maxX - minX, maxY - minY) || 1
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  return points.map((p) => ({
    x: (p.x - cx) / scale,
    y: (p.y - cy) / scale,
  }))
}

function matchScore(a, b) {
  if (a.length !== b.length) return 0
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const dx = a[i].x - b[i].x
    const dy = a[i].y - b[i].y
    sum += Math.sqrt(dx * dx + dy * dy)
  }
  const avgDist = sum / a.length
  return Math.max(0, 1 - avgDist * 2)
}

export class GestureRecognizer extends EventEmitter {
  constructor(canvas) {
    super()
    this._canvas = canvas
    this._drawing = false
    this._points = []
    this._sampleCounter = 0
    this._templates = {}

    const resampled = {}
    for (const [name, pts] of Object.entries(SPELL_TEMPLATES)) {
      resampled[name] = normalize(resample(pts, 64))
    }
    this._templates = resampled

    this._bind()
    this._buildOverlay()
  }

  _buildOverlay() {
    this._overlayCanvas = document.createElement('canvas')
    this._overlayCanvas.style.cssText = `
      position: fixed; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 100;
    `
    this._overlayCanvas.width = window.innerWidth
    this._overlayCanvas.height = window.innerHeight
    document.body.appendChild(this._overlayCanvas)
    this._ctx = this._overlayCanvas.getContext('2d')

    window.addEventListener('resize', () => {
      this._overlayCanvas.width = window.innerWidth
      this._overlayCanvas.height = window.innerHeight
    })
  }

  _bind() {
    const getXY = (e) => {
      const rect = this._canvas.getBoundingClientRect()
      const src = e.touches ? e.touches[0] : e
      return {
        x: (src.clientX - rect.left) / rect.width,
        y: (src.clientY - rect.top) / rect.height,
        rawX: src.clientX,
        rawY: src.clientY,
      }
    }

    const onStart = (e) => {
      e.preventDefault()
      this._drawing = true
      this._points = []
      this._rawPoints = []
      const { x, y, rawX, rawY } = getXY(e)
      this._points.push({ x, y })
      this._rawPoints.push({ x: rawX, y: rawY })
    }

    const onMove = (e) => {
      if (!this._drawing) return
      e.preventDefault()
      this._sampleCounter++
      if (this._sampleCounter % SAMPLE_RATE !== 0) {
        const { rawX, rawY } = getXY(e)
        this._rawPoints.push({ x: rawX, y: rawY })
        this._drawStroke()
        return
      }
      const { x, y, rawX, rawY } = getXY(e)
      this._points.push({ x, y })
      this._rawPoints.push({ x: rawX, y: rawY })
      this._drawStroke()
    }

    const onEnd = () => {
      if (!this._drawing) return
      this._drawing = false
      this._ctx.clearRect(0, 0, this._overlayCanvas.width, this._overlayCanvas.height)
      this._recognize()
    }

    this._canvas.addEventListener('mousedown', onStart)
    this._canvas.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    this._canvas.addEventListener('touchstart', onStart, { passive: false })
    this._canvas.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
  }

  _drawStroke() {
    const ctx = this._ctx
    ctx.clearRect(0, 0, this._overlayCanvas.width, this._overlayCanvas.height)
    if (this._rawPoints.length < 2) return

    ctx.beginPath()
    ctx.moveTo(this._rawPoints[0].x, this._rawPoints[0].y)
    for (let i = 1; i < this._rawPoints.length; i++) {
      ctx.lineTo(this._rawPoints[i].x, this._rawPoints[i].y)
    }
    ctx.strokeStyle = 'rgba(160, 80, 255, 0.85)'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.shadowColor = '#aa44ff'
    ctx.shadowBlur = 12
    ctx.stroke()
  }

  _recognize() {
    if (this._points.length < MIN_POINTS) return

    const candidate = normalize(resample(this._points, 64))
    let bestScore = 0
    let bestName = null

    for (const [name, template] of Object.entries(this._templates)) {
      const score = matchScore(candidate, template)
      if (score > bestScore) {
        bestScore = score
        bestName = name
      }
    }

    if (bestScore >= MATCH_THRESHOLD && bestName) {
      this.emit('cast', { spell: bestName, confidence: bestScore })
    } else {
      this.emit('miss', { confidence: bestScore })
    }
  }

  destroy() {
    this._overlayCanvas.remove()
  }
}
