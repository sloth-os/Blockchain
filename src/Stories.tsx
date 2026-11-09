import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Coins,
  Globe2,
  Pause,
  Play,
  ShieldCheck,
  Users,
} from "lucide-react";
import Scene from "./Scene";
import { applications, researchDate, topics } from "./content";
import {
  Eyebrow,
  PageHeading,
  PanelHeader,
  SourceLink,
  Tag,
} from "./components";
import type { Navigate } from "./App";

export function Applications({
  motion,
  activeId,
  navigate,
}: {
  motion: boolean;
  activeId?: string;
  navigate: Navigate;
}) {
  const [category, setCategory] = useState("All");
  const [step, setStep] = useState(0);
  const app = applications.find((a) => a.id === activeId) ?? applications[1];
  const appIndex = applications.findIndex((a) => a.id === app.id);
  const filtered = applications.filter(
    (a) => category === "All" || a.category === category,
  );
  useEffect(() => setStep(0), [app.id]);
  const choose = (id: string) => {
    navigate("applications", id);
    document.getElementById("application-detail")?.scrollIntoView({
      behavior: motion ? "smooth" : "instant",
      block: "start",
    });
  };
  return (
    <div className="page">
      <PageHeading
        chapter="CHAPTER 04 / BLOCKCHAIN IN THE REAL WORLD"
        title="Code meets"
        accent="people. And economies."
        description="Ten real applications, from peer-to-peer money to humanitarian aid. Follow how data and value move—and where trust still lives."
      >
        <Tag>
          <Globe2 size={12} />
          10 APPLICATIONS · REAL ORGANIZATIONS
        </Tag>
      </PageHeading>
      <section
        className="app-story panel"
        id="application-detail"
        style={{ "--accent": app.color } as React.CSSProperties}
      >
        <div className="app-art">
          <PanelHeader
            title={`${String(appIndex + 1).padStart(2, "0")} / 10 APPLICATIONS`}
          >
            <Tag color={app.color}>{app.category}</Tag>
          </PanelHeader>
          <div className="app-scene">
            <Scene pattern={app.pattern} color={app.color} playing={motion} />
            <div className="app-mark" style={{ color: app.color }}>
              {app.mark}
            </div>
          </div>
          <div className="app-identity">
            <span
              className="app-logo"
              style={{ color: app.color, background: `${app.color}10` }}
            >
              {app.mark}
            </span>
            <div>
              <Eyebrow>IN THE REAL WORLD</Eyebrow>
              <h2>{app.name}</h2>
            </div>
            <a
              href="#application-gallery"
              className="icon-button"
              aria-label="Browse all ten applications"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("application-gallery")
                  ?.scrollIntoView({ behavior: motion ? "smooth" : "instant" });
              }}
            >
              <ArrowDown size={18} />
            </a>
          </div>
          <div className="app-art-caption">
            <span className="live-dot" />
            CONCEPTUAL FLOW · NO LIVE TRANSACTIONS
          </div>
        </div>
        <article className="app-story-body">
          <Eyebrow>HOW IT WORKS, END TO END</Eyebrow>
          <h2>{app.headline}</h2>
          <p className="story-summary">{app.summary}</p>
          <ol className="interactive-flow">
            {app.flow.map(([title, text], i) => (
              <li key={title} className={step === i ? "active" : ""}>
                <button onClick={() => setStep(i)} aria-expanded={step === i}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <ChevronRight size={15} />
                </button>
                {step === i && <p>{text}</p>}
              </li>
            ))}
          </ol>
          <div className="app-flow-footer">
            <span>{step + 1} / 4 · Follow the value</span>
            <button
              className="text-button"
              onClick={() => setStep((v) => (v + 1) % 4)}
            >
              {step === 3 ? "Replay the flow" : "Next stage"}
              <ArrowRight size={14} />
            </button>
          </div>
          <SourceLink id={app.source} />
        </article>
      </section>
      <section className="reality-grid">
        <article className="panel reality-card">
          <Users size={21} />
          <Eyebrow>WHO PARTICIPATES</Eyebrow>
          <h3>The humans and institutions</h3>
          <p>{app.actors}</p>
        </article>
        <article className="panel reality-card">
          <Coins size={21} />
          <Eyebrow>HOW VALUE MOVES</Eyebrow>
          <h3>The economic engine</h3>
          <p>{app.economy}</p>
        </article>
        <article className="panel reality-card">
          <ShieldCheck size={21} />
          <Eyebrow>WHAT CAN GO WRONG</Eyebrow>
          <h3>The remaining risks</h3>
          <p>{app.risks}</p>
        </article>
      </section>
      <aside className="boundary-note">
        <CircleHelp size={20} />
        <div>
          <h3>The boundary between the chain and the world</h3>
          <p>{app.boundary}</p>
        </div>
      </aside>
      <section id="application-gallery" className="application-gallery">
        <div className="section-heading">
          <div>
            <Eyebrow>10 WAYS A SHARED LEDGER BECOMES USEFUL</Eyebrow>
            <h2>
              Pick a story. <span>Follow the connections.</span>
            </h2>
          </div>
          <span className="mono">{filtered.length} / 10 STORIES</span>
        </div>
        <div
          className="filter-chips"
          role="group"
          aria-label="Filter applications by category"
        >
          {[
            "All",
            "Money",
            "Finance",
            "Ownership",
            "Identity",
            "Infrastructure",
            "Public good",
          ].map((c) => (
            <button
              key={c}
              className={category === c ? "active" : ""}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
              {c === "All" && <span>10</span>}
            </button>
          ))}
        </div>
        <div className="application-grid">
          {filtered.map((a) => (
            <button
              key={a.id}
              className={`application-card panel ${app.id === a.id ? "selected" : ""}`}
              onClick={() => choose(a.id)}
              style={{ "--accent": a.color } as React.CSSProperties}
            >
              <div className="application-card-top">
                <span
                  className="app-logo"
                  style={{ color: a.color, background: `${a.color}12` }}
                >
                  {a.mark}
                </span>
                <Tag>{a.category}</Tag>
                <ArrowUpRight size={17} />
              </div>
              <h3>{a.name}</h3>
              <p>{a.summary}</p>
              <div className="application-card-bottom">
                Explore the mechanism
                {app.id === a.id ? (
                  <Check size={15} />
                ) : (
                  <ArrowRight size={15} />
                )}
              </div>
            </button>
          ))}
        </div>
      </section>
      <p className="method-note">
        Examples describe mechanisms, not endorsements or promises of returns.
        Products, supported chains and legal terms evolve. Follow the primary
        source for current operational details.
      </p>
    </div>
  );
}

export function Signals({
  motion,
  activeId,
  navigate,
}: {
  motion: boolean;
  activeId?: string;
  navigate: Navigate;
}) {
  const topic = topics.find((t) => t.id === activeId) ?? topics[0];
  const index = topics.findIndex((t) => t.id === topic.id);
  const [animate, setAnimate] = useState(true);
  const [auto, setAuto] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => setStep(0), [topic.id]);
  useEffect(() => {
    if (!motion || !animate) return;
    const timer = setInterval(() => setStep((v) => (v + 1) % 4), 2600);
    return () => clearInterval(timer);
  }, [motion, animate, topic.id]);
  useEffect(() => {
    if (!auto || !motion) return;
    const timer = setTimeout(
      () => navigate("signals", topics[(index + 1) % 10].id),
      14000,
    );
    return () => clearTimeout(timer);
  }, [auto, motion, index, navigate]);
  return (
    <div className="page signals-page">
      <PageHeading
        chapter="CHAPTER 05 / THE SIGNAL OBSERVATORY"
        title="The next block"
        accent="starts with a question."
        description="Ten hot issues, animated and unpacked. Explore the mechanisms behind the headlines—and the trade-offs that don’t fit in them."
      >
        <div className="research-stamp">
          <span className="live-dot" />
          RESEARCH SNAPSHOT
          <span>{researchDate.toUpperCase()} · EDITORIAL TOP 10</span>
        </div>
      </PageHeading>
      <div className="observatory-grid">
        <nav className="topic-list panel" aria-label="Ten hot issues">
          <PanelHeader title="10 FAULT LINES TO UNDERSTAND" />
          {topics.map((t, i) => (
            <button
              key={t.id}
              className={topic.id === t.id ? "active" : ""}
              aria-current={topic.id === t.id ? "true" : undefined}
              onClick={() => {
                navigate("signals", t.id);
                setAuto(false);
              }}
            >
              <span className="topic-rank">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <span>{t.tag}</span>
                <h3>{t.title}</h3>
              </div>
              <ArrowUpRight size={16} />
            </button>
          ))}
        </nav>
        <div
          className="topic-stage panel"
          style={{ "--accent": topic.color } as React.CSSProperties}
        >
          <PanelHeader
            number={String(index + 1).padStart(2, "0")}
            title={topic.tag}
          >
            <button
              className="icon-button"
              aria-label={
                animate ? "Pause issue animation" : "Play issue animation"
              }
              onClick={() => setAnimate((v) => !v)}
            >
              {animate ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <Tag color={topic.color}>3D EXPLAINER</Tag>
          </PanelHeader>
          <div className="topic-scene">
            <Scene
              pattern={topic.pattern}
              color={topic.color}
              playing={motion && animate}
            />
            <div className="topic-scene-caption">
              <span>THE MECHANISM</span>
              <h2>{topic.title}</h2>
            </div>
            <span className="topic-watermark" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <div className="mechanism-steps" aria-label="Mechanism steps">
            {topic.mechanism.map((m, i) => (
              <button
                key={m}
                className={step === i ? "active" : ""}
                aria-pressed={step === i}
                onClick={() => {
                  setStep(i);
                  setAnimate(false);
                }}
              >
                <span>{i + 1}</span>
                <p>{m}</p>
              </button>
            ))}
          </div>
          <div className="topic-stage-controls">
            <button
              className="text-button"
              onClick={() => {
                navigate("signals", topics[(index + 9) % 10].id);
                setAuto(false);
              }}
            >
              <ChevronLeft size={15} />
              Previous
            </button>
            <button
              className="text-button"
              aria-pressed={auto}
              disabled={!motion}
              onClick={() => setAuto((v) => !v)}
            >
              {auto ? <Pause size={13} /> : <Play size={13} />}{" "}
              {auto ? "Pause topic tour" : "Auto-tour topics"}
            </button>
            <button
              className="text-button"
              onClick={() => {
                navigate("signals", topics[(index + 1) % 10].id);
                setAuto(false);
              }}
            >
              Next issue
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
      <article className="topic-deep-dive">
        <div>
          <Eyebrow>THE QUESTION THAT MATTERS</Eyebrow>
          <h2>{topic.question}</h2>
          <p>{topic.body}</p>
          <div className="topic-sources">
            {topic.sources.map((s) => (
              <SourceLink key={s} id={s} />
            ))}
          </div>
        </div>
        <aside className="topic-context">
          <div>
            <span className="context-icon">
              <Building2 size={18} />
            </span>
            <div>
              <Eyebrow>THE TRADE-OFF</Eyebrow>
              <p>{topic.tradeoff}</p>
            </div>
          </div>
          <div>
            <span className="context-icon">
              <Globe2 size={18} />
            </span>
            <div>
              <Eyebrow>WHAT TO WATCH</Eyebrow>
              <p>{topic.watch}</p>
            </div>
          </div>
        </aside>
      </article>
      <div className="editorial-note">
        <CircleHelp size={17} />
        <p>
          “Top 10” is our curated learning agenda, not a live news feed or
          measured trend ranking. The sequence is editorial. Primary
          documentation was accessed {researchDate}; dated publications retain
          their original dates. These animations illustrate mechanisms, not real
          network activity or predictions.
        </p>
      </div>
    </div>
  );
}
