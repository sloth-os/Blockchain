import {
  applications,
  stages,
  topics,
  type UseCase,
  type Topic,
} from "./content";
import {
  defaultNetwork,
  simulateNetwork,
  type DemoTransaction,
  type NetworkOptions,
  type Solution,
  type Topology,
  workload,
} from "./models";

export type Point3 = [number, number, number];
export type ObjectKind =
  | "wallet"
  | "data"
  | "key"
  | "peer"
  | "block"
  | "proof"
  | "vault"
  | "coin"
  | "contract"
  | "validator"
  | "shard"
  | "person";
export interface SpatialObject {
  id: string;
  label: string;
  value: string;
  kind: ObjectKind;
  position: Point3;
  step: number;
  detail: string;
  trust: string;
  facts: [string, string][];
  color?: string;
  secondary?: boolean;
  offline?: boolean;
  arrival?: number;
  fill?: number;
  area?: string;
  localId?: string;
  portal?: boolean;
  networkIndex?: number;
  sourceId?: string;
  collected?: boolean;
}
export interface SpatialFlow {
  from: string;
  to: string;
  step: number;
  label: string;
  kind?: "value" | "data" | "proof" | "vote";
  arc?: number;
  window?: [number, number];
  rate?: number;
  area?: string;
  networkEdge?: [number, number];
  relation?: boolean;
  trace?: boolean;
}
export interface SpatialChapter {
  title: string;
  caption: string;
  focus: Point3;
  source: string;
  readout: [string, string][];
}
export interface SpatialStory {
  id: string;
  title: string;
  color: string;
  objects: SpatialObject[];
  flows: SpatialFlow[];
  chapters: SpatialChapter[];
  mapDistance?: number;
  network?: boolean;
}
export interface TransactionView {
  tx?: DemoTransaction | null;
  amount?: string;
  recipient?: string;
  rejected?: boolean;
  root?: string;
  tree?: string[][];
  headerHash?: string;
  verified?: boolean | null;
}
const green = "#c4f568",
  purple = "#b3a1ff",
  cyan = "#77dbea";
const object = (
  id: string,
  label: string,
  value: string,
  kind: ObjectKind,
  position: Point3,
  step: number,
  detail: string,
  trust: string,
  facts: [string, string][] = [],
  color?: string,
): SpatialObject => ({
  id,
  label,
  value,
  kind,
  position,
  step,
  detail,
  trust,
  facts,
  color,
});
const short = (v?: string) =>
  v ? `${v.slice(0, 8)}…${v.slice(-6)}` : "computing locally";

export function protocolStory(view: TransactionView = {}): SpatialStory {
  const {
    tx,
    amount = "2.5",
    recipient = "maya.atlas",
    rejected = false,
    root,
    tree,
    headerHash,
    verified,
  } = view;
  const recipientName = recipient.split(".")[0];
  const displayName =
    recipientName.charAt(0).toUpperCase() + recipientName.slice(1);
  const receivedPayload =
    tx && rejected
      ? JSON.stringify({ ...JSON.parse(tx.payload), amount: 999999 })
      : tx?.payload;
  const bytes = receivedPayload
    ? new TextEncoder().encode(receivedPayload).length
    : 103;
  const net = simulateNetwork(defaultNetwork);
  const objects: SpatialObject[] = [
    object(
      "wallet",
      "ALEX’S WALLET",
      `${amount} ATLAS → ${displayName}`,
      "wallet",
      [-5.8, 0.25, 1.3],
      0,
      "A human instruction becomes a structured transaction. The wallet is an interface and key manager; funds are recorded in ledger state.",
      "The wallet must show what you actually authorize.",
      [
        ["Sender", "alex.atlas"],
        ["Recipient", recipient],
        ["Amount", `${amount} ATLAS`],
        ["Nonce", "1 · demo chain"],
      ],
      green,
    ),
    object(
      "payload",
      "TRANSACTION PAYLOAD",
      rejected ? "999999 ATLAS · ALTERED" : `${bytes} UTF-8 bytes`,
      "data",
      [-3.65, 0.25, 1.1],
      0,
      rejected
        ? "The received amount was changed to 999999 after signing. The original signature remains unchanged, so verification of these received bytes fails."
        : "Sender, recipient, amount, nonce and chain ID are encoded into the exact bytes that are signed. A different encoding produces different bytes.",
      "This JSON teaching format is not a production chain encoding.",
      [
        ["Encoding", "UTF-8 JSON"],
        ["Chain ID", "atlas-demo-1"],
        ["Received bytes", `${bytes} UTF-8 bytes`],
        ["Signed original", tx?.payload ?? "Preparing locally"],
        [
          "Received payload",
          receivedPayload ?? "from → to → amount → nonce → chainId",
        ],
      ],
      rejected ? "#f59291" : cyan,
    ),
    object(
      "secret",
      "PRIVATE KEY",
      "STAYS IN THE WALLET",
      "key",
      [-4.6, 1.7, -0.7],
      1,
      "An ephemeral Ed25519 private key signs the payload inside this browser. It is not broadcast, stored, or shown in this scene.",
      "Anyone who gets a private key can authorize actions under it.",
      [
        ["Private key", "Never transmitted"],
        ["Signature scheme", "Ed25519 · local demo"],
        ["Public key", tx?.publicKey ?? "Preparing locally"],
      ],
      purple,
    ),
    object(
      "signed",
      "SIGNED ENVELOPE",
      tx ? short(tx.signature) : "PAYLOAD + SIGNATURE",
      "proof",
      [-1.65, 0.45, 1.25],
      1,
      "Signed bytes travel with a public authorization proof. This visualization uses a real local Ed25519 signature when Web Crypto is available.",
      "A signature proves authorization of bytes; it does not prove an external claim is true.",
      [
        ["Signature bytes", "64"],
        ["Public key bytes", "32"],
        ["Payload hash", tx?.hash ?? "Preparing locally"],
        ["Full signature", tx?.signature ?? "Preparing locally"],
        ["Public key", tx?.publicKey ?? "Preparing locally"],
      ],
      purple,
    ),
    object(
      "rpc",
      "ENTRY NODE",
      "RPC → PEER GOSSIP",
      "peer",
      [-0.1, 0.1, 1.8],
      2,
      "The wallet submits the signed message to an entry node. A valid message is announced and relayed to peers; each node keeps its own local view.",
      "An RPC provider can censor, delay or misreport a response; independent verification matters.",
      [
        ["Network", "Illustrative peer graph"],
        ["Delivery", "No private key sent"],
        ["Payload", `${bytes} signed-payload bytes`],
      ],
      cyan,
    ),
    object(
      "mempool",
      "PENDING POOL",
      "NOT FINAL YET",
      "vault",
      [2.05, 0.35, 1.3],
      2,
      "A local pending pool holds candidate transactions. Different peers can have different pending sets and arrival orders.",
      "Pending does not mean included, successful or final.",
      [
        ["State", "Candidate transactions"],
        ["Ordering", "Not yet agreed"],
        ["Propagation p95", `${Math.round(net.p95)} ms · network model`],
      ],
      green,
    ),
    object(
      "verify",
      "INDEPENDENT CHECKS",
      rejected ? "SIGNATURE REJECTED" : "VERIFY AUTHORIZATION",
      "validator",
      [2.0, 1.6, -1.3],
      3,
      rejected
        ? "The amount was changed after signing. The public-key verification fails and the message must not enter an accepted block."
        : "A verifier checks the exact signed bytes. Real nodes also check balance/inputs, nonce, format and protocol limits.",
      "This lab executes signature verification. Balance checks, replay handling and consensus are explained, not a real deployed chain.",
      [
        [
          "Signature",
          rejected
            ? "INVALID · amount altered"
            : verified === true
              ? "Valid local authorization"
              : tx
                ? "Checking locally"
                : "Awaiting local signature",
        ],
        ["Invalid bytes", "Must be rejected"],
        ["Extra node checks", "Balance / inputs / nonce / limits"],
      ],
      rejected ? "#f59291" : green,
    ),
    ...Array.from({ length: 4 }, (_, i) =>
      object(
        `leaf${i}`,
        `TRANSACTION ${i + 1} HASH`,
        short(tree?.[0]?.[i] ?? (i === 0 ? tx?.hash : undefined)),
        "shard",
        [3.25 + i * 0.95, -0.15, -0.8] as Point3,
        4,
        "This leaf commits to the exact UTF-8 bytes of one transaction. Four leaves are paired into two intermediate hashes.",
        "A hash proves integrity of supplied bytes, not external truth.",
        [
          ["Full leaf hash", tree?.[0]?.[i] ?? "Computing locally"],
          ["Leaf index", `${i + 1} of 4`],
        ],
        i % 2 ? purple : cyan,
      ),
    ),
    ...Array.from({ length: 2 }, (_, i) =>
      object(
        `branch${i}`,
        `HASH PAIR ${i + 1}`,
        short(tree?.[1]?.[i]),
        "proof",
        [3.72 + i * 1.9, 0.65, -1.9] as Point3,
        4,
        "This intermediate commitment hashes the concatenated hexadecimal digests of two child leaves. The root hashes these two parents.",
        "This is the explicitly simplified binary Merkle convention used in the lab.",
        [
          ["Full parent hash", tree?.[1]?.[i] ?? "Computing locally"],
          ["Children", `Leaves ${i * 2 + 1} and ${i * 2 + 2}`],
        ],
        cyan,
      ),
    ),
    object(
      "root",
      "MERKLE COMMITMENT",
      short(root),
      "proof",
      [4.65, 1.35, -2.65],
      4,
      "Pairwise hashing produces a root that commits to the complete batch. A changed leaf changes its ancestors and the root.",
      "This binary teaching tree differs from Ethereum’s trie commitments.",
      [
        ["Root", root ?? "Computed in your browser"],
        ["Included transactions", "4 · teaching batch"],
      ],
      cyan,
    ),
    object(
      "block",
      "BLOCK #284",
      headerHash ? short(headerHash) : "PARENT + ROOT + ORDER",
      "block",
      [5.3, 0.6, -3.65],
      4,
      "A header commits to the batch and references the prior header hash. State transitions must be valid under the chain’s rules.",
      "A valid block still needs to be selected and accepted under consensus.",
      [
        ["Parent", "Hash of header #283"],
        ["Transactions", "Ordered batch"],
        ["Header", "Minimal JSON in this lab"],
        ["Header hash", headerHash ?? "Computing locally"],
      ],
      green,
    ),
    object(
      "v0",
      "VALIDATOR A",
      "INDEPENDENT VOTE",
      "validator",
      [3.55, 1.3, -4.8],
      5,
      "This schematic validator independently checks a proposed history and contributes a vote.",
      "Ethereum checkpoint votes are weighted by stake, not by the number of machines.",
      [
        ["Vote", "Schematic, equal-weight illustration"],
        ["Production rule", "Protocol and stake weighted"],
      ],
      purple,
    ),
    object(
      "v1",
      "VALIDATOR B",
      "INDEPENDENT VOTE",
      "validator",
      [5.25, 1.3, -5.35],
      5,
      "Agreement on a valid ordering resolves competing candidates. Fork-choice and finality are distinct mechanisms.",
      "A temporary partition can delay agreement and finality.",
      [
        ["Inclusion", "Not finality"],
        ["Quorum", "Depends on protocol"],
      ],
      purple,
    ),
    object(
      "v2",
      "VALIDATOR C",
      "INDEPENDENT VOTE",
      "validator",
      [7, 1.3, -4.7],
      5,
      "Honest nodes verify for themselves, rather than trusting one central database editor.",
      "PoW uses accumulated work instead of these schematic stake-style votes.",
      [
        ["Bitcoin", "Accumulated proof of work"],
        ["Ethereum", "Fork choice + checkpoint votes"],
      ],
      purple,
    ),
    object(
      "settled",
      "ACCEPTED HISTORY",
      "RECEIPT + STATE UPDATE",
      "block",
      [1.05, 0.4, -4.7],
      6,
      "The accepted state changes balances and emits a receipt. An application chooses a confirmation policy appropriate for its risk.",
      "A block receipt, base-chain finality and rollup withdrawal completion are different assurances.",
      [
        ["Transaction", "Included under demo policy"],
        ["Real funds moved", "0"],
        ["Settlement", "Protocol-specific"],
      ],
      green,
    ),
    object(
      "recipient",
      `${displayName.toUpperCase()}’S WALLET`,
      `+${amount} ATLAS · DEMO`,
      "wallet",
      [-1.45, 0.4, -4.3],
      6,
      `${displayName}’s interface reads accepted ledger state. The wallet does not physically receive a coin from Alex’s device.`,
      "On-chain settlement does not guarantee that a merchant delivers an off-chain good.",
      [
        ["Recipient", recipient],
        ["Result", "Ledger state updated"],
        ["Asset", "Fictional ATLAS"],
      ],
      cyan,
    ),
  ];
  const peerPositions: Point3[] = [
    [-0.7, 0.8, -0.3],
    [0.5, 0.55, -1.2],
    [1, 0.15, -0.2],
    [0.1, -0.05, 0.3],
  ];
  peerPositions.forEach((p, i) =>
    objects.push({
      ...object(
        `peer${i}`,
        `PEER N0${i + 1}`,
        "CHECK → RELAY",
        "peer",
        p,
        2,
        "Gossip spreads useful messages through multiple independent paths. Peers suppress duplicates and request missing data.",
        "More redundancy can improve reachability while increasing wire traffic.",
        [
          ["Relay", "Signed bytes only"],
          ["Private key", "Never included"],
        ],
        i % 2 ? purple : cyan,
      ),
      secondary: true,
    }),
  );
  const flows: SpatialFlow[] = [
    { from: "wallet", to: "payload", step: 0, label: "encode exact bytes" },
    {
      from: "payload",
      to: "signed",
      step: 1,
      label: "payload + signature",
      kind: "proof",
    },
    {
      from: "secret",
      to: "signed",
      step: 1,
      label: "LOCAL signing operation · key stays here",
      kind: "proof",
      arc: 1,
    },
    { from: "signed", to: "rpc", step: 2, label: "submit signed message" },
    { from: "rpc", to: "peer0", step: 2, label: "announce & relay" },
    { from: "peer0", to: "peer1", step: 2, label: "gossip" },
    { from: "peer1", to: "peer2", step: 2, label: "gossip" },
    { from: "rpc", to: "peer3", step: 2, label: "alternate path" },
    {
      from: "peer2",
      to: "mempool",
      step: 2,
      label: "later duplicate suppressed",
    },
    {
      from: "peer3",
      to: "mempool",
      step: 2,
      label: "first seen → pending pool",
    },
    {
      from: "mempool",
      to: "verify",
      step: 3,
      label: rejected ? "invalid amount → reject" : "signature + state checks",
      kind: "proof",
    },
    { from: "verify", to: "leaf0", step: 4, label: "valid transaction hash" },
    ...Array.from({ length: 4 }, (_, i) => ({
      from: `leaf${i}`,
      to: `branch${Math.floor(i / 2)}`,
      step: 4,
      label: `hash leaf ${i + 1}`,
      kind: "proof" as const,
    })),
    ...Array.from({ length: 2 }, (_, i) => ({
      from: `branch${i}`,
      to: "root",
      step: 4,
      label: "hash intermediate pair",
      kind: "proof" as const,
    })),
    {
      from: "root",
      to: "block",
      step: 4,
      label: "commit root into header",
      kind: "proof",
    },
    ...["v0", "v1", "v2"].map((to) => ({
      from: "block",
      to,
      step: 5,
      label: "proposal → independent checks",
      kind: "vote" as const,
      arc: 0.6,
    })),
    ...["v0", "v1", "v2"].map((from) => ({
      from,
      to: "settled",
      step: 5,
      label: "attestation / vote",
      kind: "vote" as const,
      arc: 0.5,
    })),
    {
      from: "settled",
      to: "recipient",
      step: 6,
      label: "read receipt + updated balance",
      kind: "value",
    },
  ];
  const relayWindows: Record<string, [number, number]> = {
    "signed>rpc": [0, 0.18],
    "rpc>peer0": [0.18, 0.38],
    "peer0>peer1": [0.38, 0.6],
    "peer1>peer2": [0.6, 0.8],
    "rpc>peer3": [0.18, 0.4],
    "peer2>mempool": [0.8, 1],
    "peer3>mempool": [0.4, 0.75],
  };
  for (const flow of flows) {
    if (flow.step === 2)
      flow.window = relayWindows[`${flow.from}>${flow.to}`] ?? [0, 1];
    if (flow.step === 4)
      flow.window =
        flow.from === "verify"
          ? [0, 0.15]
          : flow.from.startsWith("leaf")
            ? [0.17, 0.5]
            : flow.from.startsWith("branch")
              ? [0.52, 0.78]
              : [0.8, 1];
    if (flow.step === 5)
      flow.window = flow.from === "block" ? [0, 0.42] : [0.5, 0.95];
  }
  const focuses: Point3[] = [
    [-4.4, 0.7, 1],
    [-3.2, 1, 0.5],
    [0.3, 0.65, 0.3],
    [2.2, 1.1, -0.4],
    [4.55, 0.7, -2],
    [4.8, 1, -4.3],
    [-0.1, 0.6, -4.4],
  ];
  const readouts: [string, string][][] = [
    [
      ["ENCODING", "UTF-8 JSON"],
      ["PAYLOAD", `${bytes} bytes`],
      ["REPLAY DOMAIN", "atlas-demo-1"],
    ],
    [
      ["SIGNATURE", "64 bytes"],
      ["PUBLIC KEY", "32 bytes"],
      ["PRIVATE KEY", "Never sent"],
    ],
    [
      ["PEERS SHOWN", "5 relay actors"],
      ["MODEL GRAPH", "18 nodes / 36 links"],
      ["MODEL p95", `${Math.round(net.p95)} ms`],
    ],
    [
      [
        "AUTHORIZATION",
        rejected
          ? "REJECTED"
          : verified === true
            ? "Verified locally"
            : "Explanatory model",
      ],
      ["SIGNATURE", rejected ? "Amount changed" : "Matches bytes"],
      ["BALANCE RULES", "Explained, not executed"],
    ],
    [
      ["DEMO BATCH", "4 transactions"],
      ["COMMITMENT", "Merkle root"],
      ["LINK", "Parent header hash"],
    ],
    [
      ["PROPOSAL", "Independently checked"],
      ["QUORUM", "Protocol-dependent"],
      ["INCLUSION", "≠ finality"],
    ],
    [
      ["ASSET", `${amount} ATLAS · fictional`],
      ["RECIPIENT", recipient],
      ["REAL FUNDS MOVED", "0"],
    ],
  ];
  return {
    id: "protocol",
    title: "The anatomy of a transaction",
    color: green,
    objects,
    flows,
    mapDistance: 12,
    chapters: stages.map((s, i) => ({
      title: s.title,
      caption:
        i === 3 && rejected
          ? "Altered bytes fail verification. Block production and settlement stop here."
          : s.wire,
      focus: focuses[i],
      source: s.source,
      readout: readouts[i],
    })),
  };
}

type ActorSpec = [string, string, ObjectKind];
const appActors: Record<string, ActorSpec[]> = {
  bitcoin: [
    ["Sender / UTXOs", "SIGNED SPEND", "wallet"],
    ["Miners + peers", "PROOF OF WORK", "validator"],
    ["Accepted blocks", "CONFIRMATIONS", "block"],
    ["Recipient", "SPENDABLE OUTPUT", "wallet"],
  ],
  usdc: [
    ["Eligible customer", "BANK DOLLARS", "person"],
    ["Circle + reserves", "OFF-CHAIN BACKING", "vault"],
    ["USDC ledger", "TOKEN BALANCES", "coin"],
    ["Redeemer + bank", "BURN → DOLLARS", "wallet"],
  ],
  uniswap: [
    ["Liquidity providers", "TWO ASSETS", "wallet"],
    ["Liquidity pool", "PRICING + RESERVES", "vault"],
    ["Swap contract", "ATOMIC EXCHANGE", "contract"],
    ["Trader / LPs", "TOKENS + FEES", "wallet"],
  ],
  aave: [
    ["Supplier", "DEPOSIT → aTOKENS", "wallet"],
    ["Collateral + oracle", "HEALTH FACTOR", "proof"],
    ["Borrow pool", "DEBT + INTEREST", "vault"],
    ["Repay / liquidate", "COLLATERAL RULES", "contract"],
  ],
  nft: [
    ["Creator + contract", "TOKEN ID", "contract"],
    ["Current owner", "OWNERSHIP RECORD", "wallet"],
    ["Transfer / market", "APPROVALS", "contract"],
    ["Application + media", "ACCESS / METADATA", "data"],
  ],
  ens: [
    ["Name owner", "maya.eth", "wallet"],
    ["ENS registry", "OWNER + RESOLVER", "contract"],
    ["Resolver records", "NAME → ADDRESS", "data"],
    ["Wallet / Web3 app", "RESOLVED RECORD", "wallet"],
  ],
  chainlink: [
    ["External sources", "PRICE OBSERVATIONS", "data"],
    ["Oracle operators", "AGGREGATED REPORT", "peer"],
    ["Feed contract", "ON-CHAIN UPDATE", "contract"],
    ["Consuming app", "CHECK FRESHNESS", "proof"],
  ],
  buidl: [
    ["Eligible investor", "IDENTITY + RIGHTS", "person"],
    ["Fund + custodian", "REAL FUND ASSETS", "vault"],
    ["Transfer agent", "TOKENIZED INTEREST", "contract"],
    ["Approved holder", "DISTRIBUTE / REDEEM", "wallet"],
  ],
  helium: [
    ["Hotspot operator", "PHYSICAL HARDWARE", "person"],
    ["Wireless service", "USEFUL COVERAGE", "peer"],
    ["Measurements", "ELIGIBLE ACTIVITY", "data"],
    ["Network economics", "PAYMENTS + REWARDS", "coin"],
  ],
  wfp: [
    ["Aid organizations", "ASSISTANCE RECORDS", "person"],
    ["Permissioned peers", "SHARED COORDINATION", "peer"],
    ["Assistance checks", "AVOID OVERLAP", "contract"],
    ["Delivery + reconciliation", "REAL-WORLD AID", "wallet"],
  ],
};
const topicActors: Record<string, ActorSpec[]> = {
  scaling: [
    ["User operations", "MANY CALLS", "data"],
    ["L2 sequencer", "BATCH EXECUTION", "vault"],
    ["L1 data layer", "AVAILABLE DATA", "shard"],
    ["Settlement contract", "FAULT / VALIDITY PROOF", "proof"],
  ],
  stablecoins: appActors.usdc,
  rwa: appActors.buidl,
  mev: [
    ["Pending user trade", "PUBLIC ORDER FLOW", "data"],
    ["Searcher", "SIMULATE ORDERING", "contract"],
    ["Builder / proposer", "SELECT + REORDER", "block"],
    ["Executed trade", "VALUE REDISTRIBUTED", "coin"],
  ],
  bridges: [
    ["Source chain", "LOCK / BURN", "block"],
    ["Message verifier", "VERIFY SOURCE EVENT", "proof"],
    ["Cross-chain message", "AUTHENTICATED EVENT", "data"],
    ["Destination chain", "RELEASE / MINT", "block"],
  ],
  availability: [
    ["Transaction batch", "ENCODE DATA", "data"],
    ["Distribution", "PUBLISH SHARDS", "shard"],
    ["Availability checks", "SAMPLE / RETRIEVE", "peer"],
    ["Reconstructed state", "CAN USERS EXIT?", "block"],
  ],
  wallets: [
    ["User + smart account", "AUTHORIZATION POLICY", "wallet"],
    ["Signed operation", "SCOPED PERMISSION", "proof"],
    ["Bundler / paymaster", "BATCH + SPONSOR GAS", "peer"],
    ["Account execution", "ENFORCE POLICY", "contract"],
  ],
  privacy: [
    ["Private witness", "SECRET INPUTS", "key"],
    ["Prover", "COMPUTE PROOF", "contract"],
    ["Public statement", "PROOF + PUBLIC INPUTS", "proof"],
    ["Verifier", "VERIFY · NOT REVEAL", "validator"],
  ],
  security: [
    ["Existing signatures", "INVENTORY KEYS", "key"],
    ["PQ standards", "LATTICE / HASH DESIGNS", "proof"],
    ["Migration design", "NEW AUTHORIZATION", "contract"],
    ["Coordinated upgrade", "PROTECT OLD HOLDINGS", "block"],
  ],
  depin: appActors.helium,
};

const flowKinds: Record<string, NonNullable<SpatialFlow["kind"]>[]> = {
  bitcoin: ["data", "proof", "value"],
  usdc: ["value", "data", "value"],
  uniswap: ["value", "data", "value"],
  aave: ["value", "data", "value"],
  nft: ["data", "proof", "data"],
  ens: ["data", "data", "data"],
  chainlink: ["data", "proof", "data"],
  buidl: ["value", "data", "value"],
  helium: ["data", "data", "value"],
  wfp: ["data", "data", "data"],
  scaling: ["data", "data", "proof"],
  stablecoins: ["value", "data", "value"],
  rwa: ["value", "data", "value"],
  mev: ["data", "data", "value"],
  bridges: ["proof", "proof", "value"],
  availability: ["data", "data", "data"],
  wallets: ["proof", "proof", "data"],
  privacy: ["data", "proof", "proof"],
  security: ["data", "data", "data"],
  depin: ["data", "data", "value"],
};
function fourStageStory(
  id: string,
  title: string,
  color: string,
  actors: ActorSpec[],
  steps: [string, string][],
  trust: string,
  source: string,
): SpatialStory {
  const positions: Point3[] = [
    [-4.3, 0.3, 0.8],
    [-1.5, 0.65, -0.5],
    [1.4, 0.35, 0.65],
    [4.25, 0.65, -0.65],
  ];
  return {
    id,
    title,
    color,
    mapDistance: 12.4,
    objects: actors.map(([label, value, kind], i) =>
      object(
        `actor${i}`,
        label.toUpperCase(),
        value,
        kind,
        positions[i],
        i,
        steps[i][1],
        trust,
        [
          ["Stage", steps[i][0]],
          ["Boundary", trust],
        ],
        i === 1 ? purple : i === 2 ? cyan : color,
      ),
    ),
    flows: actors.slice(1).map((_, i) => ({
      from: `actor${i}`,
      to: `actor${i + 1}`,
      step: i + 1,
      label: steps[i + 1][0],
      kind: flowKinds[id.replace(/^(app|topic)-/, "")]?.[i] ?? "data",
      arc: 0.6,
    })),
    chapters: steps.map(([t, c], i) => ({
      title: t,
      caption: c,
      focus: positions[i],
      source,
      readout: [
        ["STEP", `${i + 1} / 4`],
        ["ACTOR", actors[i][0]],
        ["STATE", actors[i][1]],
      ],
    })),
  };
}
export function applicationStory(app: UseCase): SpatialStory {
  const story = fourStageStory(
    `app-${app.id}`,
    app.headline,
    app.color,
    appActors[app.id],
    app.flow,
    app.boundary,
    app.source,
  );
  // Requests and value settlement have different directions and semantics.
  if (["usdc", "buidl"].includes(app.id)) {
    story.flows.push({
      from: "actor3",
      to: "actor1",
      step: 3,
      label: "redemption request under issuer / fund rules",
      kind: "data",
      arc: 1.8,
      window: [0, 0.4],
    });
    story.flows.push({
      from: "actor1",
      to: "actor3",
      step: 3,
      label: "off-chain redemption under legal terms",
      kind: "value",
      arc: 2.3,
      window: [0.5, 1],
    });
  }
  if (app.id === "aave")
    story.flows.push({
      from: "actor3",
      to: "actor2",
      step: 3,
      label: "repay borrowed assets + interest",
      kind: "value",
      arc: 1.5,
    });
  return story;
}
export function topicStory(topic: Topic): SpatialStory {
  const story = fourStageStory(
    `topic-${topic.id}`,
    topic.question,
    topic.color,
    topicActors[topic.id],
    topic.mechanism.map((s, i) => [`Mechanism ${i + 1}`, s]),
    topic.tradeoff,
    topic.sources[0],
  );
  story.objects.forEach((actor, i) => {
    actor.detail = topic.mechanism[i] + " " + topic.body;
    actor.facts.push(["What to watch", topic.watch]);
  });
  story.chapters.forEach((c, i) => {
    c.title = topicActors[topic.id][i][0];
  });
  if (topic.id === "privacy")
    story.objects[0].trust =
      "The witness remains private. Only the proof and intended public inputs travel to the verifier.";
  if (topic.id === "availability")
    story.objects[1].facts = [
      ["Correct execution", "Does not imply data availability"],
      ["Data needs", "Reconstruction and exits"],
    ];
  if (topic.id === "mev")
    story.flows.push({
      from: "actor1",
      to: "actor3",
      step: 3,
      label: "ordering affects execution value",
      kind: "value",
      arc: 1.8,
    });
  return story;
}

export function solutionStory(
  solution: Solution,
  bytes: number,
  demand: number,
): SpatialStory {
  const m = workload(solution, bytes, demand);
  const compact = (v: number) =>
    v.toLocaleString(undefined, { maximumFractionDigits: 1 });
  const story: SpatialStory = {
    id: `solution-${solution.id}`,
    title: solution.name,
    color: solution.color,
    mapDistance: 10.5,
    objects: [
      object(
        "incoming",
        "INCOMING CALLS",
        `${compact(demand)} / s`,
        "data",
        [-3.1, 0.3, 0.3],
        0,
        "The same demand and payload size are offered to both designs. This is a teaching workload, not an observed network measurement.",
        "Different transaction semantics prevent naive production TPS comparisons.",
        [
          ["Payload", `${bytes} bytes`],
          ["Demand", `${demand} calls/s`],
        ],
        cyan,
      ),
      {
        ...object(
          "capacity",
          "RESOURCE LIMIT",
          `${compact(m.capacity)} / s`,
          "vault",
          [0, 0.4, 0],
          0,
          solution.reason,
          solution.trust,
          [
            [
              "Backlog at 60s",
              `${Math.ceil(m.backlog).toLocaleString()} calls`,
            ],
            ["Limit", solution.bottleneck],
          ],
          solution.color,
        ),
        fill: m.utilization / 100,
      },
      object(
        "served",
        "COMPLETED CALLS",
        `${compact(m.served)} / s`,
        "block",
        [3.1, 0.4, -0.3],
        0,
        "Completed throughput is the smaller of incoming demand and modeled capacity. A sequencer receipt is not automatically base-layer finality.",
        solution.finality,
        [
          ["Cadence", solution.cadence],
          ["Settlement", solution.finality],
        ],
        solution.color,
      ),
    ],
    flows: [
      {
        from: "incoming",
        to: "capacity",
        step: 0,
        label: `${bytes} bytes / call`,
      },
      {
        from: "capacity",
        to: "served",
        step: 0,
        label: m.saturated ? "bottleneck reached" : "demand served",
        rate: Math.max(0.03, m.served / demand),
        kind: "value",
      },
    ],
    chapters: [
      {
        title: "Follow the bottleneck",
        caption:
          "capacity = min(byte budget / payload bytes, execution ceiling)",
        focus: [0, 0.4, 0],
        source: solution.source,
        readout: [],
      },
    ],
  };
  return story;
}

export function peerStory(options: NetworkOptions): SpatialStory {
  const sim = simulateNetwork(options),
    n = options.nodes;
  const position = (i: number): Point3 => {
    if (options.topology === "hub")
      return i === 0
        ? [0, 0.6, 0]
        : [
            Math.cos((i / (n - 1)) * Math.PI * 2) * 3.3,
            0.5 + Math.sin(i * 2.4) * 0.5,
            Math.sin((i / (n - 1)) * Math.PI * 2) * 2.5,
          ];
    if (options.topology === "ring")
      return [
        Math.cos((i / n) * Math.PI * 2) * 3.3,
        0.4,
        Math.sin((i / n) * Math.PI * 2) * 2.5,
      ];
    const y = 1 - (i / (n - 1)) * 2,
      r = Math.sqrt(1 - y * y),
      angle = i * Math.PI * (3 - Math.sqrt(5));
    return [Math.cos(angle) * r * 3, y * 2.2, Math.sin(angle) * r * 2.2];
  };
  return {
    id: `peers-${options.topology}-${n}`,
    title: "Peer-to-peer propagation",
    color: green,
    mapDistance: 11,
    network: true,
    objects: Array.from({ length: n }, (_, i) => ({
      ...object(
        `n${i}`,
        `PEER N${String(i + 1).padStart(2, "0")}`,
        sim.down.has(i)
          ? "OFFLINE"
          : Number.isFinite(sim.times[i])
            ? `${Math.round(sim.times[i])} ms arrival`
            : "UNREACHABLE",
        "peer",
        position(i),
        0,
        "This node receives a signed message, checks it locally, and relays it over available peer links. Its first-arrival route follows the deterministic network model.",
        "A peer can be offline or isolated. Independent verification is still required.",
        [
          [
            "Arrival",
            Number.isFinite(sim.times[i])
              ? `${Math.round(sim.times[i])} ms`
              : "Unreachable",
          ],
          [
            "First relay",
            i === sim.source
              ? "Source"
              : sim.parents[i] < 0
                ? "None"
                : `N${sim.parents[i] + 1}`,
          ],
          ["Link budget", `${options.bandwidth} kbps`],
        ],
        i % 3 ? green : purple,
      ),
      secondary: i !== sim.source,
      offline: sim.down.has(i),
      arrival: sim.times[i],
    })),
    flows: sim.edges.map(([a, b]) => ({
      from: `n${a}`,
      to: `n${b}`,
      step: 0,
      label: "peer relay",
      arc: 0.2,
    })),
    chapters: [
      {
        title: "Peer network",
        caption:
          "First-arrival paths and per-link serialization—not a live Internet benchmark.",
        focus: [0, 0.3, 0],
        source: "ethereum-network",
        readout: [],
      },
    ],
  };
}

export function fallbackPatternStory(pattern: string): SpatialStory {
  const app = applications.find((a) => a.pattern === pattern);
  return app ? applicationStory(app) : topicStory(topics[0]);
}
export const topologyLabel: Record<Topology, string> = {
  mesh: "Redundant mesh",
  ring: "Ring of peers",
  hub: "Hub and spokes",
};

/** A future arrival estimate is never presented as an already received message. */
export function spatialObjectValue(
  actor: SpatialObject,
  network: boolean,
  progress?: number,
): string {
  if (!network) return actor.value;
  if (actor.offline) return "OFFLINE";
  if (!Number.isFinite(actor.arrival ?? Infinity)) return "UNREACHABLE";
  const time = Math.round(actor.arrival ?? 0);
  if (progress === undefined || progress < 0) return `${time} ms · predicted`;
  return progress >= (actor.arrival ?? 0)
    ? `RECEIVED @ ${time} ms`
    : `WAITING · ${time} ms`;
}
