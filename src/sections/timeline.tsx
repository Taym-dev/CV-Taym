import { ArrowRight } from "lucide-react"
import { useRef } from "react"

import { SectionHeading } from "@/components/section-heading"
import { education, experience, profile } from "@/data/cv"
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"
import { cn } from "@/lib/utils"

type Kind = "dev" | "school" | "job"

const kinds: Record<Kind, { label: string; className: string }> = {
  dev: { label: "Development", className: "bg-main text-foreground" },
  school: { label: "School", className: "bg-blue text-foreground" },
  job: { label: "Bijbaan & stage", className: "bg-secondary-background text-foreground" },
}

const startYear = (when: string) => Number(when.match(/\d{4}/)?.[0] ?? 0)

// Eén chronologisch verhaal, opgebouwd uit de opleidingen en werkervaring in cv.ts.
const items = [
  ...education.map((e) => ({ kind: "school" as Kind, title: e.school, role: e.what, text: "", when: e.when })),
  ...experience.development.map((j) => ({ kind: "dev" as Kind, title: j.company, role: j.role, text: j.text, when: j.when })),
  ...experience.other.map((j) => ({ kind: "job" as Kind, title: j.company, role: j.role, text: j.text, when: j.when })),
]
  .map((item) => ({ ...item, year: startYear(item.when) }))
  .sort((a, b) => a.year - b.year)

export function Timeline() {
  const ref = useRef<HTMLElement>(null)
  const yearRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      const setYear = (year: string) => {
        const el = yearRef.current
        if (!el || el.textContent === year) return
        el.textContent = year
        gsap.fromTo(el, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "expo.out" })
      }

      // Desktop: sectie klikt vast en je scrollt horizontaal door de tijdlijn.
      mm.add(`${MOTION_OK} and (min-width: 768px)`, () => {
        const viewport = ref.current!.querySelector<HTMLElement>(".tl-viewport")!
        const track = ref.current!.querySelector<HTMLElement>(".tl-track")!
        const cards = gsap.utils.toArray<HTMLElement>(".tl-card")
        gsap.set(viewport, { overflow: "hidden" })

        const distance = () => track.scrollWidth - viewport.clientWidth

        const scroll = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: ".tl-pin",
            pin: true,
            start: "top top",
            end: () => `+=${distance()}`,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const i = Math.min(items.length - 1, Math.floor(self.progress * items.length))
              setYear(String(items[i].year))
              gsap.set(".tl-progress", { scaleX: self.progress })
            },
          },
        })

        cards.forEach((card) => {
          gsap.from(card, {
            y: 120,
            rotate: 10,
            opacity: 0.2,
            ease: "back.out(1.4)",
            scrollTrigger: { trigger: card, containerAnimation: scroll, start: "left 95%", end: "left 65%", scrub: true },
          })
          gsap.from(card.querySelector(".tl-dot"), {
            scale: 0,
            ease: "back.out(3)",
            scrollTrigger: { trigger: card, containerAnimation: scroll, start: "left 80%", end: "left 70%", scrub: true },
          })
        })
      })

      // Mobiel: verticale tijdlijn met een lijn die zich mee tekent.
      mm.add(`${MOTION_OK} and (max-width: 767px)`, () => {
        gsap.fromTo(
          ".tl-line-v",
          { scaleY: 0 },
          { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".tl-track", start: "top 70%", end: "bottom 60%", scrub: true } },
        )
        gsap.utils.toArray<HTMLElement>(".tl-card").forEach((card) => {
          gsap.from(card, {
            x: 80,
            rotate: 6,
            opacity: 0,
            duration: 0.9,
            ease: "back.out(1.5)",
            scrollTrigger: { trigger: card, start: "top 85%", onEnter: () => setYear(card.dataset.year ?? "") },
          })
        })
      })
    },
    { scope: ref },
  )

  return (
    <section ref={ref} id="ervaring" className="relative bg-foreground text-background">
      <div className="tl-pin relative flex min-h-screen flex-col justify-center overflow-hidden py-16 md:py-0">
        <span
          ref={yearRef}
          aria-hidden="true"
          className="pointer-events-none absolute right-4 bottom-4 font-display text-[28vw] leading-none text-transparent opacity-100 [-webkit-text-stroke:2px_var(--main)] md:text-[18vw]"
        >
          {items[0].year}
        </span>

        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <SectionHeading
            dark
            index="03"
            label="Ervaring"
            title={<>Van 2018<br />tot nu</>}
            aside={
              <div className="flex flex-wrap gap-2 font-mono text-xs uppercase">
                {(Object.keys(kinds) as Kind[]).map((k) => (
                  <span key={k} className={cn("rounded-base border-2 border-border px-2 py-1", kinds[k].className)}>
                    {kinds[k].label}
                  </span>
                ))}
              </div>
            }
          />
        </div>

        <div className="tl-viewport relative md:overflow-x-auto">
          {/* horizontale voortgangslijn (desktop) */}
          <div className="absolute top-[26px] right-0 left-0 hidden h-1 bg-background/15 md:block">
            <div className="tl-progress h-full origin-left scale-x-0 bg-main" />
          </div>

          <ol className="tl-track relative flex flex-col gap-6 px-4 pl-12 sm:px-6 sm:pl-14 md:w-max md:flex-row md:pr-[20vw] md:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
            {/* verticale lijn (mobiel) */}
            <span aria-hidden="true" className="tl-line-v absolute top-2 bottom-2 left-5 w-1 origin-top bg-main sm:left-6 md:hidden" />

            {items.map((item) => (
              <li key={item.title} data-year={item.year} className="tl-card relative md:w-[320px] md:pt-14">
                <span className="tl-dot absolute top-5 -left-[34px] size-5 rounded-full border-2 border-border bg-main md:top-[18px] md:left-6" />
                <span className="absolute top-0 left-14 hidden font-display text-2xl text-main md:block">{item.year}</span>
                <div
                  data-cursor={kinds[item.kind].label}
                  className={cn("flex h-full flex-col gap-2 rounded-base border-2 border-border p-5 shadow-[6px_6px_0_0_var(--main)] md:min-h-[230px]", kinds[item.kind].className)}
                >
                  <span className="font-mono text-xs font-bold uppercase">{item.when}</span>
                  <h3 className="font-display text-2xl leading-tight uppercase">{item.title}</h3>
                  <p className="font-semibold">{item.role}</p>
                  {item.text && <p className="text-sm leading-relaxed">{item.text}</p>}
                  <span className="mt-auto inline-flex w-fit rounded-base border-2 border-border bg-background px-2 py-0.5 font-mono text-[11px] uppercase">
                    {kinds[item.kind].label}
                  </span>
                </div>
              </li>
            ))}

            <li className="tl-card relative md:w-[320px] md:pt-14">
              <span className="tl-dot absolute top-5 -left-[34px] size-5 rounded-full border-2 border-main bg-foreground md:top-[18px] md:left-6" />
              <span className="absolute top-0 left-14 hidden font-display text-2xl text-main md:block">Next</span>
              <a
                href={`mailto:${profile.email}`}
                data-cursor="Mail"
                className="flex h-full flex-col justify-between gap-6 rounded-base border-2 border-dashed border-main p-5 text-main transition-colors hover:bg-main hover:text-foreground md:min-h-[230px]"
              >
                <span className="font-mono text-xs uppercase">Volgende hoofdstuk</span>
                <span className="font-display text-4xl leading-none uppercase">
                  Jouw team? <ArrowRight className="inline size-8" />
                </span>
              </a>
            </li>
          </ol>
        </div>
      </div>
    </section>
  )
}
