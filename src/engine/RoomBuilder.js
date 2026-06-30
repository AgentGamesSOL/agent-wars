import * as THREE from 'three'

const ROOM_W = 14, ROOM_H = 9, ROOM_D = 14

export class RoomBuilder {
  constructor(scene) { this.scene = scene }

  async build() {
    this._buildFloor()
    this._buildWalls()
  }

  _buildFloor() {
    const geo = new THREE.PlaneGeometry(ROOM_W, ROOM_D)
    const mat = new THREE.MeshStandardMaterial({ color: 0x1a1020, roughness: 0.98 })
    const floor = new THREE.Mesh(geo, mat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)
  }

  _buildWalls() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x221830, roughness: 0.92 })
    const cfgs = [
      { w: ROOM_W, h: ROOM_H, x: 0,         y: ROOM_H/2, z: -ROOM_D/2, ry: 0 },
      { w: ROOM_W, h: ROOM_H, x: 0,         y: ROOM_H/2, z:  ROOM_D/2, ry: Math.PI },
      { w: ROOM_D, h: ROOM_H, x: -ROOM_W/2, y: ROOM_H/2, z: 0,         ry:  Math.PI/2 },
      { w: ROOM_D, h: ROOM_H, x:  ROOM_W/2, y: ROOM_H/2, z: 0,         ry: -Math.PI/2 },
    ]
    cfgs.forEach(({ w, h, x, y, z, ry }) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
      mesh.position.set(x, y, z); mesh.rotation.y = ry
      mesh.receiveShadow = true; this.scene.add(mesh)
    })
  }
}
