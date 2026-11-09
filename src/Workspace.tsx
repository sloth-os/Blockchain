import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Compass,
  Copy,
  Focus,
  HelpCircle,
  Layers3,
  LockKeyhole,
  Map,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Scene from "./Scene";
import { Dialog, Range, SourceLink } from "./components";
import {
  applications,
  glossary,
  layers,
  researchDate,
  sources,
  stages,
  topics,
} from "./content";
import { defaultNetwork, hex, solutions } from "./models";
import { areas, areaOrder, type Area } from "./atlas";
import { spatialObjectValue } from "./spatial";
import { useAtlas, type AtlasController } from "./useAtlas";

export default function Workspace() {
  const c = useAtlas();
  const stageRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const [stageHeight, setStageHeight] = useState(600);
  const [introSize, setIntroSize] = useState({ width: 350, height: 170 });
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setStageHeight(entry.contentRect.height),
    );
    if (stageRef.current) observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const intro = introRef.current;
    if (!intro) return;
    const observer = new ResizeObserver(() => {
      setIntroSize({
        width: intro.offsetLeft + intro.offsetWidth + 12,
        height: intro.offsetTop + intro.offsetHeight + 12,
      });
    });
    observer.observe(intro);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    document.title = "Chain Atlas — one immersive blockchain world";
  }, []);
  const safeInsets = c.panel
    ? c.mobile
      ? { right: 0, bottom: Math.min(stageHeight * 0.62, 440) }
      : { right: 350, bottom: 0 }
    : { right: 0, bottom: 0 };
  const readouts = c.overview
    ? [
        ["CONNECTED FOCUSES", "5"],
        ["REAL APPLICATIONS", "10"],
        ["OPEN QUESTIONS", "10"],
      ]
    : c.area === "network"
      ? [
          [
            "RECEIVED",
            `${c.netSent ? c.net.times.filter((t) => t <= c.netElapsed).length : 0} / ${c.network.nodes}`,
          ],
          [
            "REACHABLE",
            `${c.net.reachable} / ${c.network.nodes - c.net.down.size}`,
          ],
          ["MODELED p95", `${Math.round(c.net.p95)} ms`],
        ]
      : c.area === "scale"
        ? [
            [
              `${c.solutionA.short} · COMPLETED`,
              `${c.metrics[0].served.toLocaleString(undefined, { maximumFractionDigits: 1 })} /s`,
            ],
            [
              `${c.solutionB.short} · COMPLETED`,
              `${c.metrics[1].served.toLocaleString(undefined, { maximumFractionDigits: 1 })} /s`,
            ],
            ["OFFERED LOAD", `${c.demand.toLocaleString()} /s`],
          ]
        : c.chapter.readout;
  const explanation = c.overview
    ? "Choose a landmark in the world. Follow the same transaction into propagation, scaling, real uses, and the assumptions behind them."
    : c.area === "transaction"
      ? stages[c.step].body
      : c.area === "network"
        ? "A ring trades links for hops. A mesh adds redundancy. A failed hub can isolate healthy peers. Adjust the experiment inside this world."
        : c.area === "scale"
          ? "More capacity changes a constraint. It does not automatically improve finality, trust, fees, or the ability to run a node."
          : c.area === "applications"
            ? c.app.flow[c.appStep][1]
            : c.topic.mechanism[c.topicStep];
  const phaseTitles =
    c.area === "transaction"
      ? stages.map((s) => s.title)
      : c.area === "applications"
        ? c.app.flow.map(([title]) => title)
        : c.area === "topics"
          ? c.world.chapters.map((s) => s.title)
          : [];
  const canPlay = !c.overview && c.area !== "scale";
  return (
    <main
      className={`atlas-workspace ${c.motion ? "" : "motion-paused"} ${c.panel ? "workbench-open" : ""}`}
      style={
        {
          "--accent": areas[c.area].color,
          "--reserved-right": `${safeInsets.right}px`,
        } as React.CSSProperties
      }
      data-focus={c.overview ? "atlas" : c.area}
    >
      <a
        className="skip-link"
        href="#atlas-tools"
        onClick={(e) => {
          e.preventDefault();
          c.setPanel("tools");
          setTimeout(() => document.getElementById("atlas-tools")?.focus(), 0);
        }}
      >
        Skip to experiment controls
      </a>
      <header className="atlas-header">
        <button
          className="atlas-brand"
          aria-label="Show the connected atlas"
          onClick={c.showAtlas}
        >
          <span>
            <Box size={21} />
          </span>
          <strong>
            chain<span>atlas</span>
          </strong>
          <small>IMMERSIVE FIELD GUIDE</small>
        </button>
        <div className="atlas-location">
          <span className="location-dot" />
          {c.overview ? "THE CONNECTED WORLD" : areas[c.area].title}
          <ChevronRight size={12} />
          <span>{c.overview ? "Explore a landmark" : c.chapter.title}</span>
        </div>
        <div className="atlas-header-actions">
          <button
            className={`atlas-map-trigger ${c.overview ? "active" : ""}`}
            aria-label="Explore the connected atlas"
            onClick={c.showAtlas}
          >
            <Compass size={15} />
            <span>Atlas</span>
          </button>
          <button
            aria-label="Search the atlas"
            onClick={() => c.setOverlay("search")}
          >
            <Search size={16} />
            <kbd>⌘ K</kbd>
          </button>
          <button
            aria-label={c.motion ? "Pause all motion" : "Enable motion"}
            onClick={c.toggleMotion}
          >
            {c.motion ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            aria-label="Research and sources"
            onClick={() => c.setOverlay("sources")}
          >
            <BookOpen size={16} />
          </button>
          <button
            className="atlas-help"
            aria-label="How to explore this world"
            onClick={() => c.setOverlay("help")}
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </header>
      <section
        ref={stageRef}
        className="atlas-stage"
        aria-label="Connected 3D blockchain world"
      >
        <Scene
          story={c.world}
          step={c.step}
          phase={
            c.area === "transaction" && !c.overview
              ? c.head === 1
                ? 1
                : (c.head * 7) % 1
              : undefined
          }
          playing={c.scenePlaying}
          motion={c.motion}
          speed={c.speed}
          cameraMode={c.view}
          cameraFrame={c.cameraFrame}
          focusArea={c.overview ? "atlas" : c.area}
          selectedObjectId={c.selectedId}
          inspector={false}
          onObjectSelect={c.pick}
          resetKey={c.resetKey}
          lens={c.lens}
          blocked={c.tampered}
          offline={c.net.down}
          arrivals={c.net.times}
          progress={c.sceneProgress}
          safeInsets={{ ...safeInsets, intro: introSize }}
        />
        <div ref={introRef} className="atlas-focus-intro">
          <div className="atlas-eyebrow">
            <i />
            {c.overview
              ? "ZOOM OUT / THE CONNECTED SYSTEM"
              : `${String(areaOrder.indexOf(c.area) + 1).padStart(2, "0")} / ${areas[c.area].verb.toUpperCase()}`}
          </div>
          <h1>{c.currentTitle}</h1>
          <p>
            {c.overview
              ? "One persistent world. Every connection tells part of the story."
              : c.area === "transaction"
                ? c.chapter.caption
                : c.area === "network"
                  ? `${c.network.topology.toUpperCase()} · ${c.network.nodes} PEERS · ${c.network.payload} BYTE PAYLOAD`
                  : c.area === "scale"
                    ? `${c.solutionA.name} ↔ ${c.solutionB.name}`
                    : c.area === "applications"
                      ? c.app.headline
                      : c.topic.question}
          </p>
          <div className="atlas-context-actions">
            {!c.overview && (
              <button
                className={c.panel === "tools" ? "active" : ""}
                aria-label="Open experiment controls"
                onClick={() => c.setPanel(c.panel === "tools" ? null : "tools")}
              >
                <Settings2 size={12} />
                Experiment
              </button>
            )}
            {!c.overview && (
              <button
                aria-label="Explain this connection"
                onClick={() => c.setPanel(c.panel === "notes" ? null : "notes")}
              >
                <BookOpen size={12} />
                Explain
              </button>
            )}
          </div>
        </div>
        <div
          className="atlas-lenses"
          role="group"
          aria-label="Information lens"
        >
          {(["data", "flow", "trust"] as const).map((lens) => (
            <button
              key={lens}
              aria-pressed={c.lens === lens}
              className={c.lens === lens ? "active" : ""}
              onClick={() => c.setLens(lens)}
            >
              {lens === "data" ? (
                <Layers3 size={11} />
              ) : lens === "flow" ? (
                <Radio size={11} />
              ) : (
                <LockKeyhole size={11} />
              )}
              <span>
                {lens === "flow"
                  ? "Messages"
                  : lens === "trust"
                    ? "Trust"
                    : "Data"}
              </span>
            </button>
          ))}
        </div>
        {!c.overview && c.area === "transaction" && (
          <div
            className={`atlas-auth-status ${c.tampered ? "invalid" : ""}`}
            role="status"
          >
            {c.valid === true ? (
              <ShieldCheck size={13} />
            ) : c.tampered ? (
              <ShieldAlert size={13} />
            ) : (
              <LockKeyhole size={13} />
            )}
            <span>
              {c.cryptoError
                ? "Explanatory model"
                : !c.amountValid
                  ? "Enter a valid amount"
                  : c.valid === null
                    ? "Preparing local signature"
                    : c.valid
                      ? "Real local signature verified"
                      : "Received bytes fail authorization"}
            </span>
            {c.tx && (
              <button onClick={c.toggleTamper}>
                {c.tampered ? "Restore signed bytes" : "Alter signed amount"}
                <ArrowRight size={10} />
              </button>
            )}
          </div>
        )}
        {c.overview && (
          <div className="atlas-map-legend">
            <span>
              <i />
              Authorize
            </span>
            <span>
              <i />
              Propagate
            </span>
            <span>
              <i />
              Scale
            </span>
            <span>
              <i />
              Apply
            </span>
            <span>
              <i />
              Question
            </span>
            <p>
              Landmarks change your focus. Your transaction and experiments stay
              here.
            </p>
          </div>
        )}
        <div
          className="atlas-camera-dock"
          role="group"
          aria-label="Camera views"
        >
          <span>CAMERA</span>
          <button
            aria-label="Follow the active process"
            className={c.view === "follow" && !c.overview ? "active" : ""}
            onClick={() => {
              c.setView("follow");
              c.setResetKey((v) => v + 1);
            }}
            disabled={c.overview}
          >
            <Focus size={12} />
            <span>Follow</span>
          </button>
          <button
            aria-label="Frame the current connection"
            className={c.view === "map" && !c.overview ? "active" : ""}
            onClick={() => {
              c.setView("map");
              c.setResetKey((v) => v + 1);
            }}
            disabled={c.overview}
          >
            <Map size={12} />
            <span>Frame</span>
          </button>
          <button
            aria-label="View from above"
            className={c.view === "top" ? "active" : ""}
            onClick={() => c.setView("top")}
          >
            <Layers3 size={12} />
            <span>Above</span>
          </button>
        </div>
        <div className="atlas-world-caption">
          <span>LOCAL SIMULATION</span>
          <span>No wallet · no real funds</span>
          <button
            aria-label="Open model assumptions"
            onClick={() => c.setPanel("notes")}
          >
            Models ≠ live benchmarks
          </button>
        </div>
        {c.panel && <Workbench c={c} />}
      </section>
      <section
        className="atlas-storyline"
        aria-label="Process timeline and connected learning path"
      >
        <div className="atlas-narration">
          <div className="narration-marker">
            {c.overview ? (
              <Compass size={23} />
            ) : c.area === "network" ? (
              <Radio size={23} />
            ) : c.area === "scale" ? (
              <Layers3 size={23} />
            ) : (
              String(c.step + 1).padStart(2, "0")
            )}
          </div>
          <div className="narration-copy">
            <h2>
              {c.overview
                ? "Every part belongs to the same story"
                : c.area === "network"
                  ? c.netSent
                    ? c.netRun
                      ? "Message propagating"
                      : "Broadcast complete"
                    : "Ready to broadcast"
                  : c.area === "scale"
                    ? "Which constraint is doing the limiting?"
                    : c.chapter.title}
            </h2>
            <p>{explanation}</p>
          </div>
          <div className="atlas-live-readouts">
            {readouts.slice(0, 3).map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="atlas-transport">
          <div className="transport-buttons">
            {canPlay && (
              <button
                className="play-process"
                aria-label={
                  c.running && c.motion
                    ? "Pause current process"
                    : "Play current process"
                }
                disabled={!c.motion}
                onClick={c.togglePlay}
              >
                {c.running && c.motion ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} />
                )}
              </button>
            )}
            {!c.overview && (
              <button
                className="transport-reset"
                aria-label="Restart current process"
                onClick={() => {
                  if (c.area === "network") c.updateNetwork(c.network);
                  else c.jump(0);
                  c.setResetKey((v) => v + 1);
                }}
              >
                <RotateCcw size={14} />
              </button>
            )}
            {canPlay && (
              <select
                aria-label="Playback speed"
                value={c.speed}
                onChange={(e) => c.setSpeed(Number(e.target.value))}
              >
                <option value="0.5">0.5×</option>
                <option value="1">1×</option>
                <option value="2">2×</option>
              </select>
            )}
            {c.area === "network" && !c.overview && (
              <button className="transport-broadcast" onClick={c.broadcast}>
                <Radio size={12} />
                {c.netSent ? "Broadcast again" : "Broadcast a message"}
              </button>
            )}
          </div>
          <div className="atlas-phase-control">
            {c.overview ? (
              <p>
                <Sparkles size={13} />
                Select a glowing landmark, or start with one signed transaction.
              </p>
            ) : c.area === "transaction" ? (
              <>
                <input
                  aria-label="Transaction timeline"
                  type="range"
                  min="0"
                  max="1000"
                  value={Math.round(c.head * 1000)}
                  onChange={(e) => {
                    c.setTxRun(false);
                    c.setSelectedId(null);
                    c.jumpTx(
                      Math.min(
                        c.tampered ? 3.999 : 6.999,
                        (Number(e.target.value) / 1000) * 7,
                      ),
                    );
                  }}
                />
                <div className="atlas-phase-points">
                  {phaseTitles.map((title, i) => (
                    <button
                      key={title}
                      aria-label={`Explore ${title} phase`}
                      aria-current={c.step === i ? "step" : undefined}
                      disabled={c.tampered && i > 3}
                      onClick={() => c.jump(i)}
                    >
                      <i />
                      {title}
                    </button>
                  ))}
                </div>
              </>
            ) : c.area === "network" ? (
              <div className="network-progress-inline">
                <div>
                  <span
                    style={{
                      width: `${c.netSent ? (c.net.total === 0 ? 100 : Math.min(100, (c.netElapsed / c.net.total) * 100)) : 0}%`,
                    }}
                  />
                </div>
                <p>
                  {Math.round(c.netElapsed)} / {Math.round(c.net.total)} model
                  ms<span>Animation slowed 4×</span>
                </p>
              </div>
            ) : c.area === "scale" ? (
              <p>
                <Layers3 size={13} />
                Adjust shared workload in Experiment. Both lanes update in this
                world.
              </p>
            ) : (
              <div className="atlas-phase-points four-phases">
                {phaseTitles.map((title, i) => (
                  <button
                    key={title}
                    aria-label={`Explore flow step ${i + 1}`}
                    aria-current={c.step === i ? "step" : undefined}
                    onClick={() => c.jump(i)}
                  >
                    <i />
                    {title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="next-connection"
            onClick={() =>
              c.overview ? c.focus("transaction") : c.connection()
            }
          >
            {c.overview ? "Start with one transaction" : c.connectionLabel}
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
      {c.overlay === "sources" && (
        <Sources onClose={() => c.setOverlay(null)} />
      )}
      {c.overlay === "search" && <AtlasSearch c={c} />}
      {c.overlay === "help" && (
        <Dialog
          title="One world. Follow any connection."
          onClose={() => c.setOverlay(null)}
        >
          <div className="help-content">
            <p>
              The wallet, network, scaling lanes, real-world applications and
              frontier questions are all in this scene. Use{" "}
              <strong>Atlas</strong> to see their landmarks, or follow{" "}
              <strong>Next connection</strong> through the end-to-end story.
            </p>
            <dl>
              <div>
                <dt>Inspect</dt>
                <dd>
                  Select an object or use Objects. Its data, trust assumptions
                  and sources open in the same workspace.
                </dd>
              </div>
              <div>
                <dt>Experiment</dt>
                <dd>
                  Edit a transaction, reshape the peer graph, compare two
                  designs, or choose any of the ten applications and ten issues.
                </dd>
              </div>
              <div>
                <dt>Camera</dt>
                <dd>
                  Drag to orbit, pinch to zoom on touch screens, or use arrow
                  keys and +/−. Home resets the camera.
                </dd>
              </div>
              <div>
                <dt>Playback</dt>
                <dd>
                  Scrub the timeline, change speed, or pause. Reduced motion
                  keeps manual exploration available.
                </dd>
              </div>
            </dl>
            <p>
              Escape closes tools and dialogs. This site stays immersive; there
              are no separate lab pages.
            </p>
          </div>
        </Dialog>
      )}
    </main>
  );
}

function Workbench({ c }: { c: AtlasController }) {
  const focusRef = useRef<HTMLElement>(null);
  const title =
    c.panel === "inspect"
      ? "Object inspector"
      : c.panel === "notes"
        ? "Why this connection matters"
        : "Experiment in place";
  return (
    <aside
      ref={focusRef}
      id="atlas-tools"
      tabIndex={-1}
      className="atlas-workbench"
      aria-label={title}
    >
      <header>
        <div>
          <span>{areas[c.area].short.toUpperCase()} / SAME WORLD</span>
          <h2>{title}</h2>
        </div>
        <button
          aria-label="Close experiment panel"
          onClick={() => {
            c.setPanel(null);
            c.setSelectedId(null);
          }}
        >
          <X size={18} />
        </button>
      </header>
      <div className="workbench-body">
        {c.panel === "inspect" && c.selected ? (
          <>
            <div className="inspected-object">
              <span className="panel-eyebrow">
                {c.selected.kind.toUpperCase()} / WORLD OBJECT
              </span>
              <h3>{c.selected.label}</h3>
              <strong style={{ color: c.selected.color }}>
                {spatialObjectValue(
                  c.selected,
                  c.selected.networkIndex !== undefined,
                  c.netSent ? c.netElapsed : -1,
                )}
              </strong>
              <p>{c.selected.detail}</p>
              <dl>
                {c.selected.facts.map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="trust-boundary">
                <span>TRUST BOUNDARY</span>
                <p>{c.selected.trust}</p>
              </div>
              <SourceLink id={c.selected.sourceId ?? c.chapter.source} />
            </div>
            <button
              className="panel-action"
              onClick={() => c.setPanel("tools")}
            >
              <Settings2 size={13} />
              Adjust this experiment
              <ArrowRight size={13} />
            </button>
          </>
        ) : c.panel === "notes" ? (
          <Notes c={c} />
        ) : (
          <Tools c={c} />
        )}
      </div>
      <footer>
        <button
          onClick={() => c.setPanel(c.panel === "tools" ? "notes" : "tools")}
        >
          {c.panel === "tools" ? (
            <BookOpen size={12} />
          ) : (
            <Settings2 size={12} />
          )}{" "}
          {c.panel === "tools"
            ? "Read the assumptions"
            : "Open experiment controls"}
        </button>
        <span>All changes stay local</span>
      </footer>
    </aside>
  );
}

function Tools({ c }: { c: AtlasController }) {
  const [copied, setCopied] = useState(false);
  if (c.area === "transaction") {
    const raw =
      c.dataView === "signature"
        ? c.tx
          ? `ED25519 SIGNATURE\n${c.tx.signature}\n\nPUBLIC KEY\n${c.tx.publicKey}\n\nORIGINAL PAYLOAD HASH\n${c.tx.hash}`
          : "Preparing signature…"
        : c.dataView === "bytes"
          ? (hex(new TextEncoder().encode(c.receivedPayload))
              .match(/.{1,40}/g)
              ?.join("\n") ?? "")
          : c.receivedPayload
            ? JSON.stringify(JSON.parse(c.receivedPayload), null, 2)
            : "Preparing payload…";
    return (
      <>
        <div className="panel-intro">
          <span className="panel-eyebrow">INTENT → BYTES → AUTHORIZATION</span>
          <h3>Change the transaction.</h3>
          <p>
            The same draft drives the wallet, signed envelope, Merkle tree and
            block commitment in the world.
          </p>
        </div>
        <label className="atlas-field">
          Recipient
          <select
            aria-label="Transaction recipient"
            value={c.recipient}
            onChange={(e) => c.setRecipient(e.target.value)}
          >
            <option value="maya.atlas">maya.atlas</option>
            <option value="sam.atlas">sam.atlas</option>
            <option value="lee.atlas">lee.atlas</option>
          </select>
        </label>
        <label className="atlas-field">
          Amount · fictional ATLAS
          <input
            aria-label="Transaction amount"
            type="number"
            min=".01"
            max="1000"
            step=".1"
            value={c.amount}
            onChange={(e) => c.setAmount(e.target.value)}
          />
        </label>
        {!c.amountValid && (
          <p className="inline-error" role="alert">
            Enter an amount greater than zero and no more than 1,000.
          </p>
        )}
        {c.cryptoError && (
          <p className="inline-error" role="alert">
            {c.cryptoError}
          </p>
        )}
        <button
          className={`panel-action ${c.tampered ? "restore" : ""}`}
          disabled={!c.tx}
          onClick={c.toggleTamper}
        >
          {c.tampered ? <RotateCcw size={14} /> : <ShieldAlert size={14} />}{" "}
          {c.tampered ? "Restore signed bytes" : "Alter the signed amount"}
          <ArrowRight size={13} />
        </button>
        <div className="panel-divider" />
        <div
          className="data-switcher"
          role="group"
          aria-label="Transaction data view"
        >
          {(["payload", "bytes", "signature"] as const).map((value) => (
            <button
              key={value}
              aria-pressed={c.dataView === value}
              onClick={() => c.setDataView(value)}
            >
              {value === "payload"
                ? "Payload"
                : value === "bytes"
                  ? "Wire bytes"
                  : "Signature"}
            </button>
          ))}
        </div>
        <div className="data-display">
          <button
            aria-label="Copy transaction data"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(raw);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          <pre data-testid="transaction-data">{raw}</pre>
        </div>
        <div className="mini-readout">
          <span>ORIGINAL HASH · SHA-256</span>
          <code data-testid="transaction-hash">
            {c.tx?.hash ?? "Computing locally…"}
          </code>
        </div>
        <div className="mini-readout">
          <span>MERKLE ROOT · FOUR LEAVES</span>
          <code data-testid="merkle-root">
            {c.root ?? "Computing locally…"}
          </code>
        </div>
        <div className="mini-readout">
          <span>BLOCK HEADER COMMITMENT</span>
          <code>{c.headerHash || "Computing locally…"}</code>
        </div>
        <p className="model-note">
          Generic JSON + Ed25519 + SHA-256. Not a production chain encoding.
          Private keys are never shown or sent.
        </p>
      </>
    );
  }
  if (c.area === "network")
    return (
      <>
        <div className="panel-intro">
          <span className="panel-eyebrow">ONE MESSAGE / MANY PATHS</span>
          <h3>Reshape the peer graph.</h3>
          <p>
            The actual relay cluster in the world changes. Node labels
            distinguish predictions from receipt.
          </p>
        </div>
        <div className="choice-row" role="group" aria-label="Network topology">
          {(["mesh", "ring", "hub"] as const).map((topology) => (
            <button
              key={topology}
              aria-pressed={c.network.topology === topology}
              onClick={() => c.updateNetwork({ topology })}
            >
              {topology}
            </button>
          ))}
        </div>
        <Range
          label="Nodes"
          value={c.network.nodes}
          unit="peers"
          min={8}
          max={32}
          onChange={(nodes) => c.updateNetwork({ nodes })}
        />
        <Range
          label="Link latency"
          value={c.network.latency}
          unit="ms"
          min={20}
          max={500}
          step={20}
          onChange={(latency) => c.updateNetwork({ latency })}
        />
        <Range
          label="Link bandwidth"
          value={c.network.bandwidth}
          unit="kbps"
          min={64}
          max={2048}
          step={64}
          onChange={(bandwidth) => c.updateNetwork({ bandwidth })}
        />
        <Range
          label="Wire message size"
          value={c.network.payload}
          unit="bytes"
          min={c.wireBytes}
          max={8192}
          step={1}
          onChange={(payload) => c.updateNetwork({ payload })}
        />
        <Range
          label="Offline nodes"
          value={c.network.offline}
          unit="%"
          min={0}
          max={40}
          step={5}
          onChange={(offline) => c.updateNetwork({ offline })}
        />
        <button className="panel-action primary" onClick={c.broadcast}>
          <Radio size={14} />
          {c.netSent ? "Broadcast again" : "Broadcast a message"}
          <ArrowRight size={14} />
        </button>
        <div className="metric-grid">
          <div>
            <span>REACHABLE / ONLINE</span>
            <strong data-testid="network-reachability">
              {c.net.reachable}/{c.network.nodes - c.net.down.size}
            </strong>
          </div>
          <div>
            <span>p95 / CONNECTIVITY</span>
            <strong data-testid="network-p95">
              {c.net.reachable < c.network.nodes - c.net.down.size
                ? "UNREACHABLE"
                : `${Math.round(c.net.p95)} ms`}
            </strong>
          </div>
          <div>
            <span>p50 REACHABLE</span>
            <strong>{Math.round(c.net.p50)} ms</strong>
          </div>
          <div>
            <span>MODELED WIRE DATA</span>
            <strong>{(c.net.wireBytes / 1024).toFixed(1)} KiB</strong>
          </div>
        </div>
        <button
          className="subtle-action"
          onClick={() => c.updateNetwork(defaultNetwork)}
        >
          <RotateCcw size={12} />
          Reset the network
        </button>
        <p className="model-note">
          Try a hub with offline nodes. Failed central routing can isolate
          healthy peers. Broadcast animates at one quarter model speed.
        </p>
      </>
    );
  if (c.area === "scale")
    return (
      <>
        <div className="panel-intro">
          <span className="panel-eyebrow">TWO LANES / ONE WORKLOAD</span>
          <h3>Move the bottleneck.</h3>
          <p>
            The A and B lanes share payload size and demand. Their limits,
            utilization and completed calls update in the same world.
          </p>
        </div>
        <label className="atlas-field">
          Design A
          <select
            aria-label="Design A"
            value={c.a}
            onChange={(e) => {
              c.setA(e.target.value);
              c.setSelectedId(null);
            }}
          >
            {solutions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="atlas-field">
          Design B
          <select
            aria-label="Design B"
            value={c.b}
            onChange={(e) => {
              c.setB(e.target.value);
              c.setSelectedId(null);
            }}
          >
            {solutions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <Range
          label="Payload size"
          value={c.bytes}
          unit="bytes"
          min={c.wireBytes}
          max={8192}
          step={1}
          onChange={c.setBytes}
        />
        <Range
          label="Incoming demand"
          value={c.demand}
          unit="calls/s"
          min={10}
          max={5000}
          step={10}
          onChange={c.setDemand}
        />
        <div className="model-comparison">
          {[c.solutionA, c.solutionB].map((solution, i) => (
            <div key={i}>
              <span>
                {i ? "B" : "A"} · {solution.name}
              </span>
              <strong
                data-testid={`throughput-${i}`}
                style={{ color: solution.color }}
              >
                {c.metrics[i].served.toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}
                <small> calls/s</small>
              </strong>
              <p>
                {Math.ceil(c.metrics[i].backlog).toLocaleString()} calls queued
                after 60s
              </p>
              <details>
                <summary>
                  Resource assumptions
                  <ChevronDown size={12} />
                </summary>
                <p>{solution.reason}</p>
              </details>
              <SourceLink id={solution.source} />
            </div>
          ))}
        </div>
        <p className="model-note">
          Fixed teaching resource budgets, not measured or live chain TPS. Read
          Explain for settlement, security and six design layers.
        </p>
      </>
    );
  if (c.area === "applications")
    return (
      <>
        <div className="panel-intro">
          <span className="panel-eyebrow">
            10 REAL USES / SAME SHARED WORLD
          </span>
          <h3>What does the record represent?</h3>
          <p>
            The recipient’s balance can connect to very different human and
            institutional systems.
          </p>
        </div>
        <label className="atlas-field">
          Real-world application
          <select
            aria-label="Real-world application"
            value={c.appId}
            onChange={(e) => c.setAppId(e.target.value)}
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>
        </label>
        <div className="application-choice">
          <span style={{ color: c.app.color }}>{c.app.mark}</span>
          <div>
            <h3>{c.app.name}</h3>
            <p>{c.app.category}</p>
          </div>
        </div>
        <p className="panel-description">{c.app.summary}</p>
        <ol className="workbench-steps">
          {c.app.flow.map(([title, detail], i) => (
            <li key={title}>
              <button
                aria-current={c.appStep === i ? "step" : undefined}
                onClick={() => c.jump(i)}
              >
                <span>{i + 1}</span>
                {title}
                <ChevronRight size={12} />
              </button>
              {c.appStep === i && <p>{detail}</p>}
            </li>
          ))}
        </ol>
        <div className="trust-boundary">
          <span>THE CHAIN ↔ THE WORLD</span>
          <p>{c.app.boundary}</p>
        </div>
        <SourceLink id={c.app.source} />
        <button className="panel-action" onClick={c.connection}>
          <ShieldAlert size={13} />
          Question this model’s assumptions
          <ArrowRight size={13} />
        </button>
      </>
    );
  return (
    <>
      <div className="panel-intro">
        <span className="panel-eyebrow">
          10 OPEN QUESTIONS / EDITORIAL SELECTION
        </span>
        <h3>Which assumption matters next?</h3>
        <p>
          Follow the real-world mechanism into the issue it leaves unresolved.
        </p>
      </div>
      <label className="atlas-field">
        Open question
        <select
          aria-label="Open question"
          value={c.topicId}
          onChange={(e) => c.setTopicId(e.target.value)}
        >
          {topics.map((topic, i) => (
            <option key={topic.id} value={topic.id}>
              {String(i + 1).padStart(2, "0")} · {topic.title}
            </option>
          ))}
        </select>
      </label>
      <h3 className="question-title">{c.topic.question}</h3>
      <ol className="workbench-steps">
        {c.topic.mechanism.map((detail, i) => (
          <li key={detail}>
            <button
              aria-current={c.topicStep === i ? "step" : undefined}
              onClick={() => c.jump(i)}
            >
              <span>{i + 1}</span>
              {c.world.chapters[i].title}
              <ChevronRight size={12} />
            </button>
            {c.topicStep === i && <p>{detail}</p>}
          </li>
        ))}
      </ol>
      <div className="trust-boundary">
        <span>THE TRADE-OFF</span>
        <p>{c.topic.tradeoff}</p>
      </div>
      <p className="panel-description">{c.topic.watch}</p>
      <div className="panel-sources">
        {c.topic.sources.map((id) => (
          <SourceLink key={id} id={id} />
        ))}
      </div>
      <div className="issue-steppers">
        <button
          onClick={() =>
            c.setTopicId(
              topics[(topics.findIndex((t) => t.id === c.topicId) + 9) % 10].id,
            )
          }
        >
          <ArrowLeft size={12} />
          Previous issue
        </button>
        <button
          onClick={() =>
            c.setTopicId(
              topics[(topics.findIndex((t) => t.id === c.topicId) + 1) % 10].id,
            )
          }
        >
          Next issue
          <ArrowRight size={12} />
        </button>
      </div>
      <p className="model-note">
        Curated learning agenda, not a measured trend ranking or a live news
        feed. Sources accessed {researchDate}.
      </p>
    </>
  );
}

function Notes({ c }: { c: AtlasController }) {
  if (c.area === "transaction")
    return (
      <>
        <div className="panel-intro">
          <span className="panel-eyebrow">
            {c.chapter.title.toUpperCase()} / A LEVEL DEEPER
          </span>
          <h3>{stages[c.step].heading}</h3>
          <p>{stages[c.step].body}</p>
        </div>
        <p className="panel-description">{stages[c.step].detail}</p>
        <SourceLink id={c.chapter.source} />
        <div className="trust-boundary">
          <span>WHAT THIS EXPERIMENT EXECUTES</span>
          <p>
            Ed25519 signing and verification, UTF-8 bytes, SHA-256 and a
            four-leaf Merkle tree are real local computations. Balances, replay
            protection, block production and consensus are explained, not a
            deployed chain.
          </p>
        </div>
        <p className="model-note">
          42-second playback is narration time. It is not confirmation or
          finality time on a production blockchain. The binary Merkle exercise
          hashes concatenated hexadecimal children; real protocols define their
          own encodings.
        </p>
      </>
    );
  if (c.area === "network")
    return (
      <>
        <div className="panel-intro">
          <span className="panel-eyebrow">
            DELIVERY ≠ AUTHORIZATION ≠ FINALITY
          </span>
          <h3>Redundancy spends bandwidth.</h3>
          <p>
            Each node is a separate observer. More paths can improve
            reachability while adding duplicate wire traffic. A fast delivery
            does not make an invalid message valid.
          </p>
        </div>
        <div className="formula">
          link time = latency × jitter
          <br />+ payload bits / bandwidth
        </div>
        <p className="panel-description">
          First arrival uses a deterministic shortest-path calculation. Offline
          nodes are removed; the first online node is the source. A hub fails
          before its spokes in this experiment.
        </p>
        <p className="panel-description">
          p50/p95 describe reachable nodes, including the source at 0 ms.
          Reachability is reported separately. Wire bytes assume one full
          payload in each direction on every reachable edge.
        </p>
        <SourceLink id="ethereum-network" />
        <div className="trust-boundary">
          <span>WHAT THE MODEL EXCLUDES</span>
          <p>
            Queueing, transport overhead, packet loss, congestion control,
            retransmission, real gossip fanout and adversarial behavior. These
            milliseconds are not live Internet measurements.
          </p>
        </div>
      </>
    );
  if (c.area === "scale") {
    const level = layers[c.layer];
    return (
      <>
        <div className="panel-intro">
          <span className="panel-eyebrow">SPEED IS ONLY ONE DIMENSION</span>
          <h3>Every design moves a constraint.</h3>
        </div>
        {[c.solutionA, c.solutionB].map((solution, i) => (
          <details className="design-details" key={i} open>
            <summary>
              {i ? "B" : "A"} · {solution.name}
              <ChevronDown size={13} />
            </summary>
            <dl>
              {[
                ["Cadence", solution.cadence],
                ["Settlement", solution.finality],
                ["Trust", solution.trust],
                ["Constraint", solution.bottleneck],
                ["Fee driver", solution.fee],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <SourceLink id={solution.source} />
          </details>
        ))}
        <label className="atlas-field">
          System design layer
          <select
            aria-label="System design layer"
            value={c.layer}
            onChange={(e) => c.setLayer(Number(e.target.value))}
          >
            {layers.map((layer, i) => (
              <option key={layer.name} value={i}>
                {layer.number} · {layer.name}
              </option>
            ))}
          </select>
        </label>
        <div className="layer-explanation">
          <h3>{level.problem}</h3>
          <span>REQUIREMENT</span>
          <p>{level.requirement}</p>
          <span>HOW WE SOLVE IT</span>
          <p>{level.solutions}</p>
          <span>THE PRICE WE PAY</span>
          <p>{level.cost}</p>
          <SourceLink id={level.source} />
        </div>
        <div className="formula">
          capacity = min(bytes budget / payload,
          <br />
          execution ceiling)
          <br />
          backlog = max(0, demand − completed) × 60
        </div>
        <p className="model-note">
          Different transaction semantics, proving delays, contention, vote
          traffic, hardware, gas variation and route liquidity prevent naive
          production comparisons.
        </p>
      </>
    );
  }
  if (c.area === "applications")
    return (
      <>
        <div className="panel-intro">
          <span className="panel-eyebrow">
            {c.app.name.toUpperCase()} / THE PEOPLE BEHIND THE PROTOCOL
          </span>
          <h3>{c.app.headline}</h3>
          <p>{c.app.summary}</p>
        </div>
        {[
          ["WHO PARTICIPATES", c.app.actors],
          ["HOW VALUE MOVES", c.app.economy],
          ["REMAINING RISKS", c.app.risks],
          ["THE INSTITUTIONAL BOUNDARY", c.app.boundary],
        ].map(([title, body]) => (
          <section className="note-section" key={title}>
            <span>{title}</span>
            <p>{body}</p>
          </section>
        ))}
        <SourceLink id={c.app.source} />
      </>
    );
  return (
    <>
      <div className="panel-intro">
        <span className="panel-eyebrow">{c.topic.tag} / THE QUESTION</span>
        <h3>{c.topic.question}</h3>
        <p>{c.topic.body}</p>
      </div>
      <section className="note-section">
        <span>THE TRADE-OFF</span>
        <p>{c.topic.tradeoff}</p>
      </section>
      <section className="note-section">
        <span>WHAT TO WATCH</span>
        <p>{c.topic.watch}</p>
      </section>
      <div className="panel-sources">
        {c.topic.sources.map((id) => (
          <SourceLink key={id} id={id} />
        ))}
      </div>
      <p className="model-note">
        An editorial research selection, not a popularity ranking. Animations
        explain mechanisms, not real network activity or predictions.
      </p>
    </>
  );
}

function AtlasSearch({ c }: { c: AtlasController }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const rows = [
      ...areaOrder.map((area) => ({
        title: areas[area].title,
        text: areas[area].description,
        area,
        id: "",
        kind: "Connection",
      })),
      ...glossary.map((g) => ({
        title: g.term,
        text: g.definition,
        area:
          (
            {
              journey: "transaction",
              networks: "network",
              compare: "scale",
              applications: "applications",
              signals: "topics",
            } as Record<string, Area>
          )[g.route] ?? "transaction",
        id: g.id ?? "",
        kind: "Concept",
      })),
      ...applications.map((app) => ({
        title: app.name,
        text: app.summary,
        area: "applications" as Area,
        id: app.id,
        kind: "Application",
      })),
      ...topics.map((topic) => ({
        title: topic.title,
        text: topic.question,
        area: "topics" as Area,
        id: topic.id,
        kind: "Open question",
      })),
    ];
    const value = query.trim().toLowerCase();
    return rows.filter(
      (row) =>
        !value || `${row.title} ${row.text}`.toLowerCase().includes(value),
    );
  }, [query]);
  return (
    <Dialog
      title="Find a connection in this world"
      onClose={() => c.setOverlay(null)}
      className="atlas-search-dialog"
    >
      <label className="atlas-search-input">
        <Search size={18} />
        <input
          autoFocus
          aria-label="Search concepts and connections"
          placeholder="Try stablecoin, signature, finality…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <kbd>ESC</kbd>
      </label>
      <div className="atlas-search-results">
        {results.slice(0, 30).map((row) => (
          <button
            key={`${row.kind}-${row.title}`}
            onClick={() => {
              c.focus(row.area, true);
              if (row.area === "applications" && row.id) c.setAppId(row.id);
              if (row.area === "topics" && row.id) c.setTopicId(row.id);
              if (row.kind === "Concept") c.setPanel("notes");
            }}
          >
            <span>{row.kind}</span>
            <h3>{row.title}</h3>
            <p>{row.text}</p>
            <ArrowRight size={15} />
          </button>
        ))}
        {!results.length && (
          <p className="empty-state">
            No connections found. Try “network” or “Bitcoin”.
          </p>
        )}
      </div>
      <p className="dialog-footnote">
        {results.length} connections · Your transaction and experiment state
        stay in place.
      </p>
    </Dialog>
  );
}
function Sources({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Research and model notes" onClose={onClose}>
      <p className="dialog-intro">
        Primary protocol documentation and organization publications, accessed{" "}
        {researchDate}. Performance figures are teaching models. Hot topics are
        an editorial selection. No live chain or real funds are connected.
      </p>
      <div className="atlas-source-list">
        {Object.entries(sources).map(([id, source], i) => (
          <a key={id} href={source.url} target="_blank" rel="noreferrer">
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3>{source.title}</h3>
              <p>{source.publisher}</p>
            </div>
            <ArrowRight size={14} />
          </a>
        ))}
      </div>
      <p className="dialog-footnote">
        <Code2 size={12} />
        Source code:{" "}
        <a
          href="https://github.com/sloth-os/Blockchain"
          target="_blank"
          rel="noreferrer"
        >
          sloth-os/Blockchain
        </a>
      </p>
    </Dialog>
  );
}
