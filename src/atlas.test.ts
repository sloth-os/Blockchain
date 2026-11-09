import { describe, expect, it } from "vitest";
import { applications, sources, topics } from "./content";
import { defaultNetwork, simulateNetwork, solutions } from "./models";
import { protocolStory } from "./spatial";
import {
  applicationIssue,
  areaOrder,
  areas,
  buildAtlas,
  legacyFocus,
} from "./atlas";

const inputs = {
  protocol: protocolStory(),
  network: defaultNetwork,
  solutionA: solutions[0],
  solutionB: solutions[2],
  bytes: 512,
  demand: 500,
  app: applications[0],
  topic: topics[0],
  area: "transaction" as const,
};

describe("a connected blockchain world", () => {
  it("keeps every area and both comparison lanes together with valid sourced connections", () => {
    for (const area of areaOrder) {
      const world = buildAtlas({ ...inputs, area });
      const ids = new Set(world.objects.map((actor) => actor.id));
      expect(ids.size).toBe(world.objects.length);
      expect(new Set(world.objects.map((actor) => actor.area))).toEqual(
        new Set(areaOrder),
      );
      expect(world.objects.filter((actor) => actor.portal)).toHaveLength(5);
      expect(
        world.objects.some((actor) => actor.id.startsWith("scaleA:")),
      ).toBe(true);
      expect(
        world.objects.some((actor) => actor.id.startsWith("scaleB:")),
      ).toBe(true);
      for (const flow of world.flows) {
        expect(ids.has(flow.from)).toBe(true);
        expect(ids.has(flow.to)).toBe(true);
      }
      for (const actor of world.objects) {
        expect(actor.position.every(Number.isFinite)).toBe(true);
        expect(sources[actor.sourceId!]).toBeDefined();
      }
    }
  });

  it("submits the transaction into the adjustable graph and forwards from a reachable peer", () => {
    for (const topology of ["mesh", "ring", "hub"] as const) {
      for (const offline of [0, 20, 40]) {
        const network = { ...defaultNetwork, nodes: 32, topology, offline };
        const sim = simulateNetwork(network);
        const world = buildAtlas({ ...inputs, network });
        expect(
          world.objects.filter((actor) => actor.networkIndex !== undefined),
        ).toHaveLength(32);
        expect(
          world.objects.some((actor) => /^tx:(rpc|peer)/.test(actor.id)),
        ).toBe(false);
        const entry = world.flows.find((flow) => flow.from === "tx:signed")!;
        expect(entry.to).toBe(`net:n${sim.source}`);
        expect(entry.window![1]).toBeLessThanOrEqual(0.18);
        const exit = world.flows.find((flow) => flow.to === "tx:mempool")!;
        const last = world.objects.find((actor) => actor.id === exit.from)!;
        expect(Number.isFinite(last.arrival)).toBe(true);
        expect(last.offline).toBe(false);
        expect(exit.window![0]).toBeGreaterThanOrEqual(0.85);
        expect(world.chapters[2].focus).toEqual(areas.network.focus);
        expect(world.chapters[2].readout).toContainEqual([
          "MODELED p95",
          `${Math.round(sim.p95)} ms`,
        ]);
      }
    }
  });

  it("preserves graph identities when only the learning focus changes", () => {
    const original = buildAtlas(inputs);
    for (const area of areaOrder) {
      const focused = buildAtlas({ ...inputs, area });
      expect(focused.objects).toEqual(original.objects);
      expect(focused.flows).toEqual(original.flows);
      expect(focused.id).toBe(original.id);
    }
  });

  it("connects every real application to a researched issue", () => {
    for (const app of applications)
      expect(
        topics.some((topic) => topic.id === applicationIssue(app.id)),
      ).toBe(true);
    expect(applicationIssue("usdc")).toBe("stablecoins");
    expect(applicationIssue("uniswap")).toBe("mev");
    expect(applicationIssue("buidl")).toBe("rwa");
  });

  it("interprets old links as world focuses and rejects unknown detail IDs", () => {
    expect(legacyFocus("#/journey").area).toBe("transaction");
    expect(legacyFocus("#/networks").area).toBe("network");
    expect(legacyFocus("#/compare").area).toBe("scale");
    expect(legacyFocus("#/applications/chainlink")).toEqual({
      area: "applications",
      appId: "chainlink",
    });
    expect(legacyFocus("#/signals/privacy")).toEqual({
      area: "topics",
      topicId: "privacy",
    });
    expect(legacyFocus("#/applications/unknown").appId).toBeUndefined();
    expect(legacyFocus("#/signals/unknown").topicId).toBeUndefined();
    expect(legacyFocus("#/missing").area).toBe("transaction");
  });
});
