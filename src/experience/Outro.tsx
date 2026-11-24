import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import gsap from "gsap"

import { sound } from "./audio"
import { rig } from "./rig"
import { pullCord, reducedMotion, screenOff, store, useStore } from "./store"

/**
 * After AFSLUITEN a glowing mouse pointer appears.
 * It slides over the glass and clicks the screen off, then glides in one smooth path past the lamp cord (which it
 * tugs on the way, the lamp dies) and then to the middle of the view, where it fades
 * into the blinking text cursor that types the goodbye (Overlays.tsx).
 */

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
  const state = useMemo(() => ({ pos: new THREE.Vector3(), size: 0, glow: 0, t: 0, a: 0, stage: 0, press: 0, tilt: 0 }), [])
  const camera = useThree((s) => s.camera)
  const geo = useMemo(() => ({ fill: arrowGeometry(0), edge: arrowGeometry(0.22) }), [])
  const path = useRef<THREE.CatmullRomCurve3 | null>(null)
  const approach = useRef<THREE.CatmullRomCurve3 | null>(null)

  useEffect(() => () => {
    geo.fill.dispose()
    geo.edge.dispose()
  }, [geo])

  // The choreography. Runs once each time the phase becomes "off".
  useEffect(() => {
    if (phase !== "off") {
      state.size = 0
      state.glow = 0
      state.t = 0
      path.current = null
      approach.current = null
      state.stage = 0
      state.press = 0
      return
    }
    const quick = reducedMotion()
    const tl = gsap.timeline({ delay: quick ? 0.75 : 0.15 })
    if (quick) {
      tl.call(() => pullCord(false))
      tl.call(() => store.set({ outro: true }), [], 0.3)
      return () => {
        tl.kill()
      }
    }

    const s = rig.screen.clone()
    const b = rig.bead.clone()
    const at = (p: THREE.Vector3, x: number, y: number, z: number) => p.clone().add(new THREE.Vector3(x, y, z))
    // First the pointer slides in over the glass to the lower right corner and clicks.
    const click = at(s, 0.08, -0.065, 0.012)
    approach.current = new THREE.CatmullRomCurve3([at(s, 0.2, -0.2, 0.08), at(s, 0.13, -0.1, 0.04), click], false, "centripetal")
    // Then one continuous curve: off the glass, over to the cord, brushing past the bead,
    // then an easy arc out into the room. The last stretch blends towards the camera.
    path.current = new THREE.CatmullRomCurve3(
      [click, at(click, -0.02, 0.04, 0.16), at(s, -0.2, 0.2, 0.3), at(b, 0.06, 0.05, 0.08), at(b, 0.0, -0.01, 0.015), at(b, 0.1, -0.08, 0.18), new THREE.Vector3(0.15, 0.32, 0.75)],
      false,
      "centripetal",
    )
    state.stage = 0
    state.a = 0
    state.t = 0
    approach.current.getPointAt(0, state.pos)
    const CORD_AT = 0.5
    const FLY = 2.8

    tl.to(state, { size: 0.6, glow: 0.6, duration: 0.25, ease: "power2.out" })
    tl.to(state, { a: 1, duration: 0.6, ease: "power2.out" }, 0)
    // Click: the screen goes off.
    tl.call(() => sound.mouseClick())
    tl.to(state, { press: 1, duration: 0.07, yoyo: true, repeat: 1 })
    tl.call(() => screenOff(), [], "<")
    tl.to({}, { duration: 0.5 })
    // Off it goes, past the lamp cord, to the middle of the view.
    tl.call(() => {
      state.stage = 1
      sound.whoosh(FLY * 0.8)
    })
    const start = tl.duration()
    tl.to(state, { glow: 1, size: 1, duration: 0.5, ease: "sine.out" }, start)
    tl.to(state, { t: 1, duration: FLY, ease: "sine.inOut" }, start)
    tl.call(() => pullCord(false), [], start + FLY * easeInverse(CORD_AT))
    // Arrived: it dissolves into the typing cursor.
    tl.call(() => {
      sound.chime()
      store.set({ outro: true })
    }, [], start + FLY)
    tl.to(state, { size: 0.6, glow: 0, duration: 0.4, ease: "power2.in" }, start + FLY)
    tl.to(state, { size: 0, duration: 0.01 })

    return () => {
      tl.kill()
    }
  }, [phase, state])

  const camPoint = useMemo(() => new THREE.Vector3(), [])
  const onCurve = useMemo(() => new THREE.Vector3(), [])
  const tangent = useMemo(() => new THREE.Vector3(), [])
  useFrame((_, dt) => {
    if (state.stage === 0 && approach.current) {
      approach.current.getPointAt(state.a, state.pos)
    } else if (path.current) {
      path.current.getPointAt(state.t, onCurve)
      // Ease into a spot a little in front of the camera, centred, so it ends right where the text starts.
      camera.getWorldDirection(camPoint).multiplyScalar(0.45).add(camera.position)
      const k = THREE.MathUtils.smoothstep(state.t, 0.72, 1)
      state.pos.lerpVectors(onCurve, camPoint, k)
      // Lean a little into the direction of travel, like a hand moving a mouse.
      path.current.getTangentAt(Math.min(0.999, state.t), tangent)
      const lean = THREE.MathUtils.clamp(-tangent.x * 0.35, -0.3, 0.3) * (1 - k)
      state.tilt += (lean - state.tilt) * (1 - Math.exp(-dt * 4))
    }
    const visible = state.size > 0.001
    if (pointer.current) {
      pointer.current.position.copy(state.pos)
      pointer.current.quaternion.copy(camera.quaternion)
      pointer.current.rotateZ(state.tilt)
      pointer.current.visible = visible
      pointer.current.scale.set(state.size * (1 - state.press * 0.18), state.size * (1 - state.press * 0.18), 1)
    }
    if (fill.current) fill.current.color.copy(GREEN).multiplyScalar(1.4 + state.glow * 1.6)
    if (light.current) {
      light.current.position.copy(state.pos)
      light.current.intensity = state.glow * 0.8
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
      <pointLight ref={light} color="#8dffaa" intensity={0} distance={2.2} decay={2} />
    </>
  )
}

/** Inverse of sine.inOut: at what share of the tween the eased value reaches v. */
function easeInverse(v: number) {
  return Math.acos(1 - 2 * v) / Math.PI
}
