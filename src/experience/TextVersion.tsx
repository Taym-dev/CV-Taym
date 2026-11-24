import { ArrowUpRight, Briefcase, GraduationCap, Languages, Mail, MapPin, Printer, X } from "lucide-react"
import { useEffect, useRef, type ReactNode } from "react"

import { GithubIcon, LinkedinIcon } from "@/components/icons"
import { education, experience, hero, languages, profile, projects, softSkills, stack, tldr } from "@/data/cv"

import { store, useStore } from "./store"

const range = (s: string) => s.replace(/\s*[–-]\s*/g, " tot ")
const PHOTO = `${import.meta.env.BASE_URL}${profile.photo}`

/**
 * The whole CV as a clean, readable page. Always in the DOM (screen readers and search
 * engines read it), visually hidden until the visitor opens "tekstversie".
 */
export function TextVersion() {
  const open = useStore((s) => s.textVersion)
  const closeRef = useRef<HTMLButtonElement>(null)
  const scroller = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    scroller.current?.scrollTo({ top: 0 })
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && store.set({ textVersion: false })
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  }, [open])

  const close = () => store.set({ textVersion: false })
  const now = tldr[0]
  const wants = tldr[2]

  return (
    <main
      ref={scroller}
      className={open ? "cv-page animate-rise-in fixed inset-0 z-30 overflow-y-auto bg-[#060a07] text-[#cfdcd2]" : "sr-only"}
      aria-label={`Cv van ${profile.name}`}
    >
      {/* Faint grid and glow, a quiet nod to the terminal. */}
      {open && (
        <div
          className="pointer-events-none fixed inset-0 opacity-60 print:hidden"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 0%, #7fe39a14, transparent 55%), linear-gradient(#7fe39a08 1px, transparent 1px), linear-gradient(90deg, #7fe39a08 1px, transparent 1px)",
            backgroundSize: "100% 100%, 32px 32px, 32px 32px",
          }}
        />
      )}

      {open && (
        <div className="sticky top-0 z-10 border-b border-[#1a2a1f] bg-[#060a07]/85 backdrop-blur-md print:hidden">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
            <span className="font-[VT323] text-lg text-[#3d9a5a]">cv_taym.txt</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => print()} className={toolbarBtn}>
                <Printer className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">printen / pdf</span>
              </button>
              <button ref={closeRef} type="button" onClick={close} className={toolbarBtn}>
                <X className="size-4" aria-hidden="true" />
                sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative mx-auto max-w-4xl px-4 pb-24 pt-10 text-[15.5px] leading-relaxed sm:px-6 sm:pt-14">
        {/* ------------------------------------------------------------ Header */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          <img
            src={PHOTO}
            alt={`Portret van ${profile.name}`}
            width={128}
            height={128}
            className="size-28 shrink-0 rounded-full border-2 border-[#7fe39a]/60 object-cover shadow-[0_0_40px_#7fe39a33] sm:size-32"
          />
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#7fe39a]/30 bg-[#7fe39a]/10 px-3 py-1 text-sm text-[#a9f0bd]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#7fe39a] opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-[#7fe39a]" />
              </span>
              {profile.status}
            </p>
            <h1 className="mt-3 font-[VT323] text-[clamp(3rem,10vw,4.75rem)] leading-[0.85] text-[#e6fbe9] [text-shadow:0_0_24px_#7fe39a40]">
              {profile.name}
            </h1>
            <p className="mt-2 text-lg text-[#9fb8a5]">
              {profile.role} in opleiding · {profile.education}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 print:hidden">
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
          </div>
        </header>

        {/* Quick facts */}
        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#1a2a1f] bg-[#1a2a1f] sm:grid-cols-4">
          <Fact icon={<MapPin className="size-4" />} label="Woont in" value={profile.city} />
          <Fact icon={<GraduationCap className="size-4" />} label="Opleiding" value="mbo 4, Da Vinci" />
          <Fact icon={<Briefcase className="size-4" />} label="Werkt sinds" value="2022" />
          <Fact icon={<Languages className="size-4" />} label="Talen" value={profile.languages.join(" · ")} />
        </dl>

        {/* ------------------------------------------------------------ About */}
        <Section n="01" title="Over mij">
          <p className="text-[17px] leading-relaxed text-[#dce8de]">{hero.intro}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Card>
              <p className={eyebrow}>Nu</p>
              <p className="mt-1 font-semibold text-[#eef6ef]">{now.title}</p>
              <p className="mt-1 text-[#a9bcae]">{now.text}</p>
            </Card>
            <Card highlight>
              <p className={eyebrow}>Ik zoek</p>
              <p className="mt-1 font-semibold text-[#eef6ef]">{wants.title}</p>
              <p className="mt-1 text-[#a9bcae]">{wants.text}</p>
            </Card>
          </div>
        </Section>

        {/* ------------------------------------------------------------ Projects */}
        <Section n="02" title="Projecten">
          <ul className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <li key={p.title}>
                <Card className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold leading-snug text-[#eef6ef]">{p.title}</h3>
                    <span className="shrink-0 rounded-md bg-[#7fe39a]/10 px-2 py-0.5 font-[VT323] text-base text-[#7fe39a]">{range(p.when)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-[#7f9686]">
                    {p.where} · {p.role}
                  </p>
                  <p className="mt-3 flex-1 text-[#c3d2c7]">{p.text}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {p.tags.map((t) => (
                      <Chip key={t}>{t}</Chip>
                    ))}
                    {p.link && (
                      <a href={p.link.href} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-sm text-[#7fe39a] underline-offset-4 hover:text-[#c8ffd2] hover:underline">
                        {p.link.label}
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </Section>

        {/* ------------------------------------------------------------ Experience */}
        <Section n="03" title="Werkervaring">
          <p className={subhead}>In de IT</p>
          <Timeline
            items={experience.development.map((j) => ({
              when: range(j.when),
              title: `${j.role} bij ${j.company}`,
              text: j.text,
            }))}
            strong
          />
          <p className={`${subhead} mt-10`}>Naast school</p>
          <Timeline
            items={experience.other.map((j) => ({
              when: range(j.when),
              title: `${j.role} bij ${j.company}`,
              text: j.text,
              tag: j.gained ? `Geleerd: ${j.gained}` : undefined,
            }))}
          />
        </Section>

        {/* ------------------------------------------------------------ Education */}
        <Section n="04" title="Opleiding">
          <Timeline
            items={education.map((e) => ({
              when: range(e.when),
              title: e.what,
              text: e.school,
              tag: e.current ? "Bezig" : undefined,
            }))}
            strong
          />
        </Section>

        {/* ------------------------------------------------------------ Skills */}
        <Section n="05" title="Skills">
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(stack).map(([group, items]) => (
              <Card key={group}>
                <p className={eyebrow}>{group}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {items.map((i) => (
                    <Chip key={i} bright>
                      {i}
                    </Chip>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <p className={subhead}>Talen</p>
              <ul className="mt-4 space-y-4">
                {languages.map((l) => (
                  <li key={l.name}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[#eef6ef]">{l.name}</span>
                      <span className="text-sm text-[#7f9686]">{l.level}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#1a2a1f]" role="presentation">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#3d9a5a] to-[#9dffb6]" style={{ width: `${l.value}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={subhead}>Wat mij typeert</p>
              <ul className="mt-4 space-y-3">
                {softSkills.map((s) => (
                  <li key={s.name} className="border-l-2 border-[#7fe39a]/40 pl-3">
                    <span className="font-semibold text-[#eef6ef]">{s.name}</span>
                    <p className="text-[#a9bcae]">{s.proof}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* ------------------------------------------------------------ Contact */}
        <Section n="06" title="Contact">
          <div className="overflow-hidden rounded-2xl border border-[#7fe39a]/30 bg-gradient-to-br from-[#0f2015] to-[#08100a] p-6 sm:p-8">
            <p className="font-[VT323] text-4xl leading-none text-[#e6fbe9] sm:text-5xl">Zin om samen te bouwen?</p>
            <p className="mt-3 max-w-xl text-[#a9bcae]">Stuur me een mail, dan reageer ik snel. Mijn code staat op GitHub.</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
          </div>
        </Section>

        {open && (
          <p className="mt-16 text-center font-[VT323] text-lg text-[#3d9a5a] print:hidden">
            <button type="button" onClick={close} className="underline-offset-4 hover:text-[#7fe39a] hover:underline">
              terug naar de kamer
            </button>
          </p>
        )}
      </div>
    </main>
  )
}

const toolbarBtn =
  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-[VT323] text-lg leading-none text-[#7fe39a] transition-colors hover:bg-[#7fe39a]/10 hover:text-[#c8ffd2] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#7fe39a]"
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#9dffb6] px-4 py-2.5 text-sm font-semibold text-[#04130a] shadow-[0_0_24px_#7fe39a40] transition hover:bg-[#c8ffd2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9dffb6] active:scale-[0.98]"
const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#2c4634] px-4 py-2.5 text-sm font-semibold text-[#cfdcd2] transition hover:border-[#7fe39a] hover:text-[#e6fbe9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9dffb6] active:scale-[0.98]"
const eyebrow = "font-[VT323] text-lg leading-none text-[#7fe39a]"
const subhead = "font-[VT323] text-xl leading-none text-[#7fe39a]"

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="mt-16 break-inside-avoid-page">
      <h2 className="mb-6 flex items-baseline gap-3 border-b border-[#1a2a1f] pb-3">
        <span className="font-[VT323] text-xl text-[#3d9a5a]">{n}</span>
        <span className="text-2xl font-semibold tracking-tight text-[#eef6ef]">{title}</span>
      </h2>
      {children}
    </section>
  )
}

function Card({ children, className = "", highlight = false }: { children: ReactNode; className?: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-5 transition-colors ${highlight ? "border-[#7fe39a]/40 bg-[#7fe39a]/[0.07]" : "border-[#1a2a1f] bg-[#0a120c]/80 hover:border-[#2c4634]"} ${className}`}
    >
      {children}
    </div>
  )
}

function Chip({ children, bright = false }: { children: ReactNode; bright?: boolean }) {
  return (
    <span className={`rounded-md border px-2 py-0.5 text-[13px] ${bright ? "border-[#2c4634] bg-[#0f1a12] text-[#dce8de]" : "border-[#1f3326] text-[#8fa896]"}`}>
      {children}
    </span>
  )
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[#0a120c] p-4">
      <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#6f8676]">
        <span className="text-[#7fe39a]" aria-hidden="true">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-[#eef6ef]">{value}</dd>
    </div>
  )
}

function Timeline({ items, strong = false }: { items: { when: string; title: string; text: string; tag?: string }[]; strong?: boolean }) {
  return (
    <ol className="relative mt-4 space-y-6 border-l border-[#2c4634] pl-6">
      {items.map((item) => (
        <li key={item.title + item.when} className="relative">
          <span
            className={`absolute -left-[31px] top-1.5 size-3 rounded-full border-2 ${strong ? "border-[#9dffb6] bg-[#060a07] shadow-[0_0_12px_#7fe39a80]" : "border-[#3d9a5a] bg-[#060a07]"}`}
            aria-hidden="true"
          />
          <p className="font-[VT323] text-lg leading-none text-[#7f9686]">{item.when}</p>
          <h3 className={`mt-1 font-semibold ${strong ? "text-lg text-[#eef6ef]" : "text-[#dce8de]"}`}>
            {item.title}
            {item.tag && <span className="ml-2 align-middle text-xs font-normal text-[#7fe39a]">· {item.tag}</span>}
          </h3>
          <p className="text-[#a9bcae]">{item.text}</p>
        </li>
      ))}
    </ol>
  )
}
