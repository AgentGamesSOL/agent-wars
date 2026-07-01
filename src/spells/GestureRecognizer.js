import { EventEmitter } from '../utils/EventEmitter.js'

export class GestureRecognizer extends EventEmitter {
  constructor(canvas) {
    super()
    this._canvas = canvas
    this._drawing = false
    this._points = []
    this._bind()
  }

  _bind() {
    this._canvas.addEventListener('mousedown', (e) => {
      this._drawing = true
      this._points = [{ x: e.clientX / innerWidth, y: e.clientY / innerHeight }]
    })
    this._canvas.addEventListener('mousemove', (e) => {
      if (!this._drawing) return
      this._points.push({ x: e.clientX / innerWidth, y: e.clientY / innerHeight })
    })
    window.addEventListener('mouseup', () => {
      if (!this._drawing) return
      this._drawing = false
      console.log('collected', this._points.length, 'points')
    })
  }
}
