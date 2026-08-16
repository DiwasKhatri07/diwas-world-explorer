import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { InputManager } from "./InputManager";
import { landmarks, type Landmark, type LandmarkId } from "./landmarks";

type HUDState = {
  nearby: LandmarkId | null;
  active: LandmarkId | null;
  discoveries: LandmarkId[];
};

const logoUrl = "/manus-storage/compass-flower-mark_17aed5f6.png";
const worldReferenceUrl = "/manus-storage/diwas-world-reference_de4e0dc1.png";

const COLORS = {
  water: Color3.FromHexString("#156e7a"),
  shallow: Color3.FromHexString("#32a5a1"),
  sand: Color3.FromHexString("#f4dba5"),
  grass: Color3.FromHexString("#79ad68"),
  grassDark: Color3.FromHexString("#458361"),
  ink: Color3.FromHexString("#102a43"),
  coral: Color3.FromHexString("#ff715b"),
  cream: Color3.FromHexString("#fff6e3"),
  wood: Color3.FromHexString("#9a673d"),
  tealRoof: Color3.FromHexString("#237e87"),
};

function material(scene: Scene, name: string, color: Color3, alpha = 1) {
  const result = new StandardMaterial(name, scene);
  result.diffuseColor = color;
  result.specularColor = Color3.Black();
  result.alpha = alpha;
  return result;
}

function circlePath(scene: Scene, x: number, z: number, width: number, depth: number, rotation: number) {
  const path = MeshBuilder.CreateBox(
    `path-${x}-${z}`,
    { width, depth, height: 0.055 },
    scene,
  );
  path.position = new Vector3(x, 0.38, z);
  path.rotation.y = rotation;
  path.material = material(scene, `sand-path-${x}`, COLORS.sand);
}

function createPalm(scene: Scene, x: number, z: number, scale = 1) {
  const trunk = MeshBuilder.CreateCylinder(
    `palm-trunk-${x}-${z}`,
    { height: 1.8 * scale, diameterTop: 0.17 * scale, diameterBottom: 0.28 * scale, tessellation: 8 },
    scene,
  );
  trunk.position = new Vector3(x, 1.2 * scale, z);
  trunk.rotation.z = x > 0 ? -0.12 : 0.12;
  trunk.material = material(scene, `palm-wood-${x}-${z}`, COLORS.wood);

  for (let index = 0; index < 6; index += 1) {
    const leaf = MeshBuilder.CreateSphere(
      `palm-leaf-${x}-${z}-${index}`,
      { diameterX: 1.7 * scale, diameterY: 0.15 * scale, diameterZ: 0.56 * scale, segments: 8 },
      scene,
    );
    leaf.position = new Vector3(x, 2.18 * scale, z);
    leaf.rotation.y = (Math.PI * 2 * index) / 6;
    leaf.rotation.z = -0.28;
    leaf.material = material(scene, `palm-green-${x}-${z}-${index}`, index % 2 ? COLORS.grass : COLORS.grassDark);
  }
}

function createCompassMarker(scene: Scene, landmark: Landmark) {
  const marker = new TransformNode(`marker-${landmark.id}`, scene);
  marker.position = new Vector3(landmark.position.x, 2.5, landmark.position.z);
  const petalMaterial = material(scene, `marker-coral-${landmark.id}`, COLORS.coral);
  petalMaterial.emissiveColor = Color3.FromHexString("#54251e");
  const coreMaterial = material(scene, `marker-core-${landmark.id}`, COLORS.ink);

  for (let index = 0; index < 4; index += 1) {
    const petal = MeshBuilder.CreateSphere(
      `marker-petal-${landmark.id}-${index}`,
      { diameterX: 0.42, diameterY: 0.18, diameterZ: 0.62, segments: 12 },
      scene,
    );
    const angle = (Math.PI * index) / 2;
    petal.parent = marker;
    petal.position = new Vector3(Math.sin(angle) * 0.25, 0, Math.cos(angle) * 0.25);
    petal.rotation.x = Math.PI / 2;
    petal.rotation.z = angle;
    petal.material = petalMaterial;
  }

  const core = MeshBuilder.CreateSphere(`marker-core-${landmark.id}`, { diameter: 0.29, segments: 12 }, scene);
  core.parent = marker;
  core.material = coreMaterial;
  return marker;
}

function createStudio(scene: Scene, landmark: Landmark) {
  const root = new TransformNode(`studio-${landmark.id}`, scene);
  root.position = new Vector3(landmark.position.x, 0.58, landmark.position.z);
  const wall = MeshBuilder.CreateBox("studio-wall", { width: 1.8, depth: 1.45, height: 1.05 }, scene);
  wall.parent = root;
  wall.material = material(scene, "studio-wall-mat", COLORS.cream);
  const roof = MeshBuilder.CreateCylinder("studio-roof", { height: 0.72, diameter: 1.75, tessellation: 4 }, scene);
  roof.parent = root;
  roof.position.y = 0.88;
  roof.rotation.y = Math.PI / 4;
  roof.material = material(scene, "studio-roof-mat", COLORS.tealRoof);
  const door = MeshBuilder.CreateBox("studio-door", { width: 0.42, height: 0.72, depth: 0.04 }, scene);
  door.parent = root;
  door.position = new Vector3(0, -0.16, -0.74);
  door.material = material(scene, "studio-door-mat", COLORS.coral);
}

function createLookout(scene: Scene, landmark: Landmark) {
  const root = new TransformNode(`lookout-${landmark.id}`, scene);
  root.position = new Vector3(landmark.position.x, 0.55, landmark.position.z);
  const tower = MeshBuilder.CreateCylinder("lookout-tower", { height: 2.1, diameterTop: 0.65, diameterBottom: 1.1, tessellation: 8 }, scene);
  tower.parent = root;
  tower.position.y = 0.95;
  tower.material = material(scene, "lookout-sandstone", COLORS.sand);
  const cap = MeshBuilder.CreateCylinder("lookout-cap", { height: 0.35, diameter: 1.05, tessellation: 8 }, scene);
  cap.parent = root;
  cap.position.y = 2.12;
  cap.material = material(scene, "lookout-cap-mat", COLORS.ink);
  const flag = MeshBuilder.CreateBox("lookout-flag", { width: 0.48, height: 0.25, depth: 0.04 }, scene);
  flag.parent = root;
  flag.position = new Vector3(0.28, 2.62, 0);
  flag.material = material(scene, "lookout-flag-mat", COLORS.coral);
}

function createPier(scene: Scene, landmark: Landmark) {
  const root = new TransformNode(`pier-${landmark.id}`, scene);
  root.position = new Vector3(landmark.position.x, 0.46, landmark.position.z);
  const deck = MeshBuilder.CreateBox("pier-deck", { width: 2.4, depth: 0.45, height: 0.18 }, scene);
  deck.parent = root;
  deck.rotation.y = -0.5;
  deck.material = material(scene, "pier-wood", COLORS.wood);
  const boat = MeshBuilder.CreateSphere("pier-boat", { diameterX: 1.1, diameterY: 0.3, diameterZ: 0.5, segments: 12 }, scene);
  boat.parent = root;
  boat.position = new Vector3(1.08, -0.15, 0.55);
  boat.material = material(scene, "pier-boat-mat", COLORS.tealRoof);
  const mast = MeshBuilder.CreateCylinder("pier-mast", { height: 1.4, diameter: 0.06, tessellation: 6 }, scene);
  mast.parent = root;
  mast.position = new Vector3(-0.25, 0.75, 0);
  mast.material = material(scene, "pier-mast-mat", COLORS.ink);
}

function createGarden(scene: Scene, landmark: Landmark) {
  const root = new TransformNode(`garden-${landmark.id}`, scene);
  root.position = new Vector3(landmark.position.x, 0.52, landmark.position.z);
  const base = MeshBuilder.CreateCylinder("garden-base", { height: 0.24, diameter: 2.1, tessellation: 16 }, scene);
  base.parent = root;
  base.material = material(scene, "garden-base-mat", COLORS.grassDark);
  for (let index = 0; index < 7; index += 1) {
    const flower = MeshBuilder.CreateSphere("garden-flower", { diameter: 0.32, segments: 8 }, scene);
    flower.parent = root;
    const angle = (Math.PI * 2 * index) / 7;
    flower.position = new Vector3(Math.cos(angle) * 0.75, 0.34 + (index % 2) * 0.1, Math.sin(angle) * 0.75);
    flower.material = material(scene, `garden-flower-${index}`, index % 2 ? COLORS.coral : Color3.FromHexString("#f3b5d0"));
  }
}

export class GameWorld {
  private readonly input = new InputManager();
  private readonly player: TransformNode;
  private readonly camera: ArcRotateCamera;
  private readonly markers = new Map<LandmarkId, TransformNode>();
  private nearby: LandmarkId | null = null;
  private active: LandmarkId | null = null;
  private discovered = new Set<LandmarkId>();
  private elapsed = 0;
  private animationObserver: ReturnType<Scene["onBeforeRenderObservable"]["add"]> | null = null;
  private onClose = () => {
    if (!this.active) return;
    this.active = null;
    this.emitState();
  };
  private onInteractRequest = () => this.interact();

  constructor(private readonly scene: Scene) {
    this.buildEnvironment();
    this.player = this.buildPlayer();
    this.camera = this.buildCamera();
    this.buildLandmarks();
    this.emitState();
    this.animationObserver = this.scene.onBeforeRenderObservable.add(() => this.update());
    window.addEventListener("diwas:close", this.onClose);
    window.addEventListener("diwas:interact", this.onInteractRequest);

    if (new URLSearchParams(window.location.search).has("demo")) {
      this.player.position = new Vector3(-2.25, 0.58, -1.1);
      this.nearby = "about";
      this.active = "about";
      this.discovered.add("about");
      this.emitState();
    }
  }

  private buildEnvironment() {
    this.scene.clearColor.set(0.12, 0.54, 0.61, 1);
    const sky = new HemisphericLight("sunny-sky", new Vector3(0, 1, 0), this.scene);
    sky.intensity = 1.25;
    sky.diffuse = Color3.FromHexString("#fff4d3");
    sky.groundColor = Color3.FromHexString("#2c7780");

    const sun = new DirectionalLight("island-sun", new Vector3(-0.4, -1, 0.25), this.scene);
    sun.position = new Vector3(8, 16, -10);
    sun.intensity = 0.85;

    const ocean = MeshBuilder.CreateGround("ocean", { width: 62, height: 62, subdivisions: 1 }, this.scene);
    ocean.position.y = -0.11;
    ocean.material = material(this.scene, "ocean-mat", COLORS.water);

    const shallow = MeshBuilder.CreateCylinder("shallow-ring", { height: 0.22, diameter: 24, tessellation: 56 }, this.scene);
    shallow.position.y = 0.01;
    shallow.scaling.z = 0.88;
    shallow.material = material(this.scene, "shallow-mat", COLORS.shallow);

    const island = MeshBuilder.CreateCylinder("island-main", { height: 0.64, diameter: 20.6, tessellation: 56 }, this.scene);
    island.position.y = 0.31;
    island.scaling.z = 0.78;
    island.material = material(this.scene, "island-grass", COLORS.grass);

    const sand = MeshBuilder.CreateCylinder("island-sand", { height: 0.08, diameter: 18.6, tessellation: 56 }, this.scene);
    sand.position.y = 0.68;
    sand.scaling.z = 0.72;
    sand.material = material(this.scene, "island-sand-mat", COLORS.sand);

    const grassCore = MeshBuilder.CreateCylinder("island-grass-core", { height: 0.07, diameter: 15.3, tessellation: 56 }, this.scene);
    grassCore.position.y = 0.74;
    grassCore.scaling.z = 0.66;
    grassCore.material = material(this.scene, "island-grass-core-mat", Color3.FromHexString("#86b66e"));

    circlePath(this.scene, -1.65, -2.7, 1.1, 7.5, 0.45);
    circlePath(this.scene, 1.7, 0.6, 0.95, 7.7, -0.72);
    circlePath(this.scene, -2.2, 2.9, 1.0, 7.3, 0.78);
    circlePath(this.scene, 1.75, -2.35, 0.95, 5.3, -0.36);

    [[-7, -4, 1.1], [6.8, 5.1, 0.95], [-6.8, 2.2, 0.85], [6.8, -4.1, 1.15], [0.4, 6.4, 0.82]].forEach(([x, z, scale]) =>
      createPalm(this.scene, x, z, scale),
    );

    for (let index = 0; index < 15; index += 1) {
      const x = Math.sin(index * 1.71) * (7.4 + (index % 3));
      const z = Math.cos(index * 2.14) * (4.8 + (index % 3));
      const rock = MeshBuilder.CreateSphere(`rock-${index}`, { diameter: 0.42 + (index % 3) * 0.14, segments: 8 }, this.scene);
      rock.position = new Vector3(x, 0.91, z);
      rock.scaling.y = 0.65;
      rock.material = material(this.scene, `rock-mat-${index}`, index % 2 ? Color3.FromHexString("#6b9a6a") : Color3.FromHexString("#d8b77a"));
    }

    const postcard = MeshBuilder.CreatePlane("atlas-reference-board", { width: 2.65, height: 1.49 }, this.scene);
    postcard.position = new Vector3(-7.5, 1.66, 5.8);
    postcard.rotation.y = 0.55;
    const postcardMat = material(this.scene, "atlas-reference-board-mat", COLORS.cream);
    const texture = new Texture(worldReferenceUrl, this.scene, true, false);
    postcardMat.diffuseTexture = texture;
    postcardMat.emissiveColor = Color3.FromHexString("#1d2f3c");
    postcard.material = postcardMat;
  }

  private buildPlayer() {
    const root = new TransformNode("diwas-player", this.scene);
    root.position = new Vector3(0, 0.78, -6.3);
    const shirt = material(this.scene, "diwas-shirt", COLORS.cream);
    const trousers = material(this.scene, "diwas-trousers", COLORS.ink);
    const skin = material(this.scene, "diwas-skin", Color3.FromHexString("#a5694f"));
    const scarf = material(this.scene, "diwas-scarf", COLORS.coral);
    const hair = material(this.scene, "diwas-hair", Color3.FromHexString("#2a1d1b"));

    const torso = MeshBuilder.CreateCylinder("diwas-torso", { height: 0.76, diameter: 0.48, tessellation: 12 }, this.scene);
    torso.parent = root;
    torso.position.y = 0.72;
    torso.material = shirt;
    const head = MeshBuilder.CreateSphere("diwas-head", { diameter: 0.46, segments: 12 }, this.scene);
    head.parent = root;
    head.position.y = 1.36;
    head.material = skin;
    const hairCap = MeshBuilder.CreateSphere("diwas-hair-cap", { diameterX: 0.47, diameterY: 0.2, diameterZ: 0.44, segments: 12 }, this.scene);
    hairCap.parent = root;
    hairCap.position.y = 1.57;
    hairCap.material = hair;
    const scarfBand = MeshBuilder.CreateTorus("diwas-scarf", { diameter: 0.43, thickness: 0.065, tessellation: 12 }, this.scene);
    scarfBand.parent = root;
    scarfBand.position.y = 1.12;
    scarfBand.rotation.x = Math.PI / 2;
    scarfBand.material = scarf;
    [-0.16, 0.16].forEach((offset, index) => {
      const leg = MeshBuilder.CreateCylinder(`diwas-leg-${index}`, { height: 0.56, diameter: 0.14, tessellation: 8 }, this.scene);
      leg.parent = root;
      leg.position = new Vector3(offset, 0.22, 0);
      leg.material = trousers;
      const shoe = MeshBuilder.CreateSphere(`diwas-shoe-${index}`, { diameterX: 0.2, diameterY: 0.1, diameterZ: 0.31, segments: 8 }, this.scene);
      shoe.parent = root;
      shoe.position = new Vector3(offset, -0.07, -0.05);
      shoe.material = shirt;
    });
    return root;
  }

  private buildCamera() {
    const camera = new ArcRotateCamera("world-camera", -Math.PI / 2.1, 1.08, 23, new Vector3(0, 0, -0.3), this.scene);
    camera.lowerRadiusLimit = 23;
    camera.upperRadiusLimit = 23;
    camera.lowerBetaLimit = 1.08;
    camera.upperBetaLimit = 1.08;
    camera.lowerAlphaLimit = -Math.PI / 2.1;
    camera.upperAlphaLimit = -Math.PI / 2.1;
    camera.fov = 0.84;
    return camera;
  }

  private buildLandmarks() {
    createStudio(this.scene, landmarks[0]);
    createLookout(this.scene, landmarks[1]);
    createPier(this.scene, landmarks[2]);
    createGarden(this.scene, landmarks[3]);
    landmarks.forEach((landmark) => this.markers.set(landmark.id, createCompassMarker(this.scene, landmark)));

    const logo = MeshBuilder.CreatePlane("world-compass", { width: 1.05, height: 1.05 }, this.scene);
    logo.position = new Vector3(0, 0.9, -7.6);
    logo.billboardMode = 7;
    const logoMat = material(this.scene, "world-compass-mat", COLORS.coral);
    logoMat.diffuseTexture = new Texture(logoUrl, this.scene, true, false);
    logoMat.opacityTexture = logoMat.diffuseTexture;
    logo.material = logoMat;
  }

  private update() {
    const delta = Math.min(this.scene.getEngine().getDeltaTime() / 1000, 0.05);
    this.elapsed += delta;
    const direction = this.input.movement();
    const magnitude = Math.hypot(direction.x, direction.z);
    const moving = magnitude > 0;

    if (moving) {
      const speed = 4.35;
      const travelX = (direction.x / magnitude) * speed * delta;
      const travelZ = (direction.z / magnitude) * speed * delta;
      const nextX = Math.max(-8.2, Math.min(8.2, this.player.position.x + travelX));
      const nextZ = Math.max(-5.9, Math.min(5.9, this.player.position.z + travelZ));
      if ((nextX * nextX) / 83 + (nextZ * nextZ) / 43 < 1) {
        this.player.position.x = nextX;
        this.player.position.z = nextZ;
      }
      const targetRotation = Math.atan2(direction.x, direction.z);
      let turn = targetRotation - this.player.rotation.y;
      turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      this.player.rotation.y += turn * Math.min(1, delta * 9);
    }
    this.player.position.y = 0.78 + (moving ? Math.sin(this.elapsed * 11) * 0.055 : Math.sin(this.elapsed * 2.1) * 0.012);
    this.camera.setTarget(new Vector3(this.player.position.x * 0.14, 0, this.player.position.z * 0.1));

    Array.from(this.markers.entries()).forEach(([id, marker]) => {
      marker.position.y = 2.35 + Math.sin(this.elapsed * 2.25 + landmarks.findIndex((item) => item.id === id)) * 0.12;
      marker.rotation.y += delta * 0.75;
    });

    const nextNearby = this.getNearbyLandmark();
    if (nextNearby !== this.nearby) {
      this.nearby = nextNearby;
      this.emitState();
    }
    if (this.input.consumeInteraction()) this.interact();
  }

  private getNearbyLandmark() {
    const closest = landmarks
      .map((landmark) => ({
        landmark,
        distance: Math.hypot(this.player.position.x - landmark.position.x, this.player.position.z - landmark.position.z),
      }))
      .sort((a, b) => a.distance - b.distance)[0];
    return closest && closest.distance < 2.15 ? closest.landmark.id : null;
  }

  private interact() {
    if (!this.nearby) return;
    this.active = this.nearby;
    this.discovered.add(this.nearby);
    this.emitState();
  }

  private emitState() {
    const detail: HUDState = { nearby: this.nearby, active: this.active, discoveries: Array.from(this.discovered) };
    window.dispatchEvent(new CustomEvent<HUDState>("diwas:state", { detail }));
  }

  public dispose() {
    this.input.dispose();
    if (this.animationObserver) this.scene.onBeforeRenderObservable.remove(this.animationObserver);
    window.removeEventListener("diwas:close", this.onClose);
    window.removeEventListener("diwas:interact", this.onInteractRequest);
  }
}
