import { useEffect } from "react"

import { Cursor } from "@/components/cursor"
import { Intro } from "@/components/intro"
import { SmoothScroll } from "@/components/smooth-scroll"
import { Toaster } from "@/components/ui/toast"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ScrollTrigger } from "@/lib/gsap"
import { Contact } from "@/sections/contact"
import { Education } from "@/sections/education"
import { Footer } from "@/sections/footer"
import { Hero } from "@/sections/hero"
import { Nav } from "@/sections/nav"
import { Projects } from "@/sections/projects"
import { Skills } from "@/sections/skills"
import { StackMarquee } from "@/sections/stack-marquee"
import { Timeline } from "@/sections/timeline"
import { Tldr } from "@/sections/tldr"

export default function App() {
  // Posities opnieuw meten zodra de webfonts binnen zijn (die veranderen de hoogtes).
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }, [])

  return (
    <TooltipProvider>
      <Toaster>
        <SmoothScroll />
        <Intro />
        <Cursor />
        <Nav />
        <main className="overflow-x-clip">
          <Hero />
          <StackMarquee />
          <Tldr />
          <Projects />
          <Timeline />
          <Skills />
          <Education />
          <Contact />
        </main>
        <Footer />
      </Toaster>
    </TooltipProvider>
  )
}
