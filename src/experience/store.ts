import { useSyncExternalStore } from "react"

import gsap from "gsap"

import { sound } from "./audio"

/**
 * Flow of the site:
 * loading  assets download, camera waits in the room
 * boot     camera has zoomed to the desk, the screen powers on and runs portfolio_Taym.exe
 * ready    the big START button is on the screen
 * tour     camera looks straight at the screen, the CV plays like a video
 */
export type Phase = "loading" | "boot" | "ready" | "tour"

type State = {
  phase: Phase
  slide: number
  paused: boolean
  muted: boolean
  textVersion: boolean
}

const readMuted = () => {
  try {
    return localStorage.getItem("muted") === "1"
  } catch {
    return false
  }
}

let state: State = { phase: "loading", slide: 0, paused: false, muted: readMuted(), textVersion: false }
const listeners = new Set<() => void>()

export const store = {
  get: () => state,
  set(patch: Partial<State>) {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => select(store.get()))
}

/** Values read every frame by shaders and effects. Not React state on purpose. */
export const fx = {
  glitch: 0,
  power: 0,
  /** Time (seconds, performance clock) when each phase started. */
  phaseAt: 0,
  slideAt: 0,
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  ;(window as unknown as { __cv: unknown }).__cv = { store, fx, gsap }
}

export const reducedMotion =() => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches

export function setPhase(phase: Phase) {
  fx.phaseAt = performance.now() / 1000
  store.set({ phase })
}

/** Short burst of picture distortion, with sound when audio is on. */
export function glitch(strength = 1, duration = 0.45, volume = 1) {
  if (reducedMotion()) strength *= 0.25
  gsap.killTweensOf(fx, "glitch")
  gsap.timeline()
    .to(fx, { glitch: strength, duration: 0.04, ease: "none" })
    .to(fx, { glitch: strength * 0.35, duration: duration * 0.4, ease: "steps(3)" })
    .to(fx, { glitch: 0, duration: duration * 0.6, ease: "power2.out" })
  sound.glitch(duration, volume)
}

export const SLIDE_COUNT = 6

export function goToSlide(index: number) {
  const slide = Math.max(0, Math.min(SLIDE_COUNT - 1, index))
  if (slide === store.get().slide) return
  glitch(0.7, 0.35)
  fx.slideAt = performance.now() / 1000
  store.set({ slide, paused: false })
  sound.beep()
}

export function startTour() {
  if (store.get().phase !== "ready") return
  sound.unlock()
  sound.start()
  glitch(1.2, 0.7)
  fx.slideAt = performance.now() / 1000 + 1.4
  store.set({ slide: 0, paused: false })
  setPhase("tour")
}

export function leaveTour() {
  if (store.get().phase !== "tour") return
  glitch(0.8, 0.4)
  setPhase("ready")
}

export function toggleMuted() {
  const muted = !store.get().muted
  try {
    localStorage.setItem("muted", muted ? "1" : "0")
  } catch {
    // Private mode: the choice just won't be remembered.
  }
  sound.unlock()
  sound.setMuted(muted)
  store.set({ muted })
}
