import { useRef, type ReactNode } from "react"

import { gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/gsap"

export function SectionHeading({
  index,
  label,
  title,
  aside,
  dark = false,
}: {
  index: string
  label: string
  title: ReactNode
  aside?: ReactNode
  dark?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const split = SplitText.create(".heading-title", { type: "lines,chars", mask: "lines" })
        const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: "top 80%" } })
        tl.from(".heading-label", { clipPath: "inset(0 100% 0 0)", duration: 0.6, ease: "expo.out" })
          .from(split.chars, { yPercent: 115, rotate: 12, duration: 0.8, stagger: 0.022, ease: "expo.out" }, "-=0.35")
          .from(".heading-aside", { y: 30, opacity: 0, duration: 0.6, ease: "power3.out" }, "-=0.6")
        return () => split.revert()
      })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14">
      <div>
        <p
          className={`heading-label mb-4 inline-flex items-center gap-2 border-2 px-2 py-1 font-mono text-xs uppercase tracking-wider ${dark ? "border-main bg-main text-foreground" : "border-border bg-foreground text-background"}`}
        >
          <span className={dark ? "" : "text-main"}>{index}</span>
          {label}
        </p>
        <h2 className="heading-title font-display text-4xl leading-[0.95] uppercase sm:text-5xl md:text-6xl">{title}</h2>
      </div>
      {aside && <div className="heading-aside">{aside}</div>}
    </div>
  )
}
