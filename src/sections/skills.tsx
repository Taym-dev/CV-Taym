import { useRef } from "react"

import { Reveal } from "@/components/reveal"
import { SectionHeading } from "@/components/section-heading"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { softSkills, stack } from "@/data/cv"
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"

const groupColor = ["bg-main", "bg-blue", "bg-yellow"]

export function Skills() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        // Badges vallen van boven naar binnen en stuiteren op hun plek.
        gsap.from(".skill-badge", {
          y: -260,
          rotate: () => gsap.utils.random(-60, 60),
          opacity: 0,
          duration: 1.1,
          stagger: { each: 0.05, from: "random" },
          ease: "bounce.out",
          scrollTrigger: { trigger: ".skill-groups", start: "top 80%" },
        })
        // Soft skills schuiven binnen, met een lime balk die er even overheen veegt.
        gsap.utils.toArray<HTMLElement>(".soft-row").forEach((row, i) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 90%" }, delay: i * 0.08 })
          tl.from(row, { xPercent: 25, opacity: 0, duration: 0.7, ease: "expo.out" })
            .fromTo(row.querySelector(".soft-wipe"), { scaleX: 0, transformOrigin: "left" }, { scaleX: 1, duration: 0.35, ease: "power2.in" }, "-=0.4")
            .to(row.querySelector(".soft-wipe"), { scaleX: 0, transformOrigin: "right", duration: 0.35, ease: "power2.out" })
        })
      })
    },
    { scope: ref },
  )

  return (
    <section ref={ref} id="skills" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <SectionHeading index="04" label="Skills" title={<>Waar ik<br />mee werk</>} />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Reveal>
          <Card className="h-full bg-secondary-background">
            <CardHeader>
              <CardTitle className="font-mono text-xs uppercase tracking-wider">Techniek</CardTitle>
            </CardHeader>
            <CardContent className="skill-groups flex flex-col gap-6">
              {Object.entries(stack).map(([group, items], i) => (
                <div key={group}>
                  <h3 className="mb-3 font-display text-xl uppercase">{group}</h3>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <Badge
                        key={item}
                        className={`skill-badge ${groupColor[i % groupColor.length]} px-3 py-1.5 text-sm font-semibold shadow-shadow transition-[translate,box-shadow] hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none`}
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={100}>
          <Card className="h-full gap-0 bg-secondary-background py-0">
            <CardHeader className="border-b-2 border-border py-6">
              <CardTitle className="font-mono text-xs uppercase tracking-wider">Hoe ik werk, met bewijs</CardTitle>
            </CardHeader>
            <ul>
              {softSkills.map((s) => (
                <li
                  key={s.name}
                  className="soft-row group relative overflow-hidden border-b-2 border-border px-6 py-5 transition-colors last:border-b-0 hover:bg-main"
                >
                  <span aria-hidden="true" className="soft-wipe pointer-events-none absolute inset-0 origin-left scale-x-0 bg-main" />
                  <h3 className="relative font-display text-2xl uppercase">{s.name}</h3>
                  <p className="relative mt-1 text-sm leading-relaxed">{s.proof}</p>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>
    </section>
  )
}
