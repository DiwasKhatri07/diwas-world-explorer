/**
 * Interactive Expedition Portfolio: an authored map world with route modes,
 * field-note content, and explicitly consent-gated voice/camera enhancements.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, Camera, Check, ChevronLeft, ChevronRight, Compass, Crosshair,
  Eye, Footprints, Gamepad2, Github, Hand, Keyboard, Map, Mic, MousePointer2, Navigation,
  Orbit, Play, RefreshCw, Shield, Sparkles, Swords, Upload, UserRound, Volume2, VolumeX, X, Zap, Gauge, Award,
} from "lucide-react";
import { AudioManager } from "@/game/AudioManager";
import ThreeExpedition, { type EnvironmentLoadState } from "@/components/ThreeExpedition";
import { useGithubActivity } from "@/hooks/useGithubActivity";
import { expeditionLevels, levelById, menuAtlas, type ExpeditionLevelId, type ExpeditionStation } from "@/game/expedition";

type Position = { x: number; y: number };
type EntryStage = "menu" | "calibration" | "tutorial" | "world";
type ControlMode = "mouse" | "keyboard" | "hand" | "voice";
type ViewMode = "atlas" | "close";
type WorldMode = "2d" | "3d";
type PermissionSheet = "camera" | "hand" | "eye" | null;
type HandPoint = { x: number; y: number };
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
const defaultMaleCharacterUrl = "/manus-storage/Male05_f2f8ab35.fbx";
const defaultCityEnvironmentUrl = "/manus-storage/Untitled-web_328ae43c.glb";
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const distance = (first: Position, second: Position) => Math.hypot(first.x - second.x, first.y - second.y);
const demoMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo");
const requestedLevel = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("level") : null;
const requestedWorldMode = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("mode") : null;
const initialLevelId: ExpeditionLevelId = requestedLevel && requestedLevel in levelById ? requestedLevel as ExpeditionLevelId : "south-shore";
const initialWorldMode: WorldMode = requestedWorldMode === "3d" ? "3d" : "2d";
const cityDeliveryStops = ["signal-crossing", "skyline-cache", "wayfinder-kiosk"] as const;

const tutorialSteps = [
  { title: "Choose a route", body: "Pick Mouse, Keyboard, Hand Route, or Voice. You can switch any time from the command dock.", icon: Navigation },
  { title: "Move Diwas", body: "Tap a clear path or use the route keys. The coral marker is your destination pulse.", icon: MousePointer2 },
  { title: "Hand Route guide", body: "With Scout Cam enabled: thumbs-up moves Diwas forward, an open palm stops, and a pinch opens a nearby note. Video stays in your browser.", icon: Hand },
  { title: "Signal reaction", body: "Press Dance when you want Diwas to celebrate a discovery. It is a quick reaction, not a movement control.", icon: Zap },
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
  const [worldMode, setWorldMode] = useState<WorldMode>(initialWorldMode);
  const [emote, setEmote] = useState(0);
  const [playerName, setPlayerName] = useState("Diwas");
  const [environmentModelUrl, setEnvironmentModelUrl] = useState<string | null>(null);
  const [cityAssetRevision, setCityAssetRevision] = useState(0);
  const [cityLoad, setCityLoad] = useState<EnvironmentLoadState>({ phase: "loading", loaded: 0, total: 0 });
  const [cityLoadHidden, setCityLoadHidden] = useState(false);
  const [cityLowDetail, setCityLowDetail] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches);
  const [deliveryStep, setDeliveryStep] = useState(0);
  const [deliveryStatus, setDeliveryStatus] = useState("Take the sealed route satchel to Signal Crossing.");
  const [deliveryCompleteStamp, setDeliveryCompleteStamp] = useState(false);
  const [mapStationId, setMapStationId] = useState<string | null>(null);
  const [recognizedGesture, setRecognizedGesture] = useState<"forward" | "stop" | "pinch" | null>(null);
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [avatarModelUrl, setAvatarModelUrl] = useState<string | null>(defaultMaleCharacterUrl);
  const [environmentModelName, setEnvironmentModelName] = useState("");
  const [avatarModelName, setAvatarModelName] = useState("");
  const [enemyHp, setEnemyHp] = useState(4);
  const [playerHp, setPlayerHp] = useState(5);
  const [combatStatus, setCombatStatus] = useState("");
  const [combatAction, setCombatAction] = useState<"none" | "slash" | "block">("none");
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [cameraFlick, setCameraFlick] = useState(false);
  const [permissionSheet, setPermissionSheet] = useState<PermissionSheet>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [handTracking, setHandTracking] = useState(false);
  const [eyeTracking, setEyeTracking] = useState(false);
  const [handStatus, setHandStatus] = useState("Hand Route is ready when you enable it.");
  const [eyeStatus, setEyeStatus] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const { items: githubItems, status: githubStatus, refreshedAt, refresh: refreshGithub } = useGithubActivity("DiwasKhatri07");

  const audioRef = useRef<AudioManager | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const handCanvasRef = useRef<HTMLCanvasElement>(null);
  const positionRef = useRef(position);
  const targetRef = useRef(target);
  const nearbyRef = useRef(nearby);
  const levelRef = useRef(levelId);
  const stageRef = useRef(stage);
  const activeRef = useRef(active);
  const controlModeRef = useRef(controlMode);
  const handFrameRef = useRef<number | null>(null);
  const eyeFrameRef = useRef<number | null>(null);
  const handLandmarkerRef = useRef<{ close?: () => void } | null>(null);
  const faceLandmarkerRef = useRef<{ close?: () => void } | null>(null);
  const handLastActionRef = useRef(0);
  const handGestureRef = useRef({ candidate: "none", candidateSince: 0, active: "", lastForward: 0 });
  const handStatusRef = useRef(handStatus);
  const calibrationStepRef = useRef(calibrationStep);
  const interactRef = useRef<() => void>(() => undefined);

  const level = levelById[levelId];
  const allStations = useMemo(() => expeditionLevels.flatMap((world) => world.stations), []);
  const activeStation = active ? allStations.find((station) => station.id === active) ?? null : null;
  const nearbyStation = nearby ? level.stations.find((station) => station.id === nearby) ?? null : null;
  const levelIndex = expeditionLevels.findIndex((world) => world.id === levelId);
  const isMoving = Boolean(target);
  const isFrontier = levelId === "rpg-frontier";
  const isCodeCity = levelId === "code-city";
  const deliveryTargetId = cityDeliveryStops[Math.min(deliveryStep, cityDeliveryStops.length - 1)];
  const deliveryTarget = isCodeCity ? level.stations.find((station) => station.id === deliveryTargetId) ?? null : null;
  const mapStation = isCodeCity ? level.stations.find((station) => station.id === mapStationId) ?? deliveryTarget : null;
  const mapStationStatus = mapStation ? cityDeliveryStops.indexOf(mapStation.id as typeof cityDeliveryStops[number]) < deliveryStep ? "Delivered" : mapStation.id === deliveryTargetId ? "Next delivery" : cityDeliveryStops.includes(mapStation.id as typeof cityDeliveryStops[number]) ? "Awaiting courier" : "Atlas landmark" : "Route complete";
  const cityNavigationStation = levelId === "code-city" ? level.stations.reduce((closest, station) => distance(target ?? position, station) < distance(target ?? position, closest) ? station : closest, level.stations[0]) : null;
  const cityCompassAngle = cityNavigationStation ? Math.atan2(cityNavigationStation.x - position.x, position.y - cityNavigationStation.y) * (180 / Math.PI) : 0;
  const cityLoadPercent = cityLoad.phase === "ready" ? 100 : cityLoad.total > 0 ? Math.min(99, Math.round((cityLoad.loaded / cityLoad.total) * 100)) : cityLoad.loaded > 0 ? 8 : 3;
  const cityLoadingVisible = worldMode === "3d" && levelId === "code-city" && !environmentModelUrl && cityLoad.phase !== "ready" && !cityLoadHidden;
  const activeEnvironmentModelUrl = environmentModelUrl || (levelId === "code-city" ? `${defaultCityEnvironmentUrl}?city-route=${cityAssetRevision}` : null);
  const writeHandStatus = (message: string) => {
    if (handStatusRef.current === message) return;
    handStatusRef.current = message;
    setHandStatus(message);
  };

  const prepareModel = (event: React.ChangeEvent<HTMLInputElement>, kind: "environment" | "avatar") => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.(glb|fbx)$/i.test(file.name)) {
      setVoiceStatus("For a reliable browser preview, please select a self-contained .glb file or an .fbx file with its texture bundle.");
      return;
    }
    const url = URL.createObjectURL(file);
    if (kind === "environment") { if (environmentModelUrl) URL.revokeObjectURL(environmentModelUrl); setEnvironmentModelUrl(url); setEnvironmentModelName(file.name); }
    else { if (avatarModelUrl) URL.revokeObjectURL(avatarModelUrl); setAvatarModelUrl(url); setAvatarModelName(file.name); }
    setVoiceStatus(`${file.name} is loaded for this browser session. Publish-ready model storage will be added after you supply the final asset.`);
  };

  const actionPulse = () => {
    if (!isFrontier) { setVoiceStatus("Action Pulse is unlocked in RPG Frontier. Travel to route 06 to practice."); return; }
    if (enemyHp <= 0) { setCombatStatus("Practice drone cleared. Route badge logged."); return; }
    const nextEnemy = enemyHp - 1;
    setEnemyHp(nextEnemy);
    setPlayerHp((current) => Math.max(1, current - (nextEnemy > 0 ? 1 : 0)));
    setCombatStatus(nextEnemy === 0 ? "Practice drone cleared — Beacon Keep route unlocked." : "Action Pulse landed. Keep moving and protect your stamina.");
    setCombatAction("slash");
    window.setTimeout(() => setCombatAction("none"), 600);
    setEmote((current) => current + 1);
    void enableSound();
  };

  const shieldBlock = () => {
    if (!isFrontier) { setVoiceStatus("Shield Block is unlocked in RPG Frontier. Travel to route 06 to practice."); return; }
    setCombatAction("block");
    setPlayerHp((current) => Math.min(5, current + 1));
    setCombatStatus("Shield Block held. Stamina recovered by one point.");
    window.setTimeout(() => setCombatAction("none"), 760);
    void enableSound();
  };

  const drawHandOverlay = (points?: HandPoint[]) => {
    const canvas = handCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const width = canvas.clientWidth || 132;
    const height = canvas.clientHeight || 99;
    if (canvas.width !== width * 2 || canvas.height !== height * 2) { canvas.width = width * 2; canvas.height = height * 2; }
    context.setTransform(2, 0, 0, 2, 0, 0);
    context.clearRect(0, 0, width, height);
    if (!points) return;
    const connections = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15], [15, 16], [0, 17], [17, 18], [18, 19], [19, 20]];
    context.strokeStyle = "#ff3b30";
    context.lineWidth = 2;
    context.shadowColor = "#ff3b30";
    context.shadowBlur = 7;
    connections.forEach(([from, to]) => { context.beginPath(); context.moveTo((1 - points[from].x) * width, points[from].y * height); context.lineTo((1 - points[to].x) * width, points[to].y * height); context.stroke(); });
    points.forEach((point, index) => { context.beginPath(); context.fillStyle = index === 0 ? "#fff4df" : "#ff3b30"; context.arc((1 - point.x) * width, point.y * height, index === 0 ? 3.8 : 2.4, 0, Math.PI * 2); context.fill(); });
  };

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
  useEffect(() => { calibrationStepRef.current = calibrationStep; }, [calibrationStep]);

  useEffect(() => {
    if (levelId === "code-city" && worldMode === "3d" && !environmentModelUrl) {
      setCityLoad({ phase: "loading", loaded: 0, total: 0 });
      setCityLoadHidden(false);
    }
  }, [levelId, worldMode, environmentModelUrl, cityAssetRevision]);

  useEffect(() => {
    if (!cityLoadingVisible) return;
    const timeout = window.setTimeout(() => setCityLoad((current) => current.phase === "loading" ? { phase: "error", loaded: current.loaded, total: current.total } : current), 12000);
    return () => window.clearTimeout(timeout);
  }, [cityLoadingVisible]);

  useEffect(() => {
    if (levelId === "code-city") {
      setDeliveryStep(0);
      setDeliveryStatus("Take the sealed route satchel to Signal Crossing.");
      setDeliveryCompleteStamp(false);
      setMapStationId("signal-crossing");
    }
  }, [levelId]);

  useEffect(() => {
    if (!cameraActive || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
  }, [cameraActive]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (handFrameRef.current) cancelAnimationFrame(handFrameRef.current);
    if (eyeFrameRef.current) cancelAnimationFrame(eyeFrameRef.current);
    handLandmarkerRef.current?.close?.();
    faceLandmarkerRef.current?.close?.();
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

  const calibrateHandRoute = () => {
    handGestureRef.current = { candidate: "none", candidateSince: performance.now(), active: "", lastForward: 0 };
    handLastActionRef.current = 0;
    writeHandStatus("Hand Route calibrated. Keep one hand in frame, then hold a thumbs-up, open palm, or pinch for a moment.");
  };

  const retryCityAsset = () => {
    setCityLoad({ phase: "loading", loaded: 0, total: 0 });
    setCityLoadHidden(false);
    setCityAssetRevision((value) => value + 1);
  };

  const advanceDelivery = (stationId: string) => {
    if (!isCodeCity || stationId !== deliveryTargetId) return;
    if (deliveryStep >= cityDeliveryStops.length - 1) {
      setDeliveryStep(cityDeliveryStops.length);
      setDeliveryStatus("Delivery complete. The Wayfinder Kiosk has stamped your city-route pass.");
      setDeliveryCompleteStamp(true);
      audioRef.current?.playQuestComplete();
      return;
    }
    const nextStep = deliveryStep + 1;
    const nextStation = level.stations.find((station) => station.id === cityDeliveryStops[nextStep]);
    setDeliveryStep(nextStep);
    setDeliveryStatus(`Satchel transferred. Follow the parchment ribbon to ${nextStation?.name ?? "the next stop"}.`);
  };

  const interact = () => {
    const stationId = nearbyRef.current;
    if (!stationId || stageRef.current === "menu") return;
    setActive(stationId);
    setDiscoveries((current) => current.includes(stationId) ? current : [...current, stationId]);
    advanceDelivery(stationId);
    audioRef.current?.playDiscover();
    if (stageRef.current === "tutorial") setTutorialStep(4);
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
      setTutorialStep(4);
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

  const activateCamera = async (enableHand = false, enableEye = false) => {
    setPermissionSheet(null);
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setCameraActive(true);
      setHandTracking(enableHand);
      setEyeTracking(enableEye);
      if (enableHand) {
        setControlMode("hand");
        calibrateHandRoute();
        if (stageRef.current === "tutorial") setTutorialStep(3);
      }
      if (enableEye) setEyeStatus("Starting Eye Route. Look left or right to set a short route; look centered to hold.");
    } catch {
      setVoiceStatus("Scout Cam was not enabled. The expedition works without device-camera access.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
    setHandTracking(false);
    setEyeTracking(false);
    if (handFrameRef.current) cancelAnimationFrame(handFrameRef.current);
    handFrameRef.current = null;
    handLandmarkerRef.current?.close?.();
    handLandmarkerRef.current = null;
    if (eyeFrameRef.current) cancelAnimationFrame(eyeFrameRef.current);
    eyeFrameRef.current = null;
    faceLandmarkerRef.current?.close?.();
    faceLandmarkerRef.current = null;
    drawHandOverlay();
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
            drawHandOverlay();
            handGestureRef.current.active = "";
            writeHandStatus("Show one hand to Scout Cam. Thumbs-up moves; open palm stops; pinch opens.");
          } else {
            drawHandOverlay(points);
            const wrist = points[0];
            const thumb = points[4];
            const index = points[8];
            const middle = points[12];
            const ring = points[16];
            const pinky = points[20];
            const pinch = Math.hypot(index.x - thumb.x, index.y - thumb.y) < 0.075;
            const extendedFingers = [[8, 6], [12, 10], [16, 14], [20, 18]].filter(([tip, joint]) => points[tip].y < points[joint].y - 0.025).length;
            const foldedFingers = [index, middle, ring, pinky].filter((point) => point.y > wrist.y - 0.015).length;
            const openPalm = extendedFingers >= 3 && Math.hypot(index.x - thumb.x, index.y - thumb.y) > 0.11;
            const thumbsUp = thumb.y < Math.min(index.y, middle.y, ring.y, pinky.y) - 0.055 && foldedFingers >= 3;
            const now = performance.now();
            const gesture = pinch ? "pinch" : openPalm ? "stop" : thumbsUp ? "forward" : "none";
            const tracker = handGestureRef.current;
            if (gesture !== tracker.candidate) {
              tracker.candidate = gesture;
              tracker.candidateSince = now;
            }
            if (gesture === "none") {
              tracker.active = "";
              writeHandStatus("Gesture guide: thumbs-up = forward · open palm = stop · pinch = open note.");
            } else if (now - tracker.candidateSince > 180) {
              const calibrationGesture = ["forward", "stop", "pinch"][calibrationStepRef.current];
              if (stageRef.current === "calibration" && gesture === calibrationGesture && tracker.active !== `calibration-${gesture}`) {
                tracker.active = `calibration-${gesture}`;
                setRecognizedGesture(gesture);
                const nextStep = Math.min(3, calibrationStepRef.current + 1);
                calibrationStepRef.current = nextStep;
                setCalibrationStep(nextStep);
                audioRef.current?.playGesture();
                writeHandStatus(nextStep === 3 ? "Calibration complete. Your Hand Route is ready." : "Confirmed. Hold the next gesture shown on the field card.");
              } else if (stageRef.current === "calibration") {
                writeHandStatus("Hold the gesture shown on the field card until it confirms.");
              } else if (gesture === "stop" && tracker.active !== "stop") {
                tracker.active = "stop";
                setRecognizedGesture("stop");
                targetRef.current = null;
                setTarget(null);
                audioRef.current?.playGesture();
                writeHandStatus("Open palm confirmed: route stopped.");
              } else if (gesture === "pinch" && tracker.active !== "pinch") {
                tracker.active = "pinch";
                setRecognizedGesture("pinch");
                audioRef.current?.playGesture();
                writeHandStatus("Pinch confirmed: opening the nearby field note.");
                interactRef.current();
              } else if (gesture === "forward" && (tracker.active !== "forward" || now - tracker.lastForward > 1100)) {
                tracker.active = "forward";
                setRecognizedGesture("forward");
                tracker.lastForward = now;
                const origin = targetRef.current ?? positionRef.current;
                const nextTarget = { x: origin.x, y: clamp(origin.y - 12, 10, 89) };
                targetRef.current = nextTarget;
                setTarget(nextTarget);
                void enableSound();
                audioRef.current?.playGesture();
                writeHandStatus("Thumbs-up confirmed: moving forward. Hold to keep walking; open your palm to stop.");
              }
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
    if (!eyeTracking || !cameraActive || !videoRef.current) return;
    let disposed = false;
    const startEyeRoute = async () => {
      try {
        const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task" },
          runningMode: "VIDEO",
          numFaces: 1,
        });
        if (disposed) { landmarker.close(); return; }
        faceLandmarkerRef.current = landmarker;
        const detectEyeRoute = () => {
          const video = videoRef.current;
          if (disposed || !video || video.readyState < 2) { eyeFrameRef.current = requestAnimationFrame(detectEyeRoute); return; }
          const face = landmarker.detectForVideo(video, performance.now()).faceLandmarks[0];
          if (!face) setEyeStatus("Center your face in Scout Cam. Eye Route stays local to your browser.");
          else {
            const irisX = ((face[468]?.x ?? 0.5) + (face[473]?.x ?? 0.5)) / 2;
            const origin = targetRef.current ?? positionRef.current;
            const now = performance.now();
            if (irisX < 0.42 && now - handLastActionRef.current > 900) {
              handLastActionRef.current = now;
              setTarget({ x: clamp(origin.x - 10, 8, 92), y: origin.y });
              setEyeStatus("Eye Route: looking left — moving west.");
            } else if (irisX > 0.58 && now - handLastActionRef.current > 900) {
              handLastActionRef.current = now;
              setTarget({ x: clamp(origin.x + 10, 8, 92), y: origin.y });
              setEyeStatus("Eye Route: looking right — moving east.");
            } else setEyeStatus("Eye Route: focused center — holding position.");
          }
          eyeFrameRef.current = requestAnimationFrame(detectEyeRoute);
        };
        detectEyeRoute();
      } catch {
        setEyeTracking(false);
        setEyeStatus("Eye Route is not available on this browser. Hand, voice, keys, and mouse remain ready.");
      }
    };
    void startEyeRoute();
    return () => {
      disposed = true;
      if (eyeFrameRef.current) cancelAnimationFrame(eyeFrameRef.current);
      faceLandmarkerRef.current?.close?.();
      faceLandmarkerRef.current = null;
    };
  }, [eyeTracking, cameraActive]);

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
    if (stage === "tutorial" && tutorialStep === 4) setTutorialStep(5);
  };

  return (
    <main className={`world-shell is-${worldMode} level-${level.theme} level-id-${levelId} view-${viewMode} ${cameraFlick ? "camera-flick" : ""}`}>
      <img
        className="world-fallback"
        src={level.background}
        alt={`${level.name} illustrated expedition map`}
        style={{ transformOrigin: `${position.x}% ${position.y}%` }}
      />
      {worldMode === "2d" && <div className="code-notes" aria-hidden="true"><span>const craft = curiosity;</span><span>git push → horizon</span><span>await next_route()</span></div>}
      {worldMode === "3d" && <ThreeExpedition className="three-expedition" levelId={levelId} position={position} target={target} stations={level.stations} activeStationId={active} viewMode={viewMode} emote={emote} combatAction={combatAction} environmentModelUrl={activeEnvironmentModelUrl} avatarModelUrl={avatarModelUrl} lowDetail={isCodeCity && cityLowDetail} onEnvironmentLoad={(state) => { if (levelRef.current === "code-city" && !environmentModelUrl) setCityLoad((current) => current.phase === "ready" && state.phase !== "ready" ? current : state); }} />}
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
      {worldMode === "2d" && <div className={`atlas-player ${isMoving ? "is-walking" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` }}><img src={explorerAvatar} alt="Diwas anime coder avatar" onError={(event) => { event.currentTarget.src = fallbackAvatar; }} /><span>{playerName.toUpperCase()}</span></div>}
      <header className="world-brand" aria-label="Diwas World Explorer">
        <img className="brand-mark" src={compassMark} alt="" />
        <div><p>Diwas</p><h1>World Explorer</h1></div>
        <span className="brand-stamp">Field edition</span>
      </header>
      <button className="credits-toggle" onClick={() => setCreditsOpen(true)}>Credits camp</button>

      {worldMode === "3d" && isCodeCity && <aside className="city-mini-map" aria-label="Code City mini-map"><div className="mini-map-header"><span className="tiny-kicker">City field map</span><span>{deliveryStep >= cityDeliveryStops.length ? "Delivered" : `${deliveryStep + 1}/3`}</span></div><div className="mini-map-canvas"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M48 77 C42 72 38 68 38 68 S24 48 24 48 S55 44 55 44 S67 25 67 25 S75 47 75 47 S83 63 83 63" /></svg>{level.stations.map((station) => <button className={`mini-station ${station.id === deliveryTargetId ? "is-target" : ""} ${station.id === mapStation?.id ? "is-selected" : ""} ${discoveries.includes(station.id) ? "is-found" : ""}`} key={`map-${station.id}`} style={{ left: `${station.x}%`, top: `${station.y}%` }} onClick={() => { setMapStationId(station.id); moveTo(station); }} aria-label={`Inspect ${station.name}`} />)}<i className="mini-player" style={{ left: `${position.x}%`, top: `${position.y}%` }} /></div><div className="mini-map-footer"><Navigation size={12} style={{ transform: `rotate(${cityCompassAngle}deg)` }} /><span><b>{mapStation?.name ?? "Route complete"}</b>{mapStation && <em>{mapStationStatus}</em>}</span></div></aside>}
      {worldMode === "3d" && isCodeCity && !activeStation && <aside className="city-delivery-quest" aria-label="Code City delivery quest"><p className="tiny-kicker">City courier</p><strong>{deliveryStep >= cityDeliveryStops.length ? "Route pass stamped" : `Satchel delivery · ${deliveryStep + 1}/3`}</strong><p>{deliveryStatus}</p>{deliveryTarget && deliveryStep < cityDeliveryStops.length && <button onClick={() => moveTo(deliveryTarget)}><Navigation size={13} /> Set route to {deliveryTarget.name}</button>}</aside>}
      {deliveryCompleteStamp && <aside className="delivery-completion-stamp" aria-live="polite"><Award size={27} /><p>City courier pass</p><strong>DELIVERED</strong><span>Three route stamps earned</span><button onClick={() => setDeliveryCompleteStamp(false)}>Keep exploring</button></aside>}
      {cityLoadingVisible && <section className={`city-loading-screen is-${cityLoad.phase}`} aria-live="polite"><div className="city-loading-mark"><img src={compassMark} alt="" /></div><p className="tiny-kicker">Code City model bay</p><h2>{cityLoad.phase === "error" ? "The skyline needs another signal." : "Unfolding the city skyline."}</h2><p>{cityLoad.phase === "error" ? "The expedition is still playable with the illustrated fallback. Retry the city route when your connection is ready." : `Opening the city route${cityLoad.total ? ` · ${cityLoadPercent}%` : ""}.`}</p><div className="city-loading-bar" aria-label={`City asset progress ${cityLoadPercent}%`}><i style={{ width: `${cityLoad.phase === "error" ? 100 : cityLoadPercent}%` }} /></div>{cityLoad.phase === "error" ? <div className="city-loading-actions"><button onClick={retryCityAsset}>Retry city route</button><button onClick={() => setCityLoadHidden(true)}>Explore fallback</button></div> : <small>Keep this field note open while the skyline reaches the atlas.</small>}</section>}

      <aside className="field-notes" aria-label="Exploration progress">
        <div className="field-notes-topline"><span className="tiny-kicker">Expedition log</span><Compass size={17} strokeWidth={1.8} /></div>
        <strong>{discoveries.length}<span>/{allStations.length}</span></strong>
        <p>{discoveries.length === 0 ? "Choose your first route." : `${discoveries.length} discovery stamp${discoveries.length === 1 ? "" : "s"} logged.`}</p>
        <div className="note-progress" aria-hidden="true"><i className="is-found" /><i className={discoveries.length > 3 ? "is-found" : ""} /><i className={discoveries.length > 6 ? "is-found" : ""} /><i className={discoveries.length > 9 ? "is-found" : ""} /></div>
      </aside>

      <aside className="github-log" aria-label="Live GitHub activity">
        <div className="github-log-heading"><span className="tiny-kicker"><Github size={13} /> Signal record</span><button onClick={() => void refreshGithub()} aria-label="Refresh signal record"><RefreshCw size={13} /></button></div>
        {githubStatus === "loading" && <p>Reading public activity…</p>}
        {githubStatus === "error" && <p>Activity is temporarily unavailable. Refresh to try again.</p>}
        {githubStatus === "ready" && <ul>{githubItems.slice(0, 3).map((item) => <li key={item.id}><a href={item.url} target="_blank" rel="noreferrer"><strong>{item.repository}</strong><span>{item.title} · {item.date}</span></a></li>)}</ul>}
        {refreshedAt && <small>Updated {refreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>}
      </aside>

      <button className="audio-toggle" onClick={() => soundOn ? (audioRef.current?.toggle(), setSoundOn(false)) : void enableSound()} aria-pressed={soundOn}>
        {soundOn ? <Volume2 size={16} strokeWidth={1.8} /> : <VolumeX size={16} strokeWidth={1.8} />}<span>{soundOn ? "Ambient on" : "Awaken ambience"}</span>
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
        <button className={controlMode === "hand" ? "is-active" : ""} onClick={() => { if (cameraActive) { setControlMode("hand"); setEyeTracking(false); setHandTracking(true); calibrateHandRoute(); } else setPermissionSheet("hand"); }}><Hand size={15} /><span>Hand</span></button>
        {isCodeCity && <button className={cityLowDetail ? "is-active" : ""} onClick={() => setCityLowDetail((value) => !value)}><Gauge size={15} /><span>{cityLowDetail ? "Detail low" : "Detail full"}</span></button>}
        <button className={eyeTracking ? "is-active" : ""} onClick={() => cameraActive ? (setEyeTracking(true), setHandTracking(false)) : setPermissionSheet("eye")}><Eye size={15} /><span>Eyes</span></button>
        <button className={controlMode === "voice" ? "is-active" : ""} onClick={requestVoiceRoute}><Mic size={15} /><span>Speak</span></button>
        <button onClick={() => { setEmote((value) => value + 1); void enableSound(); }}><Zap size={15} /><span>Dance</span></button>
        <button className={isFrontier ? "is-active" : ""} onClick={actionPulse}><Swords size={15} /><span>Action</span></button>
        <button className={combatAction === "block" ? "is-active" : ""} onClick={shieldBlock}><Shield size={15} /><span>Block</span></button>
        <button className="view-toggle" onClick={() => { setWorldMode((current) => current === "3d" ? "2d" : "3d"); setCameraFlick(true); window.setTimeout(() => setCameraFlick(false), 260); }}><Map size={15} /><span>{worldMode === "3d" ? "2D Atlas" : "3D World"}</span></button>
        <button className="view-toggle" onClick={() => { setViewMode((current) => current === "atlas" ? "close" : "atlas"); setCameraFlick(true); window.setTimeout(() => setCameraFlick(false), 260); }}>
          {viewMode === "atlas" ? <Orbit size={15} /> : <Eye size={15} />}<span>{viewMode === "atlas" ? "3rd View" : "POV"}</span>
        </button>
        <button className={cameraActive ? "is-active" : ""} onClick={() => cameraActive ? stopCamera() : setPermissionSheet("camera")}><Camera size={15} /><span>Scout Cam</span></button>
      </section>

      {voiceStatus && <div className="voice-status"><Mic size={14} />{voiceStatus}<button onClick={() => setVoiceStatus("")} aria-label="Dismiss voice status"><X size={13} /></button></div>}
      {cameraActive && <div className={`camera-preview ${handTracking ? "is-tracking" : ""}`}><video ref={videoRef} autoPlay playsInline muted /><canvas ref={handCanvasRef} className="hand-overlay" aria-hidden="true" /><span>{handTracking ? <Hand size={12} /> : <Camera size={12} />}{handTracking ? " Hand Route · LIVE" : " Scout Cam"}</span><button onClick={stopCamera} aria-label="Stop Scout Cam"><X size={13} /></button></div>}
      {handTracking && <div className="hand-status"><Hand size={14} />{handStatus}<button onClick={calibrateHandRoute}>Calibrate</button></div>}
      {handTracking && <div className={`gesture-signal ${recognizedGesture ? "is-lit" : ""}`} aria-live="polite"><Hand size={15} /><span>{recognizedGesture === "forward" ? "FORWARD" : recognizedGesture === "stop" ? "STOP" : recognizedGesture === "pinch" ? "OPEN" : "READY"}</span></div>}
      {eyeTracking && <div className="eye-status"><Eye size={14} />{eyeStatus}</div>}
      {isFrontier && <aside className="encounter-kit" aria-label="Practice encounter"><div><span className="tiny-kicker">Practice drone</span><strong>{enemyHp > 0 ? `Signal strength ${enemyHp}/4` : "Route cleared"}</strong><i><b style={{ width: `${enemyHp * 25}%` }} /></i></div><div><span className="tiny-kicker"><Shield size={12} /> Explorer stamina</span><strong>{playerHp}/5</strong></div>{combatStatus && <p>{combatStatus}</p>}</aside>}

      {stage === "world" && nearbyStation && !activeStation && (
        <button className="nearby-prompt" onClick={interact}><span className="prompt-flower"><Sparkles size={16} /></span><span><small>Nearby station</small><strong>{nearbyStation.name}</strong></span><kbd>E</kbd></button>
      )}

      {stage === "calibration" && (
        <section className="hand-calibration" aria-live="polite"><div className="calibration-mark"><Hand size={24} /></div><p className="tiny-kicker">Scout Cam field test · {Math.min(calibrationStep + 1, 3)}/3</p><h2>{calibrationStep === 0 ? "Show a steady thumbs-up." : calibrationStep === 1 ? "Open your palm to stop." : calibrationStep === 2 ? "Pinch to open a route note." : "Hand Route confirmed."}</h2><p>{cameraActive ? "Keep one hand in the preview and hold the shown gesture until it receives a coral confirmation." : "Practice the controls before the expedition begins. Camera processing stays local to your browser."}</p><div className="calibration-steps"><span className={calibrationStep > 0 ? "is-done" : "is-current"}>1 · Forward</span><span className={calibrationStep > 1 ? "is-done" : calibrationStep === 1 ? "is-current" : ""}>2 · Stop</span><span className={calibrationStep > 2 ? "is-done" : calibrationStep === 2 ? "is-current" : ""}>3 · Open</span></div>{!cameraActive && <button className="calibration-primary" onClick={() => setPermissionSheet("hand")}><Camera size={16} /> Enable Scout Cam</button>}{calibrationStep === 3 && <button className="calibration-primary" onClick={() => { setStage("tutorial"); setTutorialStep(0); }}><Check size={16} /> Continue with calibrated controls</button>}<button className="tutorial-skip" onClick={() => { setStage("tutorial"); setTutorialStep(0); }}>Continue with mouse and keys</button></section>
      )}

      {stage === "tutorial" && (
        <section className="tutorial-panel" aria-live="polite">
          <div className="tutorial-orbit"><Gamepad2 size={20} /></div>
          <p className="tiny-kicker">Expedition briefing · {Math.min(tutorialStep + 1, 6)}/6</p>
          {tutorialStep < 4 ? <>
            <h2>{tutorialSteps[tutorialStep].title}</h2><p>{tutorialSteps[tutorialStep].body}</p>
            {tutorialStep === 0 && <div className="tutorial-modes"><button className={controlMode === "mouse" ? "is-active" : ""} onClick={() => { setControlMode("mouse"); setTutorialStep(1); }}><MousePointer2 size={16} /> Mouse / Tap</button><button className={controlMode === "keyboard" ? "is-active" : ""} onClick={() => { setControlMode("keyboard"); setTutorialStep(1); }}><Keyboard size={16} /> Keyboard</button><button onClick={() => setPermissionSheet("hand")}><Hand size={16} /> Hand Route</button><button onClick={requestVoiceRoute}><Mic size={16} /> Voice route</button></div>}
            {tutorialStep === 1 && <button className="tutorial-next" onClick={() => setTutorialStep(2)}>I know the route <ArrowRight size={16} /></button>}
            {tutorialStep === 2 && <div className="tutorial-modes"><button onClick={() => setPermissionSheet("hand")}><Hand size={16} /> Try hand route</button><button onClick={() => setTutorialStep(3)}><ArrowRight size={16} /> Continue without camera</button></div>}
            {tutorialStep === 3 && <button className="tutorial-next" onClick={() => { setEmote((value) => value + 1); void enableSound(); setTutorialStep(4); }}>Test Diwas’s dance <Zap size={16} /></button>}
          </> : tutorialStep === 4 ? <><h2>Guide me to a station.</h2><p>Follow the coral compass pulse. When you reach a station, open its field note to complete the briefing.</p><button className="tutorial-next" onClick={runGuidedStation}>Start guided route <Sparkles size={16} /></button></> : <><h2>Route unlocked.</h2><p>You found a station and opened its field note. The full archipelago is ready whenever you are.</p><button className="tutorial-next" onClick={() => setStage("world")}>Begin exploring <ArrowRight size={16} /></button></>}
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
            <div className="menu-actions"><button className="menu-start" onClick={() => { setStage("calibration"); setCalibrationStep(0); }}><Play size={16} fill="currentColor" /> Calibrate & start</button><button className="menu-skip" onClick={() => setStage("world")}>Enter without briefing <ChevronRight size={15} /></button></div>
            <div className="starter-kit"><label><UserRound size={14} /> Explorer call sign<input value={playerName} maxLength={16} onChange={(event) => setPlayerName(event.target.value || "Diwas")} /></label><label><Upload size={14} /> City route GLB <input type="file" accept=".glb,model/gltf-binary" onChange={(event) => prepareModel(event, "environment")} /></label><label><Upload size={14} /> Avatar GLB / FBX <input type="file" accept=".glb,.fbx,model/gltf-binary" onChange={(event) => prepareModel(event, "avatar")} /></label><small>{environmentModelName || avatarModelName ? `Session route cargo: ${[environmentModelName, avatarModelName].filter(Boolean).join(" · ")}` : "Uploaded male character is now the default 3D player."}</small></div>
            <div className="menu-meta"><span><Crosshair size={13} /> {expeditionLevels.length} routes</span><span><Zap size={13} /> {allStations.length} stations</span><span><Orbit size={13} /> 2 views</span></div>
          </div>
        </section>
      )}

      {creditsOpen && <section className="credits-sheet" role="dialog" aria-modal="true" aria-label="Developer and model credits"><button onClick={() => setCreditsOpen(false)} aria-label="Close credits"><X size={16} /></button><p className="tiny-kicker">Credits camp</p><h2>Built by Diwas.</h2><p>World concept, portfolio routes, and developer archive curated by Diwas Khatri. The real-time environment is currently a procedural Three.js fallback with a session-only GLB model bay.</p><div><strong>Route-source acknowledgements</strong><a href="https://sketchfab.com/3d-models/low-poly-city-23e03868654d47f69fa5db2413e580c3" target="_blank" rel="noreferrer">Low Poly City — golukumar · CC BY 4.0</a><a href="https://sketchfab.com/3d-models/smile-game-builder-sample-map-081fb5468bd14e56b5caa0031ce28cf1" target="_blank" rel="noreferrer">SMILE GAME BUILDER Sample MAP — SmileBoom_SGB · license to confirm</a></div><small>Any supplied avatar or environment model will receive its own in-world credit line before publishing.</small></section>}

      {permissionSheet && (
        <section className="permission-sheet" role="dialog" aria-modal="true" aria-label="Enable Scout Cam">
          <div className="permission-icon">{permissionSheet === "hand" ? <Hand size={22} /> : permissionSheet === "eye" ? <Eye size={22} /> : <Camera size={22} />}</div><p className="tiny-kicker">Optional device feature</p><h2>{permissionSheet === "hand" ? "Enable Hand Route?" : permissionSheet === "eye" ? "Enable Eye Route?" : "Enable Scout Cam?"}</h2><p>{permissionSheet === "hand" ? "Hand Route reads one hand locally in your browser. Thumbs-up moves forward, open palm stops, and a pinch opens a nearby field note. No camera video is uploaded." : permissionSheet === "eye" ? "Eye Route estimates left/right attention locally from your camera preview to set short route movements. It is optional, has keyboard and mouse fallbacks, and no camera video is uploaded." : "Scout Cam can show a small live preview from your device camera. It is off by default, uses no audio, and your browser will ask for permission before it starts."}</p>
          <div><button className="permission-confirm" onClick={() => void activateCamera(permissionSheet === "hand", permissionSheet === "eye")}><Check size={16} /> Continue to browser permission</button><button className="permission-cancel" onClick={() => setPermissionSheet(null)}>Not now</button></div>
        </section>
      )}
    </main>
  );
}
