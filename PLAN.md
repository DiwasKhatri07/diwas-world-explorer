# Game Plan: Diwas World Explorer

## Risk Tasks

### 1. Stable third-person movement and camera framing
- **Why isolated:** Keyboard movement needs to feel natural while the camera remains readable from an elevated map perspective. A full physics system would add unnecessary complexity for this small exploration world.
- **Approach:** Use a bounded X/Z movement plane with collision-radius checks against landmark zones and water edges. Track a single move vector from WASD/arrow key state; ease the character's rotation toward the travel direction and use a fixed, gently following elevated camera.
- **Verify:** Holding each directional key moves Diwas consistently in the expected world direction; diagonal movement is normalized; releasing a key reaches idle cleanly with no character rotation snap; camera stays within island framing and never clips below the map.

### 2. Proximity discovery state handoff
- **Why isolated:** The core value is making landmark information appear at the correct time without repeatedly opening or closing due to boundary jitter.
- **Approach:** Define fixed interactable landmark coordinates, an approach radius, and a slightly smaller leave radius. Update nearby-landmark state during the frame loop; interaction activates only the current nearby item and records it as discovered.
- **Verify:** Walking from neutral terrain into a landmark radius reveals exactly one prompt; leaving the zone reliably removes it; pressing E near a landmark opens its matching card and increments progress only the first time; changing from one nearby landmark to another never shows a stale card.

## Main Build

Build a single full-screen browser exploration scene inspired by the Postcard Archipelago visual target. The player starts as Diwas on a small stylized island, walks with keyboard or touch-pad controls, and discovers four dummy profile themes: About, Skills, Projects, and Contact. The game has a clear starting instruction, a world-space label for nearby places, coral compass marker cues, and a compact edge HUD.

- **Assets needed:**
  - 16:9 visual target / scene reference for palette, camera, and prop density.
  - Transparent Diwas avatar artwork to establish character costume and silhouette.
  - Transparent coral compass flower logo for branding and interactable cues.
  - Transparent illustrated landmark totem sheet as a guide for procedural scene props.
- **Verify:**
  - Movement direction matches player input and diagonal speed is normalized.
  - Diwas visibly turns and bobs while travelling, then settles at idle after movement releases.
  - Interacting with landmarks updates the field-notes counter and presents readable dummy content.
  - UI remains readable at desktop and narrow mobile widths; no text is hidden behind the canvas.
  - No missing textures, unstyled placeholder views, or console errors appear in normal play.
  - Screenshot consistency: sea-glass water, parchment paths, green island terrain, coral discovery accents, elevated oblique camera, and postcard-like HUD all align with the visual target.
  - A deterministic `?demo` view demonstrates an already-open discovery for visual verification.
