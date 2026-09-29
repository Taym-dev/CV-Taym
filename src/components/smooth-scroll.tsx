import Lenis from "lenis"
import { useLayoutEffect } from "react"

import { gsap, prefersMotion, ScrollTrigger, scroller } from "@/lib/gsap"

// Boterzacht scrollen met Lenis, gekoppeld aan de GSAP-klok zodat ScrollTrigger synchroon loopt.
export function SmoothScroll() {
  useLayoutEffect(() => {
    history.scrollRestoration = "manual"
    if (!prefersMotion()) return

    const lenis = new Lenis({ lerp: 0.09, anchors: { offset: -72 } })
    scroller.lenis = lenis
    lenis.on("scroll", ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      scroller.lenis = null
    }
  }, [])

  return null
}
