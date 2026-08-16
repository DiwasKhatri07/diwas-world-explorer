/**
 * Interactive Expedition Portfolio content model: every level maps public project work
 * into an explorable station, while omitting personal contact and school details.
 */
export type ExpeditionLevelId = "south-shore" | "data-observatory" | "builder-harbor" | "night-lab" | "code-city" | "rpg-frontier";

export type ExpeditionStation = {
  id: string;
  name: string;
  kicker: string;
  title: string;
  description: string;
  detail: string;
  x: number;
  y: number;
  type: "profile" | "skills" | "project" | "focus";
  link?: string;
  projectPreview?: string;
};

export type ExpeditionLevel = {
  id: ExpeditionLevelId;
  order: string;
  name: string;
  subtitle: string;
  background: string;
  spawn: { x: number; y: number };
  theme: string;
  stations: ExpeditionStation[];
};

export const menuAtlas = "/manus-storage/diwas-menu-atlas-v3_84bf82d0.png";

export const expeditionLevels: ExpeditionLevel[] = [
  {
    id: "south-shore",
    order: "01",
    name: "South Shore",
    subtitle: "Starting ground · core profile",
    background: "/manus-storage/diwas-atlas-world-v2_d7835872.png",
    spawn: { x: 50, y: 76 },
    theme: "sunlit",
    stations: [
      {
        id: "diwas-log",
        name: "The Story Studio",
        kicker: "Route 01 · Personal log",
        title: "A builder who turns curiosity into routes.",
        description: "Diwas is a Nepal-based student developer exploring Python, web work, and the practical craft of making useful digital places.",
        detail: "Expedition record: a learner’s map built from code experiments, visual thinking, and the habit of shipping ideas.",
        x: 25,
        y: 63,
        type: "profile",
      },
      {
        id: "tool-camp",
        name: "Tool Camp",
        kicker: "Route 02 · Learning kit",
        title: "Tools packed for the next build.",
        description: "The current kit spans Python, Java, web foundations, API design, and the everyday mobile workflow of Android, Termux, Pydroid, and VS Code.",
        detail: "Active routes: Python full stack, Java, technical foundations, and learning in public.",
        x: 70,
        y: 19,
        type: "skills",
      },
      {
        id: "route-board",
        name: "Route Board",
        kicker: "Route 03 · How to explore",
        title: "Choose a station, travel there, unlock its log.",
        description: "The island is designed like an expedition rather than a scroll. Each coral compass marks a story, tool, or project archive waiting on the path.",
        detail: "Control routes: mouse/tap, keyboard, optional voice command, and a camera-style view switch.",
        x: 22,
        y: 27,
        type: "focus",
      },
      {
        id: "signal-garden",
        name: "Signal Garden",
        kicker: "Route 04 · Current signal",
        title: "Still learning. Still mapping what comes next.",
        description: "The current focus is to keep expanding the technical toolbox while turning experiments into shareable tools and worlds.",
        detail: "Next routes lead north to the project archive, harbor builds, and the Night Lab.",
        x: 85,
        y: 59,
        type: "focus",
      },
    ],
  },
  {
    id: "data-observatory",
    order: "02",
    name: "Data Observatory",
    subtitle: "Project archive · live-data engineering",
    background: "/manus-storage/diwas-data-observatory-v3_2dd592f9.png",
    spawn: { x: 48, y: 74 },
    theme: "observatory",
    stations: [
      {
        id: "nepse-api",
        name: "NEPSE API",
        kicker: "Archive 01 · Data observatory",
        title: "A developer route into Nepal Stock Exchange data.",
        description: "NEPSE API is a public Python/FastAPI developer project for working with unofficial Nepal Stock Exchange market data, endpoints, and developer workflows.",
        detail: "Archive note: this station describes an engineering project only. It does not show or interpret investment information.",
        x: 68,
        y: 26,
        type: "project",
        link: "https://github.com/DiwasKhatri07/NEPSE-API-",
        projectPreview: "/manus-storage/nepse-api-preview_7f3df97b.png",
      },
      {
        id: "api-instruments",
        name: "Instrument Shelf",
        kicker: "Archive 02 · Engineering notes",
        title: "FastAPI, JSON routes, and developer-first thinking.",
        description: "This shelf records the systems perspective behind the API: predictable responses, interactive documentation, and a clear path from package install to local server.",
        detail: "Technologies on the table: Python · FastAPI · package workflows · API documentation.",
        x: 27,
        y: 43,
        type: "skills",
      },
      {
        id: "signal-telescope",
        name: "Signal Telescope",
        kicker: "Archive 03 · Looking ahead",
        title: "Build for the person who needs a reliable tool tomorrow.",
        description: "The observatory turns complicated moving information into a question of interfaces, endpoints, and considerate developer experience.",
        detail: "Complete this route, then cross the harbor for packaging and authentication experiments.",
        x: 82,
        y: 61,
        type: "focus",
      },
    ],
  },
  {
    id: "builder-harbor",
    order: "03",
    name: "Builder’s Harbor",
    subtitle: "Project archive · packages and gateways",
    background: "/manus-storage/diwas-builder-harbor-v3_81c49b2b.png",
    spawn: { x: 50, y: 75 },
    theme: "harbor",
    stations: [
      {
        id: "magic-link",
        name: "Magic Link",
        kicker: "Archive 04 · Gateway dock",
        title: "A small gateway with a big usability promise.",
        description: "Magic Link appears in Diwas’s public project archive as an authentication-focused exploration: a route where sign-in can feel less like a barrier and more like a clear handoff.",
        detail: "Project station: authentication flow concepts · account access journeys · practical web utility.",
        x: 25,
        y: 30,
        type: "project",
      },
      {
        id: "diwas-pypi",
        name: "Diwas PyPi",
        kicker: "Archive 05 · Package workshop",
        title: "Packaging a useful tool so another builder can carry it.",
        description: "The Diwas PyPi project represents the leap from local experimentation to a shareable Python module for other developers.",
        detail: "Workshop record: Python packaging · reusable modules · developer handoff.",
        x: 68,
        y: 54,
        type: "project",
      },
      {
        id: "bdix-iptv",
        name: "BDIX IPTV",
        kicker: "Archive 06 · Stream pier",
        title: "Exploring the paths behind high-speed streaming.",
        description: "BDIX IPTV is listed in the public project archive as a streaming-focused build. At the harbor, it is represented as a route through delivery, availability, and experience design.",
        detail: "Project archive note: this station records a public portfolio item, not a streaming service or content catalogue.",
        x: 84,
        y: 23,
        type: "project",
      },
      {
        id: "yt-channel",
        name: "Automation Dock",
        kicker: "Archive 07 · Media route",
        title: "A Python route from media intake to a prepared channel upload.",
        description: "Automate YT Channel is a public Python project for an authorized media workflow, covering imports, rendering, metadata preparation, duplicate protection, and YouTube Data API uploads.",
        detail: "Project station: workflow design · Python automation · deliberate publishing pipelines.",
        x: 56,
        y: 18,
        type: "project",
        link: "https://github.com/DiwasKhatri07/Automate-YT-Channel",
        projectPreview: "/manus-storage/automate-yt-preview_b9560692.png",
      },
    ],
  },
  {
    id: "night-lab",
    order: "04",
    name: "Night Lab",
    subtitle: "Learning routes · AI and language systems",
    background: "/manus-storage/diwas-night-lab-v3_425c63b4.png",
    spawn: { x: 49, y: 74 },
    theme: "night",
    stations: [
      {
        id: "python-lab",
        name: "Python Lab",
        kicker: "Lab note 01 · Main tool",
        title: "Python is the working lantern for many routes.",
        description: "Python appears across Diwas’s public skill pages and project archive, from API development and packages to experiments that grow with each revision.",
        detail: "Lab inventory: Python · APIs · scripting · package design · experimental systems.",
        x: 23,
        y: 54,
        type: "skills",
      },
      {
        id: "nepali-llm",
        name: "Language Grove",
        kicker: "Lab note 02 · Current focus",
        title: "Training a Nepali LLM is a long-horizon expedition.",
        description: "The current public focus includes Nepali LLM exploration alongside advanced Python revision — a route that connects language, training, and locally meaningful technology.",
        detail: "Field condition: actively learning, iterating, and gathering better questions.",
        x: 66,
        y: 29,
        type: "focus",
      },
      {
        id: "builder-loop",
        name: "Builder Loop",
        kicker: "Lab note 03 · The method",
        title: "Learn, prototype, test, then take the next route.",
        description: "The Night Lab is where early skills become repeated practice: a looping path through code, systems thinking, and ambitious personal experiments.",
        detail: "Return to South Shore whenever you want to restart the expedition from the coast.",
        x: 83,
        y: 61,
        type: "focus",
      },
      {
        id: "nepali-ide",
        name: "Nepali IDE",
        kicker: "Lab note 04 · Mobile builder",
        title: "A mobile IDE route for making code feel closer at hand.",
        description: "Nepali IDE is a public Android project described as an AI-native code editor with syntax highlighting, live previews, project workspace tools, and a built-in Python interpreter.",
        detail: "Lab equipment: Kotlin · Jetpack Compose · mobile code editing · Python workflow.",
        x: 43,
        y: 16,
        type: "project",
        link: "https://github.com/DiwasKhatri07/Nepali-IDE",
        projectPreview: "/manus-storage/nepali-ide-preview_f248af04.png",
      },
    ],
  },
  {
    id: "code-city",
    order: "05",
    name: "Code City",
    subtitle: "City route · systems and shipping",
    background: menuAtlas,
    spawn: { x: 48, y: 77 },
    theme: "city",
    stations: [
      { id: "city-gate", name: "City Gate", kicker: "District 05 · City route", title: "A street grid where the next route begins.", description: "Past the gate, pale roads, coral signals, and small field flags turn the skyline into a place to wander rather than a place to rush through.", detail: "Field record: follow the parchment ribbon · trust the coral signal · keep one note for later.", x: 24, y: 48, type: "focus" },
      { id: "commit-plaza", name: "Commit Plaza", kicker: "District 05 · Build log", title: "Every small arrival adds a light to the skyline.", description: "This plaza keeps a running record of the trails Diwas has opened: revise a route, return to it, and leave the next traveler a clearer landmark.", detail: "Plaza record: visible iteration · careful returns · a route worth sharing.", x: 67, y: 25, type: "focus" },
      { id: "asset-bay", name: "Asset Bay", kicker: "District 05 · Import station", title: "A harbor for the world’s next found object.", description: "Asset Bay is where a new city scene, traveler, or landmark can enter the atlas with its maker’s name kept beside it.", detail: "Cargo note: city scene · explorer form · texture bundle · creator credit.", x: 83, y: 63, type: "skills" },
      { id: "signal-crossing", name: "Signal Crossing", kicker: "District 05 · Route flag", title: "A coral flag marks the next commit in the street grid.", description: "Signal Crossing is a city-route beacon. Reach it to uncover a small note about how navigation, visual hierarchy, and meaningful prompts turn a large environment into an explorable portfolio.", detail: "Waypoint kit: route flag · coral compass signal · discovery stamp.", x: 38, y: 68, type: "focus" },
      { id: "skyline-cache", name: "Skyline Cache", kicker: "District 05 · Rooftop cache", title: "A hidden cache keeps the next idea close to the skyline.", description: "The cache is an interactive skyline prop for visitors who explore beyond the main stations. It records a simple principle: ship a small useful detail, then let the next revision grow from it.", detail: "Cache record: exploration reward · iterative craft · field-note unlock.", x: 55, y: 44, type: "skills" },
      { id: "wayfinder-kiosk", name: "Wayfinder Kiosk", kicker: "District 05 · Navigation prop", title: "A field kiosk turns the city map back into a route.", description: "The kiosk connects the in-world bearing compass with the station trail, helping visitors choose a direction without losing the feeling of wandering through Code City.", detail: "Navigation kit: city compass · destination bearing · nearby discovery signal.", x: 75, y: 47, type: "focus" },
    ],
  },
  {
    id: "rpg-frontier",
    order: "06",
    name: "RPG Frontier",
    subtitle: "Practice trail · encounters and action routes",
    background: "/manus-storage/diwas-world-reference_de4e0dc1.png",
    spawn: { x: 50, y: 78 },
    theme: "frontier",
    stations: [
      { id: "practice-range", name: "Practice Range", kicker: "Frontier 01 · Action route", title: "Learn the action rhythm without losing the exploration thread.", description: "The frontier adds lightweight, non-graphic practice encounters. Use the action button near a training drone to test movement and timing.", detail: "Training kit: action pulse · stamina · recovery · optional combat HUD.", x: 25, y: 56, type: "focus" },
      { id: "beacon-keep", name: "Beacon Keep", kicker: "Frontier 02 · Route objective", title: "Protect the route, then keep building.", description: "The encounter loop is intentionally simple: it exists to make exploration feel responsive while preserving the portfolio-first purpose of the world.", detail: "Objective note: clear practice encounters, unlock a route badge, continue the expedition.", x: 70, y: 28, type: "focus" },
      { id: "credits-camp", name: "Credits Camp", kicker: "Frontier 03 · Attribution log", title: "Every route has builders behind it.", description: "Credits Camp records Diwas’s role as world designer and developer, alongside source-model attribution when licensed assets are later imported.", detail: "Credit format: creator · asset source · license · in-world use.", x: 84, y: 65, type: "profile" },
    ],
  },
];

export const levelById = Object.fromEntries(expeditionLevels.map((level) => [level.id, level])) as Record<ExpeditionLevelId, ExpeditionLevel>;
