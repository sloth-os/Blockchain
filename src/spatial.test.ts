import { describe, expect, it } from "vitest";
import { applications, sources, topics } from "./content";
import {
  defaultNetwork,
  linkedDemoHeaders,
  merkleLevels,
  merkleRoot,
  sha256,
  signTransaction,
  simulateNetwork,
  solutions,
  workload,
} from "./models";
import {
  applicationStory,
  peerStory,
  protocolStory,
  solutionStory,
  spatialObjectValue,
  topicStory,
  type SpatialStory,
} from "./spatial";

function validStory(story: SpatialStory) {
  const ids = new Set(story.objects.map((a) => a.id));
  expect(ids.size).toBe(story.objects.length);
  for (const actor of story.objects) {
    expect(actor.position.every(Number.isFinite)).toBe(true);
    expect(actor.detail.trim()).not.toBe("");
    expect(actor.trust.trim()).not.toBe("");
    expect(actor.step).toBeLessThan(story.chapters.length);
  }
  for (const flow of story.flows) {
    expect(ids.has(flow.from)).toBe(true);
    expect(ids.has(flow.to)).toBe(true);
    if (flow.window) {
      expect(flow.window[0]).toBeGreaterThanOrEqual(0);
      expect(flow.window[1]).toBeLessThanOrEqual(1);
      expect(flow.window[1]).toBeGreaterThan(flow.window[0]);
    }
  }
  for (const chapter of story.chapters)
    expect(sources[chapter.source]).toBeDefined();
}

describe("spatial explanations describe actual data and mechanisms", () => {
  it("creates valid, sourced graphs for every application, topic and protocol phase", () => {
    const stories = [
      protocolStory(),
      ...applications.map(applicationStory),
      ...topics.map(topicStory),
    ];
    for (const story of stories) validStory(story);
  });
  it("exposes the real four-leaf Merkle tree and block commitment in world objects", async () => {
    const tx = await signTransaction("3", "sam.atlas");
    const tree = await merkleLevels([tx.payload, "second", "third", "fourth"]);
    expect(tree.map((level) => level.length)).toEqual([4, 2, 1]);
    expect(tree[1][0]).toBe(await sha256(tree[0][0] + tree[0][1]));
    expect(tree[2][0]).toBe(
      await merkleRoot([tx.payload, "second", "third", "fourth"]),
    );
    const header = await linkedDemoHeaders(tree[2][0]);
    const story = protocolStory({
      tx,
      tree,
      root: tree[2][0],
      headerHash: header.currentHash,
      recipient: "sam.atlas",
      amount: "3",
      verified: true,
    });
    expect(story.objects.filter((o) => o.id.startsWith("leaf"))).toHaveLength(
      4,
    );
    expect(story.objects.filter((o) => o.id.startsWith("branch"))).toHaveLength(
      2,
    );
    expect(story.objects.find((o) => o.id === "root")?.facts).toContainEqual([
      "Root",
      tree[2][0],
    ]);
    expect(story.objects.find((o) => o.id === "signed")?.facts).toContainEqual([
      "Full signature",
      tx.signature,
    ]);
    expect(story.objects.find((o) => o.id === "recipient")?.label).toBe(
      "SAM’S WALLET",
    );
    expect(story.objects.find((o) => o.id === "block")?.facts).toContainEqual([
      "Header hash",
      header.currentHash,
    ]);
    const changed = protocolStory({ tx, rejected: true });
    const received = changed.objects.find((o) => o.id === "payload")!;
    expect(received.value).toContain("ALTERED");
    expect(
      received.facts.find(([k]) => k === "Received payload")?.[1],
    ).toContain('"amount":999999');
    expect(received.facts).toContainEqual(["Signed original", tx.payload]);
  });
  it("orders relays and commitments causally within a phase", () => {
    const story = protocolStory();
    const flow = (from: string, to: string) =>
      story.flows.find((f) => f.from === from && f.to === to)!;
    expect(flow("signed", "rpc").window![1]).toBeLessThanOrEqual(
      flow("rpc", "peer0").window![0],
    );
    expect(flow("rpc", "peer0").window![1]).toBeLessThanOrEqual(
      flow("peer0", "peer1").window![0],
    );
    expect(flow("leaf0", "branch0").window![1]).toBeLessThanOrEqual(
      flow("branch0", "root").window![0],
    );
    expect(flow("branch0", "root").window![1]).toBeLessThanOrEqual(
      flow("root", "block").window![0],
    );
    expect(flow("block", "v0").window![1]).toBeLessThanOrEqual(
      flow("v0", "settled").window![0],
    );
  });
  it("does not present an unavailable local signature as verified", () => {
    expect(protocolStory().chapters[3].readout).toContainEqual([
      "AUTHORIZATION",
      "Explanatory model",
    ]);
    const rejected = protocolStory({ rejected: true });
    expect(rejected.chapters[3].readout).toContainEqual([
      "AUTHORIZATION",
      "REJECTED",
    ]);
  });
  it("distinguishes oracle messages from money and redemption requests from settlement", () => {
    const oracle = applicationStory(
      applications.find((a) => a.id === "chainlink")!,
    );
    expect(oracle.flows.map((f) => f.kind)).toEqual(["data", "proof", "data"]);
    const stablecoin = applicationStory(
      applications.find((a) => a.id === "usdc")!,
    );
    expect(
      stablecoin.flows.find((f) => f.from === "actor3" && f.to === "actor1")
        ?.kind,
    ).toBe("data");
    expect(
      stablecoin.flows.find((f) => f.from === "actor1" && f.to === "actor3")
        ?.kind,
    ).toBe("value");
  });
  it("keeps 3D throughput readouts tied to the adjustable resource model", () => {
    for (const solution of solutions) {
      const story = solutionStory(solution, 512, 500),
        m = workload(solution, 512, 500);
      validStory(story);
      expect(story.objects[1].facts).toContainEqual([
        "Backlog at 60s",
        `${Math.ceil(m.backlog).toLocaleString()} calls`,
      ]);
      expect(story.objects[1].fill).toBeLessThanOrEqual(1);
    }
  });
  it("separates predicted arrivals, waiting, received, offline and disconnected peers", () => {
    const story = peerStory(defaultNetwork),
      sim = simulateNetwork(defaultNetwork),
      peer = story.objects[1];
    expect(spatialObjectValue(peer, true, -1)).toContain("predicted");
    expect(spatialObjectValue(peer, true, sim.times[1] - 1)).toContain(
      "WAITING",
    );
    expect(spatialObjectValue(peer, true, sim.times[1])).toContain("RECEIVED");
    const failed = peerStory({
      ...defaultNetwork,
      topology: "hub",
      offline: 20,
    });
    expect(spatialObjectValue(failed.objects[0], true, 1000)).toBe("OFFLINE");
    expect(spatialObjectValue(failed.objects[5], true, 1000)).toBe(
      "UNREACHABLE",
    );
  });
});
