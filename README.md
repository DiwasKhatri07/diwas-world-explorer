# 🧭 Diwas World Explorer

<p align="center">
  <strong>An explorable developer portfolio built as a browser expedition.</strong>
</p>

<p align="center">
  <a href="https://diwasexplor-8hxow3bb.manus.space/"><img src="https://img.shields.io/badge/Live%20Demo-Explore%20the%20world-ff715b?style=for-the-badge" alt="Live demo"></a>
  <a href="https://github.com/DiwasKhatri07/diwas-world-explorer/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-173a56?style=for-the-badge" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge" alt="React 19">
  <img src="https://img.shields.io/badge/Three.js-3D%20Expedition-102a43?style=for-the-badge" alt="Three.js">
</p>

> **Begin at the shore. Build toward the horizon.**

**Diwas World Explorer** turns a developer portfolio into a small interactive world. Travel six routes, uncover project notes, visit an optimized 3D Code City, read live public GitHub signals, complete a courier quest, and choose how to navigate: mouse, keyboard, voice, camera, hand gestures, or eye route.

## 🌐 Live Demo

| Destination | Link | What to try |
| --- | --- | --- |
| **Main expedition** | [Open Diwas World Explorer](https://diwasexplor-8hxow3bb.manus.space/) | Start with **Calibrate & start** for the guided experience. |
| **Code City demo** | [Open 3D Code City](https://diwasexplor-8hxow3bb.manus.space/?demo&level=code-city&mode=3d) | Explore the optimized city route, mini-map, and courier stations. |
| **RPG Frontier demo** | [Open RPG Frontier](https://diwasexplor-8hxow3bb.manus.space/?demo&level=rpg-frontier&mode=3d) | Test the sword slash and shield block interactions. |

## ✨ What’s Inside

| System | Experience |
| --- | --- |
| 🗺️ **Expedition atlas** | Six named routes, 24 field-note stations, responsive 2D atlas mode, and real-time 3D exploration. |
| 🏙️ **Code City** | An optimized 4.45 MB Meshopt/WebP city scene, resilient load/retry fallback, mini-map, low-detail mode, and a three-stop delivery quest. |
| 🖐️ **Hand Route** | Optional in-browser calibration: thumbs-up moves forward, open palm stops, and pinch opens a nearby note. |
| 🎙️ **Voice and eye routes** | Optional browser-supported voice phrases and left/right attention movement. |
| ⚔️ **RPG Frontier** | A simple practice encounter with visible sword slash and shield block reactions. |
| 🔊 **Soundscape** | Ambient island audio, discovery chimes, gesture cues, and a courier completion reward sound. |
| 📡 **Developer signals** | A live public GitHub Events feed for `DiwasKhatri07`, with clear loading and fallback states. |

## 🎮 How to Play

### 1. Pick an entry route

Press **Calibrate & start** to open the optional Hand Route briefing, or choose **Enter without briefing** to explore with mouse/touch and keyboard immediately. Camera access is optional and remains browser-local.

### 2. Move through the world

| Control | How it works |
| --- | --- |
| 🖱️ **Mouse / touch** | Click or tap a clear point on the map, or select a compass marker. |
| ⌨️ **Keyboard** | Select **Keys**, then use `WASD` or arrow keys. Press `E` or `Space` near a station to open it. |
| 🖐️ **Hand Route** | Complete calibration, then hold a **thumbs-up** to move, show an **open palm** to stop, and **pinch** to open a nearby field note. |
| 🎙️ **Voice Route** | In compatible browsers, say `north`, `south`, `east`, `west`, `explore`, or `open`. |
| 👁️ **Eye Route** | With optional camera permission, look left/right to set a short route. |

### 3. Deliver the Code City satchel

In **Code City**, follow the parchment ribbon to **Signal Crossing**, **Skyline Cache**, and **Wayfinder Kiosk**. Use the mini-map to inspect each station, see its delivery status, and set it as your destination. Completing all three stops earns the **City Courier Pass** stamp and reward chime.

### 4. Tune performance on mobile

Choose **Detail low** in Code City to reduce imported city meshes, scene props, pixel density, and shadow work. This setting preserves the route and discoveries while improving frame rate on constrained devices.

## 🚀 Quick Start

### Requirements

- Node.js **22+**
- pnpm **10+**

### Install and run

```bash
git clone https://github.com/DiwasKhatri07/diwas-world-explorer.git
cd diwas-world-explorer
pnpm install
pnpm dev
```

Open the local Vite URL shown in your terminal. For a production-quality check, run:

```bash
pnpm check
pnpm build
pnpm preview
```

## 🧱 Architecture

```text
client/
├── index.html                       # SEO, social cards, JSON-LD, manifest link
├── public/
│   ├── robots.txt                   # crawler guidance
│   ├── sitemap.xml                  # canonical site map
│   └── site.webmanifest             # installable app metadata
└── src/
    ├── components/
    │   ├── GameCanvas.tsx           # game shell, HUD, controls, quest state
    │   └── ThreeExpedition.tsx      # Three.js scene, model loading, route render
    ├── game/
    │   ├── expedition.ts            # routes, stations, discovery content
    │   └── AudioManager.ts          # ambient, interaction, and reward sounds
    ├── hooks/useGithubActivity.ts   # public GitHub Events integration
    └── index.css                    # Postcard Archipelago design system
```

### Core technologies

- **React 19**, TypeScript, Vite, and Tailwind CSS.
- **Three.js** for real-time terrain, landmarks, GLB/FBX imports, Meshopt decoding, and procedural scene work.
- **MediaPipe Tasks Vision** for opt-in hand and eye interaction.
- **Web Audio API** and HTML audio for ambience, field-note cues, and quest rewards.
- **Wouter** for lightweight client navigation and the public GitHub Events API for the activity panel.

## ⚡ Performance Design

The original city asset was 63.5 MB. Code City now uses a **4.45 MB Meshopt/WebP GLB** and includes an explicit loader, completion handoff, timeout fallback, retry path, and playable illustrated fallback. In low-detail mode, the renderer lowers pixel density, disables shadow work, reduces city mesh visibility, and trims procedural prop density.

## 🔎 SEO and Social Sharing

The project ships with:

- A clear search title, description, canonical URL, author metadata, and relevant keywords.
- Open Graph and Twitter summary cards using the expedition cover image.
- JSON-LD `WebSite` structured data.
- `robots.txt`, `sitemap.xml`, and a web manifest.

> When connecting a custom domain, update the absolute URLs in `client/index.html`, `client/public/robots.txt`, and `client/public/sitemap.xml`.

## 📦 GitHub Pages Automation

Every push to `main` triggers [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). The workflow installs dependencies, runs the TypeScript check, builds a GitHub Pages-specific static bundle, and deploys it through the official Pages actions. That build uses the repository base path and reads the approved portfolio assets from the live public asset origin, so the expedition visuals remain available outside the primary host.

After GitHub grants Pages deployment permission to the workflow, the public mirror will be available at `https://diwaskhatri07.github.io/diwas-world-explorer/`.

## 🛠️ Useful Development Tasks

| Goal | Where to work |
| --- | --- |
| Add a route or discovery | `client/src/game/expedition.ts` |
| Change HUD / player interaction | `client/src/components/GameCanvas.tsx` |
| Change the 3D scene or city loader | `client/src/components/ThreeExpedition.tsx` |
| Add a sound cue | `client/src/game/AudioManager.ts` |
| Change visual system | `client/src/index.css` and `ideas.md` |
| Change SEO | `client/index.html` and `client/public/` |

## 🧪 Troubleshooting

| Situation | Recommended action |
| --- | --- |
| Code City takes too long | Wait for the route loader, use **Retry city route**, or choose **Explore fallback**. |
| Mobile frame rate drops | Toggle **Detail low** in Code City and close unused browser tabs. |
| Hand Route does not detect | Re-run calibration, use bright front lighting, keep one hand in frame, and use mouse/keys as an instant fallback. |
| Voice Route does not open | Use a browser with Web Speech support, or continue with another input mode. |
| GitHub activity is unavailable | Use the refresh signal; the experience still works when public Events API requests fail. |

## 🗺️ Roadmap

- [ ] Visible parcel/satchel animation between courier stops.
- [ ] Route achievement badges in the expedition log.
- [ ] First-person Code City walk mode with touch-look controls.
- [ ] More portfolio project case files and visual discoveries.

## 🤝 Contributing

Contributions, refinements, and issue reports are welcome. Please begin with [CONTRIBUTING.md](CONTRIBUTING.md), keep the **Postcard Archipelago** visual language intact, and verify your changes with `pnpm check` and `pnpm build` before opening a pull request.

## 🙌 Credits

| Credit | Source / License |
| --- | --- |
| Low Poly City | [golukumar on Sketchfab](https://sketchfab.com/3d-models/low-poly-city-23e03868654d47f69fa5db2413e580c3) · CC BY 4.0 |
| Soldier ThreeJS Example | [Scomato on Sketchfab](https://sketchfab.com/) · credited in the in-game Credits Camp |
| World concept, portfolio routes, and development archive | Diwas Khatri |

## 📄 License

This source code is available under the [MIT License](LICENSE). Third-party models, linked content, and generated visual assets remain subject to their own licenses and attribution requirements.

---

Built by **Diwas Khatri**. If this portfolio world helps you imagine a more playful developer site, please consider starring the repository.
