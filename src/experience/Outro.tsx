import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import gsap from "gsap"

import { sound } from "./audio"
import { rig } from "./rig"
import { pullCord, reducedMotion, store, useStore } from "./store"

/**
 * After AFSLUITEN the last dot of light on the tube turns into a glowing mouse pointer.
 * It climbs out of the glass (with old school pointer trails), clicks the lamp cord and
 * drags it down (the lamp dies), wanders through the dark room, double clicks
 * and then flies straight into the camera. There it flashes and becomes the blinking
 * cursor that types the goodbye (Overlays.tsx).
 */

const GHOSTS = 6
const GREEN = new THREE.Color("#9dffb6")

/** Classic arrow pointer, tip at the origin, in pixels of a 12 x 19 cursor. */
const ARROW = [
  [0, 0],
  [0, 16],
  [4, 12.5],
  [7, 18.5],
  [9.5, 17.5],
  [6.5, 11.5],
  [11.5, 11.5],
]
const PIXEL = 0.0026

function arrowGeometry(grow = 0) {
  const shape = new THREE.Shape()
  // Grow a little around the centre for the dark outline behind the bright fill.
  const cx = 4.5
  const cy = 11
  ARROW.forEach(([x, y], i) => {
    const gx = (x + (x - cx) * grow) * PIXEL
    const gy = -(y + (y - cy) * grow) * PIXEL
    if (i === 0) shape.moveTo(gx, gy)
    else shape.lineTo(gx, gy)
  })
  shape.closePath()
  return new THREE.ShapeGeometry(shape)
}

export function Outro() {
  const phase = useStore((s) => s.phase)
  const pointer = useRef<THREE.Group>(null)
  const fill = useRef<THREE.MeshBasicMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  const ghosts = useRef<(THREE.Mesh | null)[]>([])
  const state = useMemo(() => ({ pos: new THREE.Vector3(), size: 0, glow: 0, follow: 0, toCam: 0, press: 0, from: new THREE.Vector3() }), [])
  const camera = useThree((s) => s.camera)

  const geo = useMemo(() => ({ fill: arrowGeometry(0), edge: arrowGeometry(0.22) }), [])
  // Pointer trails, like the Windows setting: a few fading copies of where it just was.
  const history = useMemo(() => Array.from({ length: GHOSTS * 3 }, () => new THREE.Vector3()), [])
  const ghostMats = useMemo(
    () => Array.from({ length: GHOSTS }, (_, i) => new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.4 * (1 - i / GHOSTS), toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending })),
    [],
  )

  useEffect(() => () => {
    geo.fill.dispose()
    geo.edge.dispose()
    ghostMats.forEach((m) => m.dispose())
  }, [geo, ghostMats])

  // The choreography. Runs once each time the phase becomes "off".
  useEffect(() => {
    if (phase !== "off") {
      state.size = 0
      state.glow = 0
      state.toCam = 0
      return
    }
    const quick = reducedMotion()
    const s = rig.screen.clone()
    state.pos.copy(s)
    history.forEach((h) => h.copy(s))
    state.follow = 0
    const near = (p: THREE.Vector3, x: number, y: number, z: number) => p.clone().add(new THREE.Vector3(x, y, z))
    const toLamp = new THREE.CatmullRomCurve3([s, near(s, 0.02, 0.02, 0.22), near(s, -0.25, 0.25, 0.35), near(rig.bead, 0.05, 0.06, 0.12), near(rig.bead, 0, -0.012, 0.012)])
    const fly = { t: 0 }
    const tl = gsap.timeline({ delay: quick ? 0 : 0.7 })

    if (quick) {
      tl.call(() => pullCord(false))
      tl.call(() => store.set({ outro: true }), [], 0.3)
      return () => {
        tl.kill()
      }
    }

    // 1. The dot on the glass becomes a mouse pointer and climbs out.
    tl.to(state, { size: 1, glow: 1, duration: 0.3, ease: "back.out(3)" })
    tl.call(() => sound.whoosh(1.5), [], 0.05)
    tl.to(fly, { t: 1, duration: 1.5, ease: "power1.inOut", onUpdate: () => toLamp.getPoint(fly.t, state.pos) }, 0.1)
    // 2. Click on the cord and drag it down: the lamp dies.
    tl.call(() => sound.mouseClick())
    tl.to(state, { press: 1, duration: 0.06, yoyo: true, repeat: 1 })
    tl.to(state, { follow: 1, duration: 0.01 })
    tl.call(() => {
      pullCord(false)
    })
    // 3. Hold on while the bead springs back, then let go and loop through the dark room.
    tl.to({}, { duration: 0.6 })
    tl.to(state, { follow: 0, duration: 0.01 })
    const loop = { t: 0 }
    let path: THREE.CatmullRomCurve3 | null = null
    tl.call(() => {
      const from = state.pos.clone()
      path = new THREE.CatmullRomCurve3([from, near(from, 0.25, 0.15, 0.2), new THREE.Vector3(0.75, 0.72, 0.15), new THREE.Vector3(0.7, 0.3, 0.7), new THREE.Vector3(0.1, 0.38, 0.9)])
      sound.whoosh(1.8)
    })
    tl.to(loop, { t: 1, duration: 1.8, ease: "sine.inOut", onUpdate: () => path?.getPoint(loop.t, state.pos) })
    // 4. It stops, double clicks at you... then comes straight at the camera.
    tl.to({}, { duration: 0.3 })
    tl.call(() => sound.mouseClick())
    tl.to(state, { press: 1, duration: 0.05, yoyo: true, repeat: 1 })
    tl.call(() => sound.mouseClick(), [], "+=0.06")
    tl.to(state, { press: 1, duration: 0.05, yoyo: true, repeat: 1 })
    tl.to({}, { duration: 0.25 })
    tl.call(() => {
      state.from.copy(state.pos)
      sound.rush()
    })
    tl.to(state, { toCam: 1, duration: 0.75, ease: "power3.in" })
    tl.to(state, { size: 3, glow: 3, duration: 0.75, ease: "power3.in" }, "<")
    // 5. Impact: flash, and the pointer becomes the cursor of the goodbye screen.
    tl.call(() => {
      sound.impact()
      store.set({ outro: true })
    })
    tl.to(state, { size: 0, glow: 0, duration: 0.08 })

    return () => {
      tl.kill()
    }
  }, [phase, state, history])

  const camPoint = useMemo(() => new THREE.Vector3(), [])
  const frameNo = useRef(0)
  useFrame(() => {
    if (state.follow > 0) state.pos.copy(rig.bead).add(new THREE.Vector3(0.004, 0.002, 0.01))
    if (state.toCam > 0) {
      // Just in front of the lens, so it fills the view right before the flash.
      camera.getWorldDirection(camPoint).multiplyScalar(0.12).add(camera.position)
      state.pos.lerpVectors(state.from, camPoint, state.toCam)
    }
    const visible = state.size > 0.001
    if (pointer.current) {
      pointer.current.position.copy(state.pos)
      // Always faces the camera, like a real cursor on glass.
      pointer.current.quaternion.copy(camera.quaternion)
      pointer.current.visible = visible
      // A click squashes it a little.
      pointer.current.scale.set(state.size * (1 - state.press * 0.18), state.size * (1 - state.press * 0.18), 1)
    }
    if (fill.current) fill.current.color.copy(GREEN).multiplyScalar(1.6 + state.glow * 2 + state.press * 2)

    // Trails: every other frame remember the position, ghosts sit further back in time.
    if (frameNo.current++ % 2 === 0) {
      for (let i = history.length - 1; i > 0; i--) history[i].copy(history[i - 1])
      history[0].copy(state.pos)
    }
    ghosts.current.forEach((g, i) => {
      if (!g) return
      g.visible = visible && state.toCam === 0
      g.position.copy(history[(i + 1) * 3 - 1])
      g.quaternion.copy(camera.quaternion)
      g.scale.set(state.size, state.size, 1)
    })

    if (light.current) {
      light.current.position.copy(state.pos)
      light.current.intensity = state.glow * 0.9
    }
  })

  return (
    <>
      <group ref={pointer} visible={false}>
        <mesh geometry={geo.edge} position-z={-0.0005}>
          <meshBasicMaterial color="#020604" toneMapped={false} />
        </mesh>
        <mesh geometry={geo.fill}>
          <meshBasicMaterial ref={fill} color={GREEN} toneMapped={false} />
        </mesh>
      </group>
      {ghostMats.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            ghosts.current[i] = el
          }}
          geometry={geo.fill}
          material={m}
          visible={false}
        />
      ))}
      <pointLight ref={light} color="#8dffaa" intensity={0} distance={2.2} decay={2} />
    </>
  )
}
