import { ArrowUpRight } from "lucide-react"
import { useRef } from "react"

import { GithubIcon } from "@/components/icons"
import { SectionHeading } from "@/components/section-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { profile, projects } from "@/data/cv"
import { accentBg } from "@/lib/accent"
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"
import { useMagnetic } from "@/lib/use-magnetic"
import { cn } from "@/lib/utils"

export function Projects() {
  const ref = useRef<HTMLElement>(null)
  useMagnetic(ref)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const slots = gsap.utils.toArray<HTMLElement>(".project-slot")
        const cards = gsap.utils.toArray<HTMLElement>(".project-card")

        cards.forEach((card, i) => {
          // Binnenkomst: kaart zwaait omhoog, groot nummer schuift in.
          gsap.from(card, {
            y: 160,
            rotate: i % 2 ? -6 : 6,
            duration: 1,
            ease: "expo.out",
            scrollTrigger: { trigger: slots[i], start: "top 90%" },
          })
          gsap.from(card.querySelector(".project-num"), {
            xPercent: -120,
            opacity: 0,
            duration: 1,
            ease: "expo.out",
            scrollTrigger: { trigger: slots[i], start: "top 75%" },
          })

          // Stapelen: zodra de volgende kaart eroverheen schuift, krimpt en kantelt deze weg.
          const next = slots[i + 1]
          if (!next) return
          gsap.to(card, {
            scale: 0.88,
            rotate: i % 2 ? 3 : -3,
            filter: "brightness(0.8)",
            ease: "none",
            scrollTrigger: { trigger: next, start: "top bottom", end: "top 25%", scrub: true },
          })
        })
      })
    },
    { scope: ref },
  )

  return (
    <section ref={ref} id="projecten" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <SectionHeading
        index="02"
        label="Projecten"
        title={<>Wat ik<br />gebouwd heb</>}
        aside={
          <span data-magnetic className="inline-block">
            <Button variant="neutral" nativeButton={false} render={<a href={profile.github} target="_blank" rel="noreferrer" />}>
              <GithubIcon /> Alles op GitHub
            </Button>
          </span>
        }
      />

      <div className="pb-[10vh]">
        {projects.map((p, i) => (
          <div
            key={p.title}
            className="project-slot sticky mb-[12vh] last:mb-0"
            style={{ top: `calc(6rem + ${i * 1.5}rem)` }}
          >
            <Card
              data-cursor={p.link ? "Bekijk" : p.role}
              className="project-card origin-top gap-0 overflow-hidden bg-secondary-background py-0 shadow-[8px_8px_0_0_var(--border)] md:grid md:min-h-[380px] md:grid-cols-[0.9fr_1.1fr]"
            >
              <div className={cn("relative flex flex-col justify-between gap-6 overflow-hidden border-b-2 border-border p-6 sm:p-8 md:border-r-2 md:border-b-0", accentBg[p.accent])}>
                <span
                  aria-hidden="true"
                  className="project-num block font-display text-7xl leading-none text-transparent [-webkit-text-stroke:2px_var(--border)] sm:text-8xl"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-4xl leading-[0.95] uppercase sm:text-5xl">{p.title}</h3>
                  <span className="mt-3 block font-mono text-xs font-bold uppercase">
                    {p.where} · {p.when}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-5 p-6 sm:p-8">
                <p className="text-lg leading-relaxed">{p.text}</p>
                <dl className="mt-auto grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 border-t-2 border-dashed border-border pt-5 text-sm">
                  <dt className="font-mono text-xs uppercase">Rol</dt>
                  <dd className="font-semibold">{p.role}</dd>
                  <dt className="font-mono text-xs uppercase">Stack</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <Badge key={t} variant="neutral">{t}</Badge>
                    ))}
                  </dd>
                </dl>
                {p.link && (
                  <Button className="self-start" nativeButton={false} render={<a href={p.link.href} target="_blank" rel="noreferrer" />}>
                    {p.link.label} <ArrowUpRight />
                  </Button>
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </section>
  )
}
