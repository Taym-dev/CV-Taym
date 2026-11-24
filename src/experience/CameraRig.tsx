import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import * as THREE from "three"

import gsap from "gsap"

import { reducedMotion, useStore, type Phase } from "./store"

/**
 * Three camera positions:
 * room    wide shot of the room while the site loads
 * desk    desk, keyboard and monitor in view, START on the screen (boot and ready)
 * screen  straight at the CRT, the glass fills most of the window, a sliver of bezel around it (tour)
 * Positions are recalculated every frame so they keep fitting when the window resizes.
 */

const ROOM = { pos: new THREE.Vector3(1.55, 0.95, 2.7), look: new THREE.Vector3(0, 0.12, 0) }
const DESK_LOOK = new THREE.Vector3(0, 0.2, 0.12)
const DESK_DIR = new THREE.Vector3(0.16, 0.3, 1).normalize()

const TRANSITIONS: Partial<Record<Phase, { duration: number; ease: string }>> = {
  boot: { duration: 2.1, ease: "expo.inOut" },
  tour: { duration: 1.7, ease: "power3.inOut" },
  ready: { duration: 1.3, ease: "power2.inOut" },
}

export function CameraRig({ screenBox }: { screenBox: THREE.Box3 | null }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const phase = useStore((s) => s.phase)
  const blend = useRef({ p: 1 })
  const from = useRef({ pos: ROOM.pos.clone(), look: ROOM.look.clone() })
  const current = useRef({ pos: ROOM.pos.clone(), look: ROOM.look.clone() })
  const pointer = useRef(new THREE.Vector2())
  const sway = useRef(new THREE.Vector2())

  useEffect(() => {
    const onMove = (e: PointerEvent) => pointer.current.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1)
    addEventListener("pointermove", onMove)
    return () => removeEventListener("pointermove", onMove)
  }, [])

  // Start a new move from wherever the camera is right now.
  useEffect(() => {
    from.current.pos.copy(current.current.pos)
    from.current.look.copy(current.current.look)
    const t = TRANSITIONS[phase]
    if (!t) return
    // boot -> ready keeps the same framing: no move needed.
    if (phase === "ready" && blend.current.p === 1 && from.current.pos.distanceTo(target(phase).pos) < 0.06) return
    blend.current.p = 0
    if (reducedMotion()) {
      blend.current.p = 1
      return
    }
    const tween = gsap.to(blend.current, { p: 1, duration: t.duration, ease: t.ease })
    return () => {
      tween.kill()
    }
  }, [phase])

  const tan = () => Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
  const fit = (w: number, h: number) => Math.max(h / 2 / tan(), w / 2 / (tan() * camera.aspect))

  function target(p: Phase) {
    if (p === "loading") return ROOM
    if (p === "tour" && screenBox) {
      const center = screenBox.getCenter(new THREE.Vector3())
      return { pos: center.clone().add(new THREE.Vector3(0, 0, fit(0.31, 0.236))), look: center }
    }
    const pos = DESK_LOOK.clone().addScaledVector(DESK_DIR, fit(1.0, 0.74))
    return { pos, look: DESK_LOOK }
  }

  useFrame((_, dt) => {
    const goal = target(phase)
    const p = blend.current.p
    current.current.pos.lerpVectors(from.current.pos, goal.pos, p)
    current.current.look.lerpVectors(from.current.look, goal.look, p)

    // Small parallax from the mouse once the camera has arrived, so the room feels 3D.
    const strength = reducedMotion() ? 0 : phase === "tour" ? 0.012 : phase === "loading" ? 0.05 : 0.04
    sway.current.lerp(pointer.current, 1 - Math.exp(-dt * 2.5))
    camera.position.copy(current.current.pos)
    camera.position.x += sway.current.x * strength * p
    camera.position.y -= sway.current.y * strength * 0.6 * p
    camera.lookAt(current.current.look)
  })

  return null
}
