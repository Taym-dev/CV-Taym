import { useGLTF } from "@react-three/drei"
import { useFrame, type ThreeEvent } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import * as THREE from "three"

import { createCrtMaterial } from "./crt/crtMaterial"
import { ScreenCanvas } from "./crt/ScreenCanvas"
import { fx, goToSlide, store } from "./store"

export const MODEL_URL = `${import.meta.env.BASE_URL}models/retro-computer.glb`

export function Computer({ onScreen }: { onScreen: (box: THREE.Box3) => void }) {
  const { scene } = useGLTF(MODEL_URL)
  const screen = useMemo(() => {
    const s = new ScreenCanvas()
    if (import.meta.env.DEV) Object.assign((window as unknown as { __cv: object }).__cv ?? {}, { screen: s })
    return s
  }, [])
  const material = useMemo(() => createCrtMaterial(screen.texture), [screen])

  const screenMesh = useMemo(() => {
    let found: THREE.Mesh | null = null
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      if (o.name === "Screen") {
        found = mesh
        return
      }
      mesh.castShadow = true
      mesh.receiveShadow = true
      const mat = mesh.material as THREE.MeshStandardMaterial
      // LEDs: keep them out of tone mapping so they glow through bloom.
      if (mat.emissive && mat.emissive.getHex() !== 0) {
        mat.toneMapped = false
        mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 3)
      }
    })
    if (!found) throw new Error("Screen mesh missing in retro-computer.glb")
    const m = found as THREE.Mesh
    m.material = material
    return m
  }, [scene, material])

  useEffect(() => {
    scene.updateMatrixWorld(true)
    onScreen(new THREE.Box3().setFromObject(screenMesh))
  }, [scene, screenMesh, onScreen])

  useEffect(() => () => {
    document.body.style.cursor = ""
  }, [])

  useFrame((state, dt) => {
    screen.update(performance.now() / 1000, Math.min(dt, 0.1))
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uGlitch.value = fx.glitch
    material.uniforms.uPower.value = fx.power
  })

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (e.object !== screenMesh || !e.uv) return
    const hot = screen.hover(e.uv.x, e.uv.y) || store.get().phase === "tour"
    document.body.style.cursor = hot ? "pointer" : ""
  }

  const onOut = () => {
    screen.leave()
    document.body.style.cursor = ""
  }

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.object !== screenMesh || !e.uv) return
    e.stopPropagation()
    if (screen.click(e.uv.x, e.uv.y)) return
    // Anywhere else on the screen during the tour: next slide.
    const { phase, slide } = store.get()
    if (phase === "tour") goToSlide(slide + 1)
  }

  return <primitive object={scene} onPointerMove={onMove} onPointerOut={onOut} onClick={onClick} />
}

useGLTF.preload(MODEL_URL)
