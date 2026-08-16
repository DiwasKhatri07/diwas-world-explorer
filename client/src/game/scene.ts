import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { GameWorld } from "./GameWorld";

export type GameHandle = {
  scene: Scene;
  dispose: () => void;
};

export async function createGameScene(_engine: Engine, _canvas: HTMLCanvasElement): Promise<GameHandle> {
  const scene = new Scene(_engine);
  const world = new GameWorld(scene);
  return {
    scene,
    dispose: () => {
      world.dispose();
      scene.dispose();
    },
  };
}
