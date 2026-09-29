import { useRef } from "react"

import { Reveal } from "@/components/reveal"
import { SectionHeading } from "@/components/section-heading"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { education, languages } from "@/data/cv"
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"

export function Education() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        // Taalbalken lopen vol met een kleine overshoot.
        gsap.from(".lang-bars [data-slot=progress-indicator]", {
          scaleX: 0,
          transformOrigin: "left",
          duration: 1.4,
          stagger: 0.18,
          ease: "elastic.out(1, 0.5)",
          scrollTrigger: { trigger: ".lang-bars", start: "top 80%" },
        })
      })
    },
    { scope: ref },
  )

  return (
    <section ref={ref} id="opleiding" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <SectionHeading index="05" label="Opleiding & talen" title={<>School &amp;<br />talen</>} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          {education.map((e, i) => (
            <Reveal key={e.school} delay={i * 80}>
              <Card className={e.current ? "bg-main" : "bg-secondary-background"}>
                <CardContent className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs font-bold uppercase">{e.when}</p>
                    <h3 className="mt-2 font-display text-2xl leading-tight uppercase sm:text-3xl">{e.school}</h3>
                    <p className="mt-1 font-semibold">{e.what}</p>
                  </div>
                  {e.current && (
                    <Badge variant="neutral" className="font-mono text-xs uppercase">Bezig</Badge>
                  )}
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <Card className="h-full bg-secondary-background">
            <CardHeader>
              <CardTitle className="font-mono text-xs uppercase tracking-wider">Talen</CardTitle>
            </CardHeader>
            <CardContent className="lang-bars flex flex-col gap-6">
              {languages.map((l) => (
                <Progress key={l.name} value={l.value}>
                  <ProgressLabel className="font-display text-lg uppercase">{l.name}</ProgressLabel>
                  <ProgressValue className="font-mono text-xs uppercase">{() => l.level}</ProgressValue>
                </Progress>
              ))}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </section>
  )
}
