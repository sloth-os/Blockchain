import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Copy,
  Fingerprint,
  Layers3,
  LockKeyhole,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Scene from "./Scene";
import { layers, stages } from "./content";
import {
  defaultNetwork,
  hex,
  linkedDemoHeaders,
  merkleRoot,
  sha256,
  signTransaction,
  simulateNetwork,
  solutions,
  verifyTransaction,
  workload,
  type DemoTransaction,
  type NetworkOptions,
  type Topology,
} from "./models";
import {
  Eyebrow,
  PageHeading,
  PanelHeader,
  Range,
  SourceLink,
  Stat,
  Tag,
} from "./components";

export function Journey({ motion }: { motion: boolean }) {
  const [stage, setStage] = useState(0);
  const [amount, setAmount] = useState("2.5");
  const [recipient, setRecipient] = useState("maya.atlas");
  const [transaction, setTransaction] = useState<DemoTransaction | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const [tampered, setTampered] = useState(false);
  const [auto, setAuto] = useState(false);
  const [view, setView] = useState<"payload" | "bytes" | "signature">(
    "payload",
  );
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const amountValid = Number(amount) > 0 && Number(amount) <= 1000;
  useEffect(() => {
    let cancelled = false;
    setTransaction(null);
    setValid(null);
    setError("");
    if (!amountValid) return;
    signTransaction(amount, recipient)
      .then((tx) => {
        if (!cancelled) setTransaction(tx);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Signing needs a modern browser and a secure context (HTTPS or localhost). Update your browser or use HTTPS to run the cryptography lab.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [amount, recipient, amountValid]);
  useEffect(() => {
    let cancelled = false;
    setValid(null);
    if (transaction)
      verifyTransaction(transaction, tampered)
        .then((v) => {
          if (!cancelled) setValid(v);
        })
        .catch(() => {
          if (!cancelled)
            setError("Signature verification failed to run in this browser.");
        });
    return () => {
      cancelled = true;
    };
  }, [transaction, tampered]);
  useEffect(() => {
    if (!auto) return;
    if (stage === 6 || (stage >= 3 && valid !== true)) {
      setAuto(false);
      return;
    }
    const timer = window.setTimeout(() => setStage((s) => s + 1), 2600);
    return () => window.clearTimeout(timer);
  }, [stage, auto, valid]);
  const reset = () => {
    setStage(0);
    setAuto(false);
    setTampered(false);
  };
  const s = stages[stage];
  const visiblePayload = transaction
    ? tampered
      ? JSON.stringify({ ...JSON.parse(transaction.payload), amount: 999999 })
      : transaction.payload
    : "";
  const data =
    view === "payload"
      ? visiblePayload
        ? JSON.stringify(JSON.parse(visiblePayload), null, 2)
        : "Preparing a signed transaction…"
      : view === "bytes"
        ? (hex(new TextEncoder().encode(visiblePayload))
            .match(/.{1,48}/g)
            ?.join("\n") ?? "")
        : transaction
          ? `SHA-256 OF ORIGINAL PAYLOAD\n${transaction.hash}\n\nED25519 SIGNATURE\n${transaction.signature}\n\nPUBLIC KEY\n${transaction.publicKey}`
          : "";
  return (
    <div className="page">
      <PageHeading
        chapter="CHAPTER 01 / THE TRANSACTION LAB"
        title="One little send."
        accent="A whole chain reaction."
        description="Follow a transaction from intention to settlement. Change the data, verify a real signature, and see why every step exists."
      >
        <Tag>
          <LockKeyhole size={12} />
          LOCAL CRYPTOGRAPHY · DEMO ASSET
        </Tag>
      </PageHeading>
      <div className="journey-composer panel">
        <div className="sender-avatar">A</div>
        <div className="composer-from">
          <span>FROM</span>
          <strong>alex.atlas</strong>
        </div>
        <ArrowRight className="composer-arrow" size={20} />
        <label>
          TO
          <select
            aria-label="Transaction recipient"
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
              reset();
            }}
          >
            <option value="maya.atlas">maya.atlas</option>
            <option value="sam.atlas">sam.atlas</option>
            <option value="lee.atlas">lee.atlas</option>
          </select>
        </label>
        <label className="amount-label">
          AMOUNT
          <div>
            <input
              aria-label="Transaction amount"
              type="number"
              min="0.01"
              max="1000"
              step="0.5"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                reset();
              }}
            />
            <span>ATLAS</span>
          </div>
        </label>
        <div className="composer-status">
          <span className={valid ? "live-dot" : "quiet-dot"} />
          {!amountValid
            ? "Enter 0 < amount ≤ 1,000"
            : error
              ? "Crypto unavailable"
              : transaction
                ? "Signed in your browser"
                : "Preparing signature…"}
        </div>
        <button
          className="icon-button"
          aria-label="Restart walkthrough"
          title="Restart walkthrough"
          onClick={reset}
        >
          <RotateCcw size={17} />
        </button>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <ol className="stage-track" aria-label="Transaction stages">
        {stages.map((item, i) => (
          <li key={item.title}>
            <button
              className={`${stage === i ? "active" : ""} ${stage > i ? "completed" : ""}`}
              aria-current={stage === i ? "step" : undefined}
              disabled={i > 3 && valid !== true}
              onClick={() => {
                setStage(i);
                setAuto(false);
              }}
            >
              <span>
                {stage > i ? (
                  <Check size={14} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <strong>{item.title}</strong>
            </button>
          </li>
        ))}
      </ol>
      <div className="lab-grid">
        <div className="panel journey-visual">
          <PanelHeader
            number={String(stage + 1).padStart(2, "0")}
            title={s.subtitle.toUpperCase()}
          >
            <Tag>
              {stage === 6
                ? "SETTLED"
                : stage === 3 && valid === false
                  ? "REJECTED"
                  : "STEP " + (stage + 1) + " OF 7"}
            </Tag>
          </PanelHeader>
          <div className="journey-scene">
            <Scene
              pattern={s.pattern}
              playing={motion}
              color={tampered && stage === 3 ? "#f5948d" : "#c4f568"}
            />
            <div className="scene-stage-label">
              <span>{String(stage + 1).padStart(2, "0")}</span>
              <p>{s.wire}</p>
            </div>
          </div>
          <div className="journey-controls">
            <button
              className="button secondary"
              disabled={stage === 0}
              onClick={() => {
                setStage((v) => v - 1);
                setAuto(false);
              }}
            >
              <ChevronLeft size={15} />
              Back
            </button>
            <button
              className="text-button"
              disabled={!transaction}
              onClick={() => {
                if (stage === 6) setStage(0);
                setAuto((v) => !v);
              }}
            >
              {auto ? <Pause size={14} /> : <Play size={14} />}{" "}
              {auto ? "Pause walkthrough" : "Auto-play"}
            </button>
            <button
              className="button primary"
              disabled={
                !transaction || stage === 6 || (stage >= 3 && valid !== true)
              }
              onClick={() => {
                setStage((v) => v + 1);
                setAuto(false);
              }}
            >
              Next step
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
        <article className="stage-explanation panel">
          <Eyebrow>{s.title.toUpperCase()} / WHAT’S REALLY HAPPENING</Eyebrow>
          <h2>
            {stage === 0
              ? `“Send ${amount || "…"} ATLAS to ${recipient.split(".")[0]}.”`
              : s.heading}
          </h2>
          <p>{s.body}</p>
          <div className="deeper-note">
            <CircleHelp size={17} />
            <div>
              <h4>A level deeper</h4>
              <p>{s.detail}</p>
            </div>
          </div>
          {stage === 3 && (
            <div
              className={`verification-result ${valid === false ? "invalid" : ""}`}
              role="status"
            >
              {valid === true ? (
                <ShieldCheck size={22} />
              ) : (
                <ShieldAlert size={22} />
              )}
              <div>
                <strong>
                  {valid === null
                    ? "Verifying…"
                    : valid
                      ? "Signature verified"
                      : "Signature rejected"}
                </strong>
                <p>
                  {valid
                    ? "The signed bytes match the authorization."
                    : "The amount no longer matches the original signature. A node must reject this message."}
                </p>
              </div>
            </div>
          )}
          <SourceLink id={s.source} />
        </article>
      </div>
      <section className="payload-grid">
        <div className="panel payload-panel">
          <PanelHeader title="THE ACTUAL DATA">
            <span className="mono">{transaction?.bytes ?? 0} UTF-8 BYTES</span>
            <button
              className="icon-button"
              aria-label="Copy displayed transaction data"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(data);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </PanelHeader>
          <div className="segmented data-tabs">
            {(["payload", "bytes", "signature"] as const).map((v) => (
              <button
                key={v}
                className={view === v ? "active" : ""}
                onClick={() => setView(v)}
              >
                {v === "payload"
                  ? "Readable payload"
                  : v === "bytes"
                    ? "Wire bytes"
                    : "Hash & signature"}
              </button>
            ))}
          </div>
          <pre className="payload-code" data-testid="payload">
            {data}
          </pre>
          <div className="data-caption">
            <Fingerprint size={13} />
            SHA-256 identifies these demo bytes. It does not encrypt them.
          </div>
        </div>
        <aside className="tamper-card panel">
          <div className="chapter-icon">
            <ShieldAlert size={22} />
          </div>
          <Eyebrow>TRY TO BREAK IT</Eyebrow>
          <h3>
            What if someone
            <br />
            changes the amount?
          </h3>
          <p>
            Change the signed payload to 999,999 ATLAS without the private key.
            The real browser verifier will catch it.
          </p>
          <button
            className={`button ${tampered ? "primary" : "secondary"} full-width`}
            disabled={!transaction}
            onClick={() => {
              setTampered((v) => !v);
              setStage(3);
              setAuto(false);
            }}
          >
            {tampered ? "Restore signed amount" : "Tamper with the amount"}
            {tampered ? <RotateCcw size={15} /> : <Zap size={15} />}
          </button>
          <span className="field-hint">
            Demo: Ed25519 + SHA-256, not a production chain encoding. No keys or
            funds leave this page.
          </span>
        </aside>
      </section>
      <HashLab />
    </div>
  );
}

function HashLab() {
  const sample = "Alex pays Maya 2.5 ATLAS";
  const [text, setText] = useState(sample);
  const [hash, setHash] = useState("");
  const [parent, setParent] = useState("");
  const [blockHash, setBlockHash] = useState("");
  const [root, setRoot] = useState("");
  const [baseline, setBaseline] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      sha256(text),
      sha256(sample),
      merkleRoot([
        text,
        "Sam pays Lee 1 ATLAS",
        "Lee pays Alex 4 ATLAS",
        "Maya pays Sam 3 ATLAS",
      ]),
    ])
      .then(async ([h, b, r]) => {
        const headers = await linkedDemoHeaders(r);
        if (!cancelled) {
          setHash(h);
          setBaseline(b);
          setRoot(r);
          setBlockHash(headers.currentHash);
          setParent(headers.nextHash);
        }
      })
      .catch(() => {
        if (!cancelled)
          setError("Hashing needs a modern browser on HTTPS or localhost.");
      });
    return () => {
      cancelled = true;
    };
  }, [text]);
  const bitDifference =
    hash && baseline
      ? Array.from(hash).reduce(
          (sum, c, i) =>
            sum +
            (parseInt(c, 16) ^ parseInt(baseline[i], 16))
              .toString(2)
              .replace(/0/g, "").length,
          0,
        )
      : 0;
  return (
    <section className="hash-section">
      <div className="section-heading">
        <div>
          <Eyebrow>THE CRYPTOGRAPHIC GLUE</Eyebrow>
          <h2>
            Change a byte. <span>Change the story.</span>
          </h2>
        </div>
        <Tag>
          <Fingerprint size={12} />
          REAL SHA-256
        </Tag>
      </div>
      <div className="hash-lab panel">
        <div>
          <label className="label" htmlFor="hash-input">
            A TRANSACTION’S CONTENT
          </label>
          <textarea
            id="hash-input"
            rows={3}
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="hash-actions">
            <button
              className="text-button"
              onClick={() =>
                setText((v) =>
                  v === sample ? sample.replace("2.5", "2.6") : sample,
                )
              }
            >
              <Zap size={13} />
              {text === sample ? "Change 2.5 to 2.6" : "Reset sample"}
            </button>
            <span>{bitDifference} / 256 bits differ</span>
          </div>
        </div>
        <div className="hash-output">
          <div>
            <span>TRANSACTION HASH</span>
            <code data-testid="transaction-hash">{hash || "Computing…"}</code>
          </div>
          <div>
            <span>MERKLE ROOT · 4 DEMO TRANSACTIONS</span>
            <code>{root || "Computing…"}</code>
          </div>
          <div>
            <span>BLOCK #284 HEADER HASH · COMMITS TO THE MERKLE ROOT</span>
            <code data-testid="block-hash">{blockHash || "Computing…"}</code>
          </div>
          <div>
            <span>BLOCK #285 HEADER HASH · LINKS TO #284</span>
            <code data-testid="next-block-hash">{parent || "Computing…"}</code>
          </div>
        </div>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <p className="method-note">
        Teaching conventions: UTF-8 strings, a binary Merkle tree that hashes
        concatenated hexadecimal children (duplicating the last for odd levels),
        and SHA-256 hashes of minimal JSON block headers. Block #285 references
        the hash of #284, which commits to this Merkle root. Real protocols
        specify their own encodings and commitments. Changing data is
        detectable; consensus makes rewriting accepted history costly.
      </p>
    </section>
  );
}

export function Networks({ motion }: { motion: boolean }) {
  const [options, setOptions] = useState<NetworkOptions>(defaultNetwork);
  const [selected, setSelected] = useState(0);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sent, setSent] = useState(false);
  const sim = useMemo(() => simulateNetwork(options), [options]);
  const duration = Math.max(sim.total, 1);
  const update = (patch: Partial<NetworkOptions>) => {
    setOptions((v) => ({ ...v, ...patch }));
    setRunning(false);
    setElapsed(0);
    setSent(false);
  };
  useEffect(() => {
    if (!running) return;
    let frame = 0,
      last = performance.now();
    let value = elapsed;
    const tick = (now: number) => {
      value += Math.max(0, now - last) / 4;
      last = now;
      setElapsed(Math.min(value, duration));
      if (value >= duration) {
        setRunning(false);
      } else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, duration]);
  const received = sim.times.filter((t) => t <= elapsed).length;
  const p95Text =
    sim.reachable < options.nodes - sim.down.size
      ? "UNREACHABLE"
      : `${Math.round(sim.p95)} ms`;
  return (
    <div className="page">
      <PageHeading
        chapter="CHAPTER 02 / THE NETWORK LAB"
        title="News travels."
        accent="But how fast, and how far?"
        description="Send a message through a peer network. Change its shape, slow the links, or take nodes offline—and watch the consequences."
      >
        <Tag>
          <Radio size={12} />
          DETERMINISTIC NETWORK MODEL
        </Tag>
      </PageHeading>
      <div className="network-lab-grid">
        <div className="panel network-experiment">
          <PanelHeader title="THE PROPAGATION EXPERIMENT">
            <Tag>
              {sent
                ? running
                  ? "PROPAGATING"
                  : "BROADCAST COMPLETE"
                : "READY TO BROADCAST"}
            </Tag>
          </PanelHeader>
          <div className="network-scene">
            <Scene
              pattern="mesh"
              nodes={options.nodes}
              topology={options.topology}
              playing={motion && (!sent || running)}
              selected={selected}
              onSelect={setSelected}
              offline={sim.down}
              arrivals={sim.times}
              progress={sent ? elapsed : -1}
            />
            <div className="network-overlay">
              <span className="eyebrow">
                {options.topology.toUpperCase()} TOPOLOGY
              </span>
              <strong>
                {sent ? received : 0}
                <span> / {options.nodes}</span>
              </strong>
              <p>nodes reached</p>
            </div>
            <div className="scene-bottom">
              <div className="legend">
                <span>
                  <i className="green" />
                  Received
                </span>
                <span>
                  <i className="purple" />
                  Validator role
                </span>
                <span>
                  <i className="gray" />
                  Offline
                </span>
              </div>
              <span className="orbit-hint">Drag to orbit · Enter selects</span>
            </div>
          </div>
          <div className="network-controls">
            <button
              className="button primary"
              onClick={() => {
                setElapsed(0);
                setSent(true);
                setRunning(true);
              }}
            >
              <Send size={15} />
              {sent ? "Broadcast again" : "Broadcast a transaction"}
            </button>
            <button
              className="button secondary"
              disabled={!sent || elapsed >= duration}
              onClick={() => setRunning((v) => !v)}
            >
              {running ? <Pause size={14} /> : <Play size={14} />}{" "}
              {running ? "Pause" : "Resume"}
            </button>
            <span className="mono">
              {Math.round(elapsed)} / {Math.round(duration)} ms
            </span>
          </div>
          <div className="propagation-progress">
            <div
              style={{
                width: `${sent ? Math.min(100, (elapsed / duration) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
        <aside className="panel network-settings">
          <PanelHeader title="TURN THE DIALS">
            <button
              className="icon-button"
              aria-label="Reset network settings"
              onClick={() => {
                update(defaultNetwork);
                setSelected(0);
              }}
            >
              <RotateCcw size={14} />
            </button>
          </PanelHeader>
          <div className="settings-body">
            <span className="label">NETWORK SHAPE</span>
            <div className="segmented topology-buttons">
              {(["mesh", "ring", "hub"] as Topology[]).map((t) => (
                <button
                  key={t}
                  className={options.topology === t ? "active" : ""}
                  onClick={() => update({ topology: t })}
                >
                  {t === "mesh" ? "Mesh" : t === "ring" ? "Ring" : "Hub"}
                </button>
              ))}
            </div>
            <Range
              label="Nodes"
              value={options.nodes}
              unit="peers"
              min={8}
              max={32}
              onChange={(v) => {
                update({ nodes: v });
                setSelected(0);
              }}
            />
            <Range
              label="Link latency"
              value={options.latency}
              unit="ms"
              min={20}
              max={500}
              step={20}
              onChange={(v) => update({ latency: v })}
            />
            <Range
              label="Link bandwidth"
              value={options.bandwidth}
              unit="kbps"
              min={64}
              max={2048}
              step={64}
              onChange={(v) => update({ bandwidth: v })}
            />
            <Range
              label="Transaction size"
              value={options.payload}
              unit="bytes"
              min={256}
              max={8192}
              step={256}
              onChange={(v) => update({ payload: v })}
            />
            <Range
              label="Offline nodes"
              value={options.offline}
              unit="%"
              min={0}
              max={40}
              step={5}
              onChange={(v) => update({ offline: v })}
            />
            <p className="field-hint">
              Try a hub with 10% offline nodes. Removing the hub isolates
              otherwise healthy peers.
            </p>
          </div>
        </aside>
      </div>
      <div className="network-metrics panel">
        <Stat
          value={Math.round(sim.p50)}
          unit="ms"
          label="p50 among reachable nodes"
        />
        <Stat value={p95Text} label="p95 / active-network reachability" />
        <Stat
          value={`${sim.reachable}/${options.nodes - sim.down.size}`}
          label="Reachable / online nodes"
        />
        <Stat
          value={(sim.wireBytes / 1024).toFixed(1)}
          unit="KiB"
          label="Modeled bidirectional wire data"
        />
      </div>
      <section className="network-bottom-grid">
        <div className="panel">
          <PanelHeader title="PEER INSPECTOR">
            <Tag>NODE {String(selected + 1).padStart(2, "0")}</Tag>
          </PanelHeader>
          <div className="node-buttons" aria-label="Select a network node">
            {Array.from({ length: options.nodes }, (_, i) => (
              <button
                key={i}
                className={`${selected === i ? "active" : ""} ${sim.down.has(i) ? "offline" : ""}`}
                aria-label={`Inspect node ${i + 1}`}
                onClick={() => setSelected(i)}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="node-detail">
            <div>
              <span>STATUS</span>
              <strong>
                {sim.down.has(selected)
                  ? "Offline"
                  : !Number.isFinite(sim.times[selected])
                    ? "Isolated"
                    : sent && sim.times[selected] <= elapsed
                      ? "Message received"
                      : "Online · waiting"}
              </strong>
            </div>
            <div>
              <span>ARRIVAL TIME</span>
              <strong>
                {Number.isFinite(sim.times[selected])
                  ? `${Math.round(sim.times[selected])} ms`
                  : "Unreachable"}
              </strong>
            </div>
            <div>
              <span>FIRST RELAY</span>
              <strong>
                {selected === sim.source
                  ? "Source node"
                  : sim.parents[selected] < 0
                    ? "None"
                    : `Node ${sim.parents[selected] + 1}`}
              </strong>
            </div>
          </div>
        </div>
        <article className="panel network-explainer">
          <Eyebrow>WHAT YOU’RE SEEING</Eyebrow>
          <h3>
            Redundancy buys resilience.
            <br />
            <span>It spends bandwidth.</span>
          </h3>
          <p>
            A ring takes more hops. A hub uses fewer links but has a critical
            center. A mesh has alternate paths and more duplicate messages. A
            real peer network continually discovers, scores and replaces peers.
          </p>
          <SourceLink id="ethereum-network" />
        </article>
      </section>
      <details className="method-details">
        <summary>
          <CircleHelp size={16} />
          Open the model’s assumptions and formulas
        </summary>
        <div>
          <p>
            Each link takes{" "}
            <code>
              latency × deterministic jitter + payload bits / bandwidth
            </code>
            . A shortest-path, store-and-forward calculation determines first
            arrival. The source is the first online peer (normally node 1).
            Offline nodes are removed deterministically; in a hub, the hub fails
            first.
          </p>
          <p>
            p50 and p95 are percentiles over reachable nodes only, including the
            source at 0 ms. A separate “unreachable” label flags online nodes
            the source cannot reach. Wire traffic assumes one full payload in
            each direction over every edge in the source’s connected component;
            real gossip often sends hashes, deduplicates payloads and batches
            messages.
          </p>
          <p>
            There is no queueing, TCP/QUIC overhead, retransmission, packet
            loss, congestion control or adversarial behavior. Animation is
            slowed 4×; reported milliseconds are model time. This is not a
            measurement of Ethereum, Bitcoin or Internet latency.
          </p>
        </div>
      </details>
    </div>
  );
}

export function Compare({ motion }: { motion: boolean }) {
  const [a, setA] = useState("ethereum");
  const [b, setB] = useState("optimistic");
  const [size, setSize] = useState(512);
  const [demand, setDemand] = useState(500);
  const [layer, setLayer] = useState(0);
  const selected = [
    solutions.find((s) => s.id === a)!,
    solutions.find((s) => s.id === b)!,
  ];
  const metrics = selected.map((s) => workload(s, size, demand));
  const level = layers[layer];
  return (
    <div className="page">
      <PageHeading
        chapter="CHAPTER 03 / THE TRADE-OFFS"
        title="Faster isn’t the"
        accent="whole story."
        description="Compare how different designs move the bottleneck. Speed matters. So do settlement, trust, liquidity, and who can run a node."
      >
        <Tag>
          <Layers3 size={12} />6 SOLUTIONS · 6 LAYERS
        </Tag>
      </PageHeading>
      <section className="comparison-controls panel">
        <div>
          <Eyebrow>GIVE BOTH DESIGNS THE SAME WORKLOAD</Eyebrow>
          <h3>A fairer question than “which chain is fastest?”</h3>
          <p>
            Illustrative resource budgets. Not live TPS, measured benchmarks or
            investment advice.
          </p>
        </div>
        <Range
          label="Payload size"
          value={size}
          unit="bytes"
          min={256}
          max={4096}
          step={256}
          onChange={setSize}
        />
        <Range
          label="Incoming demand"
          value={demand}
          unit="tx/s"
          min={10}
          max={5000}
          step={10}
          onChange={setDemand}
        />
      </section>
      <section className="comparison-grid">
        {selected.map((s, i) => (
          <article
            key={i}
            className="panel solution-card"
            style={{ "--accent": s.color } as React.CSSProperties}
          >
            <div className="solution-select">
              <label htmlFor={`solution-${i}`}>
                SOLUTION {i === 0 ? "A" : "B"}
              </label>
              <select
                id={`solution-${i}`}
                value={s.id}
                onChange={(e) => (i === 0 ? setA : setB)(e.target.value)}
              >
                {solutions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="solution-art">
              <Scene pattern={s.pattern} playing={motion} color={s.color} />
              <div className="solution-badge">{s.short}</div>
              <Tag color={s.color}>{s.category}</Tag>
            </div>
            <div className="solution-result">
              <div>
                <Eyebrow>MODELED COMPLETED CALLS</Eyebrow>
                <strong data-testid={`throughput-${i}`}>
                  {metrics[i].served.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}
                  <small> tx/s</small>
                </strong>
              </div>
              <span
                className={
                  metrics[i].saturated ? "capacity-warning" : "capacity-ok"
                }
              >
                {metrics[i].saturated ? "Capacity reached" : "Demand served"}
              </span>
            </div>
            <div className="capacity-bar">
              <div
                style={{
                  width: `${Math.max(1, (metrics[i].served / demand) * 100)}%`,
                  background: s.color,
                }}
              />
            </div>
            <div className="result-stats">
              <div>
                <span>ASSUMED CEILING</span>
                <strong>
                  {metrics[i].capacity.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}{" "}
                  calls/s
                </strong>
              </div>
              <div>
                <span>BACKLOG AFTER 60s</span>
                <strong>
                  {Math.ceil(metrics[i].backlog).toLocaleString()} calls
                </strong>
              </div>
            </div>
            <p className="assumption-text">{s.reason}</p>
            <SourceLink id={s.source} />
          </article>
        ))}
      </section>
      <section className="comparison-table-wrap panel">
        <PanelHeader title="THE THINGS A TPS NUMBER CAN’T TELL YOU" />
        <table className="comparison-table">
          <thead>
            <tr>
              <th scope="col">Dimension</th>
              {selected.map((s, i) => (
                <th scope="col" key={i} style={{ color: s.color }}>
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(
              ["cadence", "finality", "trust", "bottleneck", "fee"] as const
            ).map((key) => (
              <tr key={key}>
                <th scope="row">
                  {
                    {
                      cadence: "Block / update cadence",
                      finality: "Settlement assurance",
                      trust: "Trust & security",
                      bottleneck: "Main constraint",
                      fee: "What drives fees",
                    }[key]
                  }
                </th>
                {selected.map((s, i) => (
                  <td key={i}>{s[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <details className="method-details">
        <summary>
          <CircleHelp size={16} />
          Read the performance model before interpreting the bars
        </summary>
        <div>
          <p>
            <code>
              capacity = min(byte budget / payload size, execution ceiling)
            </code>
            . Completed throughput is the smaller of demand and capacity;
            backlog grows by <code>(demand − completed) × 60</code> during a
            60-second interval. A flat line as payload grows means the execution
            ceiling is still the bottleneck.
          </p>
          <p>
            Each solution card discloses its fixed teaching assumptions. These
            budgets are intentionally illustrative, not comparable real-world
            benchmark results. Transaction semantics differ across UTXO spends,
            contract calls and channel updates. Fees, hardware, network votes,
            gas per call, proving delay, liquidity failures and contention are
            not simulated. A fast receipt does not imply base-layer finality.
          </p>
        </div>
      </details>
      <section className="layer-section">
        <div className="section-heading">
          <div>
            <Eyebrow>ZOOM OUT / SIX LEVELS OF THE PROBLEM</Eyebrow>
            <h2>
              Every solution <span>moves a constraint.</span>
            </h2>
          </div>
        </div>
        <div className="layer-layout panel">
          <div
            className="layer-nav"
            role="tablist"
            aria-label="System design layers"
          >
            {layers.map((l, i) => (
              <button
                key={l.name}
                role="tab"
                aria-selected={layer === i}
                aria-controls={`layer-${i}`}
                id={`layer-tab-${i}`}
                onClick={() => setLayer(i)}
              >
                <span>{l.number}</span>
                {l.name}
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
          <article
            className="layer-content"
            role="tabpanel"
            id={`layer-${layer}`}
            aria-labelledby={`layer-tab-${layer}`}
          >
            <Eyebrow>
              LEVEL {level.number} / {level.name.toUpperCase()}
            </Eyebrow>
            <h3>{level.problem}</h3>
            <div className="layer-requirement">
              <ShieldCheck size={18} />
              <div>
                <span>REQUIREMENT</span>
                <p>{level.requirement}</p>
              </div>
            </div>
            <div className="two-notes">
              <div>
                <h4>How we solve it</h4>
                <p>{level.solutions}</p>
              </div>
              <div>
                <h4>The price we pay</h4>
                <p>{level.cost}</p>
              </div>
            </div>
            <div className="layer-bottom">
              <span>{level.metric}</span>
              <SourceLink id={level.source} />
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
