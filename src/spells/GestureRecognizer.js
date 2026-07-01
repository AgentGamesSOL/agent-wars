import { EventEmitter } from '../utils/EventEmitter.js'

function resample(points, n = 64) {
  let totalLen = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i-1].x, dy = points[i].y - points[i-1].y
    totalLen += Math.sqrt(dx*dx + dy*dy)
  }
  const interval = totalLen / (n - 1)
  let acc = 0
  const result = [points[0]]
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i-1].x, dy = points[i].y - points[i-1].y
    let rem = Math.sqrt(dx*dx + dy*dy)
    while (acc + rem >= interval) {
      const t = (interval - acc) / rem
      result.push({ x: points[i-1].x + t*dx, y: points[i-1].y + t*dy })
      rem = acc + rem - interval; acc = 0
      if (result.length === n) return result
    }
    acc += rem
  }
  return result
}

function normalize(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of pts) {
    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y
  }
  const scale = Math.max(maxX - minX, maxY - minY) || 1
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  return pts.map(p => ({ x: (p.x - cx) / scale, y: (p.y - cy) / scale }))
}

export class GestureRecognizer extends EventEmitter {
  constructor(canvas) {
    super()
    this._canvas = canvas; this._drawing = false; this._points = []
    this._bind()
  }
  _bind() {
    this._canvas.addEventListener('mousedown', e => {
      this._drawing = true
      this._points = [{ x: e.clientX / innerWidth, y: e.clientY / innerHeight }]
    })
    this._canvas.addEventListener('mousemove', e => {
      if (!this._drawing) return
      this._points.push({ x: e.clientX / innerWidth, y: e.clientY / innerHeight })
    })
    window.addEventListener('mouseup', () => {
      if (!this._drawing || this._points.length < 8) return
      this._drawing = false
      const processed = normalize(resample(this._points, 64))
      console.log('normalized ok, samples:', processed.length)
    })
  }
}
