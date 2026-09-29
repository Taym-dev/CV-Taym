import { useRef, useState } from "react"

import { finishIntro, gsap, MOTION_OK, scroller, SplitText, useGSAP } from "@/lib/gsap"

// Kort openingsgordijn: naam stempelt in, daarna schuiven vier gekleurde panelen weg.
export function Intro() {
  const ref = useRef<HTMLDivElement>(null)
  const [done, setDone] = useState(false)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        scrollTo(0, 0)
        scroller.lenis?.stop()
        const split = SplitText.create(".intro-name", { type: "chars" })
        const tl = gsap.timeline({
          onComplete: () => {
            scroller.lenis?.start()
            setDone(true)
          },
        })
        tl.from(split.chars, {
          scale: 3,
          opacity: 0,
          rotate: () => gsap.utils.random(-25, 25),
          duration: 0.5,
          stagger: 0.07,
          ease: "back.out(2)",
        })
          .from(".intro-sub", { yPercent: 100, opacity: 0, duration: 0.35, ease: "power3.out" }, "-=0.2")
          .to(".intro-panel", {
            yPercent: -100,
            duration: 0.85,
            stagger: 0.09,
            ease: "expo.inOut",
            onStart: finishIntro,
          }, "+=0.25")
      })
      mm.add("(prefers-reduced-motion: reduce)", () => {
        finishIntro()
        setDone(true)
      })
    },
    { scope: ref },
  )

  if (done) return null

  return (
    <div ref={ref} aria-hidden="true" className="fixed inset-0 z-[100] overflow-hidden">
      <div className="intro-panel absolute inset-0 bg-yellow" />
      <div className="intro-panel absolute inset-0 bg-blue" />
      <div className="intro-panel absolute inset-0 bg-main" />
      <div className="intro-panel absolute inset-0 flex flex-col items-center justify-center bg-foreground text-background">
        <p className="intro-name font-display text-[clamp(4rem,18vw,14rem)] leading-none text-main uppercase">Taym</p>
        <div className="overflow-hidden">
          <p className="intro-sub font-mono text-sm tracking-widest uppercase">Software Developer ✱ Dordrecht</p>
        </div>
      </div>
    </div>
  )
}
