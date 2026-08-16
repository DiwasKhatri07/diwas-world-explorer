/**
 * Interactive Expedition Portfolio: an authored map world with route modes,
 * field-note content, and explicitly consent-gated voice/camera enhancements.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, Camera, Check, ChevronLeft, ChevronRight, Compass, Crosshair,
  Eye, Footprints, Gamepad2, Github, Hand, Keyboard, Map, Mic, MousePointer2, Navigation,
  Orbit, Play, RefreshCw, Sparkles, Volume2, VolumeX, X, Zap,
} from "lucide-react";
import { AudioManager } from "@/game/AudioManager";
import ThreeExpedition from "@/components/ThreeExpedition";
import { useGithubActivity } from "@/hooks/useGithubActivity";
import { expeditionLevels, levelById, menuAtlas, type ExpeditionLevelId, type ExpeditionStation } from "@/game/expedition";

type Position = { x: number; y: number };
type EntryStage = "menu" | "tutorial" | "world";
type ControlMode = "mouse" | "keyboard" | "hand" | "voice";
type ViewMode = "atlas" | "close";
type PermissionSheet = "camera" | "hand" | null;
type VoiceResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type VoiceRecognizer = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: VoiceResultEvent) => void) | null;
  start: () => void;
};
type VoiceWindow = Window & { SpeechRecognition?: new () => VoiceRecognizer; webkitSpeechRecognition?: new () => VoiceRecognizer };

const compassMark = "/manus-storage/compass-flower-mark_17aed5f6.png";
const explorerAvatar = "/manus-storage/diwas-explorer-character-v3_3345cae2.png";
const fallbackAvatar = "/manus-storage/diwas-avatar_07dadb43.png";
const totemSheet = "/manus-storage/landmark-totems_89545891.png";
const ambienceUrl = "/manus-storage/diwas-island-ambient_44fb9747.mp3";
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const distance = (first: Position, second: Position) => Math.hypot(first.x - second.x, first.y - second.y);
const demoMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo");
const requestedLevel = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("level") : null;
const initialLevelId: ExpeditionLevelId = requestedLevel && requestedLevel in levelById ? requestedLevel as ExpeditionLevelId : "south-shore";

const tutorialSteps = [
  { title: "Choose a route", body: "Pick Mouse, Keyboard, Hand Route, or Voice. You can switch any time from the command dock.", icon: Navigation },
  { title: "Move Diwas", body: "Tap a clear path or use the route keys. The coral marker is your destination pulse.", icon: MousePointer2 },
  { title: "Hand Route guide", body: "With Scout Cam enabled: an open palm toward an edge moves Diwas, a pinch opens a nearby note, and a fist pauses the route. Video stays in your browser.", icon: Hand },
];

export default function GameCanvas() {
  const initialLevel = levelById[initialLevelId];
  const [stage, setStage] = useState<EntryStage>(demoMode ? "world" : "menu");
  const [tutorialStep, setTutorialStep] = useState(0);
  const [levelId, setLevelId] = useState<ExpeditionLevelId>(initialLevelId);
  const [position, setPosition] = useState<Position>(demoMode ? { x: initialLevel.stations[0].x, y: initialLevel.stations[0].y } : initialLevel.spawn);
  const [target, setTarget] = useState<Position | null>(null);
  const [nearby, setNearby] = useState<string | null>(demoMode ? initialLevel.stations[0].id : null);
  const [active, setActive] = useState<string | null>(demoMode ? initialLevel.stations[0].id : null);
  const [discoveries, setDiscoveries] = useState<string[]>(demoMode ? [initialLevel.stations[0].id] : []);
  const [controlMode, setControlMode] = useState<ControlMode>("mouse");
  const [viewMode, setViewMode] = useState<ViewMode>("atlas");
  const [soundOn, setSoundOn] = useState(false);
  const [cameraFlick, setCameraFlick] = useState(false);
  const [permissionSheet, setPermissionSheet] = useState<PermissionSheet>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [handTracking, setHandTracking] = useState(false);
  const [handStatus, setHandStatus] = useState("Hand Route is ready when you enable it.");
  const [voiceStatus, setVoiceStatus] = useState("");
  const { items: githubItems, status: githubStatus, refreshedAt, refresh: refreshGithub } = useGithubActivity("DiwasKhatri07");

  const audioRef = useRef<AudioManager | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const positionRef = useRef(position);
  const targetRef = useRef(target);
  const nearbyRef = useRef(nearby);
  const levelRef = useRef(levelId);
  const stageRef = useRef(stage);
  const activeRef = useRef(active);
  const controlModeRef = useRef(controlMode);
  const handFrameRef = useRef<number | null>(null);
  const handLandmarkerRef = useRef<{ close?: () => void } | null>(null);
  const handLastActionRef = useRef(0);
  const interactRef = useRef<() => void>(() => undefined);

  const level = levelById[levelId];
  const allStations = useMemo(() => expeditionLevels.flatMap((world) => world.stations), []);
  const activeStation = active ? allStations.find((station) => station.id === active) ?? null : null;
  const nearbyStation = nearby ? level.stations.find((station) => station.id === nearby) ?? null : null;
  const levelIndex = expeditionLevels.findIndex((world) => world.id === levelId);
  const isMoving = Boolean(target);

  useEffect(() => {
    const audio = new AudioManager(ambienceUrl);
    audioRef.current = audio;
    return () => audio.dispose();
  }, []);

  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { targetRef.current = target; }, [target]);
  useEffect(() => { nearbyRef.current = nearby; }, [nearby]);
  useEffect(() => { levelRef.current = levelId; }, [levelId]);
  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { controlModeRef.current = controlMode; }, [controlMode]);

  useEffect(() => {
    if (!cameraActive || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
  }, [cameraActive]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (handFrameRef.current) cancelAnimationFrame(handFrameRef.current);
    handLandmarkerRef.current?.close?.();
  }, []);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      const nextTarget = targetRef.current;
      let nextPosition = positionRef.current;
      if (nextTarget && stageRef.current !== "menu") {
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
      const currentLevel = levelById[levelRef.current];
      const closest = currentLevel.stations
        .map((station) => ({ id: station.id, distance: distance(nextPosition, station) }))
        .sort((first, second) => first.distance - second.distance)[0];
      const nextNearby = closest && closest.distance < 7.5 ? closest.id : null;
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
    if (stageRef.current === "menu") return;
    setActive(null);
    setTarget({ x: clamp(next.x, 8, 92), y: clamp(next.y, 10, 89) });
    if (stageRef.current === "tutorial" && tutorialStep === 1) setTutorialStep(2);
    void enableSound();
  };

  const interact = () => {
    const stationId = nearbyRef.current;
    if (!stationId || stageRef.current === "menu") return;
    setActive(stationId);
    setDiscoveries((current) => current.includes(stationId) ? current : [...current, stationId]);
    audioRef.current?.playDiscover();
    if (stageRef.current === "tutorial") setTutorialStep(3);
  };
  interactRef.current = interact;

  const runGuidedStation = () => {
    const station = levelById["south-shore"].stations[0];
    moveTo(station);
    window.setTimeout(() => {
      positionRef.current = { x: station.x, y: station.y };
      nearbyRef.current = station.id;
      setPosition({ x: station.x, y: station.y });
      setNearby(station.id);
      setTarget(null);
      setActive(station.id);
      setDiscoveries((current) => current.includes(station.id) ? current : [...current, station.id]);
      audioRef.current?.playDiscover();
      setTutorialStep(3);
    }, 1500);
  };

  const travelToLevel = (nextId: ExpeditionLevelId) => {
    const next = levelById[nextId];
    setLevelId(nextId);
    setPosition(next.spawn);
    positionRef.current = next.spawn;
    setTarget(null);
    setNearby(null);
    setActive(null);
    setCameraFlick(true);
    window.setTimeout(() => setCameraFlick(false), 260);
  };

  const requestVoiceRoute = () => {
    setControlMode("voice");
    const VoiceRecognition = (window as VoiceWindow).SpeechRecognition ?? (window as VoiceWindow).webkitSpeechRecognition;
    if (!VoiceRecognition) {
      setVoiceStatus("Voice Route needs a browser with speech recognition. Mouse and keyboard routes are ready now.");
      return;
    }
    const recognition = new VoiceRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setVoiceStatus("Listening for: north, south, east, west, explore, or open.");
    recognition.onerror = () => setVoiceStatus("Voice Route was not started. You can keep exploring with mouse or keyboard.");
    recognition.onresult = (event) => {
      const phrase = event.results[0][0].transcript.toLowerCase();
      const origin = targetRef.current ?? positionRef.current;
      audioRef.current?.playVoiceRoute();
      if (phrase.includes("open") || phrase.includes("explore")) interact();
      else if (phrase.includes("north")) moveTo({ x: origin.x, y: origin.y - 16 });
      else if (phrase.includes("south")) moveTo({ x: origin.x, y: origin.y + 16 });
      else if (phrase.includes("east") || phrase.includes("right")) moveTo({ x: origin.x + 16, y: origin.y });
      else if (phrase.includes("west") || phrase.includes("left")) moveTo({ x: origin.x - 16, y: origin.y });
      else setVoiceStatus("Try a route word: north, south, east, west, explore, or open.");
    };
    recognition.start();
  };

  const activateCamera = async (enableHand = false) => {
    setPermissionSheet(null);
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setCameraActive(true);
      setHandTracking(enableHand);
      if (enableHand) {
        setControlMode("hand");
        setHandStatus("Starting Hand Route. Open palm moves; pinch opens a station; fist pauses.");
      }
    } catch {
      setVoiceStatus("Scout Cam was not enabled. The expedition works without device-camera access.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
    setHandTracking(false);
    if (handFrameRef.current) cancelAnimationFrame(handFrameRef.current);
    handFrameRef.current = null;
    handLandmarkerRef.current?.close?.();
    handLandmarkerRef.current = null;
  };

  useEffect(() => {
    if (!handTracking || !cameraActive || !videoRef.current) return;
    let disposed = false;
    const start = async () => {
      try {
        const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task" },
          runningMode: "VIDEO",
          numHands: 1,
        });
        if (disposed) { landmarker.close(); return; }
        handLandmarkerRef.current = landmarker;
        const detect = () => {
          const video = videoRef.current;
          if (disposed || !video || video.readyState < 2) { handFrameRef.current = requestAnimationFrame(detect); return; }
          const results = landmarker.detectForVideo(video, performance.now());
          const points = results.landmarks[0];
          if (!points) {
            setHandStatus("Show one hand to Scout Cam. Open palm moves; pinch opens; fist pauses.");
          } else {
            const wrist = points[0];
            const thumb = points[4];
            const index = points[8];
            const middle = points[12];
            const ring = points[16];
            const pinky = points[20];
            const pinch = Math.hypot(index.x - thumb.x, index.y - thumb.y) < 0.065;
            const fingerTipsAboveWrist = [index, middle, ring, pinky].filter((point) => point.y < wrist.y - 0.08).length;
            const fist = [index, middle, ring, pinky].every((point) => point.y > wrist.y - 0.015);
            const now = performance.now();
            if (fist) {
              setTarget(null);
              audioRef.current?.playGesture();
              setHandStatus("Fist detected: route paused.");
            } else if (pinch && now - handLastActionRef.current > 950) {
              handLastActionRef.current = now;
              audioRef.current?.playGesture();
              setHandStatus("Pinch detected: opening the nearby field note.");
              interactRef.current();
            } else if (fingerTipsAboveWrist >= 3 && now - handLastActionRef.current > 520) {
              handLastActionRef.current = now;
              const origin = targetRef.current ?? positionRef.current;
              const offsetX = index.x < 0.34 ? -9 : index.x > 0.66 ? 9 : 0;
              const offsetY = index.y < 0.33 ? -9 : index.y > 0.67 ? 9 : 0;
              if (offsetX || offsetY) {
                setTarget({ x: clamp(origin.x + offsetX, 8, 92), y: clamp(origin.y + offsetY, 10, 89) });
                void enableSound();
                audioRef.current?.playGesture();
                setHandStatus(offsetY < 0 ? "Open palm: moving forward." : offsetY > 0 ? "Open palm: moving back." : offsetX < 0 ? "Open palm: moving left." : "Open palm: moving right.");
              } else setHandStatus("Open palm: move your hand toward a screen edge to route Diwas.");
            }
          }
          handFrameRef.current = requestAnimationFrame(detect);
        };
        detect();
      } catch {
        setHandTracking(false);
        setHandStatus("Hand Route could not load on this device. Mouse, keys, and voice remain available.");
      }
    };
    void start();
    return () => {
      disposed = true;
      if (handFrameRef.current) cancelAnimationFrame(handFrameRef.current);
      handLandmarkerRef.current?.close?.();
      handLandmarkerRef.current = null;
    };
  }, [handTracking, cameraActive]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (stageRef.current === "menu" || activeRef.current || controlModeRef.current !== "keyboard") return;
      const key = event.key.toLowerCase();
      if (key === "e" || key === " ") {
        event.preventDefault();
        interact();
        return;
      }
      const change = key === "w" || key === "arrowup" ? { x: 0, y: -8 }
        : key === "s" || key === "arrowdown" ? { x: 0, y: 8 }
        : key === "a" || key === "arrowleft" ? { x: -8, y: 0 }
        : key === "d" || key === "arrowright" ? { x: 8, y: 0 } : null;
      if (!change) return;
      event.preventDefault();
      const origin = targetRef.current ?? positionRef.current;
      moveTo({ x: origin.x + change.x, y: origin.y + change.y });
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const closeCard = () => {
    setActive(null);
    if (stage === "tutorial" && tutorialStep === 3) setTutorialStep(4);
  };

  return (
    <main className={`world-shell is-3d level-${level.theme} view-${viewMode} ${cameraFlick ? "camera-flick" : ""}`}>
      <img
        className="world-fallback"
        src={level.background}
        alt={`${level.name} illustrated expedition map`}
        style={{ transformOrigin: `${position.x}% ${position.y}%` }}
      />
      <ThreeExpedition className="three-expedition" levelId={levelId} position={position} target={target} stations={level.stations} activeStationId={active} viewMode={viewMode} />
      <div
        className="world-map-layer"
        role="button"
        tabIndex={0}
        aria-label="Tap anywhere on the map to move Diwas"
        onPointerDown={(event) => {
          if (controlMode !== "mouse") return;
          const rect = event.currentTarget.getBoundingClientRect();
          moveTo({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
        }}
      />
      <div className="world-vignette" aria-hidden="true" />

      {level.stations.map((station) => (
        <button
          className={`station-marker ${discoveries.includes(station.id) ? "is-found" : ""} ${nearby === station.id ? "is-nearby" : ""}`}
          key={station.id}
          style={{ left: `${station.x}%`, top: `${station.y}%` }}
          onClick={(event) => { event.stopPropagation(); moveTo(station); }}
          aria-label={`Travel to ${station.name}`}>
          <img src={compassMark} alt="" />
          <span>{station.name}</span>
        </button>
      ))}

      {target && <span className="move-pin" style={{ left: `${target.x}%`, top: `${target.y}%` }} aria-hidden="true" />}
      <header className="world-brand" aria-label="Diwas World Explorer">
        <img className="brand-mark" src={compassMark} alt="" />
        <div><p>Diwas</p><h1>World Explorer</h1></div>
        <span className="brand-stamp">Field edition</span>
      </header>

      <aside className="field-notes" aria-label="Exploration progress">
        <div className="field-notes-topline"><span className="tiny-kicker">Expedition log</span><Compass size={17} strokeWidth={1.8} /></div>
        <strong>{discoveries.length}<span>/{allStations.length}</span></strong>
        <p>{discoveries.length === 0 ? "Choose your first route." : `${discoveries.length} discovery stamp${discoveries.length === 1 ? "" : "s"} logged.`}</p>
        <div className="note-progress" aria-hidden="true"><i className="is-found" /><i className={discoveries.length > 3 ? "is-found" : ""} /><i className={discoveries.length > 6 ? "is-found" : ""} /><i className={discoveries.length > 9 ? "is-found" : ""} /></div>
      </aside>

      <aside className="github-log" aria-label="Live GitHub activity">
        <div className="github-log-heading"><span className="tiny-kicker"><Github size={13} /> Live code log</span><button onClick={() => void refreshGithub()} aria-label="Refresh GitHub activity"><RefreshCw size={13} /></button></div>
        {githubStatus === "loading" && <p>Reading public activity…</p>}
        {githubStatus === "error" && <p>Activity is temporarily unavailable. Refresh to try again.</p>}
        {githubStatus === "ready" && <ul>{githubItems.slice(0, 3).map((item) => <li key={item.id}><a href={item.url} target="_blank" rel="noreferrer"><strong>{item.repository}</strong><span>{item.title} · {item.date}</span></a></li>)}</ul>}
        {refreshedAt && <small>Updated {refreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>}
      </aside>

      <button className="audio-toggle" onClick={() => soundOn ? (audioRef.current?.toggle(), setSoundOn(false)) : void enableSound()} aria-pressed={soundOn}>
        {soundOn ? <Volume2 size={16} strokeWidth={1.8} /> : <VolumeX size={16} strokeWidth={1.8} />}<span>{soundOn ? "Sound on" : "Enable sound"}</span>
      </button>

      <nav className="level-rail" aria-label="Expedition levels">
        {expeditionLevels.map((world) => (
          <button className={world.id === levelId ? "is-active" : ""} key={world.id} onClick={() => travelToLevel(world.id)}>
            <span>{world.order}</span><strong>{world.name}</strong>
          </button>
        ))}
      </nav>

      <section className="command-dock" aria-label="Exploration controls">
        <button className={controlMode === "mouse" ? "is-active" : ""} onClick={() => setControlMode("mouse")}><MousePointer2 size={15} /><span>Mouse</span></button>
        <button className={controlMode === "keyboard" ? "is-active" : ""} onClick={() => setControlMode("keyboard")}><Keyboard size={15} /><span>Keys</span></button>
        <button className={controlMode === "hand" ? "is-active" : ""} onClick={() => cameraActive ? (setControlMode("hand"), setHandTracking(true)) : setPermissionSheet("hand")}><Hand size={15} /><span>Hand</span></button>
        <button className={controlMode === "voice" ? "is-active" : ""} onClick={requestVoiceRoute}><Mic size={15} /><span>Speak</span></button>
        <button className="view-toggle" onClick={() => { setViewMode((current) => current === "atlas" ? "close" : "atlas"); setCameraFlick(true); window.setTimeout(() => setCameraFlick(false), 260); }}>
          {viewMode === "atlas" ? <Orbit size={15} /> : <Eye size={15} />}<span>{viewMode === "atlas" ? "3rd View" : "POV"}</span>
        </button>
        <button className={cameraActive ? "is-active" : ""} onClick={() => cameraActive ? stopCamera() : setPermissionSheet("camera")}><Camera size={15} /><span>Scout Cam</span></button>
      </section>

      {voiceStatus && <div className="voice-status"><Mic size={14} />{voiceStatus}<button onClick={() => setVoiceStatus("")} aria-label="Dismiss voice status"><X size={13} /></button></div>}
      {cameraActive && <div className={`camera-preview ${handTracking ? "is-tracking" : ""}`}><video ref={videoRef} autoPlay playsInline muted /><span>{handTracking ? <Hand size={12} /> : <Camera size={12} />}{handTracking ? " Hand Route" : " Scout Cam"}</span><button onClick={stopCamera} aria-label="Stop Scout Cam"><X size={13} /></button></div>}
      {handTracking && <div className="hand-status"><Hand size={14} />{handStatus}</div>}

      {stage === "world" && nearbyStation && !activeStation && (
        <button className="nearby-prompt" onClick={interact}><span className="prompt-flower"><Sparkles size={16} /></span><span><small>Nearby station</small><strong>{nearbyStation.name}</strong></span><kbd>E</kbd></button>
      )}

      {stage === "tutorial" && (
        <section className="tutorial-panel" aria-live="polite">
          <div className="tutorial-orbit"><Gamepad2 size={20} /></div>
          <p className="tiny-kicker">Expedition briefing · {Math.min(tutorialStep + 1, 4)}/4</p>
          {tutorialStep < 3 ? <>
            <h2>{tutorialSteps[tutorialStep].title}</h2><p>{tutorialSteps[tutorialStep].body}</p>
            {tutorialStep === 0 && <div className="tutorial-modes"><button className={controlMode === "mouse" ? "is-active" : ""} onClick={() => { setControlMode("mouse"); setTutorialStep(1); }}><MousePointer2 size={16} /> Mouse / Tap</button><button className={controlMode === "keyboard" ? "is-active" : ""} onClick={() => { setControlMode("keyboard"); setTutorialStep(1); }}><Keyboard size={16} /> Keyboard</button><button onClick={() => setPermissionSheet("hand")}><Hand size={16} /> Hand Route</button><button onClick={requestVoiceRoute}><Mic size={16} /> Voice route</button></div>}
            {tutorialStep === 1 && <button className="tutorial-next" onClick={() => setTutorialStep(2)}>I know the route <ArrowRight size={16} /></button>}
            {tutorialStep === 2 && <button className="tutorial-next" onClick={runGuidedStation}>Guide me to a station <Sparkles size={16} /></button>}
          </> : <><h2>Route unlocked.</h2><p>You found a station and opened its field note. The full archipelago is ready whenever you are.</p><button className="tutorial-next" onClick={() => setStage("world")}>Begin exploring <ArrowRight size={16} /></button></>}
          <button className="tutorial-skip" onClick={() => setStage("world")}>Skip briefing</button>
        </section>
      )}

      {activeStation && (
        <aside className={`discovery-card ${activeStation.type === "project" ? "is-project" : ""}`} aria-live="polite">
          <button className="card-close" onClick={closeCard} aria-label="Close discovery card"><X size={17} /></button>
          <div className="card-visuals">
            {activeStation.type === "project" ? <><img className="project-scene" src={activeStation.projectPreview ?? level.background} alt={`${activeStation.name} public project preview`} /><span className="project-snapshot">Public project preview</span></> : <><img className="card-avatar" src={explorerAvatar} alt="Custom Diwas explorer character" onError={(event) => { event.currentTarget.src = fallbackAvatar; }} /><img className="card-totem" src={totemSheet} alt="Illustrated island landmarks" /></>}
          </div>
          <div className="card-copy">
            <p className="tiny-kicker">{activeStation.kicker}</p><h2>{activeStation.title}</h2><p className="card-description">{activeStation.description}</p><p className="card-detail">{activeStation.detail}</p>
            <div className="card-actions"><button className="resume-walk" onClick={closeCard}><Footprints size={16} /> Keep exploring</button>{activeStation.link && <button className="project-link" onClick={() => window.open(activeStation.link, "_blank", "noopener,noreferrer")}>Open source case file <ArrowRight size={14} /></button>}</div>
          </div>
        </aside>
      )}

      <footer className="world-footer"><Map size={15} /><span>{level.order} · {level.name}</span><span className="world-footer-dot">•</span><span>{level.subtitle}</span></footer>

      {stage === "menu" && (
        <section className="start-menu" aria-label="Start Diwas World Explorer">
          <img src={menuAtlas} alt="Illustrated dawn expedition island" />
          <div className="start-menu-shade" />
          <div className="start-menu-card">
            <div className="menu-overline"><img src={compassMark} alt="" /> DIWAS WORLD EXPLORER</div>
            <h2>Begin at the shore.<br /><em>Build toward the horizon.</em></h2>
            <p>An interactive personal world: project archives, learning routes, and field notes gathered into one expanding atlas.</p>
            <div className="menu-actions"><button className="menu-start" onClick={() => { setStage("tutorial"); setTutorialStep(0); }}><Play size={16} fill="currentColor" /> Start expedition</button><button className="menu-skip" onClick={() => setStage("world")}>Enter without briefing <ChevronRight size={15} /></button></div>
            <div className="menu-meta"><span><Crosshair size={13} /> 4 levels</span><span><Zap size={13} /> 15 stations</span><span><Orbit size={13} /> 2 views</span></div>
          </div>
        </section>
      )}

      {permissionSheet && (
        <section className="permission-sheet" role="dialog" aria-modal="true" aria-label="Enable Scout Cam">
          <div className="permission-icon">{permissionSheet === "hand" ? <Hand size={22} /> : <Camera size={22} />}</div><p className="tiny-kicker">Optional device feature</p><h2>{permissionSheet === "hand" ? "Enable Hand Route?" : "Enable Scout Cam?"}</h2><p>{permissionSheet === "hand" ? "Hand Route reads one hand locally in your browser. Open palm near an edge moves Diwas, pinch opens a nearby field note, and a fist pauses movement. No camera video is uploaded." : "Scout Cam can show a small live preview from your device camera. It is off by default, uses no audio, and your browser will ask for permission before it starts."}</p>
          <div><button className="permission-confirm" onClick={() => void activateCamera(permissionSheet === "hand")}><Check size={16} /> Continue to browser permission</button><button className="permission-cancel" onClick={() => setPermissionSheet(null)}>Not now</button></div>
        </section>
      )}
    </main>
  );
}
