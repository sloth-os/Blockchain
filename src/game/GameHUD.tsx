import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  Compass,
  Gamepad2,
  HelpCircle,
  Layers3,
  LockKeyhole,
  Map,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { Dialog, SourceLink } from "../components";
import { networkEdges } from "../models";
import {
  designDelivery,
  has,
  missions,
  objectives,
  routeMilliseconds,
  unlocked,
} from "./model";
import type { ChainGame } from "./useChainGame";

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
const medals = (count: number) => (
  <span className="game-stars" aria-label={`${count} of 3 stars`}>
    {[1, 2, 3].map((i) => (
      <Star
        key={i}
        size={19}
        fill={i <= count ? "currentColor" : "none"}
        className={i <= count ? "earned" : ""}
      />
    ))}
  </span>
);

export default function GameHUD({
  g,
  onExplore,
}: {
  g: ChainGame;
  onExplore: () => void;
}) {
  const checklist = objectives(g.state),
    done = checklist.filter(([, complete]) => complete).length;
  const nearby = g.stations.find(
    (s) => s.id === g.telemetry.near && !(s.collectible && has(g.state, s.id)),
  );
  const totalComplete = Object.keys(g.save.best).length;
  const steer =
    (x: number, z: number) =>
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      g.steer.current = { x, z };
    };
  const release = () => {
    g.steer.current = { x: 0, z: 0 };
  };
  return (
    <div
      ref={g.hud}
      className={`game-hud game-${g.state.status}`}
      data-testid="game-hud"
      data-mission={g.mission.id}
    >
      {g.state.status === "briefing" ? (
        <section className="game-intro" aria-label="Chain Runner introduction">
          <div className="game-intro-copy" data-game-obstacle>
            <div className="game-kicker">
              <Gamepad2 size={17} /> A PLAYABLE BLOCKCHAIN EXPEDITION
            </div>
            <h1>
              Chain
              <br />
              <span>Runner.</span>
              <i>01—07</i>
            </h1>
            <p className="game-intro-lead">
              Be the packet.
              <br />
              Restore the network.
            </p>
            <p className="game-intro-description">
              Pilot a courier through a living protocol. Recover a message,
              rebuild its route, earn a quorum, and carry trust into the real
              world.
            </p>
            <div className="game-intro-actions">
              <button
                className="game-primary"
                onClick={() => g.begin(g.state.mission)}
              >
                <Play size={18} />
                {totalComplete
                  ? `Continue mission ${String(g.state.mission + 1).padStart(2, "0")}`
                  : "Start expedition"}
                <ArrowRight size={18} />
              </button>
              <button
                className="game-secondary"
                onClick={() => g.setMenu("missions")}
              >
                Mission map
                <Compass size={16} />
              </button>
            </div>
            <div className="game-intro-facts">
              <span>
                <Shield size={14} />7 missions
              </span>
              <span>
                <Sparkles size={14} />
                {g.teaching
                  ? "Illustrated crypto checks"
                  : "Real local cryptography"}
              </span>
              <span>
                <Star size={14} />
                {g.storage
                  ? "Checkpoint progress saves"
                  : "Progress stays in this session"}
              </span>
            </div>
            <div className="game-controls-preview">
              <span>
                <kbd>W A S D</kbd> fly
              </span>
              <span>
                <kbd>E</kbd> interact
              </span>
              <span>
                <kbd>SPACE</kbd> dash
              </span>
              <span className="game-touch-copy">
                Or tap a station to travel
              </span>
            </div>
            <button className="game-return" onClick={onExplore}>
              <ArrowLeft size={14} />
              Explore the atlas
            </button>
          </div>
          <div className="game-intro-aside" data-game-obstacle>
            <span>YOUR FIRST CHECKPOINT</span>
            <h2>{g.mission.title}</h2>
            <p>{g.mission.brief}</p>
            <div>
              <span>COURIER</span>
              <strong>ATLAS / 001</strong>
            </div>
            <div>
              <span>CAMPAIGN RECORD</span>
              <strong>
                {g.total.toLocaleString()} XP · {g.stars} / 21 stars
              </strong>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section
            className="game-mission-card"
            aria-label="Current mission"
            data-game-obstacle
          >
            <div className="game-kicker">
              <span>{String(g.state.mission + 1).padStart(2, "0")} / 07</span>
              <span>CHAIN RUNNER</span>
              <button
                aria-label="Open mission brief and game help"
                onClick={() => g.setMenu("help")}
              >
                <HelpCircle size={17} />
              </button>
            </div>
            <h1>{g.mission.title}</h1>
            <p>{g.mission.brief}</p>
            <ul>
              {checklist.map(([title, complete], i) => (
                <li className={complete ? "complete" : ""} key={title}>
                  {complete ? (
                    <Check size={14} />
                  ) : (
                    <span className="game-objective-number">{i + 1}</span>
                  )}
                  {title}
                </li>
              ))}
            </ul>
            <div className="game-objective-progress">
              <span style={{ width: `${(done / checklist.length) * 100}%` }} />
            </div>
            {g.state.mission === 1 && g.state.route.length > 0 && (
              <div className="game-route-stat">
                {g.state.route
                  .map((n) => `N${String(n + 1).padStart(2, "0")}`)
                  .join(" → ")}
                <span>
                  {Math.round(routeMilliseconds(g.state.route))} model ms ·{" "}
                  {Math.max(0, g.state.route.length - 1) * 512} route bytes
                </span>
              </div>
            )}
          </section>
          <div className="game-corner" data-game-obstacle>
            <div className="game-vitals">
              <div>
                <Shield size={14} />
                <span>COURIER SHIELD</span>
                <strong data-testid="game-energy">{g.state.energy}%</strong>
              </div>
              <div
                className={`game-shield ${g.state.energy < 35 ? "low" : ""}`}
              >
                <span style={{ width: `${g.state.energy}%` }} />
              </div>
              <p>
                <span>{clock(g.telemetry.seconds)}</span>
                <span>{g.total.toLocaleString()} XP</span>
              </p>
            </div>
            <button
              className="game-minimap"
              aria-label="Open mission targets"
              onClick={() => g.setMenu("missions")}
            >
              <svg viewBox="-8 -7 16 14" aria-hidden="true">
                <rect
                  x="-7.8"
                  y="-6.7"
                  width="15.6"
                  height="13.4"
                  rx=".6"
                  fill="#0e2532"
                />
                {g.state.mission === 1 &&
                  g.state.topology &&
                  networkEdges(8, g.state.topology).map(([a, b]) => {
                    const from = g.stations[a + 1],
                      to = g.stations[b + 1];
                    return (
                      <line
                        key={`${a}-${b}`}
                        x1={from.x}
                        y1={from.z}
                        x2={to.x}
                        y2={to.z}
                        stroke="#477384"
                        strokeWidth=".08"
                      />
                    );
                  })}
                {g.stations.map((station) => (
                  <circle
                    key={station.id}
                    cx={station.x}
                    cy={station.z}
                    r=".32"
                    fill={
                      has(g.state, station.id)
                        ? "#b5e97c"
                        : (station.color ?? g.mission.color)
                    }
                    opacity={
                      station.collectible && has(g.state, station.id)
                        ? 0.2
                        : 0.8
                    }
                  />
                ))}
                <circle
                  cx={g.telemetry.x}
                  cy={g.telemetry.z}
                  r=".5"
                  fill="#efffcf"
                  stroke="#102c37"
                  strokeWidth=".15"
                />
              </svg>
              <span>
                <Compass size={12} />
                Targets
              </span>
            </button>
          </div>
          <div
            className="game-feedback"
            data-game-obstacle
            role="status"
            aria-live="polite"
            data-tone={g.state.feedback.tone}
            key={g.state.feedback.serial}
          >
            <span>
              {g.state.feedback.tone === "success" ? (
                <Check size={16} />
              ) : g.state.feedback.tone === "error" ? (
                <Zap size={16} />
              ) : (
                <Sparkles size={16} />
              )}
            </span>
            <div>
              <strong>{g.state.feedback.title}</strong>
              <p>{g.state.feedback.body}</p>
            </div>
          </div>
          <div className="game-interact-prompt" data-game-obstacle>
            <div>
              <span>{nearby ? "IN RANGE" : "NEXT MOVE"}</span>
              <strong>
                {nearby ? nearby.name : "Select a station or fly closer"}
              </strong>
            </div>
            <button
              className="game-primary"
              disabled={
                g.pending || g.state.status !== "playing" || !!g.state.choice
              }
              onClick={nearby ? g.interact : () => g.setMenu("missions")}
            >
              {g.pending ? "Checking…" : nearby ? "Interact" : "Choose target"}
              {nearby ? <kbd>E</kbd> : <Compass size={16} />}
            </button>
          </div>
          <div className="game-dpad" role="group" aria-label="Flight controls">
            <button
              className="up"
              aria-label="Fly forward"
              onPointerDown={steer(0, -1)}
              onPointerUp={release}
              onPointerCancel={release}
              onLostPointerCapture={release}
            >
              <ArrowUp size={20} />
            </button>
            <button
              className="left"
              aria-label="Fly left"
              onPointerDown={steer(-1, 0)}
              onPointerUp={release}
              onPointerCancel={release}
              onLostPointerCapture={release}
            >
              <ArrowLeft size={20} />
            </button>
            <span>
              <Gamepad2 size={18} />
            </span>
            <button
              className="right"
              aria-label="Fly right"
              onPointerDown={steer(1, 0)}
              onPointerUp={release}
              onPointerCancel={release}
              onLostPointerCapture={release}
            >
              <ArrowRight size={20} />
            </button>
            <button
              className="down"
              aria-label="Fly backward"
              onPointerDown={steer(0, 1)}
              onPointerUp={release}
              onPointerCancel={release}
              onLostPointerCapture={release}
            >
              <ArrowDown size={20} />
            </button>
          </div>
          <div className="game-flight-actions" data-game-obstacle>
            <button
              aria-label="Dash courier"
              disabled={
                g.telemetry.boost < 0.99 || g.state.status !== "playing"
              }
              onClick={g.dash}
              style={
                {
                  "--boost": `${g.telemetry.boost * 100}%`,
                } as React.CSSProperties
              }
            >
              <Zap size={21} />
              <span>Dash</span>
              <kbd>SPACE</kbd>
            </button>
            <button aria-label="Pause game" onClick={g.pause}>
              <Pause size={19} />
              <span>Pause</span>
            </button>
          </div>
          <div className="game-bottom-bar">
            <span className="game-keyboard-hint">
              <kbd>WASD / ↑↓←→</kbd>fly <kbd>E</kbd>interact <kbd>SPACE</kbd>
              dash <kbd>ESC</kbd>pause
            </span>
            <span className="game-accessibility-note">
              {g.compatibility
                ? "2D route controls available"
                : g.bridge.reduced
                  ? "Reduced effects · instant destination travel"
                  : "Tap ground or a station to fly"}
            </span>
            <div>
              <button
                aria-label={
                  g.overview ? "Follow courier" : "Show tactical camera"
                }
                aria-pressed={g.overview}
                onClick={() => g.setOverview(!g.overview)}
              >
                <Map size={15} />
                <span>{g.overview ? "Follow" : "Tactical"}</span>
              </button>
              <button
                aria-label={g.sound ? "Mute game sound" : "Enable game sound"}
                aria-pressed={g.sound}
                onClick={g.toggleSound}
              >
                {g.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>
          </div>
        </>
      )}
      {g.menu === "missions" && (
        <Dialog
          title="Mission control"
          onClose={() => g.setMenu(null)}
          className="game-dialog"
        >
          {g.state.status === "playing" && (
            <section className="game-target-list" data-testid="game-targets">
              <div className="game-dialog-kicker">
                CURRENT SECTOR · SELECT TO TRAVEL
              </div>
              <h3>{g.mission.title}</h3>
              <p className="game-sector-brief">{g.mission.brief}</p>
              <div>
                {g.stations.map((station) => (
                  <button
                    key={station.id}
                    aria-label={`Fly to ${station.name}`}
                    disabled={station.collectible && has(g.state, station.id)}
                    onClick={() => {
                      g.setMenu(null);
                      g.navigate(station.id);
                    }}
                  >
                    <span
                      className="game-target-dot"
                      style={{ background: station.color ?? g.mission.color }}
                    />
                    <span>
                      <strong>{station.name}</strong>
                      <small>
                        {station.collectible && has(g.state, station.id)
                          ? "Recovered"
                          : station.value}
                      </small>
                    </span>
                    {has(g.state, station.id) ? (
                      <Check size={15} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}
          <section className="game-mission-list">
            <div className="game-dialog-kicker">
              EXPEDITION · {totalComplete} / 7 RESTORED
            </div>
            {missions.map((mission, index) => (
              <button
                key={mission.id}
                disabled={!unlocked(g.save, index)}
                aria-label={`Play mission ${index + 1}: ${mission.title}`}
                onClick={() => g.begin(index)}
              >
                <span className="game-mission-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong>{mission.title}</strong>
                  <small>
                    {g.save.best[mission.id]
                      ? `${g.save.best[mission.id].score} XP · best ${clock(g.save.best[mission.id].seconds)}`
                      : unlocked(g.save, index)
                        ? "Ready to explore"
                        : "Complete previous missions"}
                  </small>
                </span>
                {g.save.best[mission.id] ? (
                  medals(g.save.best[mission.id].stars)
                ) : unlocked(g.save, index) ? (
                  <ArrowRight size={17} />
                ) : (
                  <LockKeyhole size={16} />
                )}
              </button>
            ))}
          </section>
        </Dialog>
      )}
      {g.menu === "help" && (
        <Dialog
          title="Your courier field manual"
          onClose={() => g.setMenu(null)}
          className="game-dialog"
        >
          <div className="game-help">
            <div className="game-dialog-kicker">CURRENT MISSION</div>
            <h3>{g.mission.title}</h3>
            <p>{g.mission.brief}</p>
            <p>
              Each mission keeps the message and block it starts with. Editing a
              draft in the atlas applies to your next mission or retry.
            </p>
            <div className="game-lesson">
              <Sparkles size={17} />
              <p>{g.mission.lesson}</p>
            </div>
            <p>
              Move through the 3D sector and bring your courier within range of
              a station. Select a station label or use Targets to travel
              automatically.
            </p>
            <dl>
              <div>
                <dt>Fly</dt>
                <dd>
                  WASD or arrow keys. On touch screens, hold the flight arrows
                  or tap the floor.
                </dd>
              </div>
              <div>
                <dt>Interact</dt>
                <dd>
                  Press E near a station, or select Interact. Selected
                  destinations interact after arrival.
                </dd>
              </div>
              <div>
                <dt>Dash</dt>
                <dd>
                  Space or Dash gives a short burst and protection through
                  interference. It recharges in two seconds.
                </dd>
              </div>
              <div>
                <dt>Shield</dt>
                <dd>
                  Red fields drain 18 shield; rejected protocol choices spend
                  12. Retry the current checkpoint if your shield runs out.
                </dd>
              </div>
              <div>
                <dt>Stars</dt>
                <dd>
                  Finish with no mistakes for three stars, up to two for two
                  stars. Time is recorded, not used as a deadline.
                </dd>
              </div>
              <div>
                <dt>Access</dt>
                <dd>
                  Reduced effects use instant destination travel and stationary
                  hazards. Keyboard flight still works. The target list also
                  works without WebGL.
                </dd>
              </div>
            </dl>
            <p>
              Progress saves after each mission on this device. This is an
              educational game with fictional assets. Browser signatures and
              hash checks are real; flight, shield, votes, resource budgets and
              finality checkpoints are teaching scenarios.
            </p>
            <SourceLink id={g.mission.source} />
          </div>
        </Dialog>
      )}
      {g.state.choice && <ChoiceDialog g={g} />}
      {g.state.status === "paused" && !g.menu && (
        <Dialog
          title="Expedition paused"
          onClose={g.resume}
          className="game-dialog game-pause"
        >
          <div className="game-result">
            <div className="game-result-icon">
              <Pause size={30} />
            </div>
            <span className="game-dialog-kicker">
              CHECKPOINT {String(g.state.mission + 1).padStart(2, "0")}
            </span>
            <h3>{g.mission.title}</h3>
            <p>Your courier and mission state are waiting here.</p>
            <button className="game-primary" onClick={g.resume}>
              <Play size={17} />
              Resume mission
            </button>
            <button className="game-secondary" onClick={g.restart}>
              <RotateCcw size={16} />
              Restart this mission
            </button>
            <button className="game-return" onClick={onExplore}>
              <ArrowLeft size={14} />
              Return to atlas
            </button>
          </div>
        </Dialog>
      )}
      {(g.state.status === "won" || g.state.status === "lost") && !g.menu && (
        <Dialog
          title={
            g.state.status === "lost"
              ? "Courier checkpoint"
              : g.state.mission === 6
                ? "Expedition complete"
                : "Mission complete"
          }
          onClose={() => g.setMenu("missions")}
          className="game-dialog game-results"
        >
          <div className="game-result">
            <div
              className={`game-result-icon ${g.state.status === "lost" ? "lost" : ""}`}
            >
              {g.state.status === "won" ? (
                <Trophy size={35} />
              ) : (
                <Shield size={35} />
              )}
            </div>
            <span className="game-dialog-kicker">
              {g.state.status === "lost"
                ? "SHIELD DEPLETED · PROGRESS SAFE"
                : g.state.mission === 6
                  ? "SEVEN SYSTEMS. ONE EXPEDITION."
                  : `SECTOR ${String(g.state.mission + 1).padStart(2, "0")} RESTORED`}
            </span>
            <h3>
              {g.state.status === "lost"
                ? "A new approach."
                : g.state.mission === 6
                  ? "Trust, delivered."
                  : g.mission.title}
            </h3>
            {g.state.status === "won" ? (
              <>
                {medals(g.result.stars)}
                <div className="game-reward">
                  <strong>+{g.result.score}</strong>
                  <span>MISSION XP</span>
                  <small>
                    {clock(g.telemetry.seconds)} · {g.state.mistakes} mistakes
                  </small>
                </div>
                <p>{g.state.feedback.body}</p>
                <div className="game-lesson">
                  <Sparkles size={17} />
                  <p>{g.mission.lesson}</p>
                </div>
                <SourceLink id={g.mission.source} />
                {g.state.mission < 6 ? (
                  <button
                    className="game-primary"
                    disabled={!unlocked(g.save, g.state.mission + 1)}
                    onClick={() => g.begin(g.state.mission + 1)}
                  >
                    Next: {missions[g.state.mission + 1].title}
                    <ArrowRight size={17} />
                  </button>
                ) : (
                  <button
                    className="game-primary"
                    onClick={() => g.setMenu("missions")}
                  >
                    <Compass size={17} />
                    Explore your mission record
                  </button>
                )}
                <button className="game-secondary" onClick={g.restart}>
                  <RotateCcw size={16} />
                  Replay for a better run
                </button>
              </>
            ) : (
              <>
                <p>
                  Interference exhausted your courier shield. Completed missions
                  and your best scores are preserved.
                </p>
                <button className="game-primary" onClick={g.restart}>
                  <RotateCcw size={17} />
                  Retry checkpoint
                </button>
              </>
            )}
            <button className="game-return" onClick={onExplore}>
              Return to the atlas
              <ArrowRight size={14} />
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
function ChoiceDialog({ g }: { g: ChainGame }) {
  const kind = g.state.choice;
  const title =
    kind === "signature"
      ? "Verify the signed payload"
      : kind === "network"
        ? "Rebuild for delivery"
        : kind === "redeem"
          ? "Who delivers the dollars?"
          : "Check the inclusion proof";
  return (
    <Dialog title={title} onClose={g.cancelChoice} className="game-dialog">
      <div className="game-choice">
        <span className="game-dialog-kicker">
          AT STATION ·{" "}
          {g.realCrypto ? "BROWSER CHECKS AVAILABLE" : "TEACHING CHECKS"}
        </span>
        {kind === "signature" ? (
          <>
            <p>
              Your wallet signed these exact bytes. Choose the message to verify
              with its public key.
            </p>
            <pre>{g.payload}</pre>
            <div className="game-choice-options">
              <button disabled={g.pending} onClick={() => g.choose("original")}>
                <Shield size={20} />
                <span>
                  <strong>Verify original message</strong>
                  <small>Keep the signed amount and recipient.</small>
                </span>
                <ChevronRight size={17} />
              </button>
              <button disabled={g.pending} onClick={() => g.choose("altered")}>
                <Zap size={20} />
                <span>
                  <strong>Verify altered amount</strong>
                  <small>
                    Change the amount to 999999; keep the signature.
                  </small>
                </span>
                <ChevronRight size={17} />
              </button>
            </div>
          </>
        ) : kind === "network" ? (
          <>
            <p>
              Keep every healthy peer reachable after one failure, with healthy
              and failure p95 below 300 model ms. Each link carries a 512-byte
              message.
            </p>
            <div className="game-choice-options">
              {(["hub", "ring", "mesh"] as const).map((topology) => {
                const d = designDelivery(topology);
                return (
                  <button key={topology} onClick={() => g.choose(topology)}>
                    <Layers3 size={21} />
                    <span>
                      <strong>Install {topology} topology</strong>
                      <small>
                        {Math.round(d.healthy.p95)} ms healthy p95 ·{" "}
                        {d.fault.reachable}/7 online after a failure ·{" "}
                        {Math.round(d.fault.p95)} ms reachable p95
                      </small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                );
              })}
            </div>
            <p className="game-fine-print">
              The faulty hub is removed first in its scenario. The mesh and ring
              lose the last peer, matching the atlas model's disclosed failure
              policy.
            </p>
          </>
        ) : kind === "redeem" ? (
          <>
            <p>
              The burn receipt records an on-chain action. Which route can
              complete an eligible customer's off-chain redemption?
            </p>
            <div className="game-choice-options">
              {[
                [
                  "code",
                  "The token contract",
                  "Make code release dollars from a bank.",
                ],
                [
                  "validators",
                  "The validator quorum",
                  "Ask consensus votes to transfer reserve assets.",
                ],
                [
                  "bank",
                  "The issuer and banking rails",
                  "Use eligibility, reserve custody and the issuer's banking process.",
                ],
              ].map(([id, name, body]) => (
                <button key={id} onClick={() => g.choose(id)}>
                  <Shield size={20} />
                  <span>
                    <strong>{name}</strong>
                    <small>{body}</small>
                  </span>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p>
              A source checkpoint is present. Reconstruct its committed event
              root using the Merkle inclusion path.
            </p>
            <div className="game-choice-options">
              <button disabled={g.pending} onClick={() => g.choose("forged")}>
                <Zap size={20} />
                <span>
                  <strong>Verify altered source event</strong>
                  <small>
                    Change the locked amount but reuse the inclusion path.
                  </small>
                </span>
                <ChevronRight size={17} />
              </button>
              <button
                disabled={g.pending}
                onClick={() => g.choose("authentic")}
              >
                <Shield size={20} />
                <span>
                  <strong>Verify authentic inclusion proof</strong>
                  <small>
                    Use the actual event, sibling hashes and committed root.
                  </small>
                </span>
                <ChevronRight size={17} />
              </button>
            </div>
            <p className="game-fine-print">
              Membership is checked with real SHA-256. The source finality
              checkpoint is a supplied game assumption.
            </p>
          </>
        )}
        {g.pending && (
          <p role="status" className="game-checking">
            Checking locally…
          </p>
        )}
      </div>
    </Dialog>
  );
}
