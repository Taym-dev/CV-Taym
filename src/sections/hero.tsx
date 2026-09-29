import { ArrowDown, Mail, MapPin } from "lucide-react"
import { useRef } from "react"

import { DragSticker } from "@/components/drag-sticker"
import { PopText } from "@/components/pop-text"
import { RotatingText } from "@/components/rotating-text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ImageCard from "@/components/ui/image-card"
import { hero, profile } from "@/data/cv"
import { FINE_POINTER, gsap, introDone, MOTION_OK, useGSAP } from "@/lib/gsap"
import { useMagnetic } from "@/lib/use-magnetic"

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  useMagnetic(ref)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(MOTION_OK, () => {
        // 1. Binnenkomst, zodra het intro-gordijn wegschuift
        const intro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } })
        intro
          .from(".hero-line-1 .pop-char", { yPercent: -140, rotate: () => gsap.utils.random(-40, 40), opacity: 0, duration: 1, stagger: 0.035, ease: "bounce.out" })
          .from(".hero-line-2 .pop-char", { yPercent: -140, rotate: () => gsap.utils.random(-40, 40), opacity: 0, duration: 1, stagger: 0.035, ease: "bounce.out" }, "-=0.75")
          .from(".hero-sub", { scale: 0, rotate: -25, duration: 0.8, ease: "back.out(2.2)" }, "-=0.5")
          .from(".hero-status", { x: -40, opacity: 0, duration: 0.6 }, "<")
          .from(".hero-photo", { y: 180, rotate: 18, scale: 0.7, opacity: 0, duration: 1.2, ease: "elastic.out(1, 0.6)" }, 0.2)
          .from(".hero-sticker", { scale: 0, rotate: 90, duration: 0.7, stagger: 0.12, ease: "back.out(3)" }, 0.9)
          .from(".hero-intro", { y: 30, opacity: 0, duration: 0.7 }, 0.8)
          .from(".hero-cta > *", { y: 40, opacity: 0, duration: 0.7, stagger: 0.08, ease: "back.out(2)" }, 0.9)
          .from(".hero-facts > *", { y: 20, opacity: 0, scale: 0.8, duration: 0.5, stagger: 0.06, ease: "back.out(2)" }, 1)
          .from(".hero-hint", { opacity: 0, duration: 0.5 }, 1.6)
        introDone.then(() => intro.play())

        // 2. Wegscrollen: kopregels schuiven uit elkaar, foto kantelt weg
        gsap
          .timeline({ scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: 0.6 } })
          .to(".hero-line-1", { xPercent: -18, ease: "none" }, 0)
          .to(".hero-line-2", { xPercent: 22, ease: "none" }, 0)
          .to(".hero-parallax", { yPercent: 25, rotate: 10, scale: 0.85, ease: "none" }, 0)
          .to(".hero-copy", { yPercent: 12, opacity: 0.2, ease: "none" }, 0)
      })

      // 3. Foto en stickers bewegen mee met de muis, elk op een eigen diepte
      mm.add(`${MOTION_OK} and ${FINE_POINTER}`, () => {
        const section = ref.current!
        const setters = gsap.utils.toArray<HTMLElement>("[data-depth]").map((el) => ({
          depth: Number(el.dataset.depth),
          x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3" }),
          y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3" }),
        }))
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / innerWidth - 0.5
          const ny = e.clientY / innerHeight - 0.5
          setters.forEach((s) => {
            s.x(nx * s.depth)
            s.y(ny * s.depth)
          })
        }
        section.addEventListener("pointermove", onMove)
        return () => section.removeEventListener("pointermove", onMove)
      })
    },
    { scope: ref },
  )

  return (
    <section
      ref={ref}
      id="top"
      className="mx-auto grid max-w-6xl items-center gap-12 overflow-x-clip px-4 pt-12 pb-20 sm:px-6 md:grid-cols-[1.4fr_1fr] md:pt-20 md:pb-28"
    >
      <div className="hero-copy">
        <Badge variant="neutral" className="hero-status mb-6 gap-2 px-3 py-1 font-mono text-xs uppercase">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-main opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full border border-border bg-main" />
          </span>
          {profile.status}
        </Badge>

        <h1 className="font-display text-[clamp(2.6rem,7.5vw,5.5rem)] leading-[0.92] uppercase">
          <PopText text={hero.headline[0]} className="hero-line-1 block" />
          <PopText text={hero.headline[1]} className="hero-line-2 inline-block" />{" "}
          <span className="hero-sub mt-3 inline-block text-[0.55em] leading-none">
            <span className="inline-block -rotate-2 rounded-base border-2 border-border bg-main px-3 py-1 shadow-shadow">
              <RotatingText items={hero.subs} />
            </span>
          </span>
        </h1>

        <p className="hero-intro mt-8 max-w-xl text-lg leading-relaxed">{hero.intro}</p>

        <div className="hero-cta mt-8 flex flex-wrap gap-3">
          <span data-magnetic className="inline-block">
            <Button size="lg" nativeButton={false} render={<a href="#projecten" />}>
              Bekijk projecten <ArrowDown />
            </Button>
          </span>
          <span data-magnetic className="inline-block">
            <Button size="lg" variant="neutral" nativeButton={false} render={<a href={`mailto:${profile.email}`} />}>
              <Mail /> Mail mij
            </Button>
          </span>
        </div>

        <div className="hero-facts mt-8 flex flex-wrap gap-2 font-mono text-xs uppercase">
          <Badge variant="neutral" className="gap-1.5 px-2.5 py-1">
            <MapPin /> {profile.city}
          </Badge>
          <Badge variant="neutral" className="px-2.5 py-1">{profile.education}</Badge>
          <Badge variant="neutral" className="px-2.5 py-1">{profile.languages.join(" / ")}</Badge>
        </div>
      </div>

      <div className="hero-parallax relative mx-auto w-full max-w-[340px]">
        <div data-depth="30" data-cursor="Hoi!" className="hero-photo">
          <ImageCard
            imageUrl={profile.photo}
            alt={`Portret van ${profile.name}`}
            caption={`${profile.name} · ${profile.role}`}
            className="w-full rotate-2 bg-secondary-background font-semibold transition-[rotate] duration-300 hover:rotate-0 [&_img]:aspect-square [&_img]:bg-yellow [&_img]:p-3"
          />
        </div>
        <div data-depth="70" data-cursor="Sleep mij" className="hero-sticker absolute -top-4 -left-4 z-10">
          <DragSticker rotate={-6} className="relative bg-yellow">Nu: stage @ Practoraat</DragSticker>
        </div>
        <div data-depth="90" data-cursor="Sleep mij" className="hero-sticker absolute -right-3 bottom-28 z-10">
          <DragSticker rotate={3} className="relative bg-blue">Front + back</DragSticker>
        </div>
        <div data-depth="55" data-cursor="Sleep mij" className="hero-sticker absolute top-1/3 -right-6 z-10">
          <DragSticker rotate={-3} className="relative bg-red">{profile.city} ✱ NL</DragSticker>
        </div>
        <p className="hero-hint mt-6 text-center font-mono text-xs">(psst: de stickers kun je verslepen)</p>
      </div>
    </section>
  )
}
