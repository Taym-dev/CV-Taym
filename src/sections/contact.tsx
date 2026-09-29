import { Copy, Download, Mail, MapPin } from "lucide-react"

import { useRef } from "react"

import { GithubIcon, LinkedinIcon } from "@/components/icons"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { profile } from "@/data/cv"
import { gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/gsap"
import { useMagnetic } from "@/lib/use-magnetic"

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(profile.email)
    toast.add({ title: "E-mail gekopieerd", description: profile.email, type: "success" })
  } catch {
    window.location.href = `mailto:${profile.email}`
  }
}

const rowClass = "contact-row flex flex-1 items-center gap-4 border-b-2 border-border px-5 py-4 last:border-b-0 sm:px-6"

export function Contact() {
  const ref = useRef<HTMLElement>(null)
  useMagnetic(ref, 0.45)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const split = SplitText.create(".contact-title", { type: "words,chars" })
        const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: "top 70%" } })
        // Kaart valt schuin naar binnen en landt met een schok.
        tl.from(".contact-card", { y: -120, rotate: -8, scale: 0.85, opacity: 0, duration: 0.7, ease: "power4.in" })
          .to(".contact-card", { keyframes: { x: [-14, 12, -8, 6, -3, 0], rotate: [1.5, -1, 0.6, 0] }, duration: 0.5, ease: "none" })
          .from(split.chars, { scale: 0, rotate: () => gsap.utils.random(-50, 50), duration: 0.6, stagger: 0.03, ease: "back.out(3)" }, "-=0.45")
          .from(".contact-row", { x: 60, opacity: 0, duration: 0.5, stagger: 0.07, ease: "back.out(2)" }, "-=0.6")
        return () => split.revert()
      })
    },
    { scope: ref },
  )

  return (
    <section ref={ref} id="contact" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <Reveal>
        <Card className="contact-card gap-0 overflow-hidden bg-main py-0 shadow-[8px_8px_0_0_var(--border)]">
          <div className="grid lg:grid-cols-[1.2fr_1fr]">
            <div className="flex flex-col justify-between gap-10 border-b-2 border-border p-6 sm:p-10 lg:border-r-2 lg:border-b-0">
              <div>
                <p className="mb-4 inline-flex border-2 border-border bg-foreground px-2 py-1 font-mono text-xs uppercase tracking-wider text-background">
                  <span className="mr-2 text-main">06</span>Contact
                </p>
                <h2 className="contact-title font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.92] uppercase">
                  Zullen we
                  <br />
                  even mailen?
                </h2>
                <p className="mt-6 max-w-md text-lg leading-relaxed">
                  Heb je een stageplek, een project of gewoon een vraag? Stuur me een bericht.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span data-magnetic className="inline-block">
                  <Button
                    size="lg"
                    variant="neutral"
                    nativeButton={false}
                    render={<a href={`mailto:${profile.email}`} />}
                  >
                    <Mail /> Stuur een mail
                  </Button>
                </span>
                {profile.cvPdf && (
                  <Button size="lg" variant="neutral" nativeButton={false} render={<a href={profile.cvPdf} download />}>
                    <Download /> Download cv
                  </Button>
                )}
              </div>
            </div>

            <ul className="flex flex-col bg-secondary-background">
              <li className={rowClass}>
                <Mail className="size-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs uppercase">E-mail</p>
                  <a href={`mailto:${profile.email}`} className="block truncate font-semibold hover:underline">
                    {profile.email}
                  </a>
                </div>
                <Tooltip>
                  <TooltipTrigger
                    render={<Button size="icon-sm" variant="neutral" onClick={copyEmail} aria-label="Kopieer e-mailadres" />}
                  >
                    <Copy />
                  </TooltipTrigger>
                  <TooltipContent>Kopieer</TooltipContent>
                </Tooltip>
              </li>
              <li className={rowClass}>
                <GithubIcon className="size-5 shrink-0" />
                <div>
                  <p className="font-mono text-xs uppercase">GitHub</p>
                  <a href={profile.github} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
                    {profile.github.replace("https://", "")}
                  </a>
                </div>
              </li>
              {profile.linkedin && (
                <li className={rowClass}>
                  <LinkedinIcon className="size-5 shrink-0" />
                  <div>
                    <p className="font-mono text-xs uppercase">LinkedIn</p>
                    <a href={profile.linkedin} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
                      LinkedIn-profiel
                    </a>
                  </div>
                </li>
              )}
              <li className={rowClass}>
                <MapPin className="size-5 shrink-0" />
                <div>
                  <p className="font-mono text-xs uppercase">Locatie</p>
                  <p className="font-semibold">{profile.city}, Nederland</p>
                </div>
              </li>
            </ul>
          </div>
        </Card>
      </Reveal>
    </section>
  )
}
