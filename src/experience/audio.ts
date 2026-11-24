/**
 * All sound is synthesised with the Web Audio API, no audio files.
 * Browsers only allow sound after a click or key press, so nothing plays
 * before the visitor presses START (or the sound toggle).
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let hum: { stop: () => void } | null = null
let muted = (() => {
  try {
    return localStorage.getItem("muted") === "1"
  } catch {
    return false
  }
})()

const VOLUME = 0.55

function audio() {
  if (!ctx) return null
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

function noiseBuffer(ac: AudioContext) {
  if (noise) return noise
  noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return noise
}

/** Gain envelope: quick attack, exponential release. */
function env(ac: AudioContext, at: number, peak: number, attack: number, release: number) {
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(peak, at + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + release)
  g.connect(master!)
  return g
}

function noiseBurst(ac: AudioContext, at: number, duration: number, peak: number, filter: BiquadFilterType, freq: number, q = 0.7) {
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer(ac)
  src.loop = true
  const f = ac.createBiquadFilter()
  f.type = filter
  f.frequency.value = freq
  f.Q.value = q
  src.connect(f).connect(env(ac, at, peak, 0.005, duration))
  src.start(at, Math.random() * 0.5)
  src.stop(at + duration + 0.05)
}

function tone(ac: AudioContext, at: number, type: OscillatorType, from: number, to: number, duration: number, peak: number) {
  const osc = ac.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(from, at)
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), at + duration)
  const lp = ac.createBiquadFilter()
  lp.type = "lowpass"
  lp.frequency.value = 3200
  osc.connect(lp).connect(env(ac, at, peak, 0.004, duration))
  osc.start(at)
  osc.stop(at + duration + 0.05)
}

export const sound = {
  /** Must be called from a user gesture. */
  unlock() {
    if (ctx) {
      void ctx.resume()
      return
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : VOLUME
    master.connect(ctx.destination)
  },

  setMuted(value: boolean) {
    muted = value
    if (ctx && master) master.gain.setTargetAtTime(value ? 0 : VOLUME, ctx.currentTime, 0.05)
  },

  /** CRT switching to a new program: relay click, degauss thump, static, then a steady hum. */
  start() {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    noiseBurst(ac, t, 0.03, 0.5, "highpass", 2500)
    tone(ac, t + 0.02, "sine", 140, 38, 0.45, 0.7)
    noiseBurst(ac, t + 0.03, 0.35, 0.25, "lowpass", 700)
    noiseBurst(ac, t + 0.05, 0.9, 0.12, "highpass", 4000)
    tone(ac, t + 0.5, "square", 523, 523, 0.07, 0.06)
    tone(ac, t + 0.6, "square", 784, 784, 0.12, 0.06)
    this.hum()
  },

  /** Quiet mains hum plus the faint high whine every CRT makes. */
  hum() {
    const ac = audio()
    if (!ac || hum) return
    const g = ac.createGain()
    g.gain.setValueAtTime(0.0001, ac.currentTime)
    g.gain.exponentialRampToValueAtTime(1, ac.currentTime + 1.5)
    g.connect(master!)
    const oscs = [
      [50, 0.018, "sine"],
      [100, 0.01, "sine"],
      [15625, 0.0025, "sine"],
    ].map(([f, v, type]) => {
      const o = ac.createOscillator()
      o.type = type as OscillatorType
      o.frequency.value = f as number
      const og = ac.createGain()
      og.gain.value = v as number
      o.connect(og).connect(g)
      o.start()
      return o
    })
    hum = {
      stop: () => {
        g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.2)
        oscs.forEach((o) => o.stop(ac.currentTime + 1))
        hum = null
      },
    }
  },

  /** Digital tearing: chopped noise and stepped square chirps. */
  glitch(duration = 0.4, volume = 1) {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    const parts = 4 + Math.floor(Math.random() * 4)
    for (let i = 0; i < parts; i++) {
      const at = t + (i / parts) * duration
      const len = 0.02 + Math.random() * 0.05
      if (Math.random() < 0.55) {
        noiseBurst(ac, at, len, (0.18 + Math.random() * 0.15) * volume, "bandpass", 300 + Math.random() * 4000, 4)
      } else {
        const f = 120 + Math.random() * 1600
        tone(ac, at, "square", f, f * (0.5 + Math.random()), len, 0.07 * volume)
      }
    }
  },

  /** Short system beep when a slide changes. */
  beep() {
    const ac = audio()
    if (!ac) return
    tone(ac, ac.currentTime, "square", 988, 988, 0.05, 0.045)
  },

  /** Pull chain of the desk lamp: a dry double click. */
  cord() {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    noiseBurst(ac, t, 0.018, 0.35, "bandpass", 2200, 3)
    noiseBurst(ac, t + 0.05, 0.012, 0.2, "bandpass", 3200, 3)
    tone(ac, t, "sine", 900, 600, 0.03, 0.05)
  },

  /** Old bulb warming up: a short electrical buzz. */
  buzz() {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    tone(ac, t, "sawtooth", 100, 100, 0.35, 0.02)
    noiseBurst(ac, t, 0.25, 0.04, "bandpass", 1800, 6)
  },

  /** CRT switching off: the high whine drops away with a soft thump. */
  powerOff() {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    noiseBurst(ac, t, 0.03, 0.4, "highpass", 2500)
    tone(ac, t, "sine", 1800, 60, 0.7, 0.08)
    tone(ac, t + 0.02, "sine", 120, 30, 0.5, 0.6)
    noiseBurst(ac, t + 0.05, 0.6, 0.08, "highpass", 5000)
    hum?.stop()
  },

  /** The spark flying through the room. */
  whoosh(duration = 1) {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    const src = ac.createBufferSource()
    src.buffer = noiseBuffer(ac)
    src.loop = true
    const f = ac.createBiquadFilter()
    f.type = "bandpass"
    f.Q.value = 2.5
    f.frequency.setValueAtTime(400, t)
    f.frequency.exponentialRampToValueAtTime(2600, t + duration * 0.6)
    f.frequency.exponentialRampToValueAtTime(700, t + duration)
    const g = ac.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.12, t + duration * 0.5)
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    src.connect(f).connect(g).connect(master!)
    src.start(t)
    src.stop(t + duration + 0.05)
    tone(ac, t, "sine", 660, 1320, duration, 0.025)
  },

  /** The spark bursts into dust: bright chime with a crackle. */
  burst() {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    noiseBurst(ac, t, 0.5, 0.25, "highpass", 3000)
    tone(ac, t, "sine", 80, 30, 0.6, 0.5)
    ;[523, 659, 784, 1047].forEach((f, i) => tone(ac, t + 0.03 + i * 0.07, "triangle", f, f, 0.9, 0.05))
    for (let i = 0; i < 10; i++) noiseBurst(ac, t + 0.1 + Math.random() * 0.8, 0.01, 0.08, "highpass", 6000)
  },

  /** Typing tick for the typewriter text. */
  tick() {
    const ac = audio()
    if (!ac) return
    noiseBurst(ac, ac.currentTime, 0.012, 0.06, "highpass", 3000)
  },
}
