import { useEffect, useMemo, useRef, useState } from "react";
import { applications, topics } from "./content";
import {
  defaultNetwork,
  linkedDemoHeaders,
  merkleLevels,
  signTransaction,
  simulateNetwork,
  solutions,
  verifyTransaction,
  workload,
  type DemoTransaction,
  type NetworkOptions,
} from "./models";
import { protocolStory, type SpatialObject, type Point3 } from "./spatial";
import {
  applicationIssue,
  areaOrder,
  areas,
  buildAtlas,
  legacyFocus,
  type Area,
} from "./atlas";
import type { CameraMode, SceneLens } from "./Scene";

export function useAtlas() {
  const initial = useMemo(() => legacyFocus(location.hash), []);
  const [area, setArea] = useState<Area>(initial.area);
  const [overview, setOverview] = useState(false);
  const [panel, setPanel] = useState<"tools" | "inspect" | "notes" | null>(
    initial.area === "transaction" ? null : "tools",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [motion, setMotion] = useState(() => {
    try {
      const value = localStorage.getItem("atlas-motion");
      return value === null
        ? !matchMedia("(prefers-reduced-motion: reduce)").matches
        : value === "true";
    } catch {
      return false;
    }
  });
  const [view, setView] = useState<CameraMode>(
    initial.area === "transaction" ? "follow" : "map",
  );
  const [lens, setLens] = useState<SceneLens>("data");
  const [resetKey, setResetKey] = useState(0);
  const [overlay, setOverlay] = useState<"search" | "sources" | "help" | null>(
    null,
  );
  const sheetQuery =
    "(max-width: 699px), (max-width: 899px) and (min-height: 600px)";
  const [mobile, setMobile] = useState(matchMedia(sheetQuery).matches);
  useEffect(() => {
    const media = matchMedia(sheetQuery);
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const [amount, setAmountState] = useState("2.5");
  const [recipient, setRecipientState] = useState("maya.atlas");
  const [tx, setTx] = useState<DemoTransaction | null>(null);
  const [tree, setTree] = useState<string[][]>([]);
  const [headerHash, setHeaderHash] = useState("");
  const [tampered, setTampered] = useState(false);
  const [valid, setValid] = useState<boolean | null>(null);
  const [cryptoError, setCryptoError] = useState("");
  const [head, setHead] = useState(0);
  const [txRun, setTxRun] = useState(motion);
  const [speed, setSpeed] = useState(1);
  const [dataView, setDataView] = useState<"payload" | "bytes" | "signature">(
    "payload",
  );
  const amountValid = Number(amount) >= 0.01 && Number(amount) <= 1000;
  const maxTxStep =
    !amountValid || (!tx && !cryptoError) ? 0 : tampered ? 3 : 6;
  useEffect(() => {
    let cancelled = false;
    setTx(null);
    setValid(null);
    setTree([]);
    setHeaderHash("");
    setCryptoError("");
    if (!amountValid) return;
    signTransaction(amount, recipient)
      .then(async (transaction) => {
        const levels = await merkleLevels([
          transaction.payload,
          "Sam pays Lee 1 ATLAS",
          "Lee pays Alex 4 ATLAS",
          "Maya pays Sam 3 ATLAS",
        ]);
        const header = await linkedDemoHeaders(levels.at(-1)![0]);
        if (!cancelled) {
          setTx(transaction);
          setTree(levels);
          setHeaderHash(header.currentHash);
        }
      })
      .catch(() => {
        if (!cancelled)
          setCryptoError(
            "Local cryptography requires a modern browser on HTTPS or localhost. The explanatory atlas is still available.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [amount, recipient, amountValid]);
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
            setCryptoError(
              "Signature verification is unavailable in this browser.",
            );
        });
    return () => {
      cancelled = true;
    };
  }, [tx, tampered]);
  const txStep = Math.min(6, Math.floor(head * 7));
  const root = tree.at(-1)?.[0];
  const protocol = useMemo(
    () =>
      protocolStory({
        tx,
        amount,
        recipient,
        tree,
        root,
        headerHash,
        verified: valid,
        rejected: tampered && valid === false,
      }),
    [tx, amount, recipient, tree, root, headerHash, valid, tampered],
  );
  const receivedPayload = tx
    ? tampered
      ? JSON.stringify({ ...JSON.parse(tx.payload), amount: 999999 })
      : tx.payload
    : "";
  const resetDraft = () => {
    setHead(0);
    setTxRun(false);
    setTampered(false);
    setSelectedId(null);
  };
  const setAmount = (value: string) => {
    setAmountState(value);
    resetDraft();
  };
  const setRecipient = (value: string) => {
    setRecipientState(value);
    resetDraft();
  };
  const jumpTx = (step: number) => {
    if (Math.floor(step) > maxTxStep) return;
    if (panel === "inspect") setPanel("notes");
    setHead(step / 7);
    setTxRun(false);
    setSelectedId(null);
  };
  const toggleTamper = () => {
    setTampered((value) => !value);
    setHead(3 / 7);
    setTxRun(false);
    setSelectedId(null);
  };

  const [network, setNetwork] = useState<NetworkOptions>(defaultNetwork);
  const net = useMemo(() => simulateNetwork(network), [network]);
  const [netElapsed, setNetElapsed] = useState(0);
  const [netRun, setNetRun] = useState(false);
  const [netSent, setNetSent] = useState(false);
  const [peer, setPeer] = useState(0);
  const updateNetwork = (patch: Partial<NetworkOptions>) => {
    setNetwork((value) => ({ ...value, ...patch }));
    setNetRun(false);
    setNetElapsed(0);
    setNetSent(false);
    setPeer(0);
    setSelectedId(null);
  };
  const broadcast = () => {
    setNetSent(true);
    setNetElapsed(motion ? 0 : net.total);
    setNetRun(motion);
    if (mobile) setPanel(null);
  };

  const [a, setA] = useState("ethereum"),
    [b, setB] = useState("optimistic");
  const bytes = network.payload;
  const [demand, setDemand] = useState(500),
    [layer, setLayer] = useState(0);
  const solutionA = solutions.find((s) => s.id === a)!,
    solutionB = solutions.find((s) => s.id === b)!;
  const metrics = [
    workload(solutionA, bytes, demand),
    workload(solutionB, bytes, demand),
  ];
  const [appId, setAppIdState] = useState(initial.appId ?? "usdc"),
    [appStep, setAppStep] = useState(0),
    [appRun, setAppRun] = useState(false);
  const [topicId, setTopicIdState] = useState(initial.topicId ?? "scaling"),
    [topicStep, setTopicStep] = useState(0),
    [topicRun, setTopicRun] = useState(false);
  const app = applications.find((value) => value.id === appId)!,
    topic = topics.find((value) => value.id === topicId)!;
  const setAppId = (id: string) => {
    setAppIdState(id);
    setAppStep(0);
    setAppRun(false);
    setSelectedId(null);
  };
  const setTopicId = (id: string) => {
    setTopicIdState(id);
    setTopicStep(0);
    setTopicRun(false);
    setSelectedId(null);
  };
  const pause = () => {
    setTxRun(false);
    setNetRun(false);
    setAppRun(false);
    setTopicRun(false);
  };
  const focus = (next: Area, tools = false) => {
    if (
      next === "network" &&
      area === "transaction" &&
      txStep === 2 &&
      !netSent
    ) {
      setNetSent(true);
      setNetElapsed(
        Math.max(0, Math.min(1, (((head * 7) % 1) - 0.18) / 0.67)) * net.total,
      );
    }
    pause();
    setArea(next);
    setOverview(false);
    setSelectedId(null);
    setPanel(tools ? "tools" : null);
    setView(next === "transaction" ? "follow" : "map");
    setOverlay(null);
  };
  const showAtlas = () => {
    pause();
    setOverview(true);
    setPanel(null);
    setSelectedId(null);
    setView("map");
  };
  const toggleMotion = () =>
    setMotion((value) => {
      try {
        localStorage.setItem("atlas-motion", String(!value));
      } catch {}
      return !value;
    });
  useEffect(() => {
    const change = () => {
      const target = legacyFocus(location.hash);
      focus(target.area);
      if (target.appId) setAppId(target.appId);
      if (target.topicId) setTopicId(target.topicId);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOverlay((value) => (value === "search" ? null : "search"));
      }
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
        if (document.querySelector('[data-camera-open="true"]')) return;
        setPanel(null);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const ticking = useRef({ head, speed, tampered });
  useEffect(() => {
    ticking.current = { head, speed, tampered };
  }, [head, speed, tampered]);
  useEffect(() => {
    if (
      area !== "transaction" ||
      overview ||
      !motion ||
      !txRun ||
      overlay ||
      !amountValid ||
      (!tx && !cryptoError)
    )
      return;
    let frame = 0,
      last = performance.now(),
      published = last,
      value = head;
    const tick = (now: number) => {
      if (!document.hidden)
        value +=
          (Math.min(100, Math.max(0, now - last)) / 42000) *
          ticking.current.speed;
      last = now;
      const max = ticking.current.tampered ? 4 / 7 - 0.0001 : 1;
      if (value >= max) {
        setHead(max);
        setTxRun(false);
        return;
      }
      if (now - published > 65) {
        setHead(value);
        published = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [
    area,
    overview,
    motion,
    txRun,
    overlay,
    speed,
    tampered,
    amountValid,
    !!tx,
    cryptoError,
  ]);
  useEffect(() => {
    if (area !== "network" || !netRun || !motion || overview || overlay) return;
    let frame = 0,
      last = performance.now(),
      value = netElapsed;
    const tick = (now: number) => {
      if (!document.hidden)
        value += (Math.max(0, Math.min(100, now - last)) / 4) * speed;
      last = now;
      setNetElapsed(Math.min(value, net.total));
      if (value >= net.total) {
        setNetRun(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [area, netRun, motion, overview, overlay, net.total, speed]);
  useEffect(() => {
    const running =
      area === "applications" ? appRun : area === "topics" ? topicRun : false;
    if (!running || !motion || overview || overlay) return;
    const step = area === "applications" ? appStep : topicStep;
    const timer = setTimeout(() => {
      if (step === 3) {
        area === "applications" ? setAppRun(false) : setTopicRun(false);
      } else {
        area === "applications"
          ? setAppStep((value) => value + 1)
          : setTopicStep((value) => value + 1);
      }
    }, 4000 / speed);
    return () => clearTimeout(timer);
  }, [
    area,
    appRun,
    topicRun,
    appStep,
    topicStep,
    motion,
    overview,
    overlay,
    speed,
  ]);

  const world = useMemo(
    () =>
      buildAtlas({
        protocol,
        network,
        solutionA,
        solutionB,
        bytes,
        demand,
        app,
        topic,
        area,
      }),
    [protocol, network, solutionA, solutionB, bytes, demand, app, topic, area],
  );
  const step =
    area === "transaction"
      ? txStep
      : area === "applications"
        ? appStep
        : area === "topics"
          ? topicStep
          : 0;
  const chapter = world.chapters[Math.min(step, world.chapters.length - 1)];
  const selected = world.objects.find((actor) => actor.id === selectedId);
  const cameraFrame = useMemo(() => {
    if (overview)
      return { target: [-3.5, 0.5, -7] as Point3, distance: 39, fit: 1.5 };
    if (view === "follow")
      return {
        target: selected?.position ?? chapter.focus,
        distance: area === "transaction" ? 8.6 : 9.4,
        fit: 0.88,
      };
    return {
      target: areas[area].focus,
      distance: areas[area].distance,
      fit: area === "transaction" ? 1.4 : 0.85,
    };
  }, [
    overview,
    view,
    selected?.id,
    chapter.focus[0],
    chapter.focus[1],
    chapter.focus[2],
    area,
  ]);
  const pick = (actor: SpatialObject) => {
    if (actor.portal) {
      focus(actor.area as Area);
      return;
    }
    const next = actor.area as Area;
    if (next && next !== area) {
      pause();
      setArea(next);
      setOverview(false);
    }
    if (next === "transaction" && actor.step <= maxTxStep) {
      setHead(actor.step / 7);
      setTxRun(false);
    }
    if (next === "network") {
      if (area === "transaction" && txStep === 2 && !netSent) {
        setNetSent(true);
        setNetElapsed(
          Math.max(0, Math.min(1, (((head * 7) % 1) - 0.18) / 0.67)) *
            net.total,
        );
      }
      setPeer(actor.networkIndex ?? 0);
      setNetRun(false);
    }
    if (next === "applications") {
      setAppStep(actor.step);
      setAppRun(false);
    }
    if (next === "topics") {
      setTopicStep(actor.step);
      setTopicRun(false);
    }
    setSelectedId(actor.id);
    setView("follow");
    setPanel("inspect");
  };
  const jump = (index: number) => {
    setSelectedId(null);
    if (panel === "inspect") setPanel("notes");
    if (area === "transaction") jumpTx(index);
    if (area === "applications") {
      setAppStep(index);
      setAppRun(false);
    }
    if (area === "topics") {
      setTopicStep(index);
      setTopicRun(false);
    }
  };
  const running =
    area === "transaction"
      ? txRun
      : area === "network"
        ? netRun
        : area === "applications"
          ? appRun
          : area === "topics"
            ? topicRun
            : false;
  const togglePlay = () => {
    if (area === "transaction") {
      if (!amountValid || (!tx && !cryptoError)) return;
      if (head >= 1) setHead(0);
      setTxRun((v) => !v);
    }
    if (area === "network") {
      if (!netSent || netElapsed >= net.total) broadcast();
      else setNetRun((v) => !v);
    }
    if (area === "applications") {
      if (appStep === 3 && !appRun) setAppStep(0);
      setAppRun((v) => !v);
    }
    if (area === "topics") {
      if (topicStep === 3 && !topicRun) setTopicStep(0);
      setTopicRun((v) => !v);
    }
  };
  const connection = () => {
    if (area === "transaction") {
      focus(
        txStep >= 6 ? "applications" : txStep >= 4 ? "scale" : "network",
        true,
      );
    } else if (area === "network") {
      focus("transaction");
      jumpTx(3);
    } else if (area === "scale") {
      focus("applications", true);
    } else if (area === "applications") {
      setTopicId(applicationIssue(appId));
      focus("topics", true);
    } else focus("transaction");
  };
  const connectionLabel =
    area === "transaction"
      ? txStep >= 6
        ? "Follow a real use"
        : txStep >= 4
          ? "Explore the scaling choices"
          : "Experiment with the peer network"
      : area === "network"
        ? "Continue to validation"
        : area === "scale"
          ? "Connect to real-world value"
          : area === "applications"
            ? "Question the assumptions"
            : "Trace another transaction";
  const currentTitle = overview
    ? "One system. Many connections."
    : area === "transaction"
      ? chapter.title
      : area === "network"
        ? "A message finds its way"
        : area === "scale"
          ? "The same demand. Different limits."
          : area === "applications"
            ? app.name
            : topic.title;
  const wireBytes = (tx?.bytes ?? 103) + 64 + 32;
  useEffect(() => {
    if (network.payload < wireBytes) updateNetwork({ payload: wireBytes });
  }, [wireBytes, network.payload]);
  const netComplete = netSent && netElapsed >= net.total;
  const netDisconnected = net.reachable < network.nodes - net.down.size;
  const networkTitle = !netSent
    ? "Ready to broadcast"
    : netComplete
      ? netDisconnected
        ? "Broadcast finished · peers isolated"
        : "Broadcast complete"
      : netRun && motion
        ? "Message propagating"
        : "Broadcast paused";
  const sceneProgress =
    area === "transaction" && txStep === 2 && !overview
      ? (head * 7) % 1 < 0.18
        ? -1
        : Math.min(1, (((head * 7) % 1) - 0.18) / 0.67) * net.total
      : netSent
        ? netElapsed
        : -1;
  const syncPayload = (value: number) =>
    updateNetwork({ payload: Math.max(wireBytes, value) });
  const scenePlaying =
    motion &&
    !overlay &&
    (overview ||
      area === "scale" ||
      (area === "transaction"
        ? txRun
        : area === "network"
          ? netRun
          : area === "applications"
            ? appRun
            : topicRun));
  return {
    area,
    overview,
    panel,
    setPanel,
    selected,
    selectedId,
    setSelectedId,
    motion,
    toggleMotion,
    view,
    setView,
    lens,
    setLens,
    resetKey,
    setResetKey,
    overlay,
    setOverlay,
    mobile,
    amount,
    setAmount,
    recipient,
    setRecipient,
    tx,
    tree,
    root,
    headerHash,
    valid,
    tampered,
    cryptoError,
    amountValid,
    maxTxStep,
    receivedPayload,
    dataView,
    setDataView,
    head,
    txStep,
    speed,
    setSpeed,
    txRun,
    setTxRun,
    jumpTx,
    toggleTamper,
    network,
    net,
    netElapsed,
    netRun,
    netSent,
    networkTitle,
    netComplete,
    netDisconnected,
    peer,
    setPeer,
    updateNetwork,
    broadcast,
    setNetRun,
    a,
    setA,
    b,
    setB,
    solutionA,
    solutionB,
    bytes,
    setBytes: syncPayload,
    wireBytes,
    sceneProgress,
    demand,
    setDemand,
    metrics,
    layer,
    setLayer,
    app,
    appId,
    setAppId,
    appStep,
    topic,
    topicId,
    setTopicId,
    topicStep,
    world,
    step,
    chapter,
    cameraFrame,
    pick,
    focus,
    showAtlas,
    jump,
    running,
    togglePlay,
    connection,
    connectionLabel,
    currentTitle,
    scenePlaying,
    pause,
    areaOrder,
  };
}
export type AtlasController = ReturnType<typeof useAtlas>;
