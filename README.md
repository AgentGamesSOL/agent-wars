# Agent Wars

> A 3D browser game. Draw gestures to cast spells and defend the crystal from waves of enemies.

![three.js](https://img.shields.io/badge/three.js-0.165-black?logo=three.js)
![xstate](https://img.shields.io/badge/xstate-5-blueviolet)
![gsap](https://img.shields.io/badge/gsap-3-88CE02)
![vite](https://img.shields.io/badge/vite-5-646CFF?logo=vite)

## Controls

| Gesture | Spell |
|---------|-------|
| Draw a circle | Arcane burst — damages all enemies in range |
| Draw a Z | Vortex — pulls enemies to the center, then kills them |
| Draw a V | Fireball — launches a projectile at nearest enemy |

Keyboard: **P** pause · **R** restart · **M** mute

## Tech

- **Three.js** — 3D rendering, WebGL, custom GLSL shaders
- **XState v5** — finite state machines for enemy lifecycle
- **GSAP** — screen transitions, UI animations, screen shake
- **Simplex noise** — particle movement, torch flicker
- **$1 Unistroke** — gesture recognition algorithm
- **Web Audio API** — positional audio, sound pools

## Run

```bash
npm install
npm run dev
```
