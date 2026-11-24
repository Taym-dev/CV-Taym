import * as THREE from "three"

import { experience, hero, languages, profile, projects, softSkills, stack, tldr } from "@/data/cv"

import { sound } from "../audio"
import { fx, goToSlide, isTouch, quit, replay, setPhase, SLIDE_COUNT, startTour, store } from "../store"

/**
 * Everything shown on the CRT is drawn here on a 2D canvas, every frame.
 * The canvas becomes a texture on the Screen mesh (see crtMaterial.ts).
 */

export const W = 1024
export const H = 768

const BRIGHT = "#c8ffd2"
const MID = "#7fe39a"
const DIM = "#3d9a5a"
const FAINT = "#163d24"
const BG = "#020604"
const FONT = '"VT323", "JetBrains Mono", monospace'

/** Boot timeline, seconds after the camera arrives at the desk. */
const BOOT_DELAY = 0.8
const LOAD_FROM = 2.6
const LOAD_TO = 5.0

type Region = { x: number; y: number; w: number; h: number; onClick: () => void }

/** Dutch date ranges without dashes: "2025 – 2026" becomes "2025 tot 2026". */
const range = (s: string) => s.replace(/\s*[–-]\s*/g, " tot ")

/** Same curvature as the shader, so clicks land where the picture shows it. */
export function curve(u: number, v: number) {
  let x = u * 2 - 1
  let y = v * 2 - 1
  const nx = x * (1 + y * y * 0.055)
  const ny = y * (1 + x * x * 0.055)
  x = nx
  y = ny
  return [(x + 1) / 2, (y + 1) / 2] as const
}

export class ScreenCanvas {
  readonly canvas: HTMLCanvasElement
  readonly texture: THREE.CanvasTexture
  private ctx: CanvasRenderingContext2D
  private regions: Region[] = []
  private hoverIndex = -1
  private typedChars = 0
  private lastTick = 0

  constructor() {
    this.canvas = document.createElement("canvas")
    this.canvas.width = W
    this.canvas.height = H
    this.ctx = this.canvas.getContext("2d")!
    this.texture = new THREE.CanvasTexture(this.canvas)
    // glTF UVs have v = 0 at the top, like the canvas.
    this.texture.flipY = false
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.anisotropy = 4
  }

  // ---------------------------------------------------------------------------
  // Input

  private regionAt(u: number, v: number) {
    const [cu, cv] = curve(u, v)
    const x = cu * W
    const y = cv * H
    return this.regions.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)
  }

  /** Returns true when the pointer is over something clickable. */
  hover(u: number, v: number) {
    this.hoverIndex = this.regionAt(u, v)
    return this.hoverIndex >= 0
  }

  leave() {
    this.hoverIndex = -1
  }

  click(u: number, v: number) {
    const i = this.regionAt(u, v)
    if (i >= 0) {
      this.regions[i].onClick()
      return true
    }
    return false
  }

  // ---------------------------------------------------------------------------
  // Drawing helpers

  private text(str: string, x: number, y: number, size: number, color = MID, align: CanvasTextAlign = "left", glow = 0) {
    const c = this.ctx
    c.font = `${size}px ${FONT}`
    c.textAlign = align
    c.textBaseline = "top"
    c.fillStyle = color
    c.shadowColor = color
    c.shadowBlur = glow
    c.fillText(str, x, y)
    c.shadowBlur = 0
    return c.measureText(str).width
  }

  private measure(str: string, size: number) {
    this.ctx.font = `${size}px ${FONT}`
    return this.ctx.measureText(str).width
  }

  private wrap(str: string, maxWidth: number, size: number) {
    this.ctx.font = `${size}px ${FONT}`
    const words = str.split(" ")
    const lines: string[] = []
    let line = ""
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (this.ctx.measureText(test).width > maxWidth && line) {
        lines.push(line)
        line = w
      } else line = test
    }
    if (line) lines.push(line)
    return lines
  }

  /** Typewriter: returns the part of str visible after `elapsed` seconds. */
  private typed(str: string, elapsed: number, cps = 60) {
    const n = Math.max(0, Math.floor(elapsed * cps))
    this.typedChars += Math.min(n, str.length)
    return str.slice(0, n)
  }

  private cursor(x: number, y: number, size: number, now: number) {
    if (Math.floor(now * 2.2) % 2) return
    this.ctx.fillStyle = BRIGHT
    this.ctx.shadowColor = BRIGHT
    this.ctx.shadowBlur = 10
    this.ctx.fillRect(x + 4, y + size * 0.12, size * 0.45, size * 0.78)
    this.ctx.shadowBlur = 0
  }

  private button(label: string, x: number, y: number, w: number, h: number, size: number, onClick: () => void, now: number) {
    const index = this.regions.push({ x, y, w, h, onClick }) - 1
    const hot = this.hoverIndex === index
    const c = this.ctx
    const pulse = 0.55 + 0.45 * Math.sin(now * 3)
    c.shadowColor = BRIGHT
    c.shadowBlur = hot ? 26 : 10 + pulse * 10
    if (hot) {
      c.fillStyle = BRIGHT
      c.fillRect(x, y, w, h)
    }
    c.strokeStyle = BRIGHT
    c.lineWidth = 4
    c.strokeRect(x, y, w, h)
    c.lineWidth = 2
    c.strokeRect(x + 9, y + 9, w - 18, h - 18)
    c.shadowBlur = 0
    this.text(label, x + w / 2, y + (h - size) / 2 + size * 0.04, size, hot ? BG : BRIGHT, "center", hot ? 0 : 14)
  }

  private link(label: string, x: number, y: number, size: number, onClick: () => void) {
    this.ctx.font = `${size}px ${FONT}`
    const w = this.ctx.measureText(label).width
    const index = this.regions.push({ x: x - 8, y: y - 6, w: w + 16, h: size + 12, onClick }) - 1
    const hot = this.hoverIndex === index
    if (hot) {
      this.ctx.fillStyle = BRIGHT
      this.ctx.fillRect(x - 8, y - 4, w + 16, size + 6)
    }
    this.text(label, x, y, size, hot ? BG : BRIGHT, "left", hot ? 0 : 8)
    return w
  }

  private bar(x: number, y: number, cells: number, filled: number, cell = 22, gap = 5) {
    for (let i = 0; i < cells; i++) {
      this.ctx.fillStyle = i < filled ? BRIGHT : FAINT
      this.ctx.shadowColor = BRIGHT
      this.ctx.shadowBlur = i < filled ? 8 : 0
      this.ctx.fillRect(x + i * (cell + gap), y, cell, cell * 1.4)
    }
    this.ctx.shadowBlur = 0
  }

  // ---------------------------------------------------------------------------
  // Frame

  update(now: number) {
    const c = this.ctx
    this.regions = []
    this.typedChars = 0
    c.fillStyle = BG
    c.fillRect(0, 0, W, H)

    const { phase } = store.get()
    if (phase === "boot") this.drawBoot(now - fx.phaseAt - BOOT_DELAY, now)
    else if (phase === "ready") this.drawReady(now - fx.phaseAt, now)
    else if (phase === "tour" || phase === "off") this.drawTour(now)

    // Typing sound while text appears (throttled).
    if (this.typedChars !== this.lastTick && now - this.lastTickTime > 0.045 && phase !== "ready") {
      if (this.typedChars > this.lastTick) sound.tick()
      this.lastTickTime = now
    }
    this.lastTick = this.typedChars
    this.texture.needsUpdate = true
  }

  private lastTickTime = 0

  private drawBoot(t: number, now: number) {
    if (t < 0) return
    const x = 70
    this.text("TA-86 BIOS v1.04   (C) 1986 Soldani", x, 60, 30, DIM)
    if (t > 0.35) {
      const kb = Math.min(640, Math.floor(((t - 0.35) / 0.7) * 640))
      this.text(`Geheugen test ..... ${String(kb).padStart(3, " ")}K ${kb === 640 ? "OK" : ""}`, x, 96, 30, DIM)
    }
    if (t > 1.15) this.text(this.typed("C:\\> dir /w", t - 1.15, 30), x, 150, 30, MID)
    if (t > 1.6) this.text("PORTFOLIO_TAYM.EXE     86.420  24-11-26", x, 186, 30, DIM)

    // The command, big and centred.
    if (t > 2.0) {
      this.text(this.typed("C:\\> start", t - 2.0, 24), W / 2, 270, 44, MID, "center", 6)
      const name = this.typed("portfolio_Taym.exe", t - 2.45, 26)
      const w = this.text(name, W / 2, 318, 92, BRIGHT, "center", 18)
      if (t < LOAD_FROM) this.cursor(W / 2 + w / 2, 318, 92, now)
    }

    // Loading animation.
    if (t > LOAD_FROM) {
      const p = Math.min(1, (t - LOAD_FROM) / (LOAD_TO - LOAD_FROM))
      // Uneven progress, like a real disk read.
      const eased = Math.min(1, p + Math.sin(p * 19) * 0.035 * (1 - p))
      const cells = 24
      const cellW = 22
      const gap = 5
      const total = cells * (cellW + gap) - gap
      this.bar((W - total) / 2, 460, cells, Math.round(eased * cells), cellW, gap)
      this.text(`${Math.round(eased * 100)}%`, W / 2, 515, 36, BRIGHT, "center", 8)
      const steps = ["profiel laden", "projecten laden", "ervaring laden", "skills laden", "klaar"]
      const step = steps[Math.min(steps.length - 1, Math.floor(eased * (steps.length - 1) + 0.02))]
      this.text(step, W / 2, 560, 30, DIM, "center")
      // Spinner.
      const spin = "|/-\\"[Math.floor(now * 12) % 4]
      if (p < 1) this.text(spin, W / 2 + total / 2 + 22, 462, 36, BRIGHT)
    }
    if (t > LOAD_TO + 0.5) setPhase("ready")
  }

  private drawReady(t: number, now: number) {
    this.text("portfolio_Taym.exe", W / 2, 150, 46, MID, "center", 8)
    this.text("rondleiding door het cv van Taym Alsudani", W / 2, 205, 30, DIM, "center")
    const bw = 470
    const bh = 170
    // Button drops in with a little overshoot.
    const k = Math.min(1, t / 0.35)
    const drop = (1 - k) * 30
    this.button("START", (W - bw) / 2, 290 - drop, bw, bh, 128, startTour, now)
    const hint = "klik op START of druk op Enter"
    const w = this.text(hint, W / 2, 505, 32, MID, "center")
    this.cursor(W / 2 + w / 2, 505, 32, now)
    this.text(isTouch() ? "daarna zelf bladeren door te vegen" : "daarna zelf bladeren met de pijltjes", W / 2, 550, 26, DIM, "center")
  }

  // ---------------------------------------------------------------------------
  // Tour

  private drawTour(now: number) {
    const { slide } = store.get()
    const t = now - fx.slideAt

    // Top bar.
    this.text("portfolio_Taym.exe", 54, 30, 28, DIM)
    this.text(`${slide + 1} / ${SLIDE_COUNT}`, W - 54, 30, 28, DIM, "right")
    this.ctx.fillStyle = FAINT
    this.ctx.fillRect(54, 66, W - 108, 2)

    if (t < 0) {
      // Camera is still moving in.
      const p = Math.min(1, (t + 1.4) / 1.4)
      this.text("programma wordt gestart", W / 2, 330, 40, MID, "center", 6)
      this.bar(W / 2 - 160, 390, 12, Math.round(p * 12), 22, 5)
    } else {
      const draw = [this.slideIntro, this.slideNow, this.slideProjects, this.slideExperience, this.slideSkills, this.slideContact][slide]
      draw.call(this, t, now)
    }

    // Bottom: arrows and one segment per slide, filled up to the current one.
    const y = H - 74
    const x0 = 120
    const x1 = W - 120
    const seg = (x1 - x0) / SLIDE_COUNT
    for (let i = 0; i < SLIDE_COUNT; i++) {
      const sx = x0 + i * seg + 3
      const sw = seg - 6
      const index = this.regions.push({ x: sx, y: y - 14, w: sw, h: 40, onClick: () => goToSlide(i) }) - 1
      this.ctx.fillStyle = this.hoverIndex === index ? DIM : FAINT
      this.ctx.fillRect(sx, y + 4, sw, 6)
      if (i <= slide) {
        this.ctx.fillStyle = i === slide ? BRIGHT : MID
        this.ctx.shadowColor = BRIGHT
        this.ctx.shadowBlur = i === slide ? 12 : 4
        this.ctx.fillRect(sx, y + 4, sw, 6)
        this.ctx.shadowBlur = 0
      }
    }
    this.arrow(-1, 40, y - 16, slide > 0, () => goToSlide(slide - 1), now)
    this.arrow(1, W - 100, y - 16, slide < SLIDE_COUNT - 1, () => goToSlide(slide + 1), now)
    const hint = slide === SLIDE_COUNT - 1
      ? "kies hierboven: opnieuw kijken of afsluiten"
      : isTouch()
        ? "veeg naar links of tik op het scherm voor de volgende"
        : "\u2190 \u2192 pijltjes om te bladeren, Esc om terug te gaan"
    this.text(hint, W / 2, H - 42, 24, DIM, "center")
  }

  /** Clickable arrow in the control bar. Blinks on the first slide so people see it. */
  private arrow(dir: -1 | 1, x: number, y: number, enabled: boolean, onClick: () => void, now: number) {
    const w = 60
    const h = 46
    const c = this.ctx
    let color = FAINT
    if (enabled) {
      const index = this.regions.push({ x, y, w, h, onClick }) - 1
      const nudge = dir === 1 && !store.get().navigated
      const pulse = nudge ? 0.5 + 0.5 * Math.sin(now * 6) : 1
      color = this.hoverIndex === index || pulse > 0.6 ? BRIGHT : MID
      if (nudge) x += Math.sin(now * 6) * 4
    }
    c.fillStyle = color
    c.shadowColor = color
    c.shadowBlur = enabled ? 10 : 0
    c.beginPath()
    const cx = x + w / 2
    const cy = y + h / 2
    c.moveTo(cx - dir * 12, cy - 15)
    c.lineTo(cx + dir * 14, cy)
    c.lineTo(cx - dir * 12, cy + 15)
    c.closePath()
    c.fill()
    c.shadowBlur = 0
  }

  private prompt(cmd: string, t: number) {
    this.text(this.typed(`C:\\> ${cmd}`, t, 40), 70, 100, 32, DIM)
  }

  private paragraph(str: string, x: number, y: number, width: number, size: number, t: number, color = MID, cps = 90) {
    const lines = this.wrap(str, width, size)
    let shown = Math.max(0, Math.floor(t * cps))
    lines.forEach((line, i) => {
      if (shown <= 0) return
      this.text(line.slice(0, shown), x, y + i * size * 1.15, size, color)
      this.typedChars += Math.min(shown, line.length)
      shown -= line.length + 1
    })
    return y + lines.length * size * 1.15
  }

  private slideIntro(t: number, now: number) {
    this.prompt("whoami", t)
    const x = 70
    if (t > 0.5) this.text(this.typed("TAYM ALSUDANI", t - 0.5, 18), x, 150, 112, BRIGHT, "left", 20)
    if (t > 1.4) this.text(this.typed(`${profile.role.toLowerCase()} in opleiding, ${profile.city}`, t - 1.4, 45), x, 270, 38, MID)
    let y = 340
    if (t > 2.2) y = this.paragraph(hero.intro, x, y, W - 140, 32, t - 2.2, MID, 70)
    if (t > 6.2) {
      const status = `> ${profile.status.toLowerCase().replace("&", "en")}`
      const w = this.text(this.typed(status, t - 6.2, 30), x, Math.max(y + 26, 560), 36, BRIGHT, "left", 10)
      this.cursor(x + w, Math.max(y + 26, 560), 36, now)
    }
  }

  private slideNow(t: number) {
    this.prompt("type nu.txt", t)
    const now = tldr[0]
    if (t > 0.5) this.text(this.typed(now.title, t - 0.5, 34), 70, 160, 60, BRIGHT, "left", 14)
    if (t > 1.8) this.paragraph(now.text, 70, 245, W - 140, 36, t - 1.8)
    const zoekt = tldr[2]
    if (t > 4.2) {
      this.ctx.fillStyle = FAINT
      this.ctx.fillRect(70, 430, W - 140, 2)
      this.text(this.typed(`zoekt: ${zoekt.title.toLowerCase()}`, t - 4.2, 40), 70, 460, 44, BRIGHT, "left", 8)
      if (t > 5.2) this.paragraph(zoekt.text, 70, 520, W - 140, 34, t - 5.2)
    }
  }

  private slideProjects(t: number) {
    this.prompt("dir projecten", t)
    // Rows share the space between the prompt and the controls.
    const rowH = Math.min(160, 530 / projects.length)
    projects.forEach((p, i) => {
      const at = 0.6 + i * 1.4
      if (t < at) return
      const y = 145 + i * rowH
      this.text(this.typed(p.title, t - at, 40), 70, y, 42, BRIGHT, "left", 10)
      this.text(`${p.where}, ${range(p.when)}`, W - 70, y + 10, 26, DIM, "right")
      const tags = p.tags.map((tag) => `[${tag}]`).join(" ")
      const tagY = y + rowH - 36
      this.paragraph(p.text, 70, y + 46, W - 140, 25, t - at - 0.4, MID, 120)
      if (t > at + 1.0) this.text(tags, 70, tagY, 24, DIM)
      if (p.link && t > at + 1.0) {
        const href = p.link.href
        const tw = this.measure(tags, 24)
        this.link(`> ${p.link.label.toLowerCase()}`, 90 + tw, tagY, 24, () => window.open(href, "_blank", "noopener"))
      }
    })
  }

  private slideExperience(t: number) {
    this.prompt("type ervaring.txt", t)
    let y = 150
    // Every job looks the same: date, role and company, and what it taught.
    const note = (j: { gained?: string; text: string }) => (j.gained ? `geleerd: ${j.gained.toLowerCase().replace("&", "en")}` : j.text.toLowerCase())
    const rows = [...experience.development, ...experience.other].map((j) => ({
      when: range(j.when).toLowerCase(),
      what: `${j.role.toLowerCase()} bij ${j.company}`,
      note: note(j),
    }))
    const dateCol = 250
    const textX = 70 + dateCol + 24
    rows.forEach((r, i) => {
      const at = 0.5 + i * 0.75
      if (t < at) return
      if (i === experience.development.length) {
        this.ctx.fillStyle = FAINT
        this.ctx.fillRect(70, y - 6, W - 140, 2)
        this.text("naast school", 70, y + 4, 24, DIM)
        y += 40
      }
      // Long dates shrink so they never run into the job title.
      let size = 28
      while (size > 18 && this.measure(r.when, size) > dateCol) size--
      this.text(r.when, 70, y + (28 - size) / 2 + 2, size, DIM)
      this.text(this.typed(r.what, t - at, 50), textX, y, 31, BRIGHT, "left", 6)
      y += 36
      this.text(r.note, textX, y, 24, MID)
      y += 40
    })
  }

  private slideSkills(t: number) {
    this.prompt("dir skills", t)
    let y = 150
    Object.entries(stack).forEach(([group, items], i) => {
      const at = 0.5 + i * 0.8
      if (t < at) return
      this.text(group.toLowerCase(), 70, y + 2, 30, DIM)
      // Wrap so long groups (front-end) never run off the screen.
      const lines = this.wrap(items.join("   "), W - 70 - 260, 34)
      let shown = Math.max(0, Math.floor((t - at) * 60))
      lines.forEach((line, li) => {
        if (shown <= 0) return
        this.text(line.slice(0, shown), 260, y + li * 36, 34, BRIGHT, "left", 8)
        this.typedChars += Math.min(shown, line.length)
        shown -= line.length + 3
      })
      y += lines.length * 36 + 10
    })
    y += 14
    if (t > 3.8) {
      this.text("talen", 70, y, 30, DIM)
      languages.forEach((l, i) => {
        const at = 3.8 + i * 0.35
        if (t < at) return
        const ly = y + i * 40
        this.text(l.name.toLowerCase(), 260, ly - 2, 32, MID)
        const fill = Math.round((l.value / 100) * 14 * Math.min(1, (t - at) / 0.6))
        this.bar(470, ly + 2, 14, fill, 16, 4)
        this.text(l.level.toLowerCase(), 770, ly - 2, 28, DIM)
      })
      y += languages.length * 40 + 20
    }
    if (t > 5.4) {
      this.text("verder", 70, y, 30, DIM)
      this.paragraph(softSkills.map((s) => s.name.toLowerCase()).join(", "), 260, y - 2, W - 330, 32, t - 5.4, MID, 50)
    }
  }

  private slideContact(t: number, now: number) {
    this.prompt("contact", t)
    if (t > 0.5) this.text(this.typed("Zin om samen", t - 0.5, 24), 70, 160, 84, BRIGHT, "left", 18)
    if (t > 1.1) this.text(this.typed("te bouwen?", t - 1.1, 24), 70, 240, 84, BRIGHT, "left", 18)
    if (t < 1.9) return
    let y = 370
    this.text("mail", 70, y + 4, 28, DIM)
    this.link(profile.email, 240, y, 40, () => {
      window.location.href = `mailto:${profile.email}`
    })
    y += 64
    this.text("github", 70, y + 4, 28, DIM)
    this.link(profile.github.replace("https://", ""), 240, y, 40, () => window.open(profile.github, "_blank", "noopener"))
    if (profile.linkedin) {
      y += 64
      this.text("linkedin", 70, y + 4, 28, DIM)
      this.link("linkedin", 240, y, 40, () => window.open(profile.linkedin, "_blank", "noopener"))
    }
    if (t < 2.6) return
    // The end: two big choices.
    const by = H - 200
    const bw = 380
    const bh = 84
    this.button("KIJK OPNIEUW", 70, by, bw, bh, 46, replay, now)
    this.button("AFSLUITEN", W - 70 - bw, by, bw, bh, 46, quit, now)
  }
}
