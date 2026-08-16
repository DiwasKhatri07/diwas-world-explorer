# Diwas World Explorer — Design Directions

## Three Possible Directions

### 1. Postcard Archipelago
**Very Brief Intro:** A sunny illustrated island viewed from a gentle overhead angle, with travel-stamp UI details and hand-painted map landmarks. It feels like opening a personal travel journal.

**Probability:** 0.07

### 2. Warm Atlas Desk
**Very Brief Intro:** The map feels like a living paper diorama on an architect's desk, with inked paths, small woodcut symbols, and quietly animated terrain. It is intimate, crafted, and curious.

**Probability:** 0.04

### 3. Signal Grove
**Very Brief Intro:** A twilight discovery world where information is held in glowing natural beacons, using rich shadows and luminous navigation trails. It feels exploratory and slightly mysterious.

**Probability:** 0.09

---

# Chosen Direction: Postcard Archipelago

## Design Movement

**Editorial illustration meets premium adventure-map UI.** The experience borrows the compositional clarity of a travel poster and the tactile charm of a hand-painted adventure atlas, then expresses it as a responsive 3D browser game. It avoids a generic dashboard shell in favor of a direct, immersive player view.

## Core Principles

1. **Explore before you explain.** The world reveals Diwas's information through physical places rather than a static biography panel.
2. **Clear silhouette, soft detail.** Everything important—the character, interactable huts, and route markers—has a recognisable form from the camera height; delicate water ripples and foliage add atmosphere without visual clutter.
3. **A map should invite movement.** Curving sand paths, linked landmarks, and visual “next stop” cues create a natural route across the island.
4. **Game UI, not website UI.** Interfaces are compact, informative, and deliberately overlaid on the world rather than boxed into a conventional web layout.

## Color Philosophy

The world is built on **sunlit sea-glass tones**: deep ocean teal holds visual depth, faded turquoise gives the water motion, parchment sand makes movement routes legible, and coral orange acts as the sole active/discovery color. These colors create warmth and curiosity rather than gamer-neon intensity. Navy ink is used for all primary text so it remains readable over the high-key illustrated terrain.

## Layout Paradigm

The game uses a **full-bleed living map** as the principal layout. UI sits at the edges: an angled title card anchors the upper-left, a mission/inventory rail occupies the upper-right, and a contextual discovery card rises from the lower-left when the player approaches a landmark. This orbiting composition keeps the landscape as the main stage.

## Signature Elements

1. **Coral compass flowers:** pulsing four-petal markers on interactable landmarks and beside actionable prompts.
2. **Stamped route ribbon:** a slim, softly curved path and visual travel stamps that connect explored sites.
3. **Postcard frame accents:** off-white paper cards with an imperfect dark-ink keyline and small rule marks, limited to UI overlays.

## Interaction Philosophy

Movement should be immediately understandable: WASD / arrow keys steer Diwas, and walking inside a landmark’s coral radius opens a concise prompt. Pressing **E** or tapping the prompt converts the nearby place into a readable information card. Discoveries visibly update the top-right “field notes” count, rewarding movement without adding complex game systems.

## Animation

Diwas has a light bob while walking; palm canopies, water bands, route beacons, and compass flowers move independently on slow loops. Discovery cards use a quick 220 ms translate-and-fade entrance, while landmark glow transitions use a softly elastic 180 ms ease-out. The world never uses jarring camera shakes, intrusive particle bursts, or long blocking animations. Reduced-motion preferences stop all decorative motion while keeping navigation working.

## Typography System

**Fraunces** is the display face for the title, landmark names, and information-card headings; its friendly editorial personality gives the UI a collectible postcard character. **DM Sans** is the functional text face for controls, progress, and body copy. Titles use medium-to-heavy weights with compact tracking; control labels are uppercase, widely tracked, and small enough to behave like map legends.

## Brand Essence

**A playable pocket world that lets visitors discover Diwas's story one landmark at a time.**

Personality: **curious, grounded, warmly adventurous**.

## Brand Voice

Headlines are observant and route-based rather than promotional. CTAs sound like physical invitations from an explorer’s map. Avoid generic invitation copy.

Examples:

> “Start at the shore. Follow what sparks your curiosity.”

> “A note waits at the studio — walk closer to unfold it.”

## Wordmark & Logo

The mark is a **coral compass flower** with four hand-cut, teardrop-shaped petals framing a navy diamond. The wordmark uses a custom, slightly condensed editorial treatment with a tiny path underline under “World,” suggesting a route across an atlas. No default sans-serif brand treatment is used.

## Signature Brand Color

**Compass Coral — #FF715B.** This is the exclusive action/discovery signal and should never become a background wash.

## Style Decisions

- The first visible map frame must contain a recognisable island or landmark silhouette, a sand-path route cue, and at least one compact postcard-style overlay.
- The wordmark always pairs the coral compass-flower emblem with editorial “Diwas World Explorer” typography in edge-mounted UI.
- Compass Coral #FF715B is reserved for markers, active route prompts, field-note progress, and other discoveries; it is never used as the large background color.
