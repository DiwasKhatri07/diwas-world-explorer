// Postcard Archipelago v2: a generated premium atlas is the visual world; Babylon owns player motion, waypoints, and gameplay state.
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { AudioManager } from "./AudioManager";
import { InputManager } from "./InputManager";
import { landmarks, type LandmarkId } from "./landmarks";

type HUDState = {
  nearby: LandmarkId | null;
  active: LandmarkId | null;
  discoveries: LandmarkId[];
};

const atlasWorldUrl = "/manus-storage/diwas-atlas-world-v2_d7835872.png";
const avatarUrl = "/manus-storage/diwas-avatar_07dadb43.png";
const ambienceUrl = "/manus-storage/diwas-island-ambient_44fb9747.mp3";

const COLORS = {
  coral: Color3.FromHexString("#ff715b"),
  ink: Color3.FromHexString("#102a43"),
  paper: Color3.FromHexString("#fff6e3"),
};

function makeMaterial(scene: Scene, name: string, color: Color3, alpha = 1) {
  const result = new StandardMaterial(name, scene);
  result.diffuseColor = color;
  result.specularColor = Color3.Black();
  result.alpha = alpha;
  return result;
}

export class GameWorld {
  private readonly input = new InputManager();
  private readonly audio = new AudioManager(ambienceUrl);
  private readonly player: TransformNode;
  private readonly camera: ArcRotateCamera;
  private readonly markers = new Map<LandmarkId, TransformNode>();
  private readonly targetRing: TransformNode;
  private moveTarget: Vector3 | null = null;
  private nearby: LandmarkId | null = null;
  private active: LandmarkId | null = null;
  private discovered = new Set<LandmarkId>();
  private elapsed = 0;
  private lastPositionEvent = 0;
  private animationObserver: ReturnType<Scene["onBeforeRenderObservable"]["add"]> | null = null;
  private onClose = () => {
    if (!this.active) return;
    this.active = null;
    this.emitState();
  };
  private onInteractRequest = () => this.interact();
  private onAudioToggle = () => this.audio.toggle();
  private onUserGesture = () => void this.audio.unlock();

  constructor(private readonly scene: Scene) {
    this.buildAtlasStage();
    this.player = this.buildPlayer();
    this.camera = this.buildCamera();
    this.targetRing = this.buildTargetRing();
    this.buildLandmarkMarkers();
    this.emitState();
    this.animationObserver = this.scene.onBeforeRenderObservable.add(() => this.update());
    window.addEventListener("diwas:close", this.onClose);
    window.addEventListener("diwas:interact", this.onInteractRequest);
    window.addEventListener("diwas:audio-toggle", this.onAudioToggle);
    window.addEventListener("keydown", this.onUserGesture, { once: true });
    window.addEventListener("pointerdown", this.onUserGesture, { once: true });
    this.scene.onPointerDown = (_event, pickInfo) => this.setMoveTarget(pickInfo?.pickedMesh?.name, pickInfo?.pickedPoint);

    if (new URLSearchParams(window.location.search).has("demo")) {
      this.player.position = new Vector3(-2.25, 0.88, -1.1);
      this.nearby = "about";
      this.active = "about";
      this.discovered.add("about");
      this.emitState();
    }
  }

  private buildAtlasStage() {
    this.scene.clearColor.set(0, 0, 0, 0);
    const sky = new HemisphericLight("atlas-sky", new Vector3(0, 1, 0), this.scene);
    sky.intensity = 1.35;
    sky.diffuse = Color3.FromHexString("#fff4d5");
    const sun = new DirectionalLight("atlas-sun", new Vector3(-0.28, -1, 0.22), this.scene);
    sun.position = new Vector3(8, 16, -10);
    sun.intensity = 0.9;

    const navigationSurface = MeshBuilder.CreateGround("navigation-surface", { width: 18.3, height: 12.1 }, this.scene);
    navigationSurface.position.y = 0.71;
    navigationSurface.isPickable = true;
    navigationSurface.material = makeMaterial(this.scene, "invisible-navigation-surface", COLORS.paper, 0);
  }

  private buildPlayer() {
    const root = new TransformNode("diwas-player", this.scene);
    root.position = new Vector3(0, 0.88, -5.15);
    const avatar = MeshBuilder.CreatePlane("diwas-avatar-plane", { width: 1.15, height: 1.92 }, this.scene);
    avatar.parent = root;
    avatar.position.y = 0.96;
    avatar.billboardMode = 7;
    const avatarMaterial = makeMaterial(this.scene, "diwas-avatar-material", COLORS.paper);
    avatarMaterial.diffuseTexture = new Texture(avatarUrl, this.scene, true, false);
    avatarMaterial.opacityTexture = avatarMaterial.diffuseTexture;
    avatarMaterial.useAlphaFromDiffuseTexture = true;
    avatarMaterial.backFaceCulling = false;
    avatar.material = avatarMaterial;
    return root;
  }

  private buildCamera() {
    const camera = new ArcRotateCamera("world-camera", -Math.PI / 2.06, 1.08, 23, new Vector3(0, 0, -0.3), this.scene);
    camera.lowerRadiusLimit = 23;
    camera.upperRadiusLimit = 23;
    camera.lowerBetaLimit = 1.08;
    camera.upperBetaLimit = 1.08;
    camera.lowerAlphaLimit = -Math.PI / 2.06;
    camera.upperAlphaLimit = -Math.PI / 2.06;
    camera.fov = 0.84;
    return camera;
  }

  private buildTargetRing() {
    const root = new TransformNode("move-target-ring", this.scene);
    const outer = MeshBuilder.CreateTorus("move-target-outer", { diameter: 0.9, thickness: 0.07, tessellation: 28 }, this.scene);
    outer.parent = root;
    outer.rotation.x = Math.PI / 2;
    const outerMat = makeMaterial(this.scene, "move-target-coral", COLORS.coral);
    outerMat.emissiveColor = COLORS.coral;
    outer.material = outerMat;
    const inner = MeshBuilder.CreateTorus("move-target-inner", { diameter: 0.48, thickness: 0.035, tessellation: 20 }, this.scene);
    inner.parent = root;
    inner.position.y = 0.045;
    inner.rotation.x = Math.PI / 2;
    const innerMat = makeMaterial(this.scene, "move-target-paper", COLORS.paper);
    innerMat.emissiveColor = COLORS.paper.scale(0.28);
    inner.material = innerMat;
    root.setEnabled(false);
    return root;
  }

  private buildLandmarkMarkers() {
    landmarks.forEach((landmark) => {
      const marker = new TransformNode(`marker-${landmark.id}`, this.scene);
      marker.position = new Vector3(landmark.position.x, 1.2, landmark.position.z);
      const coralMat = makeMaterial(this.scene, `marker-coral-${landmark.id}`, COLORS.coral);
      coralMat.emissiveColor = COLORS.coral.scale(0.32);
      const inkMat = makeMaterial(this.scene, `marker-ink-${landmark.id}`, COLORS.ink);
      for (let index = 0; index < 4; index += 1) {
        const petal = MeshBuilder.CreateSphere(`marker-petal-${landmark.id}-${index}`, { diameterX: 0.37, diameterY: 0.12, diameterZ: 0.53, segments: 12 }, this.scene);
        const angle = (Math.PI * index) / 2;
        petal.parent = marker;
        petal.position = new Vector3(Math.sin(angle) * 0.21, 0, Math.cos(angle) * 0.21);
        petal.rotation.x = Math.PI / 2;
        petal.rotation.z = angle;
        petal.material = coralMat;
      }
      const core = MeshBuilder.CreateSphere(`marker-core-${landmark.id}`, { diameter: 0.24, segments: 12 }, this.scene);
      core.parent = marker;
      core.material = inkMat;
      this.markers.set(landmark.id, marker);
    });
  }

  private update() {
    const delta = Math.min(this.scene.getEngine().getDeltaTime() / 1000, 0.05);
    this.elapsed += delta;
    const keyboard = this.input.movement();
    const keyboardMagnitude = Math.hypot(keyboard.x, keyboard.z);
    if (keyboardMagnitude > 0) this.moveTarget = null;
    const direction = keyboardMagnitude > 0 ? keyboard : this.directionToTarget();
    const magnitude = Math.hypot(direction.x, direction.z);
    const moving = magnitude > 0;

    if (moving) {
      const speed = 4.15;
      const nextX = this.player.position.x + (direction.x / magnitude) * speed * delta;
      const nextZ = this.player.position.z + (direction.z / magnitude) * speed * delta;
      if (this.isInsideIsland(nextX, nextZ)) {
        this.player.position.x = nextX;
        this.player.position.z = nextZ;
      } else {
        this.moveTarget = null;
        this.targetRing.setEnabled(false);
      }
    }

    if (this.moveTarget && Math.hypot(this.player.position.x - this.moveTarget.x, this.player.position.z - this.moveTarget.z) < 0.16) {
      this.moveTarget = null;
      this.targetRing.setEnabled(false);
    }

    this.player.position.y = 0.88 + (moving ? Math.sin(this.elapsed * 10.5) * 0.045 : Math.sin(this.elapsed * 1.9) * 0.012);
    this.camera.setTarget(new Vector3(this.player.position.x * 0.12, 0, this.player.position.z * 0.08));
    if (this.elapsed - this.lastPositionEvent > 0.06) {
      this.lastPositionEvent = this.elapsed;
      window.dispatchEvent(new CustomEvent("diwas:player-position", { detail: { x: this.player.position.x, z: this.player.position.z, moving } }));
    }

    Array.from(this.markers.entries()).forEach(([id, marker], index) => {
      marker.position.y = 1.25 + Math.sin(this.elapsed * 2.1 + index * 1.7) * 0.1;
      marker.rotation.y += delta * 0.5;
      marker.scaling.setAll(id === this.nearby ? 1.15 : 1);
    });

    const nextNearby = this.getNearbyLandmark();
    if (nextNearby !== this.nearby) {
      if (nextNearby) this.audio.playApproach();
      this.nearby = nextNearby;
      this.emitState();
    }
    if (this.input.consumeInteraction()) this.interact();
  }

  private directionToTarget() {
    if (!this.moveTarget) return { x: 0, z: 0 };
    return { x: this.moveTarget.x - this.player.position.x, z: this.moveTarget.z - this.player.position.z };
  }

  private setMoveTarget(meshName: string | undefined, pickedPoint: Vector3 | null | undefined) {
    if (meshName !== "navigation-surface" || !pickedPoint || !this.isInsideIsland(pickedPoint.x, pickedPoint.z)) return;
    this.moveTarget = new Vector3(pickedPoint.x, 0.88, pickedPoint.z);
    this.targetRing.position = new Vector3(pickedPoint.x, 0.89, pickedPoint.z);
    this.targetRing.setEnabled(true);
    void this.audio.unlock();
  }

  private isInsideIsland(x: number, z: number) {
    return (x * x) / 83 + (z * z) / 43 < 1;
  }

  private getNearbyLandmark() {
    const closest = landmarks
      .map((landmark) => ({ landmark, distance: Math.hypot(this.player.position.x - landmark.position.x, this.player.position.z - landmark.position.z) }))
      .sort((a, b) => a.distance - b.distance)[0];
    return closest && closest.distance < 2.15 ? closest.landmark.id : null;
  }

  private interact() {
    if (!this.nearby) return;
    this.active = this.nearby;
    this.discovered.add(this.nearby);
    this.audio.playDiscover();
    this.emitState();
  }

  private emitState() {
    const detail: HUDState = { nearby: this.nearby, active: this.active, discoveries: Array.from(this.discovered) };
    window.dispatchEvent(new CustomEvent<HUDState>("diwas:state", { detail }));
  }

  public dispose() {
    this.input.dispose();
    this.audio.dispose();
    if (this.animationObserver) this.scene.onBeforeRenderObservable.remove(this.animationObserver);
    window.removeEventListener("diwas:close", this.onClose);
    window.removeEventListener("diwas:interact", this.onInteractRequest);
    window.removeEventListener("diwas:audio-toggle", this.onAudioToggle);
    window.removeEventListener("keydown", this.onUserGesture);
    window.removeEventListener("pointerdown", this.onUserGesture);
    this.scene.onPointerDown = undefined;
  }
}
