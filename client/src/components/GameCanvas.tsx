/**
 * Postcard Archipelago v2: a premium rendered atlas remains the visual world;
 * React owns the reliable touch, keyboard, movement, discovery, and audio layer.
 */
import { useEffect, useRef, useState } from "react";
import { Compass, Footprints, MapPinned, MousePointer2, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { AudioManager } from "@/game/AudioManager";
import { landmarkById, type LandmarkId } from "@/game/landmarks";

type Position = { x: number; y: number };

const compassMark = "/manus-storage/compass-flower-mark_17aed5f6.png";
const diwasAvatar = "/manus-storage/diwas-avatar_07dadb43.png";
const totemSheet = "/manus-storage/landmark-totems_89545891.png";
const worldReference = "/manus-storage/diwas-atlas-world-v2_d7835872.png";
const ambienceUrl = "/manus-storage/diwas-island-ambient_44fb9747.mp3";

const mapLandmarks: Array<{ id: LandmarkId; x: number; y: number }> = [
  { id: "about", x: 25, y: 63 },
  { id: "skills", x: 70, y: 19 },
  { id: "projects", x: 22, y: 27 },
  { id: "contact", x: 85, y: 59 },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const distance = (first: Position, second: Position) => Math.hypot(first.x - second.x, first.y - second.y);
const demoMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo");
const initialPosition = demoMode ? { x: 25, y: 63 } : { x: 50, y: 76 };

export default function GameCanvas() {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [target, setTarget] = useState<Position | null>(null);
  const [nearby, setNearby] = useState<LandmarkId | null>(demoMode ? "about" : null);
  const [active, setActive] = useState<LandmarkId | null>(demoMode ? "about" : null);
  const [discoveries, setDiscoveries] = useState<LandmarkId[]>(demoMode ? ["about"] : []);
  const [showGuide, setShowGuide] = useState(true);
  const [soundOn, setSoundOn] = useState(false);

  const audioRef = useRef<AudioManager | null>(null);
  const positionRef = useRef(position);
  const targetRef = useRef(target);
  const nearbyRef = useRef(nearby);

  useEffect(() => {
    const audio = new AudioManager(ambienceUrl);
    audioRef.current = audio;
    return () => audio.dispose();
  }, []);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    nearbyRef.current = nearby;
  }, [nearby]);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      const nextTarget = targetRef.current;
      let nextPosition = positionRef.current;
      if (nextTarget) {
        const gap = distance(nextPosition, nextTarget);
        const step = delta * 18;
        if (gap <= step) {
          nextPosition = nextTarget;
          setTarget(null);
        } else {
          nextPosition = {
            x: nextPosition.x + ((nextTarget.x - nextPosition.x) / gap) * step,
            y: nextPosition.y + ((nextTarget.y - nextPosition.y) / gap) * step,
          };
        }
        positionRef.current = nextPosition;
        setPosition(nextPosition);
      }

      const closest = mapLandmarks
        .map((landmark) => ({ id: landmark.id, distance: distance(nextPosition, landmark) }))
        .sort((a, b) => a.distance - b.distance)[0];
      const nextNearby = closest && closest.distance < 7.3 ? closest.id : null;
      if (nextNearby !== nearbyRef.current) {
        nearbyRef.current = nextNearby;
        setNearby(nextNearby);
        if (nextNearby) audioRef.current?.playApproach();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const enableSound = async () => {
    await audioRef.current?.unlock();
    setSoundOn(Boolean(audioRef.current?.enabled));
  };

  const moveTo = (next: Position) => {
    setActive(null);
    setTarget({ x: clamp(next.x, 11, 89), y: clamp(next.y, 12, 87) });
    void enableSound();
  };

  const interact = () => {
    const id = nearbyRef.current;
    if (!id) return;
    setActive(id);
    setDiscoveries((current) => (current.includes(id) ? current : [...current, id]));
    audioRef.current?.playDiscover();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "e" || key === " ") {
        event.preventDefault();
        interact();
        return;
      }
      const change = key === "w" || key === "arrowup" ? { x: 0, y: -8 } : key === "s" || key === "arrowdown" ? { x: 0, y: 8 } : key === "a" || key === "arrowleft" ? { x: -8, y: 0 } : key === "d" || key === "arrowright" ? { x: 8, y: 0 } : null;
      if (!change) return;
      event.preventDefault();
      const origin = targetRef.current ?? positionRef.current;
      moveTo({ x: origin.x + change.x, y: origin.y + change.y });
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const activeLandmark = active ? landmarkById[active] : null;
  const nearbyLandmark = nearby ? landmarkById[nearby] : null;
  const isMoving = Boolean(target);

  return (
    <main className="world-shell">
      <img className="world-fallback" src={worldReference} alt="Illustrated tropical island map" />
      <div
        className="world-map-layer"
        role="button"
        tabIndex={0}
        aria-label="Tap anywhere on the island to move Diwas"
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          moveTo({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
        }}
      />
      <div className="world-vignette" aria-hidden="true" />

      {target && <span className="move-pin" style={{ left: `${target.x}%`, top: `${target.y}%` }} aria-hidden="true" />}
      <div className={`player-scout ${isMoving ? "is-walking" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} aria-label="Diwas player position">
        <img src={diwasAvatar} alt="Diwas explorer avatar" />
        <span>Diwas</span>
      </div>

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
          <span className="tiny-kicker">Expedition log</span>
          <Compass size={17} strokeWidth={1.8} />
        </div>
        <strong>{discoveries.length}<span>/4</span></strong>
        <p>{discoveries.length === 0 ? "Four route stations await." : `${discoveries.length} route stamp${discoveries.length === 1 ? "" : "s"} logged.`}</p>
        <div className="note-progress" aria-hidden="true">
          {mapLandmarks.map((landmark) => <i className={discoveries.includes(landmark.id) ? "is-found" : ""} key={landmark.id} />)}
        </div>
      </aside>

      <button className="audio-toggle" onClick={() => soundOn ? (audioRef.current?.toggle(), setSoundOn(false)) : void enableSound()} aria-pressed={soundOn}>
        {soundOn ? <Volume2 size={16} strokeWidth={1.8} /> : <VolumeX size={16} strokeWidth={1.8} />}
        <span>{soundOn ? "Sound on" : "Enable sound"}</span>
      </button>

      {showGuide && !activeLandmark && (
        <section className="control-guide">
          <button className="guide-dismiss" onClick={() => setShowGuide(false)} aria-label="Dismiss movement guide"><X size={14} /></button>
          <div className="guide-icon"><MousePointer2 size={20} strokeWidth={1.8} /></div>
          <div>
            <p className="tiny-kicker">Choose a route</p>
            <strong>Tap the island to walk</strong>
            <span>Keyboard works too. Follow coral markers, then press <kbd>E</kbd>.</span>
          </div>
        </section>
      )}

      {nearbyLandmark && !activeLandmark && (
        <button className="nearby-prompt" onClick={interact}>
          <span className="prompt-flower"><Sparkles size={16} /></span>
          <span><small>Nearby landmark</small><strong>{nearbyLandmark.shortLabel}</strong></span>
          <kbd>E</kbd>
        </button>
      )}

      {activeLandmark && (
        <aside className="discovery-card" aria-live="polite">
          <button className="card-close" onClick={() => setActive(null)} aria-label="Close discovery card"><X size={17} /></button>
          <div className="card-visuals">
            <img className="card-avatar" src={diwasAvatar} alt="Illustrated Diwas explorer" />
            <img className="card-totem" src={totemSheet} alt="Illustrated island landmarks" />
          </div>
          <div className="card-copy">
            <p className="tiny-kicker">{activeLandmark.kicker}</p>
            <h2>{activeLandmark.title}</h2>
            <p className="card-description">{activeLandmark.description}</p>
            <p className="card-detail">{activeLandmark.detail}</p>
            <button className="resume-walk" onClick={() => setActive(null)}><Footprints size={16} /> Keep exploring</button>
          </div>
        </aside>
      )}

      <footer className="world-footer"><MapPinned size={15} /><span>Spawn point: South Shore</span></footer>
    </main>
  );
}
