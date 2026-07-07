# Agent Wars

**3D browser game — gesture-based arcane defense**

Stack: Three.js · XState · GSAP · WebGL (custom GLSL shaders) · Vite

---

## What it is

You stand in a gothic chamber protecting a living crystal at its center.  
Demons pour in from four entry points — a door, a bookshelf, a window, and a floor hatch.  
They slowly drain the crystal's power. Kill them before it reaches zero.

**You fight with gestures.** Draw shapes on screen with your mouse or finger:

| Gesture | Spell | Effect |
|---|---|---|
| Loop → drag down | Arcane Pulse | Kills 1 nearest demon |
| Zigzag ∿ | Fire Surge | Two fireballs, kills 2 |
| Ω shape | Vortex Collapse | Pulls all demons into a portal |

Fail the shape → spell doesn't cast. No second chances.

50 waves + infinite mode.

---

## Dev setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

---

## Architecture

```
src/
  engine/
    Stage.js          — WebGL renderer, post-processing (SSAO, bloom, vignette), camera system
    RoomBuilder.js    — Procedural gothic room geometry
    TorchSystem.js    — Flickering torch lights + particle fire
    ParticleSim.js    — CPU particle sim on Simplex noise (fire, smoke, magic, dust, ghost, victory)
  entities/
    Enemy.js          — XState FSM (IDLE→ANIMATING_IN→ALIVE→TAGGED→DEAD), dissolve GLSL shader
    EnemyPool.js      — Fixed-size object pool, 32 demons max
  spells/
    GestureRecognizer.js  — $1 Unistroke recognizer (resample → normalize → match)
    SpellSystem.js        — Spell execution, cooldowns, impact effects
  game/
    Crystal.js        — Health entity with custom vertex+fragment shader
    WaveManager.js    — 50 wave definitions + infinite mode
    GameLoop.js       — rAF loop
  controllers/
    SoundController.js    — Three.js PositionalAudio pools
  ui/
    Screens.js        — GSAP Flip transitions, terminal-style UI
  shaders/
    dissolve.glsl     — FBM dissolve used in enemy death
    crystal.glsl      — Fresnel health-driven glow
    vignette.glsl     — Post-process vignette pass
```

---

## Status

Active development — solo project.  
Core systems are in. Polish pass ongoing.
