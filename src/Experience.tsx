import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Crosshair,
  Expand,
  Gauge,
  Layers3,
  LockKeyhole,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Scan,
  ShieldAlert,
  X,
} from "lucide-react";
import Scene, { type CameraMode, type SceneLens } from "./Scene";
import { protocolStory } from "./spatial";
import {
  merkleLevels,
  linkedDemoHeaders,
  signTransaction,
  verifyTransaction,
  type DemoTransaction,
} from "./models";
import { SourceLink } from "./components";

const LENGTH = 42;
export default function Experience({ motion }: { motion: boolean }) {
  const [playhead, setPlayhead] = useState(0);
  const [run, setRun] = useState(motion);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<CameraMode>(() =>
    window.innerWidth < 760 ? "follow" : "map",
  );
  const [lens, setLens] = useState<SceneLens>("data");
  const [theater, setTheater] = useState(false);
  const [cameraReset, setCameraReset] = useState(0);
  const [tx, setTx] = useState<DemoTransaction | null>(null);
  const [root, setRoot] = useState("");
  const [tree, setTree] = useState<string[][]>([]);
  const [headerHash, setHeaderHash] = useState("");
  const [tampered, setTampered] = useState(false);
  const [valid, setValid] = useState<boolean | null>(null);
  const [cryptoError, setCryptoError] = useState("");
  const host = useRef<HTMLElement>(null);
  const visible = useRef(true);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
      },
      { threshold: 0.1 },
    );
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const state = useRef({ playhead, run, motion, speed, tampered });
  useEffect(() => {
    state.current = { playhead, run, motion, speed, tampered };
  }, [playhead, run, motion, speed, tampered]);
  useEffect(() => {
    let cancelled = false;
    signTransaction("2.5", "maya.atlas")
      .then(async (transaction) => {
        const levels = await merkleLevels([
          transaction.payload,
          "Sam pays Lee 1 ATLAS",
          "Lee pays Alex 4 ATLAS",
          "Maya pays Sam 3 ATLAS",
        ]);
        const commitment = levels.at(-1)![0];
        const header = await linkedDemoHeaders(commitment);
        if (!cancelled) {
          setTx(transaction);
          setTree(levels);
          setHeaderHash(header.currentHash);
          setRoot(commitment);
        }
      })
      .catch(() => {
        if (!cancelled)
          setCryptoError(
            "Live signing needs a modern browser on HTTPS. The explanatory model remains available.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    setValid(null);
    if (tx)
      verifyTransaction(tx, tampered)
        .then((result) => {
          if (!cancelled) setValid(result);
        })
        .catch(() => {
          if (!cancelled)
            setCryptoError("Local signature verification is unavailable.");
        });
    return () => {
      cancelled = true;
    };
  }, [tx, tampered]);
  useEffect(() => {
    if (!run || !motion) return;
    let frame = 0,
      last = performance.now(),
      published = last,
      head = playhead;
    const tick = (now: number) => {
      const current = state.current;
      if (!document.hidden && visible.current) {
        head +=
          (Math.max(0, Math.min(now - last, 100)) / 1000 / LENGTH) *
          current.speed;
      }
      last = now;
      const maximum = current.tampered ? 4 / 7 - 0.0001 : 1;
      if (head >= maximum) {
        setPlayhead(maximum);
        setRun(false);
        return;
      }
      if (now - published >= 60) {
        setPlayhead(head);
        published = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // The playback clock owns head until pause; state updates do not restart time.
  }, [run, motion, speed, tampered]);
  useEffect(() => {
    if (!theater) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    host.current?.focus();
    const keyboard = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setTheater(false);
      }
      if (e.key === "Tab") {
        const items = Array.from(
          host.current?.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], canvas[tabindex]",
          ) ?? [],
        ).filter(
          (el) =>
            el.getClientRects().length &&
            getComputedStyle(el).visibility !== "hidden",
        );
        const first = items[0],
          last = items.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === host.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === host.current)
        ) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keyboard);
      previous?.focus();
    };
  }, [theater]);
  const story = useMemo(
    () =>
      protocolStory({
        tx,
        root,
        tree,
        headerHash,
        verified: valid,
        rejected: tampered && valid === false,
      }),
    [tx, root, tree, headerHash, tampered, valid],
  );
  const step = Math.min(6, Math.floor(playhead * 7));
  const phase = playhead === 1 ? 1 : (playhead * 7) % 1;
  const chapter = story.chapters[step];
  const jump = (index: number) => {
    if (tampered && index > 3) return;
    setPlayhead(index / 7);
    setRun(false);
  };
  return (
    <section
      ref={host}
      className={`protocol-experience ${theater ? "theater-mode" : ""}`}
      role={theater ? "dialog" : "region"}
      aria-modal={theater ? true : undefined}
      aria-label="Blockchain Protocol Theater"
      tabIndex={-1}
    >
      <header className="protocol-toolbar">
        <div>
          <span className="protocol-emblem">
            <Layers3 size={17} />
          </span>
          <div>
            <span>THE IMMERSIVE FIELD GUIDE</span>
            <h2>
              Protocol Theater
              <span>{String(step + 1).padStart(2, "0")} / 07</span>
            </h2>
          </div>
        </div>
        <div className="protocol-toolbar-actions">
          <span className="protocol-local">
            <i className="live-dot" />
            LOCAL SIMULATION
          </span>
          <button
            aria-label={theater ? "Exit theater mode" : "Enter theater mode"}
            onClick={() => setTheater((v) => !v)}
          >
            {theater ? <X size={15} /> : <Maximize2 size={15} />}
            <span>{theater ? "Exit theater" : "Go immersive"}</span>
          </button>
        </div>
      </header>
      <div className="protocol-viewport">
        <Scene
          story={story}
          step={step}
          phase={phase}
          playing={motion && run}
          motion={motion}
          speed={speed}
          cameraMode={view}
          lens={lens}
          resetKey={cameraReset}
          blocked={tampered}
          onObjectSelect={(actor) => {
            if (!tampered || actor.step <= 3) jump(actor.step);
          }}
        />
        <div
          className="protocol-lenses"
          role="group"
          aria-label="Information lens"
        >
          {(
            [
              { id: "data", label: "Data", icon: Scan },
              { id: "flow", label: "Messages", icon: ArrowRight },
              { id: "trust", label: "Trust", icon: LockKeyhole },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              className={lens === item.id ? "active" : ""}
              aria-pressed={lens === item.id}
              onClick={() => setLens(item.id)}
            >
              <item.icon size={12} />
              {item.label}
            </button>
          ))}
        </div>
        <div className="protocol-camera-controls">
          <span>CAMERA</span>
          <button
            className={view === "follow" ? "active" : ""}
            aria-label="Follow transaction camera"
            aria-pressed={view === "follow"}
            onClick={() => {
              setView("follow");
              setCameraReset((v) => v + 1);
            }}
          >
            <Crosshair size={12} />
            Follow
          </button>
          <button
            className={view === "map" ? "active" : ""}
            aria-label="View complete protocol map"
            aria-pressed={view === "map"}
            onClick={() => {
              setView("map");
              setCameraReset((v) => v + 1);
            }}
          >
            <Expand size={12} />
            Map
          </button>
          <button
            className={view === "top" ? "active" : ""}
            aria-label="View protocol from above"
            aria-pressed={view === "top"}
            onClick={() => {
              setView("top");
              setCameraReset((v) => v + 1);
            }}
          >
            <Layers3 size={12} />
            Above
          </button>
        </div>
        <div className="protocol-scene-index" aria-hidden="true">
          {String(step + 1).padStart(2, "0")}
          <span>/ 07</span>
        </div>
        <div
          className={`protocol-crypto ${tampered ? "rejected" : ""}`}
          role="status"
        >
          {valid === null ? (
            <LockKeyhole size={12} />
          ) : valid ? (
            <CheckCircle2 size={12} />
          ) : (
            <ShieldAlert size={12} />
          )}
          <span>
            {cryptoError
              ? "Explanatory model"
              : valid === null
                ? "Preparing local signature"
                : valid
                  ? "Real local signature · verified"
                  : "Altered bytes · signature rejected"}
          </span>
          {tx && (
            <button
              onClick={() => {
                setTampered((v) => !v);
                jump(3);
                setRun(false);
              }}
            >
              {tampered ? "Restore payload" : "Alter signed amount"}
              <ArrowRight size={11} />
            </button>
          )}
        </div>
      </div>
      <div className="protocol-narration">
        <div className="protocol-phase-number">
          {String(step + 1).padStart(2, "0")}
          <span>PHASE</span>
        </div>
        <div className="protocol-phase-copy" role="status">
          <h3>
            {chapter.title}
            <span>
              {tampered && step === 3
                ? "Verification boundary"
                : chapter.caption}
            </span>
          </h3>
          <p>
            {tampered && step === 3
              ? "A changed amount cannot use the original authorization. Restore the signed bytes to continue."
              : [
                  "Intent becomes bytes. The data is public; authority comes next.",
                  "The private key stays local. Only the proof of authorization travels.",
                  "Watch one message fan out. There is no single global pending pool.",
                  "Every full node checks for itself. Consensus cannot make invalid signatures valid.",
                  "Leaves become a root. The header commits to that root and the previous block.",
                  "Independent checks converge on an order under protocol-specific rules.",
                  "The interface reads accepted state. Inclusion and finality are different guarantees.",
                ][step]}
          </p>
        </div>
        <div className="protocol-readouts">
          {chapter.readout.slice(0, 3).map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="protocol-timeline">
        <div className="protocol-playback">
          <button
            className="protocol-play"
            aria-label={
              run && motion
                ? "Pause protocol playback"
                : "Play protocol playback"
            }
            disabled={!motion}
            onClick={() => {
              if (playhead >= 1) setPlayhead(0);
              setRun((v) => !v);
            }}
          >
            {run && motion ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button
            className="protocol-reset"
            aria-label="Replay protocol from beginning"
            onClick={() => {
              setPlayhead(0);
              setRun(false);
              setCameraReset((v) => v + 1);
            }}
          >
            <RotateCcw size={14} />
          </button>
          <label className="protocol-speed">
            <Gauge size={12} />
            <select
              aria-label="Protocol playback speed"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value="0.5">0.5×</option>
              <option value="1">1×</option>
              <option value="2">2×</option>
            </select>
          </label>
          <span className="protocol-clock">
            {String(Math.floor(playhead * LENGTH)).padStart(2, "0")}
            <small> / {LENGTH}s</small>
          </span>
        </div>
        <div className="protocol-scrub">
          <input
            type="range"
            aria-label="Protocol timeline"
            min={0}
            max={1000}
            value={Math.round(playhead * 1000)}
            onChange={(e) => {
              setPlayhead(
                Math.min(
                  tampered ? 4 / 7 - 0.0001 : 1,
                  Number(e.target.value) / 1000,
                ),
              );
              setRun(false);
            }}
          />
          <div className="protocol-phases">
            {story.chapters.map((c, i) => (
              <button
                key={c.title}
                aria-label={`Explore ${c.title} phase`}
                aria-current={step === i ? "step" : undefined}
                disabled={tampered && i > 3}
                className={`${step === i ? "current" : ""} ${step > i ? "past" : ""}`}
                onClick={() => jump(i)}
              >
                <i />
                {c.title}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="protocol-caption">
        <span>
          <LockKeyhole size={10} />A generic teaching chain · Ed25519 / SHA-256
          · fictional ATLAS · no real funds
        </span>
        <SourceLink id={chapter.source} />
      </div>
    </section>
  );
}
