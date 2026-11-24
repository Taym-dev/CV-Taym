import { ArrowLeft, ArrowUpRight, Mail, Printer } from "lucide-react"
import { useEffect, useRef, type ReactNode } from "react"

import { GithubIcon, LinkedinIcon } from "@/components/icons"
import { education, experience, hero, languages, profile, projects, softSkills, stack, tldr } from "@/data/cv"

import { restart, store, useStore } from "./store"

const range = (s: string) => s.replace(/\s*[–-]\s*/g, " tot ")

/**
 * The whole CV as a plain, readable page. Always in the DOM (screen readers and search
 * engines read it), visually hidden until the visitor opens the text version.
 *
 * Design rules: one sans font, one green accent on a dark neutral base, one spacing and
 * radius scale, no decoration. Hierarchy comes from size, weight and whitespace.
 */
export function TextVersion() {
  const open = useStore((s) => s.textVersion)
  const phase = useStore((s) => s.phase)
  const closeRef = useRef<HTMLButtonElement>(null)
  const scroller = useRef<HTMLElement>(null)

  // After quitting, the computer is off: going back turns it on again, so you can use it.
  const afterQuit = phase === "off"
  const close = () => {
    store.set({ textVersion: false })
    if (store.get().phase === "off") restart()
  }

  useEffect(() => {
    if (!open) return
    scroller.current?.scrollTo({ top: 0 })
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      store.set({ textVersion: false })
      if (store.get().phase === "off") restart()
    }
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  }, [open])

  const now = tldr[0]
  const wants = tldr[2]

  return (
    <main
      ref={scroller}
      className={open ? "cv-page animate-rise-in fixed inset-0 z-30 overflow-y-auto bg-[#0b0f0c] text-[#c9d4cc] [font-variant-numeric:tabular-nums]" : "sr-only"}
      aria-label={`Cv van ${profile.name}`}
    >
      {open && (
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0f0c]/90 backdrop-blur print:hidden">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2 sm:px-6">
            <button ref={closeRef} type="button" onClick={close} className={ghostBtn}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              {afterQuit ? "Terug naar de computer" : "Terug naar de kamer"}
            </button>
            <button type="button" onClick={() => print()} className={ghostBtn}>
              <Printer className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Printen of opslaan als pdf</span>
              <span className="sm:hidden">Pdf</span>
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 pb-24 pt-12 text-base leading-relaxed sm:px-6 sm:pt-16">
        {/* ------------------------------------------------------------ Header */}
        <header>
          <p className="text-sm font-medium text-[#8fe3a6]">{profile.status}</p>
          <h1 className="mt-2 text-5xl font-bold tracking-tight text-white [text-wrap:balance] sm:text-6xl">{profile.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-[#c9d4cc] [text-wrap:pretty]">{hero.intro}</p>
          <div className="mt-6 flex flex-wrap gap-2 print:hidden">
            <a href={`mailto:${profile.email}`} className={primaryBtn}>
              <Mail className="size-4" aria-hidden="true" />
              Mail mij
            </a>
            <a href={profile.github} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
              <GithubIcon className="size-4" />
              GitHub
            </a>
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
                <LinkedinIcon className="size-4" />
                LinkedIn
              </a>
            )}
          </div>

          {/* What a recruiter wants to know first: what he is doing now and what he is looking for. */}
          <dl className="mt-10 grid gap-6 border-y border-white/10 py-6 sm:grid-cols-2">
            <div>
              <dt className={label}>Ik zoek</dt>
              <dd className="mt-1 text-lg font-semibold text-white">{wants.title}</dd>
              <dd className="text-[#a6b4aa]">{wants.text}</dd>
            </div>
            <div>
              <dt className={label}>Nu</dt>
              <dd className="mt-1 text-lg font-semibold text-white">{now.title}</dd>
              <dd className="text-[#a6b4aa]">{now.text}</dd>
            </div>
          </dl>
        </header>

        {/* ------------------------------------------------------------ Projects */}
        <Section title="Projecten">
          <ul className="space-y-8">
            {projects.map((p) => (
              <li key={p.title} className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <p className="text-sm text-[#8d9b91] sm:pt-1">{range(p.when)}</p>
                <div>
                  <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                  <p className="text-sm text-[#8d9b91]">
                    {p.where} · {p.role}
                  </p>
                  <p className="mt-2 [text-wrap:pretty]">{p.text}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#a6b4aa]">
                    {p.tags.join(" · ")}
                    {p.link && (
                      <a href={p.link.href} target="_blank" rel="noopener noreferrer" className={linkCls}>
                        {p.link.label}
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/* ------------------------------------------------------------ Experience */}
        <Section title="Werkervaring">
          <Rows
            items={[...experience.development, ...experience.other].map((j) => ({
              when: range(j.when),
              title: `${j.role} bij ${j.company}`,
              text: j.text,
              note: j.gained ? `Geleerd: ${j.gained.toLowerCase()}` : undefined,
            }))}
          />
        </Section>

        {/* ------------------------------------------------------------ Education */}
        <Section title="Opleiding">
          <Rows
            items={education.map((e) => ({
              when: range(e.when),
              title: e.what,
              text: e.school,
            }))}
          />
        </Section>

        {/* ------------------------------------------------------------ Skills */}
        <Section title="Skills">
          <dl className="space-y-4">
            {Object.entries(stack).map(([group, items]) => (
              <div key={group} className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <dt className="text-sm text-[#8d9b91] sm:pt-0.5">{group}</dt>
                <dd className="text-white">{items.join(", ")}</dd>
              </div>
            ))}
            <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-6">
              <dt className="text-sm text-[#8d9b91] sm:pt-0.5">Talen</dt>
              <dd className="text-white">{languages.map((l) => `${l.name} (${l.level.toLowerCase()})`).join(", ")}</dd>
            </div>
          </dl>

          <h3 className="mt-10 text-lg font-semibold text-white">Wat mij typeert</h3>
          <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {softSkills.map((s) => (
              <div key={s.name}>
                <dt className="font-semibold text-white">{s.name}</dt>
                <dd className="text-[#a6b4aa]">{s.proof}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* ------------------------------------------------------------ Contact */}
        <Section title="Contact">
          <p className="text-2xl font-semibold text-white [text-wrap:balance]">Zin om samen te bouwen? Stuur me een mail.</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <a href={`mailto:${profile.email}`} className={primaryBtn}>
              <Mail className="size-4" aria-hidden="true" />
              {profile.email}
            </a>
            <a href={profile.github} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
              <GithubIcon className="size-4" />
              {profile.github.replace("https://", "")}
            </a>
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
                <LinkedinIcon className="size-4" />
                LinkedIn
              </a>
            )}
          </div>
        </Section>
      </div>
    </main>
  )
}

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fe3a6]"
const ghostBtn = `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#c9d4cc] transition-colors hover:bg-white/5 hover:text-white active:bg-white/10 ${focus}`
const primaryBtn = `inline-flex items-center justify-center gap-2 rounded-md bg-[#8fe3a6] px-4 py-2.5 text-sm font-semibold text-[#06140a] transition hover:bg-[#b4f0c4] active:scale-[0.98] ${focus}`
const secondaryBtn = `inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-[#c9d4cc] transition hover:border-white/30 hover:text-white active:scale-[0.98] ${focus}`
const linkCls = `inline-flex items-center gap-1 font-medium text-[#8fe3a6] underline-offset-4 hover:underline ${focus}`
const label = "text-sm font-medium text-[#8fe3a6]"

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-16 break-inside-avoid-page">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-white">{title}</h2>
      {children}
    </section>
  )
}

function Rows({ items }: { items: { when: string; title: string; text: string; note?: string }[] }) {
  return (
    <ol className="space-y-6">
      {items.map((item) => (
        <li key={item.title + item.when} className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-6">
          <p className="text-sm text-[#8d9b91] sm:pt-1">{item.when}</p>
          <div>
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p>{item.text}</p>
            {item.note && <p className="mt-0.5 text-sm text-[#a6b4aa]">{item.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
