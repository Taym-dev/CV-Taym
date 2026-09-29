import { useRef } from "react"

import { FINE_POINTER, gsap, MOTION_OK, useGSAP } from "@/lib/gsap"

// Vierkante volger naast de gewone cursor. Boven elementen met data-cursor toont hij een label.
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(`${MOTION_OK} and ${FINE_POINTER}`, () => {
      const el = ref.current!
      const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3" })
      const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3" })
      gsap.set(el, { display: "flex" })

      const onMove = (e: PointerEvent) => {
        xTo(e.clientX + 14)
        yTo(e.clientY + 14)
      }
      const onOver = (e: PointerEvent) => {
        const target = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor]")
        const label = target?.dataset.cursor ?? ""
        labelRef.current!.textContent = label
        gsap.to(el, {
          width: label ? "auto" : 18,
          height: label ? 34 : 18,
          rotate: label ? -4 : 0,
          backgroundColor: label ? "var(--main)" : "transparent",
          duration: 0.25,
          ease: "back.out(2)",
        })
      }

      addEventListener("pointermove", onMove)
      document.addEventListener("pointerover", onOver)
      return () => {
        removeEventListener("pointermove", onMove)
        document.removeEventListener("pointerover", onOver)
      }
    })
  })

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[90] hidden size-[18px] items-center justify-center rounded-base border-2 border-border px-0 font-mono text-xs font-bold whitespace-nowrap uppercase shadow-shadow"
    >
      <span ref={labelRef} className="px-2 empty:hidden" />
    </div>
  )
}
