// Alle tekst van de site staat hier. Pas dit bestand aan, de rest volgt vanzelf.
// Regels met "CHECK" moet Taym nog controleren of invullen.

export type Accent = "main" | "blue" | "red" | "yellow"

export const profile = {
  name: "Taym Alsudani",
  firstName: "Taym",
  role: "Software Developer",
  education: "mbo 4 · Da Vinci College",
  city: "Dordrecht",
  email: "alsudani.taym@gmail.com",
  github: "https://github.com/Taym-dev",
  repo: "https://github.com/Taym-dev/CV-Taym",
  linkedin: "", // CHECK: plak hier je LinkedIn-URL, leeg = verborgen
  cvPdf: "", // CHECK: zet cv.pdf in /public en vul hier "cv.pdf" in
  photo: "taym.png",
  status: "Open voor stage & werk", // CHECK
  languages: ["NL", "EN", "AR"],
}

export const hero = {
  headline: ["Ik bouw websites", "en apps."],
  subs: ["Van knop tot database.", "Van schets tot live.", "Van bug tot fix."],
  intro:
    "Ik ben Taym, mbo-4 student Software Developer uit Dordrecht. Op dit moment bouw ik bij het Practoraat van Avans Hogeschool zowel de voorkant als de achterkant van een slimme-meterapp.",
}

export const tldr: { label: string; title: string; text: string; accent: Accent }[] = [
  {
    label: "Nu",
    title: "Stagiair bij Practoraat Avans",
    text: "Voor- en achterkant van een slimme-meterapp. 2025 – 2026.",
    accent: "main",
  },
  {
    label: "Opleiding",
    title: "mbo 4 Software Developer",
    text: "Da Vinci College Dordrecht, sinds 2023.",
    accent: "blue",
  },
  {
    label: "Zoekt",
    // CHECK: maak dit concreet (stage / BBL / bijbaan, vanaf wanneer, hoeveel uur)
    title: "Een team om mee te bouwen",
    text: "Stage, bijbaan of eerste baan als developer.",
    accent: "yellow",
  },
]

// CHECK: vul aan met wat je echt gebruikt; dit is een voorzet
export const stack = {
  "Front-end": ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Tailwind"],
  "Back-end": ["PHP", "SQL", "REST API's"],
  Tools: ["Git", "GitHub", "VS Code", "Figma"],
}

export type Project = {
  title: string
  where: string
  when: string
  text: string
  role: string
  tags: string[]
  link?: { label: string; href: string }
  accent: Accent
}

export const projects: Project[] = [
  {
    title: "Slimme-meterapp",
    where: "Practoraat Avans Hogeschool",
    when: "2025 – 2026",
    text: "Een app rond de slimme meter. Ik werk aan het hele verhaal: de schermen die de gebruiker ziet én de logica en data erachter.",
    role: "Front-end + back-end",
    tags: ["Front-end", "Back-end"], // CHECK: welke talen/frameworks?
    accent: "main",
  },
  {
    title: "Websites voor klanten",
    where: "Webroses",
    when: "Aug 2024 – Feb 2025",
    text: "Zes maanden stage bij een webbureau. Ik bouwde mee aan websites en leerde werken met echte deadlines en feedback.",
    role: "Stagiair developer",
    tags: ["Websites"], // CHECK: welke tools (WordPress, HTML/CSS, ...)?
    accent: "blue",
  },
  {
    title: "Deze site",
    where: "Eigen project",
    when: "2026",
    text: "Mijn cv als website. Ontworpen en gebouwd met React, TypeScript en Tailwind, op neo-brutalist shadcn/ui-componenten.",
    role: "Ontwerp + bouw",
    tags: ["React", "TypeScript", "Tailwind", "shadcn/ui"],
    link: { label: "Bekijk de code", href: "https://github.com/Taym-dev/CV-Taym" },
    accent: "red",
  },
]

export type Job = {
  role: string
  company: string
  when: string
  text: string
  gained?: string
}

export const experience: { development: Job[]; other: Job[] } = {
  development: [
    {
      role: "Stagiair",
      company: "Practoraat Avans Hogeschool", // CHECK: officiële naam
      when: "2025 – 2026",
      text: "Verantwoordelijk voor zowel de voorkant als de achterkant van een slimme-meterapp.",
    },
    {
      role: "Stagiair",
      company: "Webroses",
      when: "Aug 2024 – Feb 2025",
      text: "Websites bouwen binnen een webbureau.",
    },
  ],
  other: [
    {
      role: "Bezorger",
      company: "Jumbo Bezorgservice",
      when: "2025 – 2026",
      text: "Boodschappen bezorgen, met klantcontact aan de deur.",
      gained: "Klantcontact",
    },
    {
      role: "Bezorger",
      company: "New York Pizza",
      when: "2023 – 2025",
      text: "Bezorgen onder tijdsdruk, zelfstandig op pad.",
      gained: "Tempo & zelfstandigheid",
    },
    {
      role: "Stagiair",
      company: "Karwei",
      when: "Mei – Juli 2023",
      text: "Twee maanden stage in een winkelteam.",
      gained: "Samenwerken",
    },
    {
      role: "Bezorger",
      company: "Flink",
      when: "2022 – 2023",
      text: "Mijn eerste bijbaan: boodschappen bezorgen.",
      gained: "Verantwoordelijkheid",
    },
  ],
}

export const softSkills = [
  { name: "Communicatie", proof: "Sinds 2022 dagelijks klantcontact, bij drie verschillende bezorgdiensten." },
  { name: "Samenwerking", proof: "Stages in een winkelteam, bij een webbureau en in een onderzoeksgroep." },
  { name: "Doelbewust", proof: "Al vier jaar school en werk tegelijk." },
  { name: "Flexibel", proof: "Van bezorgen tot back-end: ik schakel snel tussen soorten werk." },
]

export const education = [
  { school: "Da Vinci College Dordrecht", what: "mbo 4 Software Developer", when: "2023 – heden", current: true },
  { school: "Stedelijk Dalton", what: "Vmbo kader, techniek", when: "2018 – 2023", current: false },
]

// CHECK: niveaus
export const languages = [
  { name: "Nederlands", level: "Vloeiend", value: 100 },
  { name: "Engels", level: "Goed", value: 75 },
  { name: "Arabisch", level: "Spreken", value: 60 },
]
