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
    shortLabel: "About Diwas",
    kicker: "01 · The story studio",
    title: "A curious builder of meaningful digital spaces.",
    description:
      "Hi, I’m Diwas. This island is a playful placeholder for an introduction—built to feel more like a journey than a profile page.",
    detail: "Dummy info for now: based somewhere between big ideas, good coffee, and a growing list of things to make.",
    position: { x: -3.5, z: -1.25 },
    accent: "#ff715b",
  },
  {
    id: "skills",
    label: "The Lookout",
    shortLabel: "Skills & tools",
    kicker: "02 · The lookout",
    title: "Learning in public, building in many directions.",
    description:
      "This lookout keeps a clear view of the toolkit: product thinking, React, creative coding, visual design, and the patient work of making ideas useful.",
    detail: "Dummy skill stack: React · TypeScript · Three-dimensional web · UI systems · Creative strategy.",
    position: { x: 4.55, z: 2.7 },
    accent: "#2f9c95",
  },
  {
    id: "projects",
    label: "The Project Pier",
    shortLabel: "Selected projects",
    kicker: "03 · The project pier",
    title: "Small launches, ambitious experiments, useful outcomes.",
    description:
      "Every boat at this pier represents a project waiting to set out: interactive sites, identity explorations, and ideas that work best when people can touch them.",
    detail: "Dummy projects: a city guide, a student community app, a personal AI notebook, and this tiny island world.",
    position: { x: -5.5, z: 5.0 },
    accent: "#ffb85c",
  },
  {
    id: "contact",
    label: "The Signal Garden",
    shortLabel: "Let’s connect",
    kicker: "04 · The signal garden",
    title: "The best conversations usually start with a spark.",
    description:
      "Walk into the signal garden to find a friendly invitation. When real details are ready, this is where an email, socials, and a contact link can bloom.",
    detail: "Dummy contact: hello@diwas.world · Kathmandu / Remote · Open to thoughtful collaborations.",
    position: { x: 4.15, z: -4.5 },
    accent: "#a45bc9",
  },
];

export const landmarkById = Object.fromEntries(
  landmarks.map((landmark) => [landmark.id, landmark]),
) as Record<LandmarkId, Landmark>;
