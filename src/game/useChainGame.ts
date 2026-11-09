import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { merkleRoot, verifyTransaction } from "../models";
import type { AtlasController } from "../useAtlas";
import {
  checkBridgeProof,
  checkVote,
  makeBridgeProof,
  makeVotes,
} from "./crypto";
import {
  distance,
  freshSave,
  grade,
  has,
  hit,
  initialRun,
  interact,
  missions,
  readSave,
  recordBest,
  resumeMission,
  saveKey,
  stationsFor,
  unlocked,
  type Position,
} from "./model";
import { gameWorld } from "./spatial";
import type { Command, GameBridge, Telemetry } from "./types";

type MissionCrypto = Pick<
  AtlasController,
  "tx" | "root" | "tree" | "headerHash" | "cryptoError"
>;

export function useChainGame(c: AtlasController, compatibility: boolean) {
  const hud = useRef<HTMLDivElement>(null);
  const cryptography = useRef<MissionCrypto | null>(null);
  const captureCrypto = (): MissionCrypto | null =>
    c.tx || c.cryptoError
      ? {
          tx: c.tx,
          root: c.root,
          tree: c.tree,
          headerHash: c.headerHash,
          cryptoError: c.cryptoError,
        }
      : null;
  const [save, setSave] = useState(() => {
    try {
      return readSave(localStorage.getItem(saveKey));
    } catch {
      return freshSave();
    }
  });
  const [state, setState] = useState(() => initialRun(resumeMission(save)));
  const stateRef = useRef(state);
  stateRef.current = state;
  const [active, setActive] = useState(false),
    [run, setRun] = useState(0),
    [menu, setMenu] = useState<"missions" | "help" | null>(null);
  const [overview, setOverview] = useState(false),
    [pending, setPending] = useState(false),
    [sound, setSound] = useState(false),
    [storage, setStorage] = useState(true);
  const position = useRef<Position>({ ...missions[state.mission].spawn }),
    steer = useRef<Position>({ x: 0, z: 0 }),
    elapsed = useRef(0);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    ...position.current,
    seconds: 0,
    near: null,
    distance: Infinity,
    boost: 1,
  });
  const [command, setCommand] = useState<Command | null>(null);
  const serial = useRef(0),
    generation = useRef(0),
    working = useRef(false),
    recorded = useRef(-1);
  const audio = useRef<AudioContext | null>(null);
  const votes = useRef<{
      key: string;
      promise: ReturnType<typeof makeVotes>;
    } | null>(null),
    proof = useRef<ReturnType<typeof makeBridgeProof> | null>(null);
  const mission = missions[state.mission];
  useEffect(() => {
    if (active && state.status !== "briefing" && !cryptography.current)
      cryptography.current = captureCrypto();
  }, [active, run, c.tx, c.root, c.headerHash, c.cryptoError]);
  const stations = useMemo(() => stationsFor(state), [state]);
  useEffect(() => {
    try {
      localStorage.setItem(saveKey, JSON.stringify(save));
    } catch {
      setStorage(false);
    }
  }, [save]);
  useEffect(() => {
    if (state.status !== "won" || recorded.current === run) return;
    recorded.current = run;
    setSave((previous) =>
      recordBest(previous, state.mission, grade(state, elapsed.current)),
    );
  }, [state.status, run]);
  useEffect(() => {
    if (!sound || !audio.current || state.feedback.serial === 0) return;
    const ctx = audio.current;
    if (ctx.state !== "running") return;
    const start = ctx.currentTime,
      frequency =
        state.feedback.tone === "error"
          ? 135
          : state.status === "won"
            ? 660
            : 440;
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(
      frequency * 1.5,
      start + 0.12,
    );
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.06, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.24);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }, [state.feedback.serial, sound]);
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );
  const toggleSound = () => {
    if (!sound) {
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume();
        setSound(true);
      } catch {
        setSound(false);
      }
    } else setSound(false);
  };
  const close = () => {
    generation.current++;
    working.current = false;
    setPending(false);
    setActive(false);
    setMenu(null);
    steer.current = { x: 0, z: 0 };
    setState((s) =>
      s.status === "playing" ? { ...s, status: "paused", choice: null } : s,
    );
  };
  const begin = (index: number) => {
    if (!unlocked(save, index)) return;
    cryptography.current = captureCrypto();
    votes.current = null;
    proof.current = null;
    generation.current++;
    working.current = false;
    setPending(false);
    position.current = { ...missions[index].spawn };
    steer.current = { x: 0, z: 0 };
    elapsed.current = 0;
    setTelemetry({
      ...position.current,
      seconds: 0,
      near: null,
      distance: Infinity,
      boost: 1,
    });
    setCommand(null);
    setMenu(null);
    setOverview(false);
    setRun((n) => n + 1);
    setState({ ...initialRun(index), status: "playing" });
    setActive(true);
    c.focus(missions[index].area);
    c.pause();
  };
  const open = () => {
    c.pause();
    c.focus(mission.area);
    setActive(true);
    setMenu(null);
  };
  useEffect(() => {
    if (active && (c.area !== mission.area || c.panel !== null)) close();
  }, [c.area, c.panel]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        !active ||
        event.key !== "Escape" ||
        document.querySelector("dialog[open]")
      )
        return;
      event.preventDefault();
      steer.current = { x: 0, z: 0 };
      setState((s) =>
        s.status === "playing"
          ? { ...s, status: "paused" }
          : s.status === "paused"
            ? { ...s, status: "playing" }
            : s,
      );
    };
    const visibility = () => {
      if (document.hidden && active) {
        steer.current = { x: 0, z: 0 };
        setState((s) =>
          s.status === "playing" ? { ...s, status: "paused" } : s,
        );
      }
    };
    window.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [active]);
  const inspect = async (id: string, option?: string) => {
    if (working.current || stateRef.current.status !== "playing") return;
    const s = stateRef.current,
      station = stationsFor(s).find((node) => node.id === id);
    if (!station || distance(position.current, station) > 1.7) return;
    setCommand(null);
    const needsCrypto =
      (s.mission === 0 && !!option) ||
      (s.mission === 2 &&
        id === "forge" &&
        [0, 1, 2, 3].every((i) => has(s, `leaf${i}`))) ||
      (s.mission === 3 && id.startsWith("vote")) ||
      (s.mission === 6 && id === "verifier" && !!option);
    if (!needsCrypto) {
      setState((previous) => interact(previous, id, option));
      return;
    }
    working.current = true;
    setPending(true);
    const token = generation.current;
    try {
      const sample = (cryptography.current ??= captureCrypto());
      if (!sample)
        throw new Error(
          "Local cryptography is preparing. Try this station again in a moment.",
        );
      let verified = false;
      if (!sample.tx && sample.cryptoError) {
        verified =
          s.mission === 0
            ? option === "original"
            : s.mission === 3
              ? id !== "vote3"
              : s.mission === 6
                ? option === "authentic"
                : true;
      } else if (!sample.tx)
        throw new Error(
          "Local cryptography is preparing. Try this station again in a moment.",
        );
      else if (s.mission === 0)
        verified = await verifyTransaction(sample.tx, option !== "original");
      else if (s.mission === 2)
        verified =
          (await merkleRoot([
            sample.tx.payload,
            "Sam pays Lee 1 ATLAS",
            "Lee pays Alex 4 ATLAS",
            "Maya pays Sam 3 ATLAS",
          ])) === sample.root;
      else if (s.mission === 3) {
        const commitment = sample.headerHash;
        if (!commitment) throw new Error("The block commitment is preparing.");
        if (votes.current?.key !== commitment)
          votes.current = { key: commitment, promise: makeVotes(commitment) };
        const all = await votes.current.promise;
        verified = await checkVote(all[Number(id.slice(4))], commitment);
      } else {
        proof.current ??= makeBridgeProof(sample.tx.hash);
        verified = await checkBridgeProof(
          await proof.current,
          option !== "authentic",
        );
      }
      if (token === generation.current)
        setState((previous) => {
          const next = interact(previous, id, option, verified);
          if (!sample.tx && sample.cryptoError)
            return {
              ...next,
              feedback: {
                ...next.feedback,
                body: `Illustrated check: browser cryptography is unavailable. ${s.mission === 0 ? "The supplied original message is accepted; altered bytes are rejected." : s.mission === 2 ? "The example combines four transaction leaves into a Merkle commitment." : s.mission === 3 ? "Only the supplied votes for this block contribute stake." : "The supplied authentic event and inclusion path are accepted together with the game checkpoint."} No cryptographic verification was performed for this action.`,
              },
            };
          return next;
        });
    } catch (error) {
      if (token === generation.current)
        setState((previous) => ({
          ...previous,
          feedback: {
            title: "Local check not ready",
            body:
              error instanceof Error
                ? error.message
                : "Try this station again.",
            tone: "info",
            serial: previous.feedback.serial + 1,
          },
        }));
    } finally {
      if (token === generation.current) {
        working.current = false;
        setPending(false);
      }
    }
  };
  const navigate = (id: string) => {
    if (stateRef.current.status !== "playing" || stateRef.current.choice)
      return;
    const node = stationsFor(stateRef.current).find((s) => s.id === id);
    if (!node) return;
    if (compatibility) {
      position.current = { x: node.x, z: node.z };
      setTelemetry((t) => ({
        ...t,
        ...position.current,
        near: id,
        distance: 0,
      }));
      void inspect(id);
    } else setCommand({ type: "station", id, serial: ++serial.current });
  };
  const choose = (option: string) => {
    const id =
      state.choice === "signature"
        ? "sign"
        : state.choice === "network"
          ? "repair"
          : state.choice === "redeem"
            ? "issuer"
            : "verifier";
    void inspect(id, option);
  };
  const onTelemetry = useCallback((next: Telemetry) => setTelemetry(next), []);
  const onHit = useCallback(() => setState(hit), []);
  const running =
    active &&
    state.status === "playing" &&
    !state.choice &&
    !pending &&
    !menu &&
    !c.overlay;
  const material = cryptography.current ?? c;
  const world = useMemo(
    () => gameWorld(c.world, state, material.tree[0]),
    [c.world, state, material.tree],
  );
  const bridge: GameBridge = {
    hud,
    run,
    state,
    running,
    reduced: !c.motion,
    overview: overview || state.status === "briefing",
    position,
    steer,
    elapsed,
    stations,
    command,
    onInteract: (id) => void inspect(id),
    onHit,
    onTelemetry,
  };
  useEffect(() => {
    if (new URLSearchParams(location.search).get("play") === "1") open();
  }, []);
  const result = grade(state, elapsed.current),
    total = Object.values(save.best).reduce((sum, b) => sum + b.score, 0),
    stars = Object.values(save.best).reduce((sum, b) => sum + b.stars, 0);
  return {
    hud,
    active,
    state,
    mission,
    stations,
    save,
    run,
    menu,
    setMenu,
    overview,
    setOverview,
    pending,
    sound,
    toggleSound,
    storage,
    telemetry,
    position,
    steer,
    elapsed,
    bridge,
    world,
    result,
    total,
    stars,
    compatibility,
    realCrypto: !!material.tx && !material.cryptoError,
    teaching: !!material.cryptoError,
    payload:
      material.tx?.payload ??
      (material.cryptoError
        ? "Illustrated payload: Alex pays Maya 2.5 ATLAS. Local cryptography is unavailable."
        : "Local keys are preparing…"),
    open,
    close,
    begin,
    navigate,
    choose,
    interact: () => {
      if (telemetry.near) void inspect(telemetry.near);
    },
    dash: () => setCommand({ type: "dash", serial: ++serial.current }),
    pause: () => {
      steer.current = { x: 0, z: 0 };
      setState((s) => ({ ...s, status: "paused" }));
    },
    resume: () => setState((s) => ({ ...s, status: "playing" })),
    cancelChoice: () => setState((s) => ({ ...s, choice: null })),
    restart: () => begin(state.mission),
  };
}
export type ChainGame = ReturnType<typeof useChainGame>;
