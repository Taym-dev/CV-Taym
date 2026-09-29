import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import type Lenis from "lenis"

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

// Alle animaties draaien alleen als de bezoeker geen "minder beweging" heeft ingesteld.
export const MOTION_OK = "(prefers-reduced-motion: no-preference)"
export const FINE_POINTER = "(hover: hover) and (pointer: fine)"

export const prefersMotion = () => typeof window !== "undefined" && matchMedia(MOTION_OK).matches

// Gedeelde Lenis-instantie, zodat de intro het scrollen kan pauzeren.
export const scroller: { lenis: Lenis | null } = { lenis: null }

// De hero wacht tot het intro-gordijn weg is.
let resolveIntro: () => void = () => {}
export const introDone = new Promise<void>((resolve) => {
  resolveIntro = resolve
})
export const finishIntro = () => resolveIntro()

export { gsap, ScrollTrigger, SplitText, useGSAP }

