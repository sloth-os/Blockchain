import { applications, topics, type UseCase, type Topic } from "./content";
import {
  applicationStory,
  peerStory,
  solutionStory,
  topicStory,
  type Point3,
  type SpatialStory,
  type SpatialObject,
} from "./spatial";
import { simulateNetwork, type NetworkOptions, type Solution } from "./models";

export type Area =
  "transaction" | "network" | "scale" | "applications" | "topics";
export const areas: Record<
  Area,
  {
    title: string;
    short: string;
    verb: string;
    description: string;
    position: Point3;
    focus: Point3;
    distance: number;
    color: string;
    source: string;
  }
> = {
  transaction: {
    title: "Transaction anatomy",
    short: "Authorize",
    verb: "Follow the bytes",
    description:
      "An intention becomes a signed message, a commitment, and accepted state.",
    position: [-2, 0, 6],
    focus: [-1.5, 0.6, 3],
    distance: 14,
    color: "#c4f568",
    source: "ethereum-transactions",
  },
  network: {
    title: "Peer network",
    short: "Propagate",
    verb: "Experiment with propagation",
    description:
      "Broadcast the same message through a network you can reshape and disrupt.",
    position: [-13, 0, -3],
    focus: [-13, 0.3, -3],
    distance: 11,
    color: "#77dbea",
    source: "ethereum-network",
  },
  scale: {
    title: "Scaling & trade-offs",
    short: "Scale",
    verb: "Compare resource limits",
    description:
      "Give two designs the same workload and find what limits each one.",
    position: [11, 0, -3],
    focus: [11, 0.4, -3],
    distance: 12,
    color: "#b3a1ff",
    source: "ethereum-rollups",
  },
  applications: {
    title: "Real-world connections",
    short: "Apply",
    verb: "Follow real-world value",
    description:
      "Ten uses connect ledger records to people, institutions, and economies.",
    position: [3, 0, -17],
    focus: [3, 0.5, -17],
    distance: 12,
    color: "#82baf5",
    source: "circle",
  },
  topics: {
    title: "Questions at the frontier",
    short: "Question",
    verb: "Explore the open questions",
    description:
      "Ten issues expose the assumptions a ledger cannot make disappear.",
    position: [-11, 0, -19],
    focus: [-11, 0.5, -19],
    distance: 12,
    color: "#e3b1dc",
    source: "ethereum-zk",
  },
};
export const areaOrder: Area[] = [
  "transaction",
  "network",
  "scale",
  "applications",
  "topics",
];
const move = (p: Point3, o: Point3): Point3 => [
  p[0] + o[0],
  p[1] + o[1],
  p[2] + o[2],
];

interface Inputs {
  protocol: SpatialStory;
  network: NetworkOptions;
  solutionA: Solution;
  solutionB: Solution;
  bytes: number;
  demand: number;
  app: UseCase;
  topic: Topic;
  area: Area;
}
/** All experiments inhabit this graph together. Focusing changes no page or canvas. */
export function buildAtlas(input: Inputs): SpatialStory {
  const app = applicationStory(input.app),
    topic = topicStory(input.topic),
    network = peerStory(input.network);
  const laneA = solutionStory(input.solutionA, input.bytes, input.demand),
    laneB = solutionStory(input.solutionB, input.bytes, input.demand);
  const stories: Record<Area, SpatialStory> = {
    transaction: input.protocol,
    network,
    scale: laneA,
    applications: app,
    topics: topic,
  };
  const objects: SpatialObject[] = [],
    flows: SpatialStory["flows"] = [];
  const include = (
    area: Area,
    story: SpatialStory,
    prefix: string,
    offset: Point3,
    lane?: "A" | "B",
  ) => {
    for (const actor of story.objects) {
      if (
        area === "transaction" &&
        (actor.id === "rpc" || actor.id.startsWith("peer"))
      )
        continue;
      objects.push({
        ...actor,
        id: `${prefix}:${actor.id}`,
        localId: actor.id,
        area,
        position: move(actor.position, offset),
        networkIndex:
          area === "network" ? Number(actor.id.slice(1)) : undefined,
        sourceId:
          story.chapters[Math.min(actor.step, story.chapters.length - 1)]
            .source,
        label: lane
          ? `${lane} · ${lane === "A" ? input.solutionA.short : input.solutionB.short} · ${actor.label}`
          : actor.label,
      });
    }
    for (const flow of story.flows) {
      if (
        area === "transaction" &&
        [flow.from, flow.to].some((id) => id === "rpc" || id.startsWith("peer"))
      )
        continue;
      flows.push({
        ...flow,
        from: `${prefix}:${flow.from}`,
        to: `${prefix}:${flow.to}`,
        area,
        trace: area === "network",
        networkEdge:
          area === "network"
            ? [Number(flow.from.slice(1)), Number(flow.to.slice(1))]
            : undefined,
      });
    }
  };
  include("transaction", input.protocol, "tx", areas.transaction.position);
  include("network", network, "net", areas.network.position);
  include(
    "scale",
    laneA,
    "scaleA",
    move(areas.scale.position, [0, 0, -1.8]),
    "A",
  );
  include(
    "scale",
    laneB,
    "scaleB",
    move(areas.scale.position, [0, 0, 1.8]),
    "B",
  );
  include("applications", app, "app", areas.applications.position);
  include("topics", topic, "topic", areas.topics.position);
  const portalOffsets: Record<Area, Point3> = {
    transaction: [0, 1.5, 3.2],
    network: [0, 2, 0],
    scale: [0, 1.8, 0],
    applications: [0, 1.8, 0],
    topics: [0, 1.8, 0],
  };
  for (const area of areaOrder) {
    const meta = areas[area];
    objects.push({
      id: `portal:${area}`,
      localId: "portal",
      area,
      portal: true,
      label: meta.title.toUpperCase(),
      value:
        area === "network"
          ? `${input.network.nodes} PEERS · EXPERIMENT`
          : area === "scale"
            ? "TWO DESIGNS · ONE WORKLOAD"
            : area === "applications"
              ? "10 APPLICATIONS · REAL ECONOMIES"
              : area === "topics"
                ? "10 SOURCED OPEN QUESTIONS"
                : "7 PHASES · REAL LOCAL CRYPTO",
      kind: "proof",
      position: move(meta.position, portalOffsets[area]),
      step: 0,
      detail: meta.description,
      trust:
        "A focus in the same educational world. All data, controls and experiments stay in this workspace.",
      facts: [["Explore", meta.verb]],
      color: meta.color,
      sourceId: meta.source,
    });
  }
  const source = network.objects.find((o) => o.arrival === 0 && !o.offline)!;
  const last =
    [...network.objects]
      .filter((o) => Number.isFinite(o.arrival) && !o.offline)
      .sort((a, b) => (b.arrival ?? 0) - (a.arrival ?? 0))[0] ?? source;
  flows.push({
    from: "tx:signed",
    to: `net:${source.id}`,
    step: 2,
    area: "transaction",
    label: "signed envelope → entry node",
    kind: "data",
    arc: 2,
    window: [0, 0.18],
  });
  flows.push({
    from: `net:${last.id}`,
    to: "tx:mempool",
    step: 2,
    area: "transaction",
    label: "available message → pending pool",
    kind: "data",
    arc: 2,
    window: [0.85, 1],
  });
  const relations: [string, string, string][] = [
    ["tx:block", "scaleA:capacity", "Explore resource constraints"],
    ["tx:recipient", "app:actor0", "Explore what the record represents"],
    ["app:actor2", "topic:actor0", "Examine the remaining assumptions"],
  ];
  for (const [from, to, label] of relations)
    flows.push({
      from,
      to,
      label,
      step: 0,
      relation: true,
      kind: "data",
      arc: 2,
    });
  const active = stories[input.area],
    offset = areas[input.area].position;
  return {
    id: "connected-atlas",
    title: "One connected blockchain atlas",
    color: areas[input.area].color,
    objects,
    flows,
    mapDistance: 38,
    chapters: active.chapters.map((chapter, index) => ({
      ...chapter,
      focus:
        input.area === "transaction" && index === 2
          ? areas.network.focus
          : move(chapter.focus, offset),
      readout:
        input.area === "transaction" && index === 2
          ? [
              ["PEERS", `${input.network.nodes}`],
              ["WIRE BUDGET", `${input.network.payload} bytes`],
              [
                "MODELED p95",
                `${Math.round(simulateNetwork(input.network).p95)} ms`,
              ],
            ]
          : chapter.readout,
    })),
  };
}

export function applicationIssue(appId: string): string {
  return (
    (
      {
        bitcoin: "security",
        usdc: "stablecoins",
        uniswap: "mev",
        aave: "availability",
        nft: "privacy",
        ens: "wallets",
        chainlink: "bridges",
        buidl: "rwa",
        helium: "depin",
        wfp: "privacy",
      } as Record<string, string>
    )[appId] ?? "scaling"
  );
}

export function legacyFocus(hash: string): {
  area: Area;
  appId?: string;
  topicId?: string;
} {
  const [route, id] = hash.replace(/^#\/?/, "").split("/");
  const map: Record<string, Area> = {
    explore: "transaction",
    journey: "transaction",
    networks: "network",
    compare: "scale",
    applications: "applications",
    signals: "topics",
  };
  return {
    area: map[route] ?? "transaction",
    appId: applications.some((a) => a.id === id) ? id : undefined,
    topicId: topics.some((t) => t.id === id) ? id : undefined,
  };
}
