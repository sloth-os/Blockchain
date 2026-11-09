export type Topology = "mesh" | "ring" | "hub";
export type Pattern =
  | "globe"
  | "chain"
  | "rollup"
  | "bridge"
  | "vault"
  | "orbit"
  | "shield"
  | "mesh"
  | "swarm"
  | "identity";
export interface NetworkOptions {
  nodes: number;
  latency: number;
  bandwidth: number;
  payload: number;
  topology: Topology;
  offline: number;
}
export const defaultNetwork: NetworkOptions = {
  nodes: 18,
  latency: 80,
  bandwidth: 512,
  payload: 512,
  topology: "mesh",
  offline: 0,
};

export function networkEdges(
  count: number,
  topology: Topology,
): [number, number][] {
  const edges: [number, number][] = [];
  const add = (a: number, b: number) => {
    if (a === b) return;
    const pair: [number, number] = [Math.min(a, b), Math.max(a, b)];
    if (!edges.some(([x, y]) => x === pair[0] && y === pair[1]))
      edges.push(pair);
  };
  for (let i = 0; i < count; i++) {
    if (topology === "hub") {
      if (i > 0) add(0, i);
    } else {
      add(i, (i + 1) % count);
      if (topology === "mesh") add(i, (i + 5) % count);
    }
  }
  return edges;
}

/** Deterministic store-and-forward model. No packet loss, queuing or TCP overhead. */
export function simulateNetwork(o: NetworkOptions) {
  const edges = networkEdges(o.nodes, o.topology);
  // For a hub experiment, take down the hub first to expose its failure domain.
  const offlineCount = Math.floor((o.nodes * o.offline) / 100);
  const down = new Set(
    Array.from({ length: offlineCount }, (_, i) =>
      o.topology === "hub" ? i : o.nodes - 1 - i,
    ),
  );
  const source =
    Array.from({ length: o.nodes }, (_, i) => i).find((i) => !down.has(i)) ?? 0;
  const times = Array<number>(o.nodes).fill(Infinity);
  const parents = Array<number>(o.nodes).fill(-1);
  const visited = new Set<number>();
  times[source] = 0;
  const serialization = ((o.payload * 8) / (o.bandwidth * 1000)) * 1000;
  for (let iter = 0; iter < o.nodes; iter++) {
    let u = -1;
    for (let j = 0; j < o.nodes; j++)
      if (!down.has(j) && !visited.has(j) && (u === -1 || times[j] < times[u]))
        u = j;
    if (u === -1 || !Number.isFinite(times[u])) break;
    visited.add(u);
    for (const [a, b] of edges) {
      const v = a === u ? b : b === u ? a : -1;
      if (v < 0 || down.has(v)) continue;
      const jitter = 1 + ((a * 7 + b * 3) % 9) / 30;
      const candidate = times[u] + o.latency * jitter + serialization;
      if (candidate < times[v]) {
        times[v] = candidate;
        parents[v] = u;
      }
    }
  }
  const reachable = times.filter(Number.isFinite).sort((a, b) => a - b);
  const percentile = (p: number) =>
    reachable[Math.max(0, Math.ceil(p * reachable.length) - 1)] ?? 0;
  const activeEdges = edges.filter(
    ([a, b]) =>
      !down.has(a) &&
      !down.has(b) &&
      Number.isFinite(times[a]) &&
      Number.isFinite(times[b]),
  );
  return {
    edges,
    times,
    parents,
    down,
    source,
    reachable: reachable.length,
    p50: percentile(0.5),
    p95: percentile(0.95),
    total: reachable.at(-1) ?? 0,
    wireBytes: activeEdges.length * o.payload * 2,
    serialization,
  };
}

export interface Solution {
  id: string;
  name: string;
  short: string;
  category: string;
  color: string;
  pattern: Pattern;
  cadence: string;
  finality: string;
  trust: string;
  bottleneck: string;
  fee: string;
  source: string;
  byteBudget: number;
  executionLimit: number;
  reason: string;
}

export const solutions: Solution[] = [
  {
    id: "bitcoin",
    name: "Bitcoin L1",
    short: "BTC",
    category: "Proof of work",
    color: "#f5b66d",
    pattern: "chain",
    cadence: "~10 min target",
    finality: "Probabilistic; more confirmations reduce reorg risk.",
    trust:
      "Independent validation; economic security from accumulated proof of work.",
    bottleneck: "Limited block space and a conservative block cadence.",
    fee: "Demand for block space, measured in sat/vB.",
    source: "bitcoin",
    byteBudget: 1_000_000 / 600,
    executionLimit: Infinity,
    reason:
      "Model: 1,000,000 virtual bytes per 600 seconds; transaction size is treated as vbytes. Weight, witness composition and actual intervals vary.",
  },
  {
    id: "ethereum",
    name: "Ethereum L1",
    short: "ETH",
    category: "Proof of stake",
    color: "#b0a1ff",
    pattern: "globe",
    cadence: "12-second slots",
    finality:
      "Checkpoint finality, normally around two epochs (~12.8 min); inclusion is earlier.",
    trust: "Validators stake ETH; independent nodes re-execute transactions.",
    bottleneck: "Gas budget and global execution/storage costs.",
    fee: "Execution gas × base fee plus priority fee.",
    source: "ethereum-pos",
    byteBudget: 100_000,
    executionLimit: 30_000_000 / 12 / 70_000,
    reason:
      "Illustrative 30M gas budget per 12-second slot and 70k gas per contract call. These are fixed teaching assumptions, not current chain parameters.",
  },
  {
    id: "optimistic",
    name: "Optimistic rollup",
    short: "OP",
    category: "Layer 2",
    color: "#c4f568",
    pattern: "rollup",
    cadence: "Sequencer-dependent",
    finality:
      "Soft receipt first; L1 settlement later. Canonical withdrawals often have a ~7-day challenge period.",
    trust:
      "L1 data + working fault proofs, honest challengers, and implementation-specific upgrade controls.",
    bottleneck: "Execution, sequencer capacity, and L1 data availability.",
    fee: "L2 execution + amortized L1 data fees.",
    source: "ethereum-rollups",
    byteBudget: 250_000,
    executionLimit: 1200,
    reason:
      "Illustrative 250 kB/s effective data budget and 1,200 calls/s execution ceiling after batching; not a benchmark of a named rollup.",
  },
  {
    id: "zk",
    name: "ZK rollup",
    short: "ZK",
    category: "Validity proofs",
    color: "#78d9e6",
    pattern: "shield",
    cadence: "Sequencer-dependent",
    finality:
      "Receipt first; settlement after proof generation, L1 verification and L1 finality.",
    trust:
      "Validity proof soundness, available transaction data, correct verifier, and upgrade controls.",
    bottleneck: "Proving cost, data bandwidth, and execution.",
    fee: "Execution + shared proving + L1 data costs.",
    source: "ethereum-zk",
    byteBudget: 350_000,
    executionLimit: 2000,
    reason:
      "Illustrative 350 kB/s effective data budget and 2,000 calls/s ceiling. Proof generation latency is excluded from this throughput model.",
  },
  {
    id: "solana",
    name: "Solana L1",
    short: "SOL",
    category: "Parallel execution",
    color: "#e7a4dc",
    pattern: "swarm",
    cadence: "~400 ms target slots",
    finality:
      "Processed, confirmed, and finalized are different commitment levels; timing varies.",
    trust:
      "Stake-weighted consensus with higher node hardware/bandwidth requirements.",
    bottleneck: "Contention on shared accounts, compute and network bandwidth.",
    fee: "Base signature fee + optional compute-unit priority fee.",
    source: "solana",
    byteBudget: 900_000,
    executionLimit: 3000,
    reason:
      "Illustrative 900 kB/s data budget and 3,000 user calls/s ceiling, excluding vote traffic. Actual results depend heavily on account contention and workload.",
  },
  {
    id: "lightning",
    name: "Lightning",
    short: "LN",
    category: "Payment channels",
    color: "#f7dc7a",
    pattern: "bridge",
    cadence: "Interactive routing",
    finality:
      "Off-chain channel updates; unilateral close/dispute is on-chain and time-locked.",
    trust:
      "Bitcoin settlement + key security, online monitoring, route liquidity and channel counterparties.",
    bottleneck: "Liquidity along the whole route and channel management.",
    fee: "Routing fees; on-chain fees for channel open/close.",
    source: "lightning",
    byteBudget: 600_000,
    executionLimit: 5000,
    reason:
      "Illustrative aggregate routing budget of 600 kB/s and 5,000 updates/s across independent channels. This assumes sufficient liquidity and successful routes; it is not L1 throughput.",
  },
];

export function workload(solution: Solution, bytes: number, demand: number) {
  const capacity = Math.min(
    solution.byteBudget / bytes,
    solution.executionLimit,
  );
  const served = Math.min(capacity, demand);
  return {
    capacity,
    served,
    utilization: Math.min(100, (demand / capacity) * 100),
    backlog: Math.max(0, (demand - served) * 60),
    saturated: demand > capacity,
  };
}

const encoder = new TextEncoder();
export const hex = (bytes: ArrayBuffer | Uint8Array) =>
  Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
export const sha256 = async (text: string) =>
  hex(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
export interface DemoTransaction {
  payload: string;
  hash: string;
  signature: string;
  publicKey: string;
  signatureBytes: Uint8Array;
  key: CryptoKey;
  bytes: number;
}
export async function signTransaction(
  amount: string,
  recipient: string,
): Promise<DemoTransaction> {
  const keys = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  const payload = JSON.stringify({
    from: "alex.atlas",
    to: recipient,
    amount: Number(amount),
    asset: "ATLAS",
    nonce: 1,
    chainId: "atlas-demo-1",
  });
  const bytes = encoder.encode(payload);
  const signatureBytes = new Uint8Array(
    await crypto.subtle.sign("Ed25519", keys.privateKey, bytes),
  );
  return {
    payload,
    hash: await sha256(payload),
    signature: hex(signatureBytes),
    publicKey: hex(await crypto.subtle.exportKey("raw", keys.publicKey)),
    signatureBytes,
    key: keys.publicKey,
    bytes: bytes.length,
  };
}
export async function verifyTransaction(
  tx: DemoTransaction,
  tampered: boolean,
) {
  const payload = tampered
    ? JSON.stringify({ ...JSON.parse(tx.payload), amount: 999999 })
    : tx.payload;
  return crypto.subtle.verify(
    "Ed25519",
    tx.key,
    new Uint8Array(tx.signatureBytes),
    encoder.encode(payload),
  );
}

export async function merkleLevels(leaves: string[]): Promise<string[][]> {
  if (!leaves.length) return [[await sha256("")]];
  let level = await Promise.all(leaves.map(sha256));
  const levels = [level];
  while (level.length > 1) {
    const next: Promise<string>[] = [];
    // Explicit teaching convention: hash concatenated hexadecimal child hashes.
    for (let i = 0; i < level.length; i += 2)
      next.push(sha256(level[i] + (level[i + 1] ?? level[i])));
    level = await Promise.all(next);
    levels.push(level);
  }
  return levels;
}

export async function merkleRoot(leaves: string[]): Promise<string> {
  return (await merkleLevels(leaves)).at(-1)![0];
}

/** Minimal JSON headers: commit to the transaction tree, then link the next block. */
export async function linkedDemoHeaders(root: string) {
  const current = {
    height: 284,
    previousHash: await sha256("fixed educational header #283"),
    merkleRoot: root,
  };
  const currentHash = await sha256(JSON.stringify(current));
  const next = {
    height: 285,
    previousHash: currentHash,
    merkleRoot: await merkleRoot([
      "fixed educational transaction in block #285",
    ]),
  };
  return {
    current,
    currentHash,
    next,
    nextHash: await sha256(JSON.stringify(next)),
  };
}
