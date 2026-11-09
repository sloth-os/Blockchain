import {
  networkEdges,
  simulateNetwork,
  solutions,
  workload,
  type Topology,
} from "../models";
import type { Area } from "../atlas";
import type { ObjectKind } from "../spatial";

export type Position = { x: number; z: number };
export type GameStatus = "briefing" | "playing" | "paused" | "won" | "lost";
export type Choice = "signature" | "network" | "redeem" | "bridge" | null;
export interface Station {
  id: string;
  name: string;
  value: string;
  kind: ObjectKind;
  x: number;
  z: number;
  color?: string;
  collectible?: boolean;
}
export interface Mission {
  id: string;
  title: string;
  area: Area;
  color: string;
  source: string;
  brief: string;
  lesson: string;
  spawn: Position;
  hazards: number;
}
export const missions: Mission[] = [
  {
    id: "seal",
    title: "Seal the message",
    area: "transaction",
    color: "#c4f568",
    source: "ethereum-transactions",
    brief:
      "Recover the payload. Fly to the signing terminal and identify the bytes your wallet actually authorized.",
    lesson:
      "A signature authorizes exact bytes. Changing an amount after signing breaks that authorization.",
    spawn: { x: -5.5, z: 4.7 },
    hazards: 0,
  },
  {
    id: "relay",
    title: "Rebuild the relay",
    area: "network",
    color: "#77dbea",
    source: "ethereum-network",
    brief:
      "A failed hub has isolated the peers. Restore a resilient topology, collect the packet at N01 and relay it to N05 over actual links.",
    lesson:
      "Redundant links improve resilience. Every relay still consumes time and wire capacity; delivery does not establish validity.",
    spawn: { x: -5.5, z: 4.7 },
    hazards: 1,
  },
  {
    id: "merkle",
    title: "Forge a commitment",
    area: "transaction",
    color: "#b3a1ff",
    source: "bitcoin",
    brief:
      "Recover four transaction-hash shards. Bring them to the Merkle forge and commit the whole batch to one root.",
    lesson:
      "Four leaves become two pair hashes and one Merkle root. The root commits to the data; it does not supply missing data.",
    spawn: { x: 0, z: 5.4 },
    hazards: 1,
  },
  {
    id: "quorum",
    title: "Earn the quorum",
    area: "transaction",
    color: "#c4f568",
    source: "ethereum-pos",
    brief:
      "Collect verified votes for the same block. This checkpoint needs more than two thirds of the total stake. A vote for a different block must not count.",
    lesson:
      "This equal-time checkpoint puzzle weights votes by stake: 34% + 26% + 22% = 82%. A signature for another block contributes zero.",
    spawn: { x: 0, z: 5.4 },
    hazards: 2,
  },
  {
    id: "scale",
    title: "Find the scaling route",
    area: "scale",
    color: "#b3a1ff",
    source: "ethereum-zk",
    brief:
      "Route 500 smart-contract calls per second. Require Ethereum settlement, published transaction data and validity proofs. Choose a gateway that meets every requirement.",
    lesson:
      "Capacity alone is insufficient. Under these teaching budgets, the ZK rollup also matches the requested settlement and proof model; proving and settlement still take time.",
    spawn: { x: 0, z: 5.5 },
    hazards: 1,
  },
  {
    id: "redeem",
    title: "Cross into the real world",
    area: "applications",
    color: "#82baf5",
    source: "circle",
    brief:
      "Complete a fictional, eligible USDC redemption: obtain a burn receipt, secure issuer authorization and carry the bank acknowledgment back to the customer.",
    lesson:
      "A ledger burn is not a bank payment. Redemption depends on eligibility, issuer processes, reserve custody and banking rails.",
    spawn: { x: 0, z: 5.6 },
    hazards: 1,
  },
  {
    id: "bridge",
    title: "Guard the final crossing",
    area: "topics",
    color: "#e3b1dc",
    source: "ethereum-bridges",
    brief:
      "Collect a source lock event, its checkpoint and its inclusion proof. Verify the authentic message before opening the destination gate. The shortcut is untrusted.",
    lesson:
      "An inclusion proof and source finality are separate requirements. Real bridges add verification, custody and upgrade assumptions beyond this simplified checkpoint game.",
    spawn: { x: -5.7, z: 4.9 },
    hazards: 2,
  },
];
export interface Best {
  score: number;
  stars: number;
  seconds: number;
}
export interface GameSave {
  version: 1;
  best: Record<string, Best>;
}
export interface GameState {
  mission: number;
  status: GameStatus;
  bag: string[];
  route: number[];
  topology: Topology | null;
  energy: number;
  mistakes: number;
  choice: Choice;
  feedback: {
    title: string;
    body: string;
    tone: "info" | "success" | "error";
    serial: number;
  };
}
export const saveKey = "chain-atlas:runner:v1";
export const freshSave = (): GameSave => ({ version: 1, best: {} });
export const initialRun = (mission = 0): GameState => ({
  mission,
  status: "briefing",
  bag: [],
  route: [],
  topology: null,
  energy: 100,
  mistakes: 0,
  choice: null,
  feedback: {
    title: "A packet. A world to restore.",
    body: "Select a station to fly there, or pilot with WASD / arrow keys.",
    tone: "info",
    serial: 0,
  },
});
export function readSave(raw: string | null): GameSave {
  try {
    const parsed = JSON.parse(raw || "null");
    if (parsed?.version !== 1 || !parsed.best) return freshSave();
    const best: Record<string, Best> = {};
    for (const mission of missions) {
      const entry = parsed.best[mission.id];
      if (
        entry &&
        Number.isInteger(entry.stars) &&
        entry.stars >= 1 &&
        entry.stars <= 3 &&
        Number.isFinite(entry.score) &&
        entry.score >= 0 &&
        entry.score <= 10000 &&
        Number.isFinite(entry.seconds) &&
        entry.seconds >= 0
      )
        best[mission.id] = {
          score: Math.round(entry.score),
          stars: entry.stars,
          seconds: Math.round(entry.seconds),
        };
    }
    return { version: 1, best };
  } catch {
    return freshSave();
  }
}
export function resumeMission(save: GameSave) {
  const i = missions.findIndex((m) => !save.best[m.id]);
  return i < 0 ? 0 : i;
}
export function unlocked(save: GameSave, index: number) {
  return (
    index === 0 || missions.slice(0, index).every((m) => !!save.best[m.id])
  );
}
export function grade(run: GameState, seconds: number): Best {
  return {
    stars: run.mistakes === 0 ? 3 : run.mistakes <= 2 ? 2 : 1,
    score: Math.max(
      100,
      300 + run.energy * 2 + run.bag.length * 20 - run.mistakes * 15,
    ),
    seconds: Math.round(seconds),
  };
}
export function recordBest(
  save: GameSave,
  index: number,
  result: Best,
): GameSave {
  const key = missions[index].id,
    before = save.best[key];
  return {
    version: 1,
    best: {
      ...save.best,
      [key]: before
        ? {
            score: Math.max(before.score, result.score),
            stars: Math.max(before.stars, result.stars),
            seconds: Math.min(before.seconds, result.seconds),
          }
        : result,
    },
  };
}
export const has = (s: GameState, id: string) => s.bag.includes(id);
export const networkScenario = (topology: Topology, offline = 0) => ({
  nodes: 8,
  latency: 80,
  bandwidth: 512,
  payload: 512,
  topology,
  offline,
});
export function designDelivery(topology: Topology) {
  const healthy = simulateNetwork(networkScenario(topology)),
    fault = simulateNetwork(networkScenario(topology, 13));
  return {
    healthy,
    fault,
    qualifies:
      fault.reachable === 8 - fault.down.size &&
      healthy.p95 < 300 &&
      fault.p95 < 300,
  };
}
export function hopMilliseconds(a: number, b: number) {
  const [x, y] = [a, b].sort((p, q) => p - q);
  return 80 * (1 + ((x * 7 + y * 3) % 9) / 30) + 8;
}
export const routeMilliseconds = (route: number[]) =>
  route
    .slice(1)
    .reduce((sum, node, i) => sum + hopMilliseconds(route[i], node), 0);
export const stake = (s: GameState) =>
  [34, 26, 22].reduce(
    (total, weight, i) => total + (has(s, `vote${i}`) ? weight : 0),
    0,
  );
const station = (
  id: string,
  name: string,
  value: string,
  kind: ObjectKind,
  x: number,
  z: number,
  collectible = false,
  color?: string,
): Station => ({ id, name, value, kind, x, z, collectible, color });
export function stationsFor(s: GameState): Station[] {
  switch (s.mission) {
    case 0:
      return [
        station(
          "payload",
          "Payload cache",
          "Recover exact bytes",
          "data",
          -3.6,
          1,
          true,
        ),
        station(
          "sign",
          "Signing terminal",
          "Original or altered?",
          "key",
          3.6,
          -2,
        ),
      ];
    case 1:
      return [
        station(
          "repair",
          "Relay workshop",
          s.topology ? "Redundancy installed" : "Hub offline · repair",
          "contract",
          -5.3,
          -4.6,
        ),
        ...Array.from({ length: 8 }, (_, i) =>
          station(
            `peer${i}`,
            `Peer N${String(i + 1).padStart(2, "0")}`,
            !s.topology
              ? "Waiting for repair"
              : s.route.at(-1) === i
                ? "Packet here"
                : s.route.includes(i)
                  ? "Relayed"
                  : i === 4
                    ? "Delivery destination"
                    : i === 0
                      ? "Collect packet here"
                      : "Available relay",
            "peer",
            Math.cos((i / 8) * Math.PI * 2) * 5.1,
            Math.sin((i / 8) * Math.PI * 2) * 4.1,
            false,
            s.route.includes(i) ? "#c4f568" : "#77dbea",
          ),
        ),
      ];
    case 2:
      return [
        station(
          "leaf0",
          "Transaction shard 01",
          "SHA-256 leaf",
          "shard",
          -4.7,
          -3.6,
          true,
        ),
        station(
          "leaf1",
          "Transaction shard 02",
          "SHA-256 leaf",
          "shard",
          4.7,
          -3.6,
          true,
        ),
        station(
          "leaf2",
          "Transaction shard 03",
          "SHA-256 leaf",
          "shard",
          -4.7,
          2.7,
          true,
        ),
        station(
          "leaf3",
          "Transaction shard 04",
          "SHA-256 leaf",
          "shard",
          4.7,
          2.7,
          true,
        ),
        station(
          "forge",
          "Merkle forge",
          `${s.bag.filter((k) => k.startsWith("leaf")).length}/4 leaves recovered`,
          "proof",
          0,
          -0.5,
        ),
      ];
    case 3:
      return [
        station(
          "vote0",
          "Validator Alpha",
          has(s, "vote0") ? "34% · verified" : "34% stake",
          "validator",
          -4.8,
          -3.2,
        ),
        station(
          "vote1",
          "Validator Beta",
          has(s, "vote1") ? "26% · verified" : "26% stake",
          "validator",
          4.8,
          -3.2,
        ),
        station(
          "vote2",
          "Validator Gamma",
          has(s, "vote2") ? "22% · verified" : "22% stake",
          "validator",
          -4.8,
          2.6,
        ),
        station(
          "vote3",
          "Validator Delta",
          has(s, "rejected-vote")
            ? "Other block · rejected"
            : "18% · another block",
          "validator",
          4.8,
          2.6,
          false,
          "#f59291",
        ),
        station(
          "quorum",
          "Checkpoint gate",
          `${stake(s)}% / >66⅔% required`,
          "block",
          0,
          -0.6,
        ),
      ];
    case 4:
      return solutions.map((solution, i) =>
        station(
          solution.id,
          solution.name,
          `${workload(solution, 512, 500).capacity.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${solution.id === "lightning" ? "payments/s" : solution.id === "bitcoin" ? "tx/s" : "calls/s"} model capacity`,
          "vault",
          ((i % 3) - 1) * 5,
          Math.floor(i / 3) * 4.5 - 3,
          false,
          solution.color,
        ),
      );
    case 5:
      return [
        station(
          "burn",
          "Token burn receipt",
          "On-chain receipt",
          "data",
          -4.8,
          -2.7,
          true,
        ),
        station(
          "issuer",
          "Issuer desk",
          "Check redemption rights",
          "vault",
          0,
          -4.8,
        ),
        station(
          "bank",
          "Bank handoff",
          "Off-chain settlement",
          "contract",
          4.8,
          -2.7,
        ),
        station(
          "customer",
          "Customer destination",
          has(s, "bank-receipt")
            ? "Deliver acknowledgment"
            : "Awaiting bank acknowledgment",
          "wallet",
          0,
          2.7,
        ),
      ];
    default:
      return [
        station(
          "lock",
          "Source event",
          "Lock / burn record",
          "block",
          -4.9,
          -2.8,
          true,
        ),
        station(
          "header",
          "Checkpoint cache",
          "Source finality assumption",
          "block",
          0,
          -4.8,
          true,
        ),
        station(
          "proof",
          "Proof cache",
          "Merkle inclusion path",
          "proof",
          4.9,
          -2.8,
          true,
        ),
        station(
          "verifier",
          "Message verifier",
          "Check proof + checkpoint",
          "contract",
          0,
          0,
        ),
        station(
          "destination",
          "Destination gate",
          "Release after verification",
          "vault",
          4.9,
          3.4,
        ),
        station(
          "shortcut",
          "Untrusted shortcut",
          "Unverified message",
          "data",
          -4.9,
          3.4,
          false,
          "#f59291",
        ),
      ];
  }
}
export function objectives(s: GameState): [string, boolean][] {
  switch (s.mission) {
    case 0:
      return [
        ["Recover payload", has(s, "payload")],
        ["Verify the original signature", s.status === "won"],
      ];
    case 1:
      return [
        ["Restore a resilient topology", !!s.topology],
        ["Collect packet at N01", s.route.length > 0],
        ["Relay over links to N05", s.status === "won"],
      ];
    case 2:
      return [
        [
          "Recover all four hash shards",
          s.bag.filter((k) => k.startsWith("leaf")).length === 4,
        ],
        ["Forge the actual Merkle root", s.status === "won"],
      ];
    case 3:
      return [
        [`Collect >66⅔% valid stake (${stake(s)}%)`, stake(s) > (100 * 2) / 3],
        ["Open the checkpoint gate", s.status === "won"],
      ];
    case 4:
      return [
        [
          "Match capacity, settlement and proof requirements",
          s.status === "won",
        ],
      ];
    case 5:
      return [
        ["Obtain the token burn receipt", has(s, "burn")],
        ["Confirm eligible issuer redemption", has(s, "authorized")],
        ["Receive the bank acknowledgment", has(s, "bank-receipt")],
        ["Deliver it to the customer", s.status === "won"],
      ];
    default:
      return [
        [
          "Recover lock event, checkpoint and proof",
          ["lock", "header", "proof"].every((k) => has(s, k)),
        ],
        ["Verify the authentic inclusion proof", has(s, "verified")],
        ["Open the destination gate", s.status === "won"],
      ];
  }
}
function message(
  s: GameState,
  title: string,
  body: string,
  tone: GameState["feedback"]["tone"] = "info",
): GameState {
  return {
    ...s,
    feedback: { title, body, tone, serial: s.feedback.serial + 1 },
  };
}
function error(s: GameState, title: string, body: string) {
  const energy = Math.max(0, s.energy - 12);
  return message(
    {
      ...s,
      energy,
      mistakes: s.mistakes + 1,
      status: energy === 0 ? "lost" : s.status,
      choice: null,
    },
    title,
    body,
    "error",
  );
}
function collect(s: GameState, id: string, title: string, body: string) {
  return has(s, id)
    ? message(s, "Already secured", body)
    : message({ ...s, bag: [...s.bag, id] }, title, body, "success");
}
function win(s: GameState, body: string) {
  return message(
    { ...s, status: "won", choice: null },
    "Mission complete",
    body,
    "success",
  );
}
export function hit(s: GameState): GameState {
  if (s.status !== "playing" || s.choice) return s;
  const energy = Math.max(0, s.energy - 18);
  return message(
    {
      ...s,
      energy,
      mistakes: s.mistakes + 1,
      status: energy === 0 ? "lost" : "playing",
    },
    "Noise collision · −18 shield",
    "Steer around the red interference fields. Your mission checkpoint is safe.",
    "error",
  );
}
/** Protocol actions are gated independently of the visual controls. */
export function interact(
  s: GameState,
  id: string,
  option?: string,
  verified?: boolean,
): GameState {
  if (s.status !== "playing") return s;
  if (!stationsFor(s).some((node) => node.id === id)) return s;
  switch (s.mission) {
    case 0:
      if (id === "payload")
        return collect(
          s,
          id,
          "Payload recovered",
          "The exact UTF-8 payload is now in your courier. Find the signing terminal.",
        );
      if (!has(s, "payload"))
        return message(
          s,
          "Recover the payload first",
          "The signing terminal needs the message whose bytes you will authorize.",
        );
      if (!option) return { ...s, choice: "signature" };
      if (option === "original" && verified === true)
        return win(
          s,
          "The browser verified the original signed payload. The altered amount does not share that authorization.",
        );
      return error(
        s,
        "Authorization rejected",
        "An unchanged signature cannot authorize altered bytes. Try the original signed message.",
      );
    case 1:
      if (id === "repair") {
        if (!option) return { ...s, choice: "network" };
        if (!["mesh", "ring", "hub"].includes(option)) return s;
        const d = designDelivery(option as Topology);
        if (!d.qualifies)
          return error(
            s,
            "This design misses a requirement",
            `${Math.round(d.healthy.p95)} ms healthy p95; ${d.fault.reachable}/7 online peers reachable after one failure, at ${Math.round(d.fault.p95)} ms reachable p95. Keep all healthy peers reachable and both p95 values below 300 ms.`,
          );
        return message(
          { ...s, topology: option as Topology, choice: null },
          "Redundant relays online",
          "All healthy peers remain reachable after the modeled failure. Collect the signed message at N01.",
          "success",
        );
      }
      if (!s.topology)
        return message(
          s,
          "The hub is down",
          "Visit the relay workshop before sending a message into the partition.",
        );
      {
        const node = Number(id.slice(4)),
          previous = s.route.at(-1);
        if (previous === undefined)
          return node === 0
            ? message(
                { ...s, route: [0] },
                "Packet collected",
                "N05 is the destination. Relay only across the illuminated peer links.",
                "success",
              )
            : message(
                s,
                "Start at N01",
                "Collect the packet at the source peer before relaying it.",
              );
        if (previous === node)
          return message(
            s,
            "Packet already here",
            "Choose a linked neighbor to forward the message.",
          );
        if (
          !networkEdges(8, s.topology).some(
            ([a, b]) =>
              (a === previous && b === node) || (b === previous && a === node),
          )
        )
          return error(
            s,
            "No direct peer link",
            "Physical travel cannot create a network edge. Select a connected neighbor of the current packet holder.",
          );
        const next = { ...s, route: [...s.route, node] };
        return node === 4
          ? win(
              next,
              `Delivered in ${next.route.length - 1} relays: ${Math.round(routeMilliseconds(next.route))} model ms and ${(next.route.length - 1) * 512} payload bytes on this route. These are teaching link costs, not real Internet measurements.`,
            )
          : message(
              next,
              `Relayed to N${String(node + 1).padStart(2, "0")}`,
              `${Math.round(routeMilliseconds(next.route))} model ms so far. Find the next available link toward N05.`,
              "success",
            );
      }
    case 2:
      if (id.startsWith("leaf")) {
        const next = collect(
          s,
          id,
          "Hash shard recovered",
          "Each leaf commits to one transaction. Recover the other shards, then visit the forge.",
        );
        return next.bag.filter((key) => key.startsWith("leaf")).length === 4
          ? message(
              next,
              "All four shards secured",
              "Bring the complete batch to the Merkle forge. Its full ring shows that all four leaves are ready.",
              "success",
            )
          : next;
      }
      if (![0, 1, 2, 3].every((i) => has(s, `leaf${i}`)))
        return message(
          s,
          "The batch is incomplete",
          "The forge needs all four transaction hashes.",
        );
      return verified === true
        ? win(
            s,
            "Four actual local transaction hashes were combined into the browser-computed Merkle root.",
          )
        : message(
            s,
            "Preparing the commitment",
            "Wait for local cryptography, then try the forge again.",
          );
    case 3:
      if (id === "quorum")
        return stake(s) > (100 * 2) / 3
          ? win(
              s,
              `${stake(s)}% of the total stake signed the same block. The checkpoint meets this simplified PoS game's supermajority rule.`,
            )
          : message(
              s,
              "Not enough valid stake",
              `${stake(s)}% is below the required supermajority. Collect more votes for this exact block.`,
            );
      if (verified !== true)
        return collect(
          s,
          "rejected-vote",
          "Different block · vote rejected",
          "The signature does not verify against this block commitment. Its 18% contributes zero stake.",
        );
      return collect(
        s,
        id,
        "Vote verified",
        `${stake(collect(s, id, "", ""))}% valid stake collected. The gate requires more than two thirds of total stake.`,
      );
    case 4: {
      const solution = solutions.find((d) => d.id === id)!;
      const m = workload(solution, 512, 500);
      if (id === "zk" && m.served >= 500)
        return win(
          s,
          `${solution.name} serves the offered 500 calls/s in this resource model and matches Ethereum data settlement plus validity proofs. This is not a live performance benchmark.`,
        );
      return error(
        s,
        "Capacity is only one requirement",
        `${solution.name}: ${m.served.toLocaleString(undefined, { maximumFractionDigits: 1 })} of 500 calls/s served. ${id === "optimistic" ? "This budget also has a backlog, and optimistic verification uses a challenge model rather than validity proofs." : id === "solana" ? "Its own base layer does not provide the requested Ethereum settlement." : id === "lightning" ? "Payment channels are not the requested general smart-contract execution route." : "The offered contract workload exceeds this teaching design's capacity or execution model."}`,
      );
    }
    case 5:
      if (id === "burn")
        return collect(
          s,
          id,
          "Burn receipt secured",
          "The on-chain action is recorded. Bank dollars still require an eligible issuer and banking process.",
        );
      if (id === "issuer") {
        if (!has(s, "burn"))
          return message(
            s,
            "Bring the burn receipt",
            "The issuer needs the recorded redemption request.",
          );
        if (!option) return { ...s, choice: "redeem" };
        return option === "bank"
          ? collect(
              { ...s, choice: null },
              "authorized",
              "Redemption authorized",
              "The eligible holder uses the issuer and its banking rails. Find the bank handoff.",
            )
          : error(
              s,
              "The ledger cannot move bank reserves",
              "Validators and token code cannot independently deliver off-chain dollars. Use the issuer's eligible banking process.",
            );
      }
      if (id === "bank")
        return has(s, "authorized")
          ? collect(
              s,
              "bank-receipt",
              "Bank acknowledgment received",
              "This fictional bank handoff represents the off-chain settlement. Carry the acknowledgment to the customer.",
            )
          : message(
              s,
              "Authorization required",
              "Visit the issuer desk with the burn receipt first.",
            );
      return has(s, "bank-receipt")
        ? win(
            s,
            "The customer received the bank acknowledgment. The ledger and off-chain institutions fulfilled different parts of the redemption.",
          )
        : message(
            s,
            "The customer is still waiting",
            "A token burn alone does not confirm that bank dollars arrived.",
          );
    default:
      if (id === "shortcut")
        return error(
          s,
          "Unverified shortcut rejected",
          "A relayer's claim is not a proof. Collect the source event, checkpoint and inclusion path.",
        );
      if (id === "lock")
        return collect(
          s,
          id,
          "Source event secured",
          "The source lock/burn event is the claim the destination must verify.",
        );
      if (id === "header" || id === "proof")
        return has(s, "lock")
          ? collect(
              s,
              id,
              id === "header"
                ? "Checkpoint recovered"
                : "Inclusion path recovered",
              id === "header"
                ? "The game supplies a source-finality checkpoint. Real bridges must verify their own finality assumptions."
                : "The Merkle path must match the source event and committed root.",
            )
          : message(
              s,
              "Find the source event first",
              "The checkpoint and proof must refer to the event you intend to bridge.",
            );
      if (id === "verifier") {
        if (!["lock", "header", "proof"].every((k) => has(s, k)))
          return message(
            s,
            "Verification material missing",
            "Bring the lock event, source checkpoint and inclusion path.",
          );
        if (!option) return { ...s, choice: "bridge" };
        return option === "authentic" && verified === true
          ? collect(
              { ...s, choice: null },
              "verified",
              "Inclusion verified",
              "The SHA-256 path matches the committed event root, and the game checkpoint is present. Open the destination gate.",
            )
          : error(
              s,
              "Proof rejected",
              "The altered event cannot reconstruct the committed root. An inclusion proof also needs a separate source-finality policy.",
            );
      }
      return has(s, "verified")
        ? win(
            s,
            "The destination accepted the authenticated event under this game's explicit checkpoint assumption. You restored the chain of trust.",
          )
        : message(
            s,
            "The destination is locked",
            "The message verifier must accept the proof and checkpoint before release.",
          );
  }
}
export const distance = (a: Position, b: Position) =>
  Math.hypot(a.x - b.x, a.z - b.z);
export function movePosition(
  position: Position,
  direction: Position,
  dt: number,
  dash = false,
): Position {
  const length = Math.hypot(direction.x, direction.z),
    scale =
      (Math.min(1, length) / Math.max(1e-9, length)) *
      Math.min(0.06, Math.max(0, dt)) *
      (dash ? 9 : 4.2);
  return {
    x: Math.max(-7.25, Math.min(7.25, position.x + direction.x * scale)),
    z: Math.max(-6.15, Math.min(6.15, position.z + direction.z * scale)),
  };
}
export function hazardPosition(
  index: number,
  time: number,
  reduced: boolean,
): Position {
  const angle = reduced ? index * 2.4 + 0.8 : time * 0.42 + index * 2.4 + 0.8;
  return {
    x: Math.cos(angle) * (index ? 3.6 : 2.1),
    z: Math.sin(angle) * (index ? 2.5 : 1.8),
  };
}
