# Spec — cv-site Taym Alsudani (v2, neo-brutalism)

## 1. Review van het huidige cv (door de ogen van een recruiter)

Een recruiter kijkt gemiddeld 6–10 seconden naar een cv. In die tijd moet duidelijk zijn: **wie ben je, wat kun je, wat zoek je, hoe bereik ik je.**

### Wat goed is
- Rustige, overzichtelijke opmaak; contactgegevens staan bovenaan.
- Je hebt al drie stages én sinds 2022 doorlopend werk naast school. Dat laat discipline zien, alleen zegt het cv dat nergens.
- De stage bij het practoraat (voorkant + achterkant van een slimme-meterapp) is echt interessant. Dat is je sterkste regel.

### Wat beter moet (op volgorde van impact)
1. **Er staan geen technische skills op.** Voor een Software Developer is dat het eerste waar iemand naar zoekt. Alleen soft skills ("Flexibel", "Communicatie") zonder bewijs leest als opvulling.
2. **Er is geen werk om te bekijken.** Geen GitHub, geen projecten, geen links. Een developer-cv zonder code is zoals een fotograaf zonder foto's.
3. **Development en bijbanen staan door elkaar.** Je sterkste ervaring (Practoraat, Webroses) raakt verstopt tussen drie bezorgbanen. Splits ze.
4. **De beschrijvingen zijn vaag of kloppen niet.**
   - "Mijn rol bij Flink was eten bezorgen": Flink bezorgt boodschappen.
   - "Tijdens mijn stage werkte ik aan het bouwen van websites": welke? met wat? wat was jouw deel?
   - Beschrijf resultaat en techniek, niet alleen de taak.
5. **Er staat niet wat je zoekt.** Stage? Bijbaan als developer? Vanaf wanneer, hoeveel uur? Eén zin lost dat op.
6. **Spelfouten vallen op bij een recruiter:** "Stagair" (→ Stagiair), "Jumbo Berzorg Service" (→ Jumbo Bezorgservice), "WERKERVARING" staat als één kop boven alles. Check ook of "Practoraat Avans Hogeschool" de officiële naam is.
7. **Er staan privégegevens op die niet nodig zijn:** volledig adres en geboortedatum. Een woonplaats is genoeg, zeker op een openbare website.
8. **De talen hebben geen niveau.** "Engels" zegt weinig; gebruik een schaal (moedertaal / vloeiend / goed / basis).

### Wat er mis was met site v1 (de Lando-versie)
- **De preloader en custom cursor kosten tijd en gebruiksgemak.** Recruiters willen meteen inhoud zien.
- **Stats als "3 talen" en "4+ jaar werkervaring" voelen opgeblazen**, en dat prikt een recruiter meteen door.
- **Het F1-thema ("Career laps") is leuk, maar leidt af van de inhoud.**
- Hetzelfde probleem: er staat nog steeds geen code of project op.

## 2. Doel van v2
Een one-page cv-site die **binnen 10 seconden** laat zien wat Taym kan en zoekt, en die **door een mens gemaakt** aanvoelt: concrete tekst, geen buzzwords, geen paarse gradients, geen standaard "hero met twee knoppen en drie feature cards".

**Stijl:** neo-brutalism. Harde zwarte randen (2–3px), harde offset-schaduwen (4px 4px 0 zwart), platte kleuren, knoppen die bij hover "indrukken", een paar bewust scheve stickers. Hoofdkleur lime (#8AE500-ish, sluit aan bij v1), met blauw, rood en geel als accent. Achtergrond crème, geen puur wit.

**Typografie:** Archivo Black (koppen), Archivo (tekst), JetBrains Mono (labels, datums).

**Wow-laag (v2.2): GSAP + ScrollTrigger + SplitText + Lenis**
- Intro-gordijn (±2 s): "TAYM" stempelt in, daarna schuiven vier gekleurde panelen weg.
- Smooth scroll via Lenis, gekoppeld aan de GSAP-klok.
- Hero: letters vallen stuiterend op hun plek, foto zwiept elastisch binnen, stickers ploppen erin. Muis-parallax op foto en stickers (elk op een eigen diepte). Bij wegscrollen schuiven de kopregels uit elkaar.
- Twee kruisende marquee-banden die tegen elkaar in lopen, versnellen met de scrollsnelheid en meedraaien met de scrollrichting.
- Sectiekoppen: letters schuiven per regel uit een masker (SplitText).
- TL;DR-kaarten vliegen vanuit drie richtingen binnen en bewegen daarna op verschillende snelheden (parallax).
- Projecten: gestapelde sticky kaarten. De onderste krimpt en kantelt weg als de volgende eroverheen schuift.
- Tijdlijn (vervangt terminal + tabs): de sectie klikt vast en je scrollt horizontaal van 2018 naar nu. Een lime lijn tekent mee, een groot jaartal telt mee, kaarten zwaaien binnen. Op mobiel verticaal met een meetekenende lijn.
- Skills: badges vallen uit de lucht en stuiteren. Soft skills schuiven binnen met een lime veeg.
- Taalbalken lopen elastisch vol.
- Contact: kaart valt schuin binnen en landt met een schok, letters ploppen op, magnetische knoppen.
- Footer: letters van de naam scrubben omhoog.
- Cursor-volger (vierkant) met labels boven kaarten en stickers. Nav verdwijnt bij naar beneden scrollen.
- Alles valt weg bij `prefers-reduced-motion`; de inhoud staat dan gewoon stil.

**Motion:** kort en hard in plaats van zweverig. Secties schuiven 12px omhoog bij binnenkomst, knoppen drukken in, een marquee-band. Geen preloader, geen custom cursor. `prefers-reduced-motion` wordt gerespecteerd.

## 3. Techniek
- Vite + React + TypeScript
- Tailwind CSS v4
- shadcn/ui-componenten uit de **neobrutalism.dev registry** (`npx shadcn add https://neobrutalism.dev/r/<component>.json`)
- Alle inhoud in **één bestand**: `src/data/cv.ts`. Tekst aanpassen = alleen dat bestand.
- Deploy: GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)

## 4. Secties (elk een eigen component in `src/sections/`)

| # | Sectie | Doel | shadcn / neobrutalism componenten |
|---|--------|------|-----------------------------------|
| 0 | `Nav` | Altijd bereikbaar: naam, ankers, "Mail mij" | Button, Sheet (mobiel menu) |
| 1 | `Hero` | Wie + wat + status in 1 scherm | Badge, Button, ImageCard |
| 2 | `StackMarquee` | Tech stack in één oogopslag | Marquee |
| 3 | `Tldr` | "Taym in 10 seconden": zoekt / kan / zit nu | Card |
| 4 | `Projects` | Bewijs: wat heb ik gebouwd, mijn rol, stack | Card, Badge, Button |
| 5 | `Timeline` | Hele verhaal 2018 → nu, kleur per soort (development / school / bijbaan) | Custom + GSAP pin |
| 6 | `Skills` | Tech gegroepeerd + soft skills *met bewijs* | Card, Badge, Tooltip |
| 7 | `Education` | Opleiding + talen met niveau | Card, Progress |
| 8 | `Contact` | Mail (kopiëren), bellen, GitHub | Card, Button, Sonner (toast) |
| 9 | `Footer` | Wie heeft het gebouwd, link naar broncode | – |

### Per sectie

**0. Nav:** sticky balk met rand-onder. Links: logo-blok "TA". Midden: Projecten · Ervaring · Skills · Contact. Rechts: Button "Mail mij". Mobiel: hamburger → Sheet.

**1. Hero:** grote kop in twee regels, *"Ik bouw websites en apps — van scherm tot database."* Eronder naam + rol. Status-badge met groene stip: "Open voor stage & werk" (**input nodig:** klopt dit, en vanaf wanneer?). Foto in ImageCard, licht gedraaid, met sticker "mbo 4 · Software Developer". Knoppen: "Bekijk projecten" (main) + "Mail mij" (neutral). Feitjes als badges: Dordrecht · Da Vinci College · NL / EN / AR.

**2. StackMarquee:** zwarte band, lime tekst, de tech stack loopt voorbij.

**3. Tldr:** drie kaarten naast elkaar, elk met een eigen accentkleur.
- *Nu:* stagiair bij het Practoraat, slimme-meterapp.
- *Kan:* front-end + back-end, met de stack erbij.
- *Zoekt:* (**input nodig**) bijv. BBL-plek / stage / bijbaan als developer.

**4. Projects:** genummerde kaarten met een gekleurde kopbalk. Per project: titel, context (waar/wanneer), wat het doet, mijn rol, stack-badges, link (code/live) als die er is.
- Slimme-meterapp (Practoraat)
- Websites bij Webroses
- Deze site (broncode op GitHub, want dit is zelf ook bewijs)
- **Input nodig:** schoolprojecten of eigen projecten met GitHub-links. Hoe meer, hoe beter.

**5. Timeline:** één chronologisch verhaal, opgebouwd uit `education` en `experience` in `cv.ts`. Elke kaart heeft een kleur per soort: development (lime), school (blauw), bijbaan & stage (wit). Zo blijft het onderscheid voor recruiters zichtbaar. De laatste kaart is "Jouw team?" met een mail-link.

**6. Skills:** links de tech-skills gegroepeerd in Front-end / Back-end / Tools (**input nodig:** de echte lijst). Rechts de soft skills, elk met één zin bewijs, bijv. *Communicatie: sinds 2022 dagelijks klantcontact aan de deur.*

**7. Education:** kaart Da Vinci (2023–heden, mbo 4 Software Developer) + Stedelijk Dalton (2018–2023, vmbo kader techniek). Talenkaart: Nederlands (vloeiend), Engels (goed), Arabisch (spreken). Niveaus checken.

**8. Contact:** grote kaart in de lime kleur. Kop "Zullen we even mailen?". E-mail met kopieerknop (toast "Gekopieerd") en GitHub. Bewust geen telefoonnummer. Optioneel: knop "Download cv (PDF)" zodra `public/cv.pdf` bestaat.

**9. Footer:** "Ontworpen en gebouwd door Taym Alsudani · React, Tailwind, shadcn/ui" + link naar de repo.

## 5. Input nodig van Taym
Alles staat in `src/data/cv.ts` en is gemarkeerd met `// CHECK`.
- [ ] Echte tech-skills (nu een voorzet: HTML, CSS, JavaScript, TypeScript, React, PHP, SQL, Git)
- [ ] Wat zoek je en vanaf wanneer?
- [ ] Stack per project (Practoraat, Webroses)
- [ ] Extra projecten + GitHub-links
- [ ] LinkedIn-URL (optioneel)
- [ ] Originele foto in hogere resolutie → `public/taym.png`
- [ ] `public/cv.pdf` (zonder adres/geboortedatum) → zet `cvPdf` in `cv.ts` aan
