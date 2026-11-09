import { areas } from "../atlas";
import { networkEdges } from "../models";
import type { SpatialStory } from "../spatial";
import { has, missions, stationsFor, type GameState } from "./model";

export function gameWorld(
  base: SpatialStory,
  state: GameState,
  hashes: string[] = [],
): SpatialStory {
  const mission = missions[state.mission],
    center = areas[mission.area].position;
  const stations = stationsFor(state);
  const actors = stations.map((node) => ({
    id: `game:${mission.id}:${node.id}`,
    localId: node.id,
    area: "game",
    label: node.name.toUpperCase(),
    value:
      node.id.startsWith("leaf") && hashes[Number(node.id.slice(4))]
        ? hashes[Number(node.id.slice(4))].slice(0, 12) + "…"
        : node.value,
    kind: node.kind,
    position: [center[0] + node.x, 0.28, center[2] + node.z] as [
      number,
      number,
      number,
    ],
    step: 0,
    detail: mission.brief,
    trust: mission.lesson,
    facts: [
      ["Role", node.name],
      ["Mission", mission.title],
      ["Requirement", mission.brief],
    ] as [string, string][],
    color: has(state, node.id) ? "#c4f568" : (node.color ?? mission.color),
    collected: !!node.collectible && has(state, node.id),
    sourceId: mission.source,
  }));
  const prefix = `game:${mission.id}:`;
  const pairs: [string, string][] =
    state.mission === 1
      ? state.topology
        ? networkEdges(8, state.topology).map(([a, b]) => [
            `peer${a}`,
            `peer${b}`,
          ])
        : []
      : state.mission === 2
        ? [0, 1, 2, 3].map((i) => [`leaf${i}`, "forge"])
        : state.mission === 3
          ? [0, 1, 2, 3].map((i) => [`vote${i}`, "quorum"])
          : state.mission === 4
            ? []
            : state.mission === 5
              ? [
                  ["burn", "issuer"],
                  ["issuer", "bank"],
                  ["bank", "customer"],
                ]
              : state.mission === 6
                ? [
                    ["lock", "header"],
                    ["header", "verifier"],
                    ["proof", "verifier"],
                    ["verifier", "destination"],
                  ]
                : [["payload", "sign"]];
  return {
    ...base,
    color: mission.color,
    objects: [...base.objects, ...actors],
    flows: [
      ...base.flows,
      ...pairs.map(([from, to]) => ({
        from: prefix + from,
        to: prefix + to,
        area: "game",
        step: 0,
        kind: "data" as const,
        label: state.mission === 1 ? "available relay link" : "mission pathway",
        arc: 0.25,
      })),
    ],
    chapters: [
      {
        title: mission.title,
        caption: mission.brief,
        source: mission.source,
        focus: [center[0], 0.6, center[2]],
        readout: [],
      },
    ],
  };
}
