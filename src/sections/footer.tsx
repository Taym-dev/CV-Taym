import { useRef } from "react"

import { PopText } from "@/components/pop-text"
import { profile } from "@/data/cv"
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"

export function Footer() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        // De letters van de naam komen één voor één omhoog terwijl je naar beneden scrollt.
        gsap.from(".footer-name .pop-char", {
          yPercent: 110,
          rotate: 15,
          stagger: 0.04,
          ease: "back.out(1.5)",
          scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom bottom", scrub: 0.5 },
        })
      })
    },
    { scope: ref },
  )

  return (
    <footer ref={ref}>
      <div className="overflow-hidden border-t-2 border-border px-4 pt-10 pb-6 sm:px-6">
        <p className="mx-auto max-w-6xl font-mono text-xs uppercase">Tot snel ✱ Gemaakt in Dordrecht</p>
        <p className="mx-auto mt-2 max-w-6xl font-display text-[min(8.6vw,6.6rem)] leading-[0.95] whitespace-nowrap uppercase overflow-hidden pb-1">
          <PopText text={profile.name} className="footer-name" />
        </p>
      </div>
      <div className="border-t-2 border-border bg-foreground text-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 font-mono text-xs uppercase sm:px-6">
          <p>
            Ontworpen en gebouwd door {profile.name} · {new Date().getFullYear()}
          </p>
          <p>
            React · Tailwind · shadcn/ui ·{" "}
            <a href={profile.repo} target="_blank" rel="noreferrer" className="text-main underline-offset-4 hover:underline">
              Broncode
            </a>
          </p>
          <a href="#top" className="text-main underline-offset-4 hover:underline">
            Terug naar boven ↑
          </a>
        </div>
      </div>
    </footer>
  )
}
