import { Volume2, VolumeX } from "lucide-react"

import { leaveTour, startTour, store, toggleMuted, useStore } from "./store"

const chip =
  "pointer-events-auto inline-flex items-center gap-2 rounded-sm px-3 py-2 font-[VT323] text-lg leading-none text-[#7fe39a]/70 transition-colors hover:text-[#c8ffd2] focus-visible:text-[#c8ffd2] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#7fe39a]"

/** Small controls in the corners, outside the 3D scene. */
export function Hud() {
  const phase = useStore((s) => s.phase)
  const muted = useStore((s) => s.muted)
  if (phase === "loading") return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex items-end justify-between p-3 sm:p-5">
      <div className="flex gap-1">
        <button type="button" className={chip} onClick={() => store.set({ textVersion: true })}>
          tekstversie
        </button>
        {phase === "tour" && (
          <button type="button" className={chip} onClick={leaveTour}>
            terug naar bureau
          </button>
        )}
      </div>

      {/* Same as the START button on the screen, for keyboard and screen reader users. */}
      {phase === "ready" && (
        <button
          type="button"
          onClick={startTour}
          className="sr-only pointer-events-auto focus:not-sr-only focus:fixed focus:left-1/2 focus:top-4 focus:-translate-x-1/2 focus:rounded-sm focus:bg-[#c8ffd2] focus:px-4 focus:py-2 focus:font-[VT323] focus:text-xl focus:text-[#020604]"
        >
          start rondleiding
        </button>
      )}

      <button type="button" className={chip} onClick={toggleMuted} aria-pressed={!muted} aria-label={muted ? "Geluid aanzetten" : "Geluid uitzetten"}>
        {muted ? <VolumeX className="size-4" aria-hidden="true" /> : <Volume2 className="size-4" aria-hidden="true" />}
        <span aria-hidden="true">{muted ? "geluid uit" : "geluid aan"}</span>
      </button>
    </div>
  )
}
