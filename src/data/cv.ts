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
  // Korte beschrijving op het beginscherm van de rondleiding.
  intro:
    "Ik ben Taym, software developer in opleiding uit Dordrecht. Ik bouw het liefst dingen die mensen echt gebruiken: websites, dashboards en mijn eigen Roblox-game. Ik leer door te maken, te testen en het daarna beter te doen. Naast school werk ik al sinds 2022, dus doorpakken ben ik gewend.",
}

export const tldr: { label: string; title: string; text: string; accent: Accent }[] = [
  {
    label: "Nu",
    title: "Student mbo 4 Software Developer",
    text: "Da Vinci College in Dordrecht, sinds 2023. Naast school bouw ik aan mijn eigen Roblox-game.",
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
  Game: ["Roblox Studio", "Luau"],
  Tools: ["Git", "GitHub", "VS Code", "Figma", "Blender"],
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
    title: "Slimme-meter dashboard",
    where: "Schoolopdracht",
    when: "2025", // CHECK: jaar
    text: "Een dashboard voor de slimme meter in de meterkast. Het zet de gegevens uit de meter om in een overzicht dat je in één oogopslag snapt.",
    role: "Ontwerp en bouw",
    tags: ["Dashboard"], // CHECK: welke talen/frameworks?
    accent: "main",
  },
  {
    title: "CarCompany Simulator",
    where: "Eigen project, Roblox",
    when: "2026",
    text: "Mijn eigen Roblox-game. Ik programmeer de auto's, de besturing, de menu's en de systemen erachter in Luau.",
    role: "Game developer",
    tags: ["Roblox Studio", "Luau"],
    accent: "yellow",
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
    text: "Mijn cv als 3D-kamer. De computer bouwde ik in Blender met Python, de site draait op React Three Fiber met een eigen CRT-shader.",
    role: "Ontwerp en bouw",
    tags: ["React", "Three.js", "Blender", "GLSL"],
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
