export type MovementAction = "forward" | "back" | "left" | "right";

const actionByKey: Record<string, MovementAction | "interact" | undefined> = {
  w: "forward",
  arrowup: "forward",
  s: "back",
  arrowdown: "back",
  a: "left",
  arrowleft: "left",
  d: "right",
  arrowright: "right",
  e: "interact",
  " ": "interact",
};

export class InputManager {
  private pressed = new Set<MovementAction>();
  private interactionQueued = false;

  private onKeyDown = (event: KeyboardEvent) => {
    const action = actionByKey[event.key.toLowerCase()];
    if (!action) return;
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(event.key.toLowerCase())) {
      event.preventDefault();
    }
    if (action === "interact") {
      if (!event.repeat) this.interactionQueued = true;
      return;
    }
    this.pressed.add(action);
  };

  private onKeyUp = (event: KeyboardEvent) => {
    const action = actionByKey[event.key.toLowerCase()];
    if (action && action !== "interact") this.pressed.delete(action);
  };

  constructor() {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
  }

  public movement() {
    return {
      x: (this.pressed.has("right") ? 1 : 0) - (this.pressed.has("left") ? 1 : 0),
      z: (this.pressed.has("back") ? 1 : 0) - (this.pressed.has("forward") ? 1 : 0),
    };
  }

  public consumeInteraction() {
    const queued = this.interactionQueued;
    this.interactionQueued = false;
    return queued;
  }

  public dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.pressed.clear();
  }
}
