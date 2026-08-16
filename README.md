# Diwas World Explorer

> An interactive developer portfolio that turns a project archive into an explorable expedition world.

**Diwas World Explorer** is a React and Three.js portfolio experience. Visitors travel across six themed routes, inspect field-note discoveries, browse public GitHub signals, complete a Code City courier route, and optionally use keyboard, voice, camera, and hand gestures to navigate.

## Live Experience

The published site is available at **[diwasexplor-8hxow3bb.manus.space](https://diwasexplor-8hxow3bb.manus.space/)**.

## Highlights

| Area | Included experience |
| --- | --- |
| Expedition world | Six routes, 24 discoverable stations, 2D atlas mode, and real-time 3D exploration. |
| Code City | Optimized 4.45 MB Meshopt/WebP city asset, resilient loading fallback, low-detail mode, interactive mini-map, and three-stop courier quest. |
| Input modes | Mouse/touch, keyboard, optional voice commands, optional eye route, and calibrated local hand gestures. |
| Interaction | Click-to-move, discovery cards, live public GitHub activity, dance response, RPG Frontier sword/block practice, and courier completion stamp. |
| Accessibility and privacy | Keyboard route controls, responsive layouts, clear opt-in device permission, and browser-local camera processing. |

## Controls

| Input | Action |
| --- | --- |
| Mouse / touch | Select a point or station to move Diwas there. |
| Keyboard | Select **Keys**, then use `WASD` or arrow keys. Use `E` or `Space` to open a nearby station. |
| Hand Route | Complete the optional calibration: **thumbs-up** moves forward, **open palm** stops, and **pinch** opens a nearby note. |
| Voice Route | Say `north`, `south`, `east`, `west`, `explore`, or `open` in supported browsers. |
| Code City | Click a mini-map station to inspect it and set it as your destination. Toggle **Detail low** for constrained devices. |

## Tech Stack

- **React 19**, TypeScript, Vite, and Tailwind CSS.
- **Three.js** for real-time 3D exploration, GLB/FBX loading, Meshopt decoding, animation, and procedural route landmarks.
- **MediaPipe Tasks Vision** for opt-in hand and eye interaction.
- **Web Audio API** and HTML audio for ambient sound, discovery cues, gestures, and quest completion.
- **Wouter** for lightweight client-side routing and the GitHub Events API for public activity signals.

## Local Development

### Requirements

- Node.js 22 or later.
- pnpm 10 or later.

### Commands

```bash
pnpm install
pnpm dev
```

The local Vite server is exposed on the host. Before publishing a change, verify it with:

```bash
pnpm check
pnpm build
```

## Project Structure

```text
client/
  index.html                    # SEO, social metadata, structured data
  public/                       # robots.txt, sitemap.xml, web manifest
  src/
    components/GameCanvas.tsx   # game shell, UI, state, controls, quests
    components/ThreeExpedition.tsx # Three.js renderer and model loading
    game/expedition.ts          # level and discovery data
    game/AudioManager.ts        # ambient audio and route cues
    hooks/useGithubActivity.ts  # public GitHub events integration
    index.css                   # Postcard Archipelago visual system
```

## Performance Notes

Code City uses an optimized **Meshopt/WebP GLB** rather than the original 63.5 MB asset. The standard route includes a loader with a retry/fallback state. On phones or slower hardware, the **Detail low** mode reduces city meshes, prop density, renderer pixel ratio, and shadow work. The route remains playable even if the full city cannot be loaded.

## SEO

The project includes an SEO-ready document head, canonical URL, Open Graph and Twitter cards, JSON-LD website schema, a web manifest, `robots.txt`, and `sitemap.xml`. If a custom domain is attached later, update the URLs in `client/index.html`, `client/public/robots.txt`, and `client/public/sitemap.xml`.

## Credits

- Low Poly City by [golukumar on Sketchfab](https://sketchfab.com/3d-models/low-poly-city-23e03868654d47f69fa5db2413e580c3), licensed under CC BY 4.0.
- Soldier ThreeJS Example by [Scomato on Sketchfab](https://sketchfab.com/), credited in the in-game Credits Camp.
- Portfolio concept, routes, and development archive curated by Diwas Khatri.

## License

The source code is released under the [MIT License](LICENSE). Third-party models, generated assets, and linked content remain subject to their own license terms and attributions.
