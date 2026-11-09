import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Box,
  Check,
  CircleDot,
  Code2,
  Compass,
  ExternalLink,
  GitBranch,
  Globe2,
  Layers3,
  Menu,
  MoveUpRight,
  Network,
  Pause,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Scene from "./Scene";
import {
  applications,
  glossary,
  researchDate,
  sources,
  topics,
} from "./content";
import { defaultNetwork, simulateNetwork } from "./models";
import {
  Dialog,
  Eyebrow,
  PanelHeader,
  SourceLink,
  Stat,
  Tag,
} from "./components";
import { Applications, Compare, Journey, Networks, Signals } from "./Pages";

export type Route =
  "explore" | "journey" | "networks" | "compare" | "applications" | "signals";
export type Navigate = (route: Route, id?: string) => void;
const nav: { id: Route; label: string }[] = [
  { id: "explore", label: "Overview" },
  { id: "journey", label: "Transaction lab" },
  { id: "networks", label: "Network lab" },
  { id: "compare", label: "The trade-offs" },
  { id: "applications", label: "Real world" },
  { id: "signals", label: "Hot topics" },
];
const currentPath = () => window.location.hash.replace(/^#\/?/, "").split("/");

export default function App() {
  const [path, setPath] = useState(currentPath);
  const route: Route = nav.some((n) => n.id === path[0])
    ? (path[0] as Route)
    : "explore";
  const [motion, setMotion] = useState(() => {
    try {
      const saved = localStorage.getItem("atlas-motion");
      return saved === null
        ? !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : saved === "true";
    } catch {
      return false;
    }
  });
  const [mobileMenu, setMobileMenu] = useState(false);
  const [overlay, setOverlay] = useState<"search" | "sources" | null>(null);
  const [query, setQuery] = useState("");
  const navigate: Navigate = (r, id) => {
    window.location.hash = `/${r}${id ? `/${encodeURIComponent(id)}` : ""}`;
    setMobileMenu(false);
    setOverlay(null);
  };
  useEffect(() => {
    const update = () => setPath(currentPath());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.title = `${nav.find((n) => n.id === route)?.label} — Chain Atlas`;
  }, [route]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOverlay((v) => (v === "search" ? null : "search"));
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const toggleMotion = () =>
    setMotion((v) => {
      try {
        localStorage.setItem("atlas-motion", String(!v));
      } catch {
        /* Storage is optional. */
      }
      return !v;
    });
  const results = useMemo(() => {
    const rows = [
      ...nav.map((n) => ({
        title: n.label,
        text: "Explore this chapter",
        route: n.id,
        id: undefined as string | undefined,
        kind: "Chapter",
      })),
      ...glossary.map((g) => ({
        title: g.term,
        text: g.definition,
        route: g.route as Route,
        id: g.id,
        kind: "Concept",
      })),
      ...applications.map((a) => ({
        title: a.name,
        text: a.summary,
        route: "applications" as Route,
        id: a.id,
        kind: "Application",
      })),
      ...topics.map((t) => ({
        title: t.title,
        text: t.question,
        route: "signals" as Route,
        id: t.id,
        kind: "Hot topic",
      })),
    ];
    const q = query.toLowerCase().trim();
    return rows.filter(
      (r) => !q || `${r.title} ${r.text} ${r.kind}`.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className={`app ${motion ? "" : "motion-paused"}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#/explore" aria-label="Chain Atlas home">
          <span className="brand-symbol">
            <Box size={24} strokeWidth={1.8} />
          </span>
          <span>
            chain<span className="brand-light">atlas</span>
            <sup>®</sup>
          </span>
        </a>
        <span className="header-divider" />
        <nav
          aria-label="Main navigation"
          className={mobileMenu ? "nav-open" : ""}
        >
          {nav.map((n) => (
            <a
              key={n.id}
              href={`#/${n.id}`}
              className={route === n.id ? "active" : ""}
              aria-current={route === n.id ? "page" : undefined}
              onClick={() => setMobileMenu(false)}
            >
              {n.label}
              {n.id === "signals" && <span className="nav-count">10</span>}
            </a>
          ))}
        </nav>
        <div className="header-tools">
          <button
            className="search-trigger"
            aria-label="Search the atlas"
            onClick={() => {
              setOverlay("search");
              setQuery("");
            }}
          >
            <Search size={16} />
            <kbd>⌘ K</kbd>
          </button>
          <button
            className="icon-button motion-toggle"
            aria-label={motion ? "Pause animations" : "Enable animations"}
            title={motion ? "Pause animations" : "Enable animations"}
            onClick={toggleMotion}
          >
            {motion ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <a
            className="github-link"
            href="https://github.com/sloth-os/Blockchain"
            target="_blank"
            rel="noreferrer"
            aria-label="View project on GitHub"
          >
            <Code2 size={18} />
          </a>
          <button
            className="menu-toggle icon-button"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenu}
            onClick={() => setMobileMenu((v) => !v)}
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} key={route}>
        {route === "explore" && (
          <Overview
            navigate={navigate}
            motion={motion}
            toggleMotion={toggleMotion}
          />
        )}
        {route === "journey" && <Journey motion={motion} />}
        {route === "networks" && <Networks motion={motion} />}
        {route === "compare" && <Compare motion={motion} />}
        {route === "applications" && (
          <Applications
            motion={motion}
            activeId={path[1]}
            navigate={navigate}
          />
        )}
        {route === "signals" && (
          <Signals motion={motion} activeId={path[1]} navigate={navigate} />
        )}
      </main>
      <footer className="site-footer">
        <a className="footer-wordmark" href="#/explore">
          <Box size={17} />
          chainatlas<span>A field guide to shared trust.</span>
        </a>
        <div>
          <span className="footer-dot" />
          Built for curiosity. No wallet required.
        </div>
        <button onClick={() => setOverlay("sources")}>
          <BookOpen size={14} />
          Research & sources
          <ArrowUpRight size={13} />
        </button>
      </footer>
      {overlay === "search" && (
        <Dialog
          title="Search the atlas"
          onClose={() => setOverlay(null)}
          className="search-dialog"
        >
          <div className="search-input">
            <Search size={20} />
            <input
              autoFocus
              placeholder="Try “finality”, “stablecoin” or “MEV”…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search concepts, applications and topics"
            />
            <kbd>ESC</kbd>
          </div>
          <div className="search-results">
            {results.length ? (
              results.slice(0, 30).map((r) => (
                <button
                  key={`${r.kind}-${r.title}`}
                  onClick={() => navigate(r.route, r.id)}
                >
                  <div>
                    <Tag>{r.kind}</Tag>
                    <h3>{r.title}</h3>
                    <p>{r.text}</p>
                  </div>
                  <ArrowUpRight size={18} />
                </button>
              ))
            ) : (
              <div className="empty-state">
                No matches. Try “network”, “wallet” or “Bitcoin”.
              </div>
            )}
          </div>
          <div className="dialog-footnote">
            {results.length} results · Select a result to explore its chapter.
          </div>
        </Dialog>
      )}
      {overlay === "sources" && (
        <Dialog title="Research & field notes" onClose={() => setOverlay(null)}>
          <p className="dialog-intro">
            Primary protocol documentation, standards and organization
            publications. Accessed {researchDate}. The hot topics are an
            editorial selection, not a measured popularity ranking. Vendor
            sources explain their own systems and are not independent
            performance audits.
          </p>
          <div className="sources-list">
            {Object.entries(sources).map(([id, s], i) => (
              <a key={id} href={s.url} target="_blank" rel="noreferrer">
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.publisher}</p>
                </div>
                <ExternalLink size={16} />
              </a>
            ))}
          </div>
          <p className="dialog-footnote">
            All traffic, balances and performance experiments in this atlas are
            local teaching models. No live network connections or real funds.
          </p>
        </Dialog>
      )}
    </div>
  );
}

function Overview({
  navigate,
  motion,
  toggleMotion,
}: {
  navigate: Navigate;
  motion: boolean;
  toggleMotion: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [block, setBlock] = useState<number | null>(null);
  const net = simulateNetwork(defaultNetwork);
  const cards = [
    {
      icon: GitBranch,
      number: "01",
      label: "FOLLOW A TRANSACTION",
      title: "From “send” to settled.",
      desc: "Sign it. Broadcast it. Find its place in history.",
      route: "journey" as Route,
      className: "card-green",
    },
    {
      icon: Layers3,
      number: "02",
      label: "EXPLORE THE TRADE-OFFS",
      title: "There’s no free block.",
      desc: "Speed, security, cost. Turn the dials yourself.",
      route: "compare" as Route,
      className: "card-purple",
    },
    {
      icon: Globe2,
      number: "03",
      label: "CONNECT TO THE REAL WORLD",
      title: "Beyond the buzzwords.",
      desc: "10 applications. The people and economics behind them.",
      route: "applications" as Route,
      className: "card-blue",
    },
  ];
  return (
    <div className="page overview-page">
      <section className="hero">
        <div>
          <Eyebrow>
            <span className="tiny-square" />
            THE INTERACTIVE BLOCKCHAIN ATLAS
          </Eyebrow>
          <h1>
            Trust is built.
            <br />
            <span>Block by block.</span>
            <span className="hero-asterisk">✳</span>
          </h1>
          <p>
            A shared ledger. A world of possibilities. Go beneath the surface
            <br className="desktop-break" /> and discover how blockchain
            actually works.
          </p>
        </div>
        <div className="hero-aside">
          <div className="edition-label">
            <span className="live-dot" />
            OPEN TO EVERYONE · BUILT TO EXPLORE
          </div>
          <p>
            Less abstract.
            <br />
            More <span>“oh, I get it.”</span>
          </p>
          <button className="text-button" onClick={() => navigate("journey")}>
            Start with one transaction
            <ArrowUpRight size={18} />
          </button>
          <div className="hero-coordinate">
            01 — 06{" "}
            <span>
              SCROLL TO DISCOVER
              <ArrowDown size={11} />
            </span>
          </div>
        </div>
      </section>
      <section
        className="overview-grid"
        aria-label="Interactive network overview"
      >
        <div className="network-card panel">
          <PanelHeader number="01" title="THE LIVING LEDGER">
            <span className="simulation-pill">
              <span className={motion ? "live-dot" : "quiet-dot"} />
              {motion ? "SIMULATION RUNNING" : "MOTION PAUSED"}
            </span>
            <button
              className="icon-button"
              onClick={toggleMotion}
              aria-label={
                motion ? "Pause network animation" : "Play network animation"
              }
            >
              {motion ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              className="icon-button"
              onClick={() => navigate("networks")}
              aria-label="Open full network lab"
            >
              <MoveUpRight size={16} />
            </button>
          </PanelHeader>
          <div className="overview-scene">
            <div className="scene-coordinate">
              P2P NETWORK <span>18 NODES / DISTRIBUTED</span>
            </div>
            <Scene
              playing={motion}
              selected={selected}
              onSelect={(n) => {
                setSelected(n);
                setBlock(null);
              }}
            />
            <div className="scene-side-label">NO CENTRAL AUTHORITY</div>
            <div className="scene-bottom">
              <div className="legend">
                <span>
                  <i className="green" />
                  Peer node
                </span>
                <span>
                  <i className="purple" />
                  Validator role
                </span>
                <span>
                  <i className="packet" />
                  Data packet
                </span>
              </div>
              <span className="orbit-hint">
                <Compass size={12} />
                Drag to orbit · Select a node
              </span>
            </div>
          </div>
          <div className="ledger-strip">
            <div className="ledger-label">
              <GitBranch size={15} />
              <div>
                THE BLOCKCHAIN<span>ILLUSTRATIVE HEADERS</span>
              </div>
            </div>
            {[282, 283, 284].map((n, i) => (
              <div className="ledger-item" key={n}>
                <button
                  className={block === n ? "selected" : ""}
                  onClick={() => {
                    setBlock(n);
                    setSelected(null);
                  }}
                >
                  <Box size={16} />
                  <div>
                    Block #{n}
                    <span>{["a82f…9c41", "4f1b…e8d2", "7dc9…3a06"][i]}</span>
                  </div>
                  <Check size={12} />
                </button>
                {i < 2 && <span className="chain-connector" />}
              </div>
            ))}
            <span className="ledger-ellipsis">···</span>
          </div>
        </div>
        <aside className="insight-panel panel">
          <PanelHeader
            title={
              selected !== null
                ? "NODE INSPECTOR"
                : block !== null
                  ? "BLOCK INSPECTOR"
                  : "A LOOK UNDER THE HOOD"
            }
          >
            <CircleDot size={14} />
          </PanelHeader>
          <div className="insight-body">
            <div className="insight-icon">
              {selected !== null ? (
                <Network />
              ) : block !== null ? (
                <Box />
              ) : (
                <Network />
              )}
              <span className="icon-orbit" />
            </div>
            <Eyebrow>
              {selected !== null
                ? `PEER N${String(selected + 1).padStart(2, "0")}`
                : block !== null
                  ? `BLOCK #${block}`
                  : "MANY COMPUTERS. ONE SHARED STORY."}
            </Eyebrow>
            <h2>
              {selected !== null ? (
                <>
                  A witness.
                  <br />
                  <span>And a verifier.</span>
                </>
              ) : block !== null ? (
                <>
                  A fingerprint
                  <br />
                  <span>of history.</span>
                </>
              ) : (
                <>
                  A network.
                  <br />
                  <span>Not a middleman.</span>
                </>
              )}
            </h2>
            <p>
              {selected !== null
                ? `This simulated ${selected % 3 === 0 ? "validator-role" : "peer"} node maintains its own view and checks messages against the same rules. Colored roles are schematic; actual validator/miner duties depend on the protocol.`
                : block !== null
                  ? `Header #${block} references its parent’s hash and commits to its contents. Editing a past block changes its hash, breaking the expected links. Consensus determines which valid history nodes accept.`
                  : "Instead of one company keeping the record, independent computers exchange, verify and agree on a shared history."}
            </p>
            <div className="insight-stats">
              <Stat
                value={
                  selected !== null
                    ? net.edges.filter(
                        ([a, b]) => a === selected || b === selected,
                      ).length
                    : block !== null
                      ? block - 1
                      : 18
                }
                label={
                  selected !== null
                    ? "Peer connections"
                    : block !== null
                      ? "Parent block"
                      : "Connected peers"
                }
              />
              <Stat
                value={
                  selected !== null
                    ? "Local"
                    : block !== null
                      ? "SHA"
                      : net.edges.length
                }
                unit={block !== null ? "256" : undefined}
                label={
                  selected !== null
                    ? "Verification"
                    : block !== null
                      ? "Demo hash family"
                      : "Peer links"
                }
              />
            </div>
            <button
              className="button primary full-width"
              onClick={() =>
                navigate(selected !== null ? "networks" : "journey")
              }
            >
              {selected !== null
                ? "Experiment with the network"
                : "Trace a transaction"}
              <ArrowRight size={16} />
            </button>
            <div className="safe-note">
              <ShieldCheck size={12} />A safe sandbox. No wallet. No real funds.
            </div>
          </div>
        </aside>
      </section>
      <div className="section-heading">
        <div>
          <Eyebrow>CHOOSE YOUR NEXT DISCOVERY</Eyebrow>
          <h2>
            Big ideas. <span>Small aha moments.</span>
          </h2>
        </div>
        <span className="section-note">
          <Sparkles size={14} />
          LEARN BY DOING
        </span>
      </div>
      <section className="chapter-grid">
        {cards.map((c) => (
          <button
            key={c.number}
            className={`chapter-card ${c.className}`}
            onClick={() => navigate(c.route)}
          >
            <div className="chapter-top">
              <div className="chapter-icon">
                <c.icon size={21} />
              </div>
              <span>{c.number} /</span>
              <ArrowUpRight size={19} />
            </div>
            <div className="chapter-label">{c.label}</div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </button>
        ))}
      </section>
      <section className="signal-banner">
        <div className="banner-orb" aria-hidden="true">
          <div />
          <div />
          <span>
            <ArrowUpRight size={28} />
          </span>
        </div>
        <div>
          <Eyebrow>THE NEXT BLOCK</Eyebrow>
          <h2>The questions shaping what comes next.</h2>
          <p>
            Scaling, stablecoins, privacy, and seven more fault lines worth
            understanding.
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() => navigate("signals")}
        >
          Explore 10 hot topics
          <ArrowUpRight size={16} />
        </button>
      </section>
      <div className="overview-footnote">
        <span>Curiosity has no prerequisites.</span>
        <span>
          Start with the model. Follow the sources. Question the trade-offs.
          <SourceLink id="bitcoin" />
        </span>
      </div>
    </div>
  );
}
