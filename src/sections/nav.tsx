import { Menu } from "lucide-react"
import { useEffect, useRef } from "react"

import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap"

import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { profile } from "@/data/cv"

const links = [
  { href: "#projecten", label: "Projecten" },
  { href: "#ervaring", label: "Ervaring" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
]

export function Nav() {
  const barRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  // Nav verdwijnt als je naar beneden scrollt en komt terug zodra je omhoog scrollt.
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const hide = gsap.to(headerRef.current, { yPercent: -110, duration: 0.35, ease: "power3.inOut", paused: true })
      const trigger = ScrollTrigger.create({
        start: 200,
        end: "max",
        onUpdate: (self) => (self.direction === 1 ? hide.play() : hide.reverse()),
        onLeaveBack: () => hide.reverse(),
      })
      return () => trigger.kill()
    })
  })

  useEffect(() => {
    let frame = 0
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      if (barRef.current) barRef.current.style.scale = `${max > 0 ? scrollY / max : 0} 1`
      frame = 0
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    addEventListener("scroll", onScroll, { passive: true })
    return () => removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b-2 border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="#top"
          className="flex size-10 items-center justify-center rounded-base border-2 border-border bg-main font-display text-sm shadow-shadow transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
          aria-label="Naar boven"
        >
          TA
        </a>

        <nav aria-label="Hoofdmenu" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-base border-2 border-transparent px-3 py-1.5 text-sm font-semibold transition-colors hover:border-border hover:bg-secondary-background"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button nativeButton={false} render={<a href={`mailto:${profile.email}`} />} className="hidden sm:inline-flex">
            Mail mij
          </Button>

          <Sheet>
            <SheetTrigger
              render={<Button variant="neutral" size="icon" className="md:hidden" aria-label="Open menu" />}
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="p-6">
              <SheetTitle className="font-display text-xl uppercase">Menu</SheetTitle>
              <nav className="mt-6 flex flex-col gap-3" aria-label="Mobiel menu">
                {links.map((l) => (
                  <SheetClose
                    key={l.href}
                    nativeButton={false}
                    render={
                      <a
                        href={l.href}
                        className="rounded-base border-2 border-border bg-secondary-background px-4 py-3 font-display text-lg uppercase shadow-shadow"
                      />
                    }
                  >
                    {l.label}
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div ref={barRef} aria-hidden="true" className="absolute inset-x-0 -bottom-[3px] h-1 origin-left bg-main" style={{ scale: "0 1" }} />
    </header>
  )
}
