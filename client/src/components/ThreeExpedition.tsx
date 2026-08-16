/**
 * Interactive Expedition Portfolio: a procedural Three.js layer that turns the atlas into a live third-person game world.
 * The surrounding React UI remains the field-guide frame; Three owns the game-space camera, terrain, player, props, and markers.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { menuAtlas, type ExpeditionLevelId, type ExpeditionStation } from "@/game/expedition";

type Position = { x: number; y: number };
type SceneState = {
  levelId: ExpeditionLevelId;
  position: Position;
  target: Position | null;
  stations: ExpeditionStation[];
  activeStationId: string | null;
  viewMode: "atlas" | "close";
  emote: number;
  combatAction: "none" | "slash" | "block";
  environmentModelUrl: string | null;
  avatarModelUrl: string | null;
};

type Props = SceneState & { className?: string };

const toWorld = ({ x, y }: Position) => new THREE.Vector3((x - 50) * 0.52, 0, (y - 50) * 0.42);
const levelPalette: Record<ExpeditionLevelId, { sky: number; water: number; grass: number; sand: number; glow: number }> = {
  "south-shore": { sky: 0x7bdbe1, water: 0x27aebe, grass: 0x63a84d, sand: 0xe8cf8e, glow: 0xff715b },
  "data-observatory": { sky: 0x7dcee2, water: 0x2c9bb9, grass: 0x6aa354, sand: 0xd9c58f, glow: 0xff715b },
  "builder-harbor": { sky: 0xffc783, water: 0x3faab4, grass: 0x738f51, sand: 0xf0cf95, glow: 0xff715b },
  "night-lab": { sky: 0x264b78, water: 0x155f87, grass: 0x355f5d, sand: 0xbea36e, glow: 0xff715b },
  "code-city": { sky: 0xf0b879, water: 0x2d8da0, grass: 0x607c62, sand: 0xe6c783, glow: 0xff715b },
  "rpg-frontier": { sky: 0x8cbdcf, water: 0x3b9bae, grass: 0x728e4f, sand: 0xe6cf92, glow: 0xff715b },
};

function roundedIsland(palette: { grass: number; sand: number }, atlasTexture: THREE.Texture) {
  const root = new THREE.Group();
  const grass = new THREE.Mesh(new THREE.CylinderGeometry(26, 28, 1.4, 56), new THREE.MeshStandardMaterial({ color: palette.grass, roughness: 0.98 }));
  grass.scale.z = 0.68;
  grass.position.y = -0.72;
  grass.receiveShadow = true;
  root.add(grass);
  const sand = new THREE.Mesh(new THREE.CircleGeometry(20, 48), new THREE.MeshStandardMaterial({ color: palette.sand, roughness: 1 }));
  sand.rotation.x = -Math.PI / 2;
  sand.scale.set(1.08, 0.65, 1);
  sand.position.y = 0.02;
  sand.receiveShadow = true;
  root.add(sand);
  return root;
}

function createPlayer() {
  const root = new THREE.Group();
  const navy = new THREE.MeshStandardMaterial({ color: 0x173a56, roughness: 0.72 });
  const navyGlow = new THREE.MeshStandardMaterial({ color: 0x205f7a, emissive: 0x0d3246, emissiveIntensity: 0.45, roughness: 0.5 });
  const mustard = new THREE.MeshStandardMaterial({ color: 0xc99035, roughness: 0.78 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xf5ddb1, roughness: 0.88 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x9b603d, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.7, 6, 12), mustard);
  body.position.y = 1.28;
  body.castShadow = true;
  root.add(body);
  const tee = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.45, 0.3), cream);
  tee.position.set(0, 1.25, 0.34);
  root.add(tee);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 14), skin);
  head.position.y = 2.08;
  head.castShadow = true;
  root.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.335, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), navy);
  hair.position.y = 2.22;
  root.add(hair);
  for (let spike = 0; spike < 5; spike += 1) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 5), navy);
    tuft.position.set((spike - 2) * 0.1, 2.4 + Math.abs(spike - 2) * 0.02, -0.03);
    tuft.rotation.z = (spike - 2) * 0.22;
    root.add(tuft);
  }
  const headphones = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.045, 8, 18, Math.PI), navyGlow);
  headphones.position.set(0, 2.13, -0.04);
  headphones.rotation.y = Math.PI;
  root.add(headphones);
  [-0.18, 0.18].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.74, 0.24), navy);
    leg.position.set(x, 0.48, 0);
    leg.castShadow = true;
    root.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.38), new THREE.MeshStandardMaterial({ color: 0x6d452c, roughness: 0.9 }));
    boot.position.set(x, 0.08, 0.08);
    root.add(boot);
  });
  [-0.5, 0.5].forEach((x) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.58, 4, 8), mustard);
    arm.name = x > 0 ? "right-arm" : "left-arm";
    arm.position.set(x, 1.34, 0);
    arm.rotation.z = x > 0 ? -0.28 : 0.28;
    root.add(arm);
  });
  const sword = new THREE.Group();
  sword.name = "training-sword";
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.02, 0.09), new THREE.MeshStandardMaterial({ color: 0xd7e2dc, metalness: 0.55, roughness: 0.38 }));
  blade.position.y = 0.48;
  sword.add(blade);
  const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.1), new THREE.MeshStandardMaterial({ color: 0xc99035, roughness: 0.7 }));
  hilt.position.y = -0.02;
  sword.add(hilt);
  sword.position.set(0.58, 1.08, 0.08);
  sword.rotation.z = -0.48;
  sword.visible = false;
  root.add(sword);
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.09, 12), new THREE.MeshStandardMaterial({ color: 0x2c6380, metalness: 0.15, roughness: 0.58 }));
  shield.name = "training-shield";
  shield.position.set(-0.58, 1.28, 0.1);
  shield.rotation.z = Math.PI / 2;
  shield.visible = false;
  root.add(shield);
  const pin = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.038, 8, 16), new THREE.MeshStandardMaterial({ color: 0xff715b, emissive: 0x44120e, emissiveIntensity: 0.35 }));
  pin.position.set(0.22, 1.52, 0.42);
  pin.rotation.x = Math.PI / 2;
  root.add(pin);
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.78, 0.2), navy);
  backpack.position.set(0, 1.34, -0.3);
  backpack.castShadow = true;
  root.add(backpack);
  const laptopGlow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.03), new THREE.MeshStandardMaterial({ color: 0x85e4e5, emissive: 0x2d9fa2, emissiveIntensity: 0.8 }));
  laptopGlow.position.set(0, 1.42, -0.42);
  root.add(laptopGlow);
  return root;
}

function createCodeTerminal() {
  const root = new THREE.Group();
  const ink = new THREE.MeshStandardMaterial({ color: 0x102a43, roughness: 0.58, metalness: 0.08 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.26, 1.02, 0.15), ink);
  frame.position.y = 1.25;
  root.add(frame);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.76, 0.025), new THREE.MeshStandardMaterial({ color: 0x184a60, emissive: 0x0d2938, emissiveIntensity: 0.55 }));
  screen.position.set(0, 1.25, 0.09);
  root.add(screen);
  const colors = [0x77e1df, 0xff715b, 0xf4dba5, 0x77e1df];
  colors.forEach((color, index) => {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.5 + (index % 2) * 0.24, 0.045, 0.02), new THREE.MeshBasicMaterial({ color }));
    line.position.set(-0.2 + (index % 2) * 0.08, 1.48 - index * 0.16, 0.115);
    root.add(line);
  });
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.78, 8), ink);
  stand.position.y = 0.42;
  root.add(stand);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.65, 0.14, 10), new THREE.MeshStandardMaterial({ color: 0xf4dba5, roughness: 0.9 }));
  base.position.y = 0.07;
  root.add(base);
  return root;
}

function createStationMarker(active: boolean) {
  const root = new THREE.Group();
  const coral = new THREE.MeshStandardMaterial({ color: 0xff715b, emissive: 0x7a180f, emissiveIntensity: active ? 1.8 : 0.85, roughness: 0.55 });
  const paper = new THREE.MeshStandardMaterial({ color: 0xfff0cc, roughness: 0.8 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.9, 8), paper);
  stem.position.y = 0.45;
  root.add(stem);
  for (let index = 0; index < 4; index += 1) {
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), coral);
    petal.scale.set(1.3, 0.52, 0.46);
    petal.position.set(Math.cos(index * Math.PI / 2) * 0.18, 1.08, Math.sin(index * Math.PI / 2) * 0.18);
    petal.rotation.y = -index * Math.PI / 2;
    root.add(petal);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), paper);
  center.position.y = 1.08;
  root.add(center);
  return root;
}

function createLandmark(kind: number, palette: { sand: number; glow: number }, levelId: ExpeditionLevelId) {
  const root = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0xd7d0bd, roughness: 0.92 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x6d472e, roughness: 0.95 });
  const teal = new THREE.MeshStandardMaterial({ color: 0x216d79, roughness: 0.58, metalness: 0.08 });
  const glow = new THREE.MeshStandardMaterial({ color: palette.glow, emissive: palette.glow, emissiveIntensity: 1.15, roughness: 0.4 });
  if (levelId === "code-city") {
    const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x244c61, roughness: 0.68 });
    const paperMaterial = new THREE.MeshStandardMaterial({ color: 0xf4dba5, roughness: 0.85 });
    for (let block = 0; block < 3; block += 1) {
      const building = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.2 + block * 0.45, 0.82), buildingMaterial);
      building.position.set((block - 1) * 0.66, 0.6 + block * 0.225, block === 1 ? 0.08 : -0.18);
      root.add(building);
      const window = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.025), paperMaterial);
      window.position.set((block - 1) * 0.66, 0.72 + block * 0.3, 0.42);
      root.add(window);
    }
    const routeArch = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.08, 8, 16, Math.PI), glow);
    routeArch.position.set(0, 0.88, 0.51);
    routeArch.rotation.y = Math.PI;
    root.add(routeArch);
  } else if (kind % 4 === 0) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.08, 3.6, 18), stone);
    tower.position.y = 1.8;
    tower.castShadow = true;
    root.add(tower);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), teal);
    dome.position.y = 3.6;
    root.add(dome);
  } else if (kind % 4 === 1) {
    for (let board = 0; board < 4; board += 1) {
      const dock = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.22, 0.65), wood);
      dock.position.set(0, 0.1 + board * 0.26, -board * 0.42);
      dock.castShadow = true;
      root.add(dock);
    }
    const flag = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 4), glow);
    flag.position.set(1.4, 1.25, 0);
    root.add(flag);
  } else if (kind % 4 === 2) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.25, 0.7, 10), stone);
    base.position.y = 0.35;
    root.add(base);
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), glow);
    crystal.position.y = 1.35;
    crystal.rotation.y = Math.PI / 4;
    root.add(crystal);
  } else {
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 1.4, 10), wood);
    lantern.position.y = 0.72;
    root.add(lantern);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), glow);
    lamp.position.y = 1.4;
    root.add(lamp);
  }
  const foundation = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.85, 0.25, 16), new THREE.MeshStandardMaterial({ color: palette.sand, roughness: 1 }));
  foundation.position.y = -0.1;
  root.add(foundation);
  return root;
}

function createPalm() {
  const root = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.25, 2.7, 7), new THREE.MeshStandardMaterial({ color: 0x7b5533, roughness: 1 }));
  trunk.position.y = 1.35;
  trunk.rotation.z = 0.13;
  root.add(trunk);
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x2f814a, roughness: 0.9, side: THREE.DoubleSide });
  for (let leaf = 0; leaf < 6; leaf += 1) {
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.7, 4), leafMaterial);
    frond.position.set(Math.cos(leaf * Math.PI / 3) * 0.42, 2.78, Math.sin(leaf * Math.PI / 3) * 0.42);
    frond.rotation.z = Math.PI / 2;
    frond.rotation.y = leaf * Math.PI / 3;
    root.add(frond);
  }
  return root;
}

function createDataOrbit() {
  const root = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x55d7e1, emissive: 0x1e8090, emissiveIntensity: 1.2, roughness: 0.35 });
  for (let ring = 0; ring < 3; ring += 1) {
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.2 + ring * 0.28, 0.028, 8, 42), material);
    orbit.rotation.set(ring * 0.7, ring * 0.4, ring * 0.8);
    root.add(orbit);
  }
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), material);
  root.add(core);
  return root;
}

function createHarborCrate() {
  const root = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x815b38, roughness: 0.95 });
  const coral = new THREE.MeshStandardMaterial({ color: 0xff715b, emissive: 0x50100b, emissiveIntensity: 0.35 });
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.92, 1.0), wood);
  crate.position.y = 0.46;
  root.add(crate);
  const stamp = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.36, 0.025), coral);
  stamp.position.set(0, 0.55, 0.515);
  root.add(stamp);
  return root;
}

function createNightCrystal() {
  const root = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0x35475a, roughness: 0.9 }));
  base.position.y = 0.11;
  root.add(base);
  for (let shard = 0; shard < 3; shard += 1) {
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.44 + shard * 0.06, 0), new THREE.MeshStandardMaterial({ color: 0x87a6ff, emissive: 0x3650d5, emissiveIntensity: 0.95, roughness: 0.34 }));
    crystal.position.set((shard - 1) * 0.24, 0.67 + shard * 0.22, shard === 1 ? -0.08 : 0.13);
    crystal.scale.y = 1.55;
    crystal.rotation.y = shard * 0.55;
    root.add(crystal);
  }
  return root;
}

export default function ThreeExpedition({ levelId, position, target, stations, activeStationId, viewMode, emote, combatAction, environmentModelUrl, avatarModelUrl, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<SceneState>({ levelId, position, target, stations, activeStationId, viewMode, emote, combatAction, environmentModelUrl, avatarModelUrl });
  stateRef.current = { levelId, position, target, stations, activeStationId, viewMode, emote, combatAction, environmentModelUrl, avatarModelUrl };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 160);
    const sun = new THREE.DirectionalLight(0xfff1c8, 2.2);
    sun.position.set(12, 22, 10);
    sun.castShadow = true;
    scene.add(sun, new THREE.HemisphereLight(0xbbeff2, 0x537447, 2.0));
    const water = new THREE.Mesh(new THREE.PlaneGeometry(150, 130), new THREE.MeshStandardMaterial({ color: 0x27aebe, roughness: 0.36, metalness: 0.12 }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = -1.48;
    water.receiveShadow = true;
    scene.add(water);
    const island = new THREE.Group();
    scene.add(island);
    const player = createPlayer();
    player.position.copy(toWorld(stateRef.current.position));
    scene.add(player);
    const importedEnvironment = new THREE.Group();
    const importedAvatar = new THREE.Group();
    const gltfLoader = new GLTFLoader();
    scene.add(importedEnvironment, importedAvatar);
    const targetRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.07, 8, 28), new THREE.MeshStandardMaterial({ color: 0xff715b, emissive: 0x5b160e, emissiveIntensity: 1.2 }));
    targetRing.rotation.x = Math.PI / 2;
    targetRing.visible = false;
    scene.add(targetRing);
    const markerRoot = new THREE.Group();
    scene.add(markerRoot);
    const landmarkRoot = new THREE.Group();
    scene.add(landmarkRoot);
    const levelRoot = new THREE.Group();
    scene.add(levelRoot);
    const textureLoader = new THREE.TextureLoader();
    const atlasTexture = textureLoader.load(menuAtlas);
    atlasTexture.colorSpace = THREE.SRGBColorSpace;
    let loadedLevel: ExpeditionLevelId | null = null;
    let loadedEnvironmentUrl: string | null = null;
    let loadedAvatarUrl: string | null = null;
    let avatarImported = false;
    let handledEmote = stateRef.current.emote;
    let previousCombatAction = stateRef.current.combatAction;
    let combatUntil = 0;
    let danceUntil = 0;
    let lastTime = performance.now();
    let frame = 0;

    const clearGroup = (group: THREE.Group) => {
      while (group.children.length) {
        const child = group.children.pop();
        if (!child) continue;
        child.traverse((node) => {
          const mesh = node as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
          else mesh.material?.dispose();
        });
      }
    };

    const loadSessionModel = (url: string, target: THREE.Group, targetHeight: number, isAvatar: boolean) => {
      clearGroup(target);
      gltfLoader.load(url, (gltf) => {
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        bounds.getSize(size);
        model.scale.setScalar(targetHeight / Math.max(size.y, 0.001));
        const scaled = new THREE.Box3().setFromObject(model);
        model.position.y -= scaled.min.y;
        model.traverse((node) => { const mesh = node as THREE.Mesh; if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; } });
        target.add(model);
        if (isAvatar) avatarImported = true;
      }, undefined, () => { if (isAvatar) avatarImported = false; });
    };

    const rebuildLevel = (next: SceneState) => {
      const palette = levelPalette[next.levelId];
      scene.background = new THREE.Color(palette.sky);
      scene.fog = new THREE.Fog(palette.sky, 36, 95);
      water.material = new THREE.MeshStandardMaterial({ color: palette.water, roughness: 0.36, metalness: 0.12 });
      clearGroup(levelRoot);
      clearGroup(markerRoot);
      clearGroup(landmarkRoot);
      island.clear();
      island.add(roundedIsland(palette, atlasTexture));
      const atlasUnderlay = new THREE.Mesh(new THREE.PlaneGeometry(51, 34), new THREE.MeshBasicMaterial({ map: atlasTexture, transparent: true, opacity: next.levelId === "night-lab" ? 0.16 : 0.3, color: 0xfff4d6 }));
      atlasUnderlay.rotation.x = -Math.PI / 2;
      atlasUnderlay.rotation.z = Math.PI;
      atlasUnderlay.position.y = 0.045;
      levelRoot.add(atlasUnderlay);
      const waterBands = new THREE.Mesh(new THREE.RingGeometry(25.5, 33, 64), new THREE.MeshBasicMaterial({ color: palette.water, transparent: true, opacity: 0.44, side: THREE.DoubleSide }));
      waterBands.rotation.x = -Math.PI / 2;
      waterBands.scale.z = 0.69;
      waterBands.position.y = -1.36;
      levelRoot.add(waterBands);
      const route = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-14, 0.1, 7), new THREE.Vector3(-7, 0.12, -1), new THREE.Vector3(-1, 0.12, 3), new THREE.Vector3(7, 0.12, -4), new THREE.Vector3(15, 0.12, 5),
      ]);
      const routeLine = new THREE.Mesh(new THREE.TubeGeometry(route, 36, 0.2, 8, false), new THREE.MeshStandardMaterial({ color: palette.sand, roughness: 1 }));
      levelRoot.add(routeLine);
      route.getSpacedPoints(18).forEach((point, index) => {
        if (index % 2) return;
        const marker = new THREE.Mesh(new THREE.CircleGeometry(0.11, 10), new THREE.MeshBasicMaterial({ color: 0xfff0cc, transparent: true, opacity: 0.78 }));
        marker.rotation.x = -Math.PI / 2;
        marker.position.copy(point).add(new THREE.Vector3(0, 0.15, 0));
        levelRoot.add(marker);
      });
      next.stations.forEach((station, index) => {
        const point = toWorld(station);
        const marker = createStationMarker(station.id === next.activeStationId);
        marker.position.copy(point);
        marker.userData.stationIndex = index;
        markerRoot.add(marker);
        const landmark = createLandmark(index, palette, next.levelId);
        landmark.position.copy(point.clone().add(new THREE.Vector3(index % 2 === 0 ? 1.8 : -1.8, 0, index % 2 === 0 ? -1.1 : 1.1)));
        landmark.rotation.y = index * 0.74;
        landmarkRoot.add(landmark);
        const terminal = createCodeTerminal();
        terminal.position.copy(point.clone().add(new THREE.Vector3(index % 2 === 0 ? -1.42 : 1.42, 0, index % 2 === 0 ? 1.34 : -1.34)));
        terminal.rotation.y = index * 0.48 + Math.PI;
        terminal.scale.setScalar(0.78);
        landmarkRoot.add(terminal);
      });
      for (let propIndex = 0; propIndex < 12; propIndex += 1) {
        const angle = propIndex * 1.83;
        const radius = 7 + (propIndex % 4) * 3.2;
        const prop = next.levelId === "south-shore" ? createPalm()
          : next.levelId === "data-observatory" ? createDataOrbit()
            : next.levelId === "builder-harbor" ? createHarborCrate()
              : createNightCrystal();
        prop.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius * 0.56);
        prop.rotation.y = angle;
        prop.scale.setScalar(next.levelId === "data-observatory" ? 0.75 : 0.9 + (propIndex % 3) * 0.08);
        levelRoot.add(prop);
      }
      for (let flagIndex = 0; flagIndex < 5; flagIndex += 1) {
        const point = route.getPointAt((flagIndex + 1) / 6);
        const flag = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.3, 6), new THREE.MeshStandardMaterial({ color: 0x183d58, roughness: 0.9 }));
        pole.position.y = 0.65;
        flag.add(pole);
        const pennant = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.55, 3), new THREE.MeshStandardMaterial({ color: 0xf4dba5, roughness: 0.86 }));
        pennant.position.set(0.2, 1.08, 0);
        pennant.rotation.z = -Math.PI / 2;
        flag.add(pennant);
        flag.position.copy(point).add(new THREE.Vector3(0, 0.05, flagIndex % 2 ? 0.9 : -0.9));
        levelRoot.add(flag);
      }
      for (let rock = 0; rock < 36; rock += 1) {
        const angle = rock * 2.399;
        const radius = 5 + (rock % 9) * 2.05;
        const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24 + (rock % 3) * 0.12, 0), new THREE.MeshStandardMaterial({ color: rock % 2 ? 0x577a50 : 0x70915c, roughness: 1 }));
        boulder.position.set(Math.cos(angle) * radius, 0.15, Math.sin(angle) * radius * 0.58);
        boulder.scale.y = 1.6;
        boulder.castShadow = true;
        levelRoot.add(boulder);
      }
      loadedLevel = next.levelId;
    };

    const resize = () => {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const render = (time: number) => {
      const state = stateRef.current;
      if (loadedLevel !== state.levelId) rebuildLevel(state);
      if (state.environmentModelUrl !== loadedEnvironmentUrl) {
        loadedEnvironmentUrl = state.environmentModelUrl;
        clearGroup(importedEnvironment);
        if (state.environmentModelUrl) loadSessionModel(state.environmentModelUrl, importedEnvironment, 13, false);
      }
      if (state.avatarModelUrl !== loadedAvatarUrl) {
        loadedAvatarUrl = state.avatarModelUrl;
        avatarImported = false;
        clearGroup(importedAvatar);
        if (state.avatarModelUrl) loadSessionModel(state.avatarModelUrl, importedAvatar, 2.35, true);
      }
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      const worldPosition = toWorld(state.position);
      player.position.lerp(worldPosition, Math.min(1, dt * 12));
      importedAvatar.position.copy(player.position);
      importedAvatar.rotation.y = player.rotation.y;
      player.visible = !avatarImported;
      if (state.emote !== handledEmote) { handledEmote = state.emote; danceUntil = time + 2500; }
      const leftArm = player.getObjectByName("left-arm");
      const rightArm = player.getObjectByName("right-arm");
      const sword = player.getObjectByName("training-sword");
      const shield = player.getObjectByName("training-shield");
      if (state.combatAction !== previousCombatAction) { previousCombatAction = state.combatAction; combatUntil = time + 720; }
      const inCombatMotion = state.combatAction !== "none" && time < combatUntil;
      if (inCombatMotion && state.combatAction === "slash") {
        if (sword) sword.visible = true;
        if (shield) shield.visible = false;
        player.rotation.z = Math.sin(time / 52) * 0.16;
        if (rightArm) rightArm.rotation.z = -1.55 + Math.sin(time / 85) * 0.9;
        if (leftArm) leftArm.rotation.z = 0.72;
      } else if (inCombatMotion && state.combatAction === "block") {
        if (sword) sword.visible = false;
        if (shield) shield.visible = true;
        player.rotation.z = 0;
        if (rightArm) rightArm.rotation.z = -0.9;
        if (leftArm) leftArm.rotation.z = 0.9;
      } else
      if (time < danceUntil) {
        if (sword) sword.visible = false;
        if (shield) shield.visible = false;
        const beat = Math.sin(time / 110);
        player.position.y = Math.abs(beat) * 0.22;
        player.rotation.z = beat * 0.1;
        if (leftArm) leftArm.rotation.z = 0.55 + beat * 0.85;
        if (rightArm) rightArm.rotation.z = -0.55 - beat * 0.85;
      } else {
        if (sword) sword.visible = false;
        if (shield) shield.visible = false;
        player.position.y = THREE.MathUtils.lerp(player.position.y, worldPosition.y, Math.min(1, dt * 8));
        player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, 0, Math.min(1, dt * 8));
        if (leftArm) leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.28, Math.min(1, dt * 8));
        if (rightArm) rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.28, Math.min(1, dt * 8));
      }
      if (state.target) {
        const destination = toWorld(state.target);
        const direction = destination.clone().sub(player.position);
        if (direction.lengthSq() > 0.02) player.rotation.y = Math.atan2(direction.x, direction.z);
        importedAvatar.rotation.y = player.rotation.y;
        targetRing.visible = true;
        targetRing.position.copy(destination).add(new THREE.Vector3(0, 0.12, 0));
        targetRing.rotation.z += dt * 1.6;
        targetRing.scale.setScalar(1 + Math.sin(time / 180) * 0.1);
      } else targetRing.visible = false;
      markerRoot.children.forEach((marker, index) => {
        marker.rotation.y += dt * 0.8;
        marker.position.y = Math.sin(time / 520 + index) * 0.11;
      });
      const forward = new THREE.Vector3(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
      if (state.viewMode === "close") {
        const closeCam = player.position.clone().add(new THREE.Vector3(0, 1.85, 0)).add(forward.clone().multiplyScalar(0.25));
        camera.position.lerp(closeCam, Math.min(1, dt * 5));
        camera.lookAt(player.position.clone().add(forward.multiplyScalar(8)).add(new THREE.Vector3(0, 1.1, 0)));
      } else {
        const thirdCam = player.position.clone().add(new THREE.Vector3(6.4, 8.6, 10.7));
        camera.position.lerp(thirdCam, Math.min(1, dt * 3));
        camera.lookAt(player.position.clone().add(new THREE.Vector3(0, 0.8, 0)));
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      clearGroup(levelRoot); clearGroup(markerRoot); clearGroup(landmarkRoot);
      clearGroup(importedEnvironment); clearGroup(importedAvatar);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={className ?? "three-expedition"} aria-label="Live 3D expedition world" />;
}
