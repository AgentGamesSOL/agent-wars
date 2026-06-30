import * as THREE from 'three'

const r = new THREE.WebGLRenderer({ canvas: document.getElementById('gl-canvas') })
r.setSize(window.innerWidth, window.innerHeight)
const scene = new THREE.Scene()
const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100)
cam.position.z = 5
const geo = new THREE.BoxGeometry()
const mat = new THREE.MeshBasicMaterial({ color: 0x4400ff, wireframe: true })
const box = new THREE.Mesh(geo, mat)
scene.add(box)
function tick() { requestAnimationFrame(tick); box.rotation.y += 0.01; r.render(scene, cam) }
tick()
