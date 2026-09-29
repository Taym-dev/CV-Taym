import { useRef } from "react"

import Marquee from "@/components/ui/marquee"
import { stack } from "@/data/cv"
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap"

const soft = ["Flexibel", "Communicatie", "Doelbewust", "Samenwerking", "Front-end", "Back-end"]

export function StackMarquee() {
  const ref = useRef<HTMLDivElement>(null)
  const items = Object.values(stack).flat()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const bands = gsap.utils.toArray<HTMLElement>("[data-band]")
        let direction = 1
        const state = { boost: 0 }

        // Scrollsnelheid bepaalt de boost; de richting draait mee met je scrollrichting.
        const trigger = ScrollTrigger.create({
          onUpdate: (self) => {
            direction = self.direction
            const boost = Math.min(Math.abs(self.getVelocity()) / 250, 8)
            gsap.to(state, { boost, duration: 0.2, overwrite: true })
            gsap.to(state, { boost: 0, duration: 1.4, delay: 0.2, ease: "power2.out" })
          },
        })

        const tick = () => {
          bands.forEach((band) => {
            const sign = Number(band.dataset.band)
            const rate = sign * direction * (1 + state.boost)
            band.getAnimations({ subtree: true }).forEach((a) => (a.playbackRate = rate))
          })
        }
        gsap.ticker.add(tick)

        // De banden kantelen verder terwijl je erlangs scrollt.
        gsap.fromTo(
          ".band-a",
          { rotate: 0 },
          { rotate: -4, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true } },
        )
        gsap.fromTo(
          ".band-b",
          { rotate: 0 },
          { rotate: 3, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true } },
        )

        return () => {
          gsap.ticker.remove(tick)
          trigger.kill()
        }
      })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} aria-hidden="true" className="relative my-10 h-44 sm:h-52">
      <div className="absolute inset-x-[-5%] top-1/2 -translate-y-1/2 rotate-1">
        <div data-band="-1" className="band-b">
          <Marquee
            items={soft}
            separator="●"
            className="border-y-4 bg-main text-foreground [&>div]:py-4"
            itemClassName="font-display text-xl uppercase sm:text-2xl"
          />
        </div>
      </div>
      <div className="absolute inset-x-[-5%] top-1/2 -translate-y-1/2 -rotate-1">
        <div data-band="1" className="band-a">
          <Marquee
            items={items}
            separator="✱"
            className="border-y-4 bg-foreground text-main [&>div]:py-5"
            itemClassName="font-display text-2xl uppercase sm:text-3xl"
          />
        </div>
      </div>
    </div>
  )
}
