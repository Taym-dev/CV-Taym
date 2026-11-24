import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import gsap from "gsap"

import { sound } from "./audio"
import { rig } from "./rig"
import { pullCord, reducedMotion, store, useStore } from "./store"

/**
 * After AFSLUITEN the last dot of light on the tube does not just fade:
 * it escapes from the glass as a spark, flies across the dark room, tugs the lamp cord
 * (the lamp dies), loops back and bursts into glowing dust in front of the camera.
 */

const PARTICLES = 520
const TRAIL = 28
const GREEN = new THREE.Color("#9dffb6")

/** Where the spark bursts: a bit in front of the desk, roughly where the camera looks. */
const BURST_AT = new THREE.Vector3(0.05, 0.42, 0.75)

export function Outro() {
  const phase = useStore((s) => s.phase)
  const spark = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const light = useRef<THREE.PointLight>(null)
  const points = useRef<THREE.Points>(null)
  const state = useMemo(() => ({ pos: new THREE.Vector3(), size: 0, glow: 0, burstAt: -1, follow: 0 }), [])

  const dust = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PARTICLES * 3), 3))
    geo.setAttribute("aSeed", new THREE.BufferAttribute(Float32Array.from({ length: PARTICLES }, () => Math.random()), 1))
    const vel = new Float32Array(PARTICLES * 3)
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: { uFade: { value: 0 }, uTime: { value: 0 }, uColor: { value: GREEN.clone().multiplyScalar(2.2) } },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime;
        varying float vTwinkle;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          vTwinkle = 0.55 + 0.45 * sin(uTime * (3.0 + aSeed * 6.0) + aSeed * 40.0);
          gl_PointSize = (1.5 + aSeed * 3.5) * (2.0 / -mv.z) * 6.0;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uFade;
        uniform vec3 uColor;
        varying float vTwinkle;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(uColor * a * vTwinkle * uFade, a * uFade);
        }
      `,
    })
    return { geo, vel, mat }
  }, [])

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
    dust.geo.dispose()
    dust.mat.dispose()
    tail.geo.dispose()
    tail.mat.dispose()
  }, [dust, tail])

  // The choreography. Runs once each time the phase becomes "off".
  useEffect(() => {
    if (phase !== "off") {
      state.size = 0
      state.glow = 0
      state.burstAt = -1
      dust.mat.uniforms.uFade.value = 0
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
    tl.call(() => {
      const from = state.pos.clone()
      const loop = new THREE.CatmullRomCurve3([from, near(from, 0.25, 0.15, 0.2), new THREE.Vector3(0.75, 0.75, 0.2), new THREE.Vector3(0.6, 0.3, 0.9), BURST_AT.clone()])
      const back = { t: 0 }
      sound.whoosh(1.9)
      gsap.to(back, { t: 1, duration: 2, ease: "power2.inOut", onUpdate: () => loop.getPoint(back.t, state.pos) })
    })
    // 4. Charge up and burst.
    tl.to(state, { size: 1.8, glow: 2.2, duration: 0.5, ease: "power2.in" }, "+=1.6")
    tl.call(() => {
      burst(dust, state.pos)
      state.burstAt = performance.now() / 1000
      sound.burst()
    })
    tl.to(state, { size: 0, duration: 0.12, ease: "power3.in" }, "<")
    tl.to(state, { glow: 4, duration: 0.05 }, "<")
    tl.to(state, { glow: 0, duration: 1.6, ease: "power2.out" })
    tl.call(() => store.set({ outro: true }), [], "-=1.3")

    return () => {
      tl.kill()
    }
  }, [phase, state, dust, tail])

  useFrame((frame, dt) => {
    const t = frame.clock.elapsedTime
    if (state.follow > 0) state.pos.copy(rig.bead).add(new THREE.Vector3(0, -0.012, 0.012))
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

    // Dust: drifts outward, slows down, sinks a little and keeps twinkling.
    if (state.burstAt < 0) return
    const age = performance.now() / 1000 - state.burstAt
    dust.mat.uniforms.uTime.value = t
    dust.mat.uniforms.uFade.value = Math.min(1, age * 8) * (0.35 + 0.65 * Math.exp(-age * 0.6))
    const pos = dust.geo.attributes.position.array as Float32Array
    const drag = Math.exp(-dt * 1.8)
    for (let i = 0; i < PARTICLES; i++) {
      const k = i * 3
      dust.vel[k] *= drag
      dust.vel[k + 1] = dust.vel[k + 1] * drag - dt * 0.012
      dust.vel[k + 2] *= drag
      pos[k] += dust.vel[k] * dt + Math.sin(t * 0.7 + i) * 0.0004
      pos[k + 1] += dust.vel[k + 1] * dt
      pos[k + 2] += dust.vel[k + 2] * dt
    }
    dust.geo.attributes.position.needsUpdate = true
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
      <points ref={points} geometry={dust.geo} material={dust.mat} frustumCulled={false} />
    </>
  )
}

/** Put every particle at the burst point with a random outward speed. */
function burst(dust: { geo: THREE.BufferGeometry; vel: Float32Array }, at: THREE.Vector3) {
  const pos = dust.geo.attributes.position.array as Float32Array
  const dir = new THREE.Vector3()
  for (let i = 0; i < PARTICLES; i++) {
    dir.randomDirection()
    const speed = 0.25 + Math.random() ** 2 * 1.4
    pos.set([at.x, at.y, at.z], i * 3)
    dust.vel.set([dir.x * speed, dir.y * speed * 0.8 + 0.08, dir.z * speed * 0.6], i * 3)
  }
  dust.geo.attributes.position.needsUpdate = true
}
