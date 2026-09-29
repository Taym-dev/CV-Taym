import { useRef } from "react"

import { SectionHeading } from "@/components/section-heading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { tldr } from "@/data/cv"
import { accentBg } from "@/lib/accent"
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"
import { cn } from "@/lib/utils"

export function Tldr() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        // Kaarten vliegen vanuit verschillende hoeken binnen en landen met een klap.
        const from = [
          { x: -200, y: 80, rotate: -18 },
          { y: 220, rotate: 8 },
          { x: 200, y: 80, rotate: 18 },
        ]
        gsap.utils.toArray<HTMLElement>(".tldr-card").forEach((card, i) => {
          gsap.from(card, {
            ...from[i % from.length],
            opacity: 0,
            duration: 1.1,
            delay: i * 0.1,
            ease: "back.out(1.4)",
            scrollTrigger: { trigger: ".tldr-grid", start: "top 85%" },
          })
        })
        // Daarna bewegen ze elk op een eigen snelheid mee met de scroll.
        gsap.utils.toArray<HTMLElement>(".tldr-float").forEach((el, i) => {
          gsap.to(el, {
            yPercent: [-12, 6, -20][i % 3],
            ease: "none",
            scrollTrigger: { trigger: ".tldr-grid", start: "top bottom", end: "bottom top", scrub: true },
          })
        })
      })
    },
    { scope: ref },
  )

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 pt-20 pb-4 sm:px-6 md:pt-28">
      <SectionHeading index="01" label="Kort samengevat" title={<>Taym in<br />10 seconden</>} />
      <div className="tldr-grid grid gap-6 md:grid-cols-3">
        {tldr.map((item) => (
          <div key={item.label} className="tldr-float">
            <Card className="tldr-card h-full gap-4 bg-secondary-background py-0">
              <CardHeader className={cn("border-b-2 border-border py-3", accentBg[item.accent])}>
                <p className="font-mono text-xs font-bold uppercase tracking-wider">{item.label}</p>
              </CardHeader>
              <CardContent className="pb-6">
                <CardTitle className="font-display text-2xl leading-tight uppercase">{item.title}</CardTitle>
                <p className="mt-3 leading-relaxed">{item.text}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </section>
  )
}
