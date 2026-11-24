import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import gsap from "gsap"

import { sound } from "./audio"
import { rig } from "./rig"
import { pullCord, reducedMotion, store, useStore } from "./store"

/**
 * After AFSLUITEN the last dot of light on the tube does not just fade:
 * it escapes from the glass as a spark, flies across the dark room, tugs the lamp cord
 * (the lamp dies), loops through the dark room and then flies straight into the camera.
 * There it flashes and becomes the blinking cursor that types the goodbye (Overlays.tsx).
 */

const TRAIL = 28
const GREEN = new THREE.Color("#9dffb6")

export function Outro() {
  const phase = useStore((s) => s.phase)
  const spark = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const light = useRef<THREE.PointLight>(null)
  const state = useMemo(() => ({ pos: new THREE.Vector3(), size: 0, glow: 0, follow: 0, toCam: 0, from: new THREE.Vector3() }), [])
  const camera = useThree((s) => s.camera)

  // Tail of the spark: its last positions as fading glow points.
  const tail = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3))
    geo.setAttribute("aAge", new THREE.BufferAttribute(Float32Array.from({ length: TRAIL }, (_, i) => i / (TRAIL - 1)), 1))
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: { uSize: { value: 0 }, uColor: { value: GREEN.clone().multiplyScalar(2.5) } },
      vertexShader: /* glsl */ `
        attribute float aAge;
        uniform float uSize;
        varying float vA;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          vA = (1.0 - aAge) * (1.0 - aAge);
          gl_PointSize = uSize * (0.35 + 0.65 * (1.0 - aAge)) * (2.0 / -mv.z) * 22.0;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * vA;
          gl_FragColor = vec4(uColor * a * 0.6, a);
        }
      `,
    })
    return { geo, mat }
  }, [])

  useEffect(() => () => {
    tail.geo.dispose()
    tail.mat.dispose()
  }, [tail])

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
    const tp = tail.geo.attributes.position.array as Float32Array
    for (let i = 0; i < TRAIL; i++) tp.set([s.x, s.y, s.z], i * 3)
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

    // 1. The dot leaves the glass.
    tl.to(state, { size: 1, glow: 1, duration: 0.25, ease: "back.out(3)" })
    tl.call(() => sound.whoosh(1.5), [], 0.05)
    tl.to(fly, { t: 1, duration: 1.5, ease: "power1.inOut", onUpdate: () => toLamp.getPoint(fly.t, state.pos) }, 0.1)
    // 2. It grabs the cord and pulls: the lamp dies.
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
    // 4. A beat of stillness, it looks at you... then comes straight at the camera.
    tl.to(state, { glow: 1.6, size: 1.3, duration: 0.45, ease: "sine.inOut", yoyo: true, repeat: 1 })
    tl.call(() => {
      state.from.copy(state.pos)
      sound.rush()
    })
    tl.to(state, { toCam: 1, duration: 0.75, ease: "power3.in" })
    tl.to(state, { size: 3, glow: 3, duration: 0.75, ease: "power3.in" }, "<")
    // 5. Impact: flash, and the spark becomes the cursor of the goodbye screen.
    tl.call(() => {
      sound.impact()
      store.set({ outro: true })
    })
    tl.to(state, { size: 0, glow: 0, duration: 0.08 })

    return () => {
      tl.kill()
    }
  }, [phase, state, tail])

  const camPoint = useMemo(() => new THREE.Vector3(), [])
  useFrame((frame) => {
    const t = frame.clock.elapsedTime
    if (state.follow > 0) state.pos.copy(rig.bead).add(new THREE.Vector3(0, -0.012, 0.012))
    if (state.toCam > 0) {
      // Just in front of the lens, so it fills the view right before the flash.
      camera.getWorldDirection(camPoint).multiplyScalar(0.12).add(camera.position)
      state.pos.lerpVectors(state.from, camPoint, state.toCam)
    }
    if (spark.current) {
      // A little jitter: it is alive.
      spark.current.position.set(state.pos.x + Math.sin(t * 23) * 0.003, state.pos.y + Math.cos(t * 19) * 0.003, state.pos.z)
      spark.current.visible = state.size > 0.001
      const pulse = 1 + Math.sin(t * 18) * 0.12
      spark.current.scale.setScalar(Math.max(0.0001, state.size * pulse))
    }
    // Shift the tail: newest position first.
    const tp = tail.geo.attributes.position.array as Float32Array
    tp.copyWithin(3, 0, (TRAIL - 1) * 3)
    tp.set([state.pos.x, state.pos.y, state.pos.z], 0)
    tail.geo.attributes.position.needsUpdate = true
    tail.mat.uniforms.uSize.value = Math.min(1, state.size)
    if (core.current) (core.current.material as THREE.MeshBasicMaterial).color.copy(GREEN).multiplyScalar(2 + state.glow * 3)
    if (light.current) {
      light.current.position.copy(state.pos)
      light.current.intensity = state.glow * 0.9
    }
  })

  return (
    <>
      <points geometry={tail.geo} material={tail.mat} frustumCulled={false} />
      <group ref={spark} visible={false}>
        <mesh ref={core}>
          <sphereGeometry args={[0.011, 16, 12]} />
          <meshBasicMaterial color={GREEN} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.026, 16, 12]} />
          <meshBasicMaterial color={GREEN} transparent opacity={0.18} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      <pointLight ref={light} color="#8dffaa" intensity={0} distance={2.2} decay={2} />
    </>
  )
}
