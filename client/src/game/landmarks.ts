export type LandmarkId = "about" | "skills" | "projects" | "contact";

export type Landmark = {
  id: LandmarkId;
  label: string;
  shortLabel: string;
  kicker: string;
  title: string;
  description: string;
  detail: string;
  position: { x: number; z: number };
  accent: string;
};

export const landmarks: Landmark[] = [
  {
    id: "about",
    label: "The Story Studio",
    shortLabel: "Log 01 · Diwas",
    kicker: "Route 01 · The story studio",
    title: "A builder who makes paths into places.",
    description:
      "Diwas charts digital places where useful ideas can be explored, understood, and remembered. The work begins with curiosity, then follows the details that make an experience feel alive.",
    detail: "Field note: working between product ideas, good coffee, and an always-growing collection of things worth making.",
    position: { x: -3.5, z: -1.25 },
    accent: "#ff715b",
  },
  {
    id: "skills",
    label: "The Lookout",
    shortLabel: "Log 02 · The toolkit",
    kicker: "Route 02 · The lookout",
    title: "A toolkit gathered for thoughtful making.",
    description:
      "This lookout keeps a clear view of the toolkit: product thinking, React, creative coding, visual design, and the patient work of making ideas useful.",
    detail: "Kit inventory: React · TypeScript · interactive web worlds · UI systems · creative strategy.",
    position: { x: 4.55, z: 2.7 },
    accent: "#2f9c95",
  },
  {
    id: "projects",
    label: "The Project Pier",
    shortLabel: "Log 03 · The work",
    kicker: "Route 03 · The project pier",
    title: "Each launch begins as a route worth testing.",
    description:
      "Every boat at this pier represents a project waiting to set out: interactive sites, identity explorations, and ideas that work best when people can touch them.",
    detail: "Voyage log: a city guide, a student community app, a personal AI notebook, and this island of ideas.",
    position: { x: -5.5, z: 5.0 },
    accent: "#ffb85c",
  },
  {
    id: "contact",
    label: "The Signal Garden",
    shortLabel: "Log 04 · The signal",
    kicker: "Route 04 · The signal garden",
    title: "Good collaborations often begin with a small signal.",
    description:
      "The signal garden is open to people who care about clear ideas, generous collaboration, and work that gives someone a reason to look twice.",
    detail: "Signal coordinates: hello@diwas.world · Kathmandu / Remote · Open to thoughtful collaborations.",
    position: { x: 4.15, z: -4.5 },
    accent: "#a45bc9",
  },
];

export const landmarkById = Object.fromEntries(
  landmarks.map((landmark) => [landmark.id, landmark]),
) as Record<LandmarkId, Landmark>;
