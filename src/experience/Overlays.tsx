import { ChevronLeft, ChevronRight, FileText, Mail, Power } from "lucide-react"
import { useEffect, useState } from "react"

import { GithubIcon, LinkedinIcon } from "@/components/icons"
import { profile } from "@/data/cv"

import { sound } from "./audio"
import { goToSlide, isTouch, reducedMotion, restart, SLIDE_COUNT, store, useStore } from "./store"

/**
 * HTML on top of the 3D scene: how to flip slides, big arrow buttons for thumbs,
 * a hint to turn the phone, and the goodbye screen after quitting.
 */
export function Overlays() {
  return (
    <>
      <NavHint />
      <SideArrows />
      <RotateHint />
      <Goodbye />
    </>
  )
}

/** Shown when the tour starts, until the visitor has moved to another slide. */
function NavHint() {
  const phase = useStore((s) => s.phase)
  const navigated = useStore((s) => s.navigated)
  const [ready, setReady] = useState(false)
  const touch = isTouch()

  // Wait until the camera has arrived at the screen.
  useEffect(() => {
    setReady(false)
    if (phase !== "tour") return
    const t = setTimeout(() => setReady(true), 2600)
    return () => clearTimeout(t)
  }, [phase])

  const show = phase === "tour" && ready && !navigated
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-5 z-10 flex justify-center px-4 transition-all duration-500 sm:top-8 ${show ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"}`}
      aria-hidden={!show}
    >
      <div className="flex items-center gap-3 rounded-md border border-[#7fe39a]/40 bg-[#020604]/85 px-4 py-2.5 font-[VT323] text-xl leading-none text-[#c8ffd2] shadow-[0_0_30px_#7fe39a33] backdrop-blur-sm">
        {touch ? (
          <>
            <span className="relative block h-7 w-12 overflow-hidden" aria-hidden="true">
              <span className="animate-swipe-hand absolute left-3 top-0 text-2xl">👆</span>
            </span>
            <span>veeg om te bladeren</span>
          </>
        ) : (
          <>
            <span className="flex gap-1" aria-hidden="true">
              {["←", "→"].map((k, i) => (
                <kbd
                  key={k}
                  className="animate-key-press grid size-8 place-items-center rounded border border-[#7fe39a] text-lg"
                  style={{ animationDelay: `${i * 0.8}s` }}
                >
                  {k}
                </kbd>
              ))}
            </span>
            <span>gebruik de pijltjes om te bladeren</span>
          </>
        )}
      </div>
    </div>
  )
}

/** Large tap targets: under the screen on phones (thumb reach), left and right on wider screens. */
function SideArrows() {
  const phase = useStore((s) => s.phase)
  const slide = useStore((s) => s.slide)
  const navigated = useStore((s) => s.navigated)
  if (phase !== "tour") return null
  const btn =
    "pointer-events-auto grid size-12 place-items-center rounded-full border border-[#7fe39a]/40 bg-[#020604]/70 text-[#7fe39a] backdrop-blur-sm transition hover:border-[#c8ffd2] hover:text-[#c8ffd2] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#c8ffd2] active:scale-90 disabled:opacity-0 sm:size-14"
  return (
    <div className="animate-rise-in pointer-events-none fixed inset-x-0 bottom-20 z-10 flex justify-center gap-24 [animation-delay:2s] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:justify-between sm:px-5">
      <button type="button" className={btn} onClick={() => goToSlide(slide - 1)} disabled={slide === 0} aria-label="Vorige slide">
        <ChevronLeft className="size-6" aria-hidden="true" />
      </button>
      <button type="button" className={btn} onClick={() => goToSlide(slide + 1)} disabled={slide === SLIDE_COUNT - 1} aria-label="Volgende slide">
        <ChevronRight className={`size-6 ${navigated ? "" : "animate-nudge-x"}`} aria-hidden="true" />
      </button>
    </div>
  )
}

/** On a phone held upright the screen is small. Suggest turning it, once per tour. */
function RotateHint() {
  const phase = useStore((s) => s.phase)
  const [portrait, setPortrait] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const mq = matchMedia("(orientation: portrait) and (max-width: 700px)")
    const update = () => setPortrait(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (phase !== "tour" || !portrait) return
    const t = setTimeout(() => setDismissed(true), 6500)
    return () => clearTimeout(t)
  }, [phase, portrait])

  if (phase !== "tour" || !portrait || dismissed) return null
  return (
    <button
      type="button"
      onClick={() => setDismissed(true)}
      className="animate-rise-in fixed inset-x-4 bottom-40 z-10 flex items-center justify-center gap-2 rounded-md border border-[#7fe39a]/30 bg-[#020604]/85 px-3 py-2 font-[VT323] text-lg leading-tight text-[#7fe39a] backdrop-blur-sm [animation-delay:3s]"
    >
      <span className="inline-block rotate-90 text-xl" aria-hidden="true">
        ▯
      </span>
      draai je telefoon voor een groter scherm
    </button>
  )
}

const LINES = ["bedankt", "voor het kijken."]

/**
 * The mouse pointer glided to the middle of the view and became the cursor of a terminal
 * that types the goodbye. The buttons boot in line by line underneath.
 */
function Goodbye() {
  const outro = useStore((s) => s.outro)
  const phase = useStore((s) => s.phase)
  if (!outro || phase !== "off") return null
  return <GoodbyeScreen />
}

function GoodbyeScreen() {
  const quick = reducedMotion()
  const total = LINES.join("").length
  const [typed, setTyped] = useState(quick ? total : 0)
  const done = typed >= total

  useEffect(() => {
    if (quick) return
    let n = 0
    let timer = 0
    const next = () => {
      n++
      setTyped(n)
      sound.tick()
      if (n < total) timer = window.setTimeout(next, 55 + Math.random() * 70 + (n === LINES[0].length ? 280 : 0))
    }
    timer = window.setTimeout(next, 900)
    return () => clearTimeout(timer)
  }, [quick, total])

  let left = typed
  const shown = LINES.map((line) => {
    const part = line.slice(0, Math.max(0, left))
    left -= line.length
    return part
  })
  const cursorLine = done ? LINES.length - 1 : shown.findIndex((part, i) => part.length < LINES[i].length)

  const link =
    "pointer-events-auto inline-flex items-center gap-2 rounded-sm px-3 py-2 font-[VT323] text-xl leading-none text-[#7fe39a] transition-colors hover:text-[#c8ffd2] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#7fe39a]"

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col items-center justify-center px-6 font-[VT323]" role="dialog" aria-label="Tot ziens">
      <div className="animate-scan-in absolute inset-0 bg-[#030403]/80 bg-[repeating-linear-gradient(0deg,#0000_0_3px,#0006_3px_4px)]" aria-hidden="true" />

      <div className="relative w-full max-w-3xl">
        <p className="animate-rise-in text-lg text-[#3d9a5a] [animation-delay:0.7s] sm:text-xl">C:\&gt; exit</p>
        <h2 className="mt-2 text-[clamp(3.2rem,13vw,8rem)] leading-[0.88] text-[#c8ffd2] [text-shadow:0_0_10px_#7fe39a,0_0_36px_#3d9a5a]" aria-label={LINES.join(" ")}>
          {LINES.map((line, i) => (
            <span key={line} className="block min-h-[0.88em]" aria-hidden="true">
              {shown[i]}
              {i === cursorLine && <span className="animate-blink ml-1 inline-block h-[0.78em] w-[0.5em] translate-y-[0.08em] bg-[#c8ffd2] shadow-[0_0_18px_#9dffb6]" />}
            </span>
          ))}
        </h2>

        {done && (
          <>
            <div className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-3">
              <button
                type="button"
                onClick={restart}
                autoFocus
                className="animate-rise-in group pointer-events-auto inline-flex items-center gap-3 rounded-sm border-2 border-[#c8ffd2] px-6 py-3 text-3xl leading-none text-[#c8ffd2] shadow-[0_0_24px_#7fe39a55,inset_0_0_18px_#7fe39a22] transition hover:bg-[#c8ffd2] hover:text-[#020604] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fe39a] focus-visible:ring-offset-4 focus-visible:ring-offset-[#030403] active:scale-95 [animation-delay:0.2s]"
              >
                <Power className="size-6 transition-transform duration-500 group-hover:rotate-180" aria-hidden="true" />
                opnieuw opstarten
              </button>
              <button
                type="button"
                onClick={() => store.set({ textVersion: true })}
                className="animate-rise-in pointer-events-auto inline-flex items-center gap-3 rounded-sm border-2 border-[#7fe39a]/60 bg-[#7fe39a]/10 px-6 py-3 text-3xl leading-none text-[#c8ffd2] transition hover:border-[#c8ffd2] hover:bg-[#7fe39a]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fe39a] focus-visible:ring-offset-4 focus-visible:ring-offset-[#030403] active:scale-95 [animation-delay:0.35s]"
              >
                <FileText className="size-6" aria-hidden="true" />
                duidelijke tekstversie
              </button>
              <a className={`${link} animate-rise-in [animation-delay:0.5s]`} href={`mailto:${profile.email}`}>
                <Mail className="size-4" aria-hidden="true" />
                mail mij
              </a>
              <a className={`${link} animate-rise-in [animation-delay:0.6s]`} href={profile.github} target="_blank" rel="noopener noreferrer">
                <GithubIcon className="size-4" />
                github
              </a>
              {profile.linkedin && (
                <a className={`${link} animate-rise-in [animation-delay:0.7s]`} href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                  <LinkedinIcon className="size-4" />
                  linkedin
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
