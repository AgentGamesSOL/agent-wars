import * as THREE from 'three'

const ROOM_W = 14
const ROOM_H = 9
const ROOM_D = 14

export class RoomBuilder {
  constructor(scene) {
    this.scene = scene
    this._geo = []
  }

  async build() {
    this._buildFloor()
    this._buildWalls()
    this._buildCeiling()
    this._buildArches()
    this._buildPortals()
    this._buildBookshelf()
    this._buildWindow()
    this._buildHatch()
    this._buildPillars()
    this._buildCrystalPedestal()
    this._placeProps()
  }

  _stoneMaterial(color = 0x2a2030, roughness = 0.92) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0.05,
    })
  }

  _buildFloor() {
    const geo = new THREE.PlaneGeometry(ROOM_W, ROOM_D, 20, 20)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a1020,
      roughness: 0.98,
      metalness: 0.01,
    })
    const floor = new THREE.Mesh(geo, mat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)
  }

  _buildWalls() {
    const mat = this._stoneMaterial(0x221830)
    const walls = [
      { w: ROOM_W, h: ROOM_H, x: 0, y: ROOM_H / 2, z: -ROOM_D / 2, ry: 0 },
      { w: ROOM_W, h: ROOM_H, x: 0, y: ROOM_H / 2, z: ROOM_D / 2, ry: Math.PI },
      { w: ROOM_D, h: ROOM_H, x: -ROOM_W / 2, y: ROOM_H / 2, z: 0, ry: Math.PI / 2 },
      { w: ROOM_D, h: ROOM_H, x: ROOM_W / 2, y: ROOM_H / 2, z: 0, ry: -Math.PI / 2 },
    ]
    walls.forEach(({ w, h, x, y, z, ry }) => {
      const geo = new THREE.PlaneGeometry(w, h, 12, 8)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(x, y, z)
      mesh.rotation.y = ry
      mesh.receiveShadow = true
      this.scene.add(mesh)
    })
  }

  _buildCeiling() {
    const geo = new THREE.PlaneGeometry(ROOM_W, ROOM_D)
    const mat = this._stoneMaterial(0x180d22)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.x = Math.PI / 2
    mesh.position.y = ROOM_H
    mesh.receiveShadow = true
    this.scene.add(mesh)
  }

  _buildArches() {
    const mat = this._stoneMaterial(0x2e1e3a)
    const archPositions = [
      { x: 0, z: -ROOM_D / 2 + 0.1, ry: 0 },
      { x: -ROOM_W / 2 + 0.1, z: 0, ry: Math.PI / 2 },
      { x: ROOM_W / 2 - 0.1, z: 0, ry: -Math.PI / 2 },
    ]
    archPositions.forEach(({ x, z, ry }) => {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-1.5, 3, 0),
        new THREE.Vector3(0, 5.5, 0),
        new THREE.Vector3(1.5, 3, 0)
      )
      const pts = curve.getPoints(20)
      const archGeo = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts), 20, 0.15, 6
      )
      const arch = new THREE.Mesh(archGeo, mat)
      arch.position.set(x, 0, z)
      arch.rotation.y = ry
      arch.castShadow = true
      this.scene.add(arch)
    })
  }

  _buildPortals() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x110820,
      roughness: 1,
      metalness: 0,
    })
    const doorGeo = new THREE.BoxGeometry(2.4, 4.5, 0.3)
    const door = new THREE.Mesh(doorGeo, mat)
    door.position.set(0, 2.25, -ROOM_D / 2 + 0.25)
    door.userData.portalId = 'door'
    this.scene.add(door)

    const hatchGeo = new THREE.BoxGeometry(2.0, 0.15, 2.0)
    const hatchMat = new THREE.MeshStandardMaterial({ color: 0x1a0f28 })
    const hatch = new THREE.Mesh(hatchGeo, hatchMat)
    hatch.position.set(3.5, 0.08, 3.5)
    hatch.userData.portalId = 'hatch'
    this.scene.add(hatch)

    this._hatch = hatch
  }

  _buildBookshelf() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x2b1a0e, roughness: 0.9 })
    const shelfGeo = new THREE.BoxGeometry(2.5, 4.5, 0.6)
    const shelf = new THREE.Mesh(shelfGeo, mat)
    shelf.position.set(-ROOM_W / 2 + 1.55, 2.25, 0)
    shelf.castShadow = true
    shelf.receiveShadow = true
    shelf.userData.portalId = 'bookshelf'
    this.scene.add(shelf)

    const bookColors = [0x8b1a1a, 0x1a3a8b, 0x2a8b1a, 0x8b6a1a, 0x5a1a8b]
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 6; col++) {
        const w = 0.22 + Math.random() * 0.1
        const h = 0.55 + Math.random() * 0.25
        const bookGeo = new THREE.BoxGeometry(w, h, 0.4)
        const bookMat = new THREE.MeshStandardMaterial({
          color: bookColors[Math.floor(Math.random() * bookColors.length)],
          roughness: 0.8,
        })
        const book = new THREE.Mesh(bookGeo, bookMat)
        book.position.set(
          -ROOM_W / 2 + 1.35 + col * 0.35 - 1.05,
          0.6 + row * 1.3,
          0.05 + Math.random() * 0.1
        )
        book.rotation.z = (Math.random() - 0.5) * 0.05
        book.castShadow = true
        this.scene.add(book)
      }
    }
  }

  _buildWindow() {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1220 })
    const frameGeo = new THREE.BoxGeometry(2.8, 3.5, 0.2)
    const frame = new THREE.Mesh(frameGeo, frameMat)
    frame.position.set(0, 4.5, ROOM_D / 2 - 0.1)
    frame.rotation.y = Math.PI
    frame.userData.portalId = 'window'
    this.scene.add(frame)

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x112244,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
    })
    const glassGeo = new THREE.PlaneGeometry(2.4, 3.1)
    const glass = new THREE.Mesh(glassGeo, glassMat)
    glass.position.set(0, 4.5, ROOM_D / 2 - 0.15)
    glass.rotation.y = Math.PI
    this.scene.add(glass)

    const moonLight = new THREE.PointLight(0x2244aa, 1.5, 6)
    moonLight.position.set(0, 4.5, ROOM_D / 2 + 2)
    this.scene.add(moonLight)
  }

  _buildHatch() {
    const rings = [0.6, 0.9, 1.2]
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a1a3a, roughness: 0.95 })
    rings.forEach((r) => {
      const geo = new THREE.TorusGeometry(r, 0.04, 8, 32)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.rotation.x = Math.PI / 2
      mesh.position.set(3.5, 0.1, 3.5)
      this.scene.add(mesh)
    })
  }

  _buildPillars() {
    const mat = this._stoneMaterial(0x24183a)
    const positions = [[-4, -4], [4, -4], [-4, 4], [4, 4]]
    positions.forEach(([x, z]) => {
      const geo = new THREE.CylinderGeometry(0.35, 0.45, ROOM_H, 8)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(x, ROOM_H / 2, z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.scene.add(mesh)
    })
  }

  _buildCrystalPedestal() {
    const mat = this._stoneMaterial(0x1e1230)
    const baseGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.3, 8)
    const base = new THREE.Mesh(baseGeo, mat)
    base.position.set(0, 0.15, 0)
    base.receiveShadow = true
    this.scene.add(base)

    const shaftGeo = new THREE.CylinderGeometry(0.25, 0.4, 1.0, 8)
    const shaft = new THREE.Mesh(shaftGeo, mat)
    shaft.position.set(0, 0.8, 0)
    shaft.castShadow = true
    this.scene.add(shaft)

    const topGeo = new THREE.CylinderGeometry(0.5, 0.25, 0.2, 8)
    const top = new THREE.Mesh(topGeo, mat)
    top.position.set(0, 1.4, 0)
    top.castShadow = true
    this.scene.add(top)
  }

  _placeProps() {
    const candleMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, emissive: 0x442200, emissiveIntensity: 0.8 })
    const candlePositions = [[-1.5, -6], [1.5, -6], [-5.5, 1], [-5.5, -1]]
    candlePositions.forEach(([x, z]) => {
      const geo = new THREE.CylinderGeometry(0.06, 0.07, 0.4, 8)
      const c = new THREE.Mesh(geo, candleMat)
      c.position.set(x, 0.2, z)
      this.scene.add(c)
    })
  }
}
