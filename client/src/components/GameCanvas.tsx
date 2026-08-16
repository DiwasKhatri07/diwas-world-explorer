/**
 * Postcard Archipelago visual system: full-bleed world, navy-ink editorial UI,
 * parchment cards, and Compass Coral only for discovery and action signals.
 */
import { useEffect, useRef, useState } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Compass, Footprints, Keyboard, MapPinned, Sparkles, X } from "lucide-react";
import { createGameScene, type GameHandle } from "@/game/scene";
import { landmarkById, type LandmarkId } from "@/game/landmarks";

type HUDState = {
  nearby: LandmarkId | null;
  active: LandmarkId | null;
  discoveries: LandmarkId[];
};

const compassMark = "/manus-storage/compass-flower-mark_17aed5f6.png";
const diwasAvatar = "/manus-storage/diwas-avatar_07dadb43.png";
const totemSheet = "/manus-storage/landmark-totems_89545891.png";
const worldReference = "/manus-storage/diwas-world-reference_de4e0dc1.png";

const initialState: HUDState = { nearby: null, active: null, discoveries: [] };

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);
  const [state, setState] = useState<HUDState>(initialState);
  const [showGuide, setShowGuide] = useState(true);
  const [worldReady, setWorldReady] = useState(false);

  useEffect(() => {
    const onState = (event: Event) => setState((event as CustomEvent<HUDState>).detail);
    window.addEventListener("diwas:state", onState);
    return () => window.removeEventListener("diwas:state", onState);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, adaptToDeviceRatio: true });
    let handle: GameHandle | null = null;
    createGameScene(engine, canvas).then((gameHandle) => {
      handle = gameHandle;
      engine.runRenderLoop(() => gameHandle.scene.render());
      gameHandle.scene.executeWhenReady(() => setWorldReady(true));
    });
    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      handle?.dispose();
      engine.dispose();
      startedRef.current = false;
    };
  }, []);

  const activeLandmark = state.active ? landmarkById[state.active] : null;
  const nearbyLandmark = state.nearby ? landmarkById[state.nearby] : null;

  return (
    <main className="world-shell">
      <img className={`world-fallback ${worldReady ? "is-hidden" : ""}`} src={worldReference} alt="" aria-hidden="true" />
      <canvas ref={canvasRef} className={`world-canvas ${worldReady ? "is-ready" : ""}`} style={{ touchAction: "none" }} aria-label="Diwas World Explorer interactive island" />

      <div className="world-vignette" aria-hidden="true" />

      <header className="world-brand" aria-label="Diwas World Explorer">
        <img className="brand-mark" src={compassMark} alt="" />
        <div>
          <p>Diwas</p>
          <h1>World Explorer</h1>
        </div>
        <span className="brand-stamp">Field edition</span>
      </header>

      <aside className="field-notes" aria-label="Exploration progress">
        <div className="field-notes-topline">
          <span className="tiny-kicker">Field notes</span>
          <Compass size={17} strokeWidth={1.8} />
        </div>
        <strong>
          {state.discoveries.length}<span>/4</span>
        </strong>
        <p>{state.discoveries.length === 0 ? "Four small stories are waiting." : "The island is starting to open up."}</p>
        <div className="note-progress" aria-hidden="true">
          {["about", "skills", "projects", "contact"].map((id) => (
            <i className={state.discoveries.includes(id as LandmarkId) ? "is-found" : ""} key={id} />
          ))}
        </div>
      </aside>

      {showGuide && !activeLandmark && (
        <section className="control-guide">
          <button className="guide-dismiss" onClick={() => setShowGuide(false)} aria-label="Dismiss movement guide">
            <X size={14} />
          </button>
          <div className="guide-icon"><Keyboard size={20} strokeWidth={1.8} /></div>
          <div>
            <p className="tiny-kicker">Walk the map</p>
            <strong>WASD or arrow keys</strong>
            <span>Follow coral markers, then press <kbd>E</kbd>.</span>
          </div>
        </section>
      )}

      {nearbyLandmark && !activeLandmark && (
        <button className="nearby-prompt" onClick={() => window.dispatchEvent(new Event("diwas:interact"))}>
          <span className="prompt-flower"><Sparkles size={16} /></span>
          <span>
            <small>Nearby landmark</small>
            <strong>{nearbyLandmark.shortLabel}</strong>
          </span>
          <kbd>E</kbd>
        </button>
      )}

      {activeLandmark && (
        <aside className="discovery-card" aria-live="polite">
          <button className="card-close" onClick={() => window.dispatchEvent(new Event("diwas:close"))} aria-label="Close discovery card">
            <X size={17} />
          </button>
          <div className="card-visuals">
            <img className="card-avatar" src={diwasAvatar} alt="Illustrated Diwas explorer" />
            <img className="card-totem" src={totemSheet} alt="Illustrated island landmarks" />
          </div>
          <div className="card-copy">
            <p className="tiny-kicker">{activeLandmark.kicker}</p>
            <h2>{activeLandmark.title}</h2>
            <p className="card-description">{activeLandmark.description}</p>
            <p className="card-detail">{activeLandmark.detail}</p>
            <button className="resume-walk" onClick={() => window.dispatchEvent(new Event("diwas:close"))}>
              <Footprints size={16} /> Keep exploring
            </button>
          </div>
        </aside>
      )}

      <footer className="world-footer">
        <MapPinned size={15} />
        <span>Spawn point: South Shore</span>
      </footer>
    </main>
  );
}
