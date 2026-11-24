import { useSyncExternalStore } from "react"

import gsap from "gsap"

import { sound } from "./audio"

/**
 * Flow of the site:
 * loading  assets download, camera waits in the dark room
 * lamp     camera flies to the desk, the cord of the desk lamp is pulled and it flickers on
 * boot     camera is at the desk, the screen powers on and runs portfolio_Taym.exe
 * ready    the big START button is on the screen
 * tour     camera looks straight at the screen, the visitor flips through the CV slides
 * off      the visitor quit: the tube collapses, a spark escapes, turns the lamp off and flies into the camera
 */
export type Phase = "loading" | "lamp" | "boot" | "ready" | "tour" | "off"

type State = {
  phase: Phase
  slide: number
  muted: boolean
  textVersion: boolean
  /** True once the visitor has moved to another slide, hides the "how to navigate" hint. */
  navigated: boolean
  /** The goodbye screen after quitting. */
  outro: boolean
}

const readMuted = () => {
  try {
    return localStorage.getItem("muted") === "1"
  } catch {
    return false
  }
}

let state: State = { phase: "loading", slide: 0, muted: readMuted(), textVersion: false, navigated: false, outro: false }
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
  /** CRT switch off: 0 picture, 0.5 a bright line, 1 a fading dot. */
  off: 0,
  /** Desk lamp, 0 off to 1 on. Lights add their own flicker on top. */
  lamp: 0,
  /** Lamp brightness this frame, flicker included. Set by Lights, read by the bulb. */
  lampLit: 0,
  /** Lamp cord: how far it is pulled down (0..1) and how much it still swings. */
  cord: 0,
  swing: 0,
  /** Time (seconds, performance clock) when each phase started. */
  phaseAt: 0,
  slideAt: 0,
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  ;(window as unknown as { __cv: unknown }).__cv = { store, fx, gsap }
}

export const reducedMotion = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
export const isTouch = () => typeof window !== "undefined" && matchMedia("(pointer: coarse)").matches

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

/**
 * Pull the lamp cord: it goes down, springs back and swings a little.
 * The lamp itself flickers on (or dies) a moment later, like an old bulb.
 */
export function pullCord(on: boolean) {
  const quick = reducedMotion()
  const tl = gsap.timeline()
  tl.to(fx, { cord: 1, duration: quick ? 0.01 : 0.22, ease: "power2.in" })
  tl.call(() => sound.cord())
  tl.to(fx, { cord: 0, duration: quick ? 0.01 : 0.9, ease: "elastic.out(1, 0.35)" })
  tl.fromTo(fx, { swing: 1 }, { swing: 0, duration: quick ? 0.01 : 2.6, ease: "power2.out" }, "<")
  const flicker = on ? [0.55, 0.05, 0.8, 0.15, 0.95, 0.4, 1] : [0.35, 0.8, 0.1, 0.45, 0]
  const lamp = gsap.timeline()
  flicker.forEach((v, i) => lamp.to(fx, { lamp: v, duration: quick ? 0.01 : 0.03 + Math.random() * 0.07, ease: "none", delay: quick ? 0 : i === 0 ? 0 : Math.random() * 0.08 }))
  if (on) lamp.call(() => sound.buzz(), [], 0)
  tl.add(lamp, quick ? 0 : 0.24)
  return tl
}

/** Lamp on, then the camera flies to the desk and the computer boots. Used at start and after a restart. */
export function startUp() {
  const quick = reducedMotion()
  gsap.killTweensOf(fx, "power,off")
  fx.power = 0
  fx.off = 0
  store.set({ slide: 0, navigated: false, outro: false })
  setPhase("lamp")
  // The camera flies to the desk; on the way the lamp cord is pulled.
  gsap.delayedCall(quick ? 0 : 0.9, () => pullCord(true))
  gsap.delayedCall(quick ? 0.05 : 2.0, () => {
    setPhase("boot")
    glitch(0.6, 0.35, 0)
    gsap.fromTo(fx, { power: 0 }, { power: 1, duration: quick ? 0.01 : 1.1, delay: quick ? 0 : 0.5, ease: "power2.out" })
  })
}

export const SLIDE_COUNT = 6

export function goToSlide(index: number) {
  const slide = Math.max(0, Math.min(SLIDE_COUNT - 1, index))
  if (slide === store.get().slide) return
  glitch(0.7, 0.35)
  fx.slideAt = performance.now() / 1000
  store.set({ slide, navigated: true })
  sound.beep()
}

export function startTour() {
  if (store.get().phase !== "ready") return
  sound.unlock()
  sound.start()
  glitch(1.2, 0.7)
  fx.slideAt = performance.now() / 1000 + 1.4
  store.set({ slide: 0 })
  setPhase("tour")
}

export function leaveTour() {
  if (store.get().phase !== "tour") return
  glitch(0.8, 0.4)
  setPhase("ready")
}

/** Watch again from the first slide. */
export function replay() {
  if (store.get().phase !== "tour") return
  glitch(1, 0.5)
  fx.slideAt = performance.now() / 1000
  store.set({ slide: 0 })
  sound.beep()
}

/** Quit. A mouse pointer comes in and clicks the screen off: see Outro.tsx. */
export function quit() {
  if (store.get().phase !== "tour") return
  sound.unlock()
  fx.off = 0
  setPhase("off")
  if (reducedMotion()) screenOff()
}

/** The tube collapses into a dot. Called by the pointer's click. */
export function screenOff() {
  sound.powerOff()
  glitch(0.9, 0.3, 0.6)
  gsap.to(fx, { off: 1, duration: reducedMotion() ? 0.01 : 0.75, ease: "power2.in" })
}

/** Restart from the goodbye screen. */
export function restart() {
  if (store.get().phase !== "off") return
  sound.unlock()
  startUp()
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
