# Runtime Structure — Diwas World Explorer

The game uses a React frame around one Babylon.js canvas. React owns responsive HUD panels and visual cards; Babylon owns every real-time world object, camera operation, movement update, landmarks, and keyboard interaction.

| Module | Owner | Responsibility |
| --- | --- | --- |
| `components/GameCanvas.tsx` | React | Creates one lifecycle-safe engine, receives lightweight HUD events, and renders the full-screen overlay UI. |
| `game/scene.ts` | Scene setup | Sets scene-level lighting and lifecycle cleanup, then creates the game world. |
| `game/GameWorld.ts` | Gameplay | Owns procedural terrain, the Diwas mesh, camera target, landmark meshes, player movement, proximity logic, and interaction updates. |
| `game/InputManager.ts` | Gameplay | Translates keyboard input into semantic movement and one-shot interaction actions. |
| `game/landmarks.ts` | Data | Defines the four discoverable dummy profile landmarks and their text. |

## Interaction Contract

`GameWorld` emits `diwas:state` custom browser events only when the HUD changes. The React shell listens to these events and does not drive the world. React may emit `diwas:close` or `diwas:interact` requests from its own controls, and `GameWorld` receives those requests at the scene boundary. This keeps game rules independent from React state.

## Rendering Contract

The canvas is always full-screen and is constructed exactly once per mounted `GameCanvas`. Scene disposal cleans all Babylon resources; `GameCanvas` cleans the engine and window listeners. The `?demo` query enables a deterministic initial discovery card for visual verification.
