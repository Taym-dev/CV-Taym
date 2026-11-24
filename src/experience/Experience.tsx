import { Environment, useProgress } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import type * as THREE from "three"

import { CameraRig } from "./CameraRig"
import { Computer } from "./Computer"
import { Effects } from "./Effects"
import { Hud } from "./Hud"
import { Lights } from "./Lights"
import { Outro } from "./Outro"
import { Overlays } from "./Overlays"
import { Room } from "./Room"
import { glitch, goToSlide, isTouch, leaveTour, reducedMotion, restart, startTour, startUp, store, useStore } from "./store"
import { TextVersion } from "./TextVersion"

const HDRI = `${import.meta.env.BASE_URL}hdri/studio.hdr`

export function Experience() {
  const [screenBox, setScreenBox] = useState<THREE.Box3 | null>(null)
  const onScreen = useCallback((box: THREE.Box3) => setScreenBox(box), [])

  const touch = useMemo(() => isTouch(), [])

  useBoot()
  useControls()
  useAmbientGlitches()
  useTabTitle()

  return (
    <div className="fixed inset-0 bg-[#030403]">
      <Canvas
        flat
        shadows
        dpr={touch ? [1, 1.5] : [1, 1.75]}
        camera={{ fov: 35, near: 0.01, far: 30, position: [1.55, 0.95, 2.7] }}
        gl={{ powerPreference: "high-performance", antialias: false }}
        aria-hidden="true"
      >
        <color attach="background" args={["#030403"]} />
        <fog attach="fog" args={["#030403", 2.6, 7.5]} />
        <Suspense fallback={null}>
          <Room />
          <Computer onScreen={onScreen} />
          <Lights screenBox={screenBox} />
          <Environment files={HDRI} environmentIntensity={0.14} />
          <Outro />
          <Effects multisampling={touch ? 0 : 4} />
        </Suspense>
        <CameraRig screenBox={screenBox} />
      </Canvas>
      <Loader />
      <Hud />
      <Overlays />
      <TextVersion />
    </div>
  )
}

/** When everything has loaded: pull the lamp cord, zoom in to the desk and switch the monitor on. */
function useBoot() {
  const { active, progress } = useProgress()
  const phase = useStore((s) => s.phase)

  useEffect(() => {
    if (phase !== "loading" || active || progress < 100) return
    let cancelled = false
    const fonts = document.fonts?.load('64px "VT323"').catch(() => undefined) ?? Promise.resolve()
    // A short moment in the dark room first, after the loader has faded.
    void Promise.all([fonts, new Promise((r) => setTimeout(r, 400))]).then(() => {
      if (cancelled) return
      startUp()
    })
    return () => {
      cancelled = true
    }
  }, [phase, active, progress])
}

/** Keyboard, mouse wheel and swipe. */
function useControls() {
  useEffect(() => {
    let lastWheel = 0
    let touchX = 0
    let touchY = 0

    const onKey = (e: KeyboardEvent) => {
      const { phase, slide, textVersion } = store.get()
      if (textVersion || e.target instanceof HTMLButtonElement) return
      if (phase === "ready" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        startTour()
      } else if (phase === "off" && store.get().outro && e.key === "Enter") {
        restart()
      } else if (phase === "tour") {
        if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) goToSlide(slide + 1)
        else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) goToSlide(slide - 1)
        else if (e.key === "Home") goToSlide(0)
        else if (e.key === "End") goToSlide(Infinity)
        else if (e.key === "Escape") leaveTour()
        else return
        e.preventDefault()
      }
    }

    const onWheel = (e: WheelEvent) => {
      const { phase, slide, textVersion } = store.get()
      if (textVersion) return
      const now = performance.now()
      if (now - lastWheel < 900 || Math.abs(e.deltaY) < 12) return
      lastWheel = now
      if (phase === "ready" && e.deltaY > 0) startTour()
      else if (phase === "tour") goToSlide(slide + (e.deltaY > 0 ? 1 : -1))
    }

    const onTouchStart = (e: TouchEvent) => {
      touchX = e.touches[0].clientX
      touchY = e.touches[0].clientY
    }
    const onTouchEnd = (e: TouchEvent) => {
      const { phase, slide, textVersion } = store.get()
      if (textVersion || phase !== "tour") return
      const dx = e.changedTouches[0].clientX - touchX
      const dy = e.changedTouches[0].clientY - touchY
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) goToSlide(slide + (dx < 0 ? 1 : -1))
      else if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.5) goToSlide(slide + (dy < 0 ? 1 : -1))
    }

    addEventListener("keydown", onKey)
    addEventListener("wheel", onWheel, { passive: true })
    addEventListener("touchstart", onTouchStart, { passive: true })
    addEventListener("touchend", onTouchEnd, { passive: true })
    return () => {
      removeEventListener("keydown", onKey)
      removeEventListener("wheel", onWheel)
      removeEventListener("touchstart", onTouchStart)
      removeEventListener("touchend", onTouchEnd)
    }
  }, [])
}

/** Now and then the picture crackles, like an old tube. */
function useAmbientGlitches() {
  useEffect(() => {
    if (reducedMotion()) return
    let timer = 0
    const schedule = () => {
      timer = window.setTimeout(() => {
        const { phase, textVersion } = store.get()
        if ((phase === "ready" || phase === "tour") && !textVersion) glitch(0.3 + Math.random() * 0.25, 0.22, 0.35)
        schedule()
      }, 7000 + Math.random() * 8000)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [])
}

/** The browser tab calls you back when you switch away. */
function useTabTitle() {
  useEffect(() => {
    const original = document.title
    const onChange = () => {
      document.title = document.hidden ? "▌ het scherm wacht op je…" : original
    }
    document.addEventListener("visibilitychange", onChange)
    return () => {
      document.removeEventListener("visibilitychange", onChange)
      document.title = original
    }
  }, [])
}

function Loader() {
  const { progress } = useProgress()
  const phase = useStore((s) => s.phase)
  const done = phase !== "loading"
  const cells = 20
  const filled = Math.round((progress / 100) * cells)
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-center bg-[#030403] font-[VT323] text-[#7fe39a] transition-opacity duration-700 ${done ? "opacity-0" : "opacity-100"}`}
      role="status"
      aria-live="polite"
    >
      <p className="text-2xl tracking-wide">kamer laden</p>
      <p className="mt-3 text-3xl tracking-[0.2em] text-[#c8ffd2]" aria-hidden="true">
        {"█".repeat(filled)}
        <span className="text-[#163d24]">{"█".repeat(cells - filled)}</span>
      </p>
      <p className="mt-2 text-xl text-[#3d9a5a]">{Math.round(progress)}%</p>
    </div>
  )
}
