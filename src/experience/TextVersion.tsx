import { X } from "lucide-react"
import { useEffect, useRef } from "react"

import { education, experience, hero, languages, profile, projects, softSkills, stack, tldr } from "@/data/cv"

import { store, useStore } from "./store"

const range = (s: string) => s.replace(/\s*[–-]\s*/g, " tot ")

/**
 * The whole CV as plain HTML. Hidden visually (but read by screen readers and search
 * engines) until the visitor opens "tekstversie".
 */
export function TextVersion() {
  const open = useStore((s) => s.textVersion)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && store.set({ textVersion: false })
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  }, [open])

  const h2 = "mt-12 mb-4 font-[VT323] text-2xl text-[#7fe39a]"

  return (
    <main
      className={
        open
          ? "fixed inset-0 z-30 overflow-y-auto bg-[#030403]/95 text-[#d7e6da] backdrop-blur-sm"
          : "sr-only"
      }
      aria-label="Cv van Taym Alsudani"
    >
      <div className="mx-auto max-w-2xl px-5 py-14 text-[15px] leading-relaxed sm:py-20">
        {open && (
          <button
            ref={closeRef}
            type="button"
            onClick={() => store.set({ textVersion: false })}
            className="fixed right-4 top-4 inline-flex items-center gap-2 rounded-sm px-3 py-2 font-[VT323] text-lg text-[#7fe39a] hover:text-[#c8ffd2] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#7fe39a]"
          >
            <X className="size-4" aria-hidden="true" />
            sluiten
          </button>
        )}

        <h1 className="font-[VT323] text-5xl leading-none text-[#c8ffd2]">{profile.name}</h1>
        <p className="mt-2 text-[#9fb8a5]">
          {profile.role} in opleiding, {profile.education}, {profile.city}
        </p>
        <p className="mt-6">{hero.intro}</p>
        <p className="mt-4">
          {tldr[2].title}. {tldr[2].text}
        </p>

        <h2 className={h2}>Projecten</h2>
        <ul className="space-y-6">
          {projects.map((p) => (
            <li key={p.title}>
              <h3 className="font-semibold text-[#eef6ef]">{p.title}</h3>
              <p className="text-sm text-[#9fb8a5]">
                {p.where}, {range(p.when)}. {p.role}
              </p>
              <p className="mt-1">{p.text}</p>
              {p.link && (
                <a className="mt-1 inline-block text-[#7fe39a] underline underline-offset-4 hover:text-[#c8ffd2]" href={p.link.href} target="_blank" rel="noopener">
                  {p.link.label}
                </a>
              )}
            </li>
          ))}
        </ul>

        <h2 className={h2}>Ervaring</h2>
        <ul className="space-y-4">
          {experience.development.map((j) => (
            <li key={j.company}>
              <h3 className="font-semibold text-[#eef6ef]">
                {j.role} bij {j.company}
              </h3>
              <p className="text-sm text-[#9fb8a5]">{range(j.when)}</p>
              <p>{j.text}</p>
            </li>
          ))}
        </ul>
        <h3 className="mt-8 mb-2 font-semibold text-[#eef6ef]">Naast school</h3>
        <ul className="space-y-1">
          {experience.other.map((j) => (
            <li key={j.company}>
              {j.role} bij {j.company}, {range(j.when)}. {j.text}
            </li>
          ))}
        </ul>

        <h2 className={h2}>Opleiding</h2>
        <ul className="space-y-1">
          {education.map((e) => (
            <li key={e.school}>
              {e.what}, {e.school}, {range(e.when)}
            </li>
          ))}
        </ul>

        <h2 className={h2}>Skills</h2>
        <dl className="space-y-2">
          {Object.entries(stack).map(([group, items]) => (
            <div key={group}>
              <dt className="text-sm text-[#9fb8a5]">{group}</dt>
              <dd>{items.join(", ")}</dd>
            </div>
          ))}
          <div>
            <dt className="text-sm text-[#9fb8a5]">Talen</dt>
            <dd>{languages.map((l) => `${l.name} (${l.level.toLowerCase()})`).join(", ")}</dd>
          </div>
        </dl>
        <ul className="mt-4 space-y-1">
          {softSkills.map((s) => (
            <li key={s.name}>
              <span className="text-[#eef6ef]">{s.name}.</span> {s.proof}
            </li>
          ))}
        </ul>

        <h2 className={h2}>Contact</h2>
        <p>
          <a className="text-[#7fe39a] underline underline-offset-4 hover:text-[#c8ffd2]" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
        </p>
        <p>
          <a className="text-[#7fe39a] underline underline-offset-4 hover:text-[#c8ffd2]" href={profile.github} target="_blank" rel="noopener">
            {profile.github.replace("https://", "")}
          </a>
        </p>
      </div>
    </main>
  )
}
