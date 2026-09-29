import { useRef, type ReactNode } from "react"

import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"

// Laat een blok met een stevige klap binnenkomen zodra het in beeld scrolt.
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: "div" | "span"
}) {
  const ref = useRef<HTMLDivElement & HTMLSpanElement>(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.from(ref.current, {
        y: 70,
        rotate: 2.5,
        opacity: 0,
        duration: 0.9,
        delay: delay / 1000,
        ease: "back.out(1.6)",
        scrollTrigger: { trigger: ref.current, start: "top 88%" },
      })
    })
  })

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
