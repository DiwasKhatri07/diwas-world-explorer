# Model Research for the 3D World Upgrade

## Linked City Environment

**Source:** https://sketchfab.com/3d-models/low-poly-city-23e03868654d47f69fa5db2413e580c3

The page identifies the author as **golukumar** and marks the model as downloadable under **Creative Commons Attribution 4.0**. The listing describes it as game-ready/low-poly and suitable as a browser-game environment. Before it can be placed into the published game, its downloaded asset package must be supplied as an actual local model file, preferably `.glb` or `.gltf` with textures, so the project can host it and include attribution.

The public Sketchfab download API responded with an authentication requirement in this environment. The city can therefore be used once Diwas downloads the licensed archive from Sketchfab and uploads its `.glb` file here; the in-game **City Route GLB** slot is already prepared to load that model for the current browser session.

## Linked Sample Map

**Source:** https://sketchfab.com/3d-models/smile-game-builder-sample-map-081fb5468bd14e56b5caa0031ce28cf1

The page identifies the author as **SmileBoom_SGB**. It describes the asset as a 3D RPG sample map with approximately **136.1k triangles** and **84.7k vertices**. The page did not expose a download action or license in the accessible content, so it must not be copied into the project without the user supplying a licensed downloadable file or clear permission. Its scale is also substantial for a browser game, so it should be optimized or split into smaller route zones before use.

## Integration Decision

The game will retain its procedural/illustrated fallback world and prepare a GLB/GLTF import path. When Diwas supplies a valid model file, it will be uploaded to project storage, loaded with Three.js GLTFLoader, positioned in a dedicated city or RPG route, and credited in the in-game developer credits.
