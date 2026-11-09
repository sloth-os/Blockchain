import { describe, expect, it } from "vitest";
import { applications, layers, sources, topics } from "./content";
import {
  defaultNetwork,
  merkleRoot,
  networkEdges,
  sha256,
  signTransaction,
  simulateNetwork,
  solutions,
  verifyTransaction,
  workload,
} from "./models";

describe("peer propagation and failures", () => {
  it("constructs distinct undirected edges and a sparse ring", () => {
    const edges = networkEdges(18, "mesh");
    expect(new Set(edges.map((e) => e.join(","))).size).toBe(edges.length);
    expect(edges.every(([a, b]) => a < b && a >= 0 && b < 18)).toBe(true);
    expect(networkEdges(18, "ring")).toHaveLength(18);
  });
  it("reaches every healthy node and reports consistent percentiles", () => {
    const sim = simulateNetwork(defaultNetwork);
    expect(sim.reachable).toBe(18);
    expect(sim.times[0]).toBe(0);
    expect(sim.p95).toBeGreaterThanOrEqual(sim.p50);
    expect(sim.total).toBeGreaterThan(0);
    expect(sim.wireBytes).toBe(sim.edges.length * defaultNetwork.payload * 2);
  });
  it("makes serialization and slower links affect first arrival", () => {
    const base = simulateNetwork(defaultNetwork);
    expect(
      simulateNetwork({ ...defaultNetwork, payload: 8192 }).p95,
    ).toBeGreaterThan(base.p95);
    expect(
      simulateNetwork({ ...defaultNetwork, bandwidth: 64 }).p95,
    ).toBeGreaterThan(base.p95);
    expect(
      simulateNetwork({ ...defaultNetwork, latency: 500 }).p95,
    ).toBeGreaterThan(base.p95);
  });
  it("isolates online spokes when the hub fails", () => {
    const sim = simulateNetwork({
      ...defaultNetwork,
      topology: "hub",
      offline: 10,
    });
    expect(sim.down.has(0)).toBe(true);
    expect(sim.source).toBe(1);
    expect(sim.reachable).toBe(1);
    expect(sim.times[2]).toBe(Infinity);
    expect(sim.wireBytes).toBe(0);
  });
  it("retains alternate paths in a mesh with offline peers", () => {
    const sim = simulateNetwork({ ...defaultNetwork, offline: 20 });
    expect(sim.down.size).toBe(3);
    expect(sim.reachable).toBe(15);
    expect(sim.times[17]).toBe(Infinity);
  });
  it("always chooses an online source when several hub spokes are also offline", () => {
    const sim = simulateNetwork({
      ...defaultNetwork,
      topology: "hub",
      offline: 40,
    });
    expect(sim.down.has(sim.source)).toBe(false);
    expect(sim.source).toBe(7);
    expect(sim.reachable).toBe(1);
    expect(sim.times[0]).toBe(Infinity);
    expect(sim.times[1]).toBe(Infinity);
  });
});

describe("workload limits", () => {
  it("caps service and accumulates unserved calls without claiming negative backlog", () => {
    const bitcoin = solutions[0];
    const overloaded = workload(bitcoin, 250, 100);
    expect(overloaded.capacity).toBeCloseTo(6.666666, 4);
    expect(overloaded.served).toBe(overloaded.capacity);
    expect(overloaded.backlog).toBeCloseTo(5600);
    expect(workload(bitcoin, 250, 1).backlog).toBe(0);
    expect(workload(bitcoin, 1000, 100).capacity).toBeLessThan(
      overloaded.capacity,
    );
  });
  it("honors an execution ceiling even when bandwidth remains", () => {
    const eth = solutions.find((s) => s.id === "ethereum")!;
    expect(workload(eth, 256, 500).capacity).toBe(eth.executionLimit);
  });
});

describe("real demo cryptography", () => {
  it("matches the published SHA-256 test vector", async () => {
    expect(await sha256("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
  it("verifies the signed payload and rejects a changed amount", async () => {
    const tx = await signTransaction("2.5", "maya.atlas");
    expect(await verifyTransaction(tx, false)).toBe(true);
    expect(await verifyTransaction(tx, true)).toBe(false);
    expect(JSON.parse(tx.payload)).toMatchObject({
      amount: 2.5,
      to: "maya.atlas",
      chainId: "atlas-demo-1",
    });
    expect(tx.hash).toHaveLength(64);
    expect(tx.signature).toHaveLength(128);
  });
  it("makes Merkle commitments sensitive to content and ordering", async () => {
    const root = await merkleRoot(["a", "b", "c"]);
    expect(root).toHaveLength(64);
    expect(await merkleRoot(["a", "b", "c"])).toBe(root);
    expect(await merkleRoot(["a", "b", "d"])).not.toBe(root);
    expect(await merkleRoot(["b", "a", "c"])).not.toBe(root);
    expect(await merkleRoot([])).toBe(await sha256(""));
  });
});

describe("research coverage", () => {
  it("contains ten distinct applications and ten sourced issues", () => {
    expect(applications).toHaveLength(10);
    expect(topics).toHaveLength(10);
    expect(new Set(applications.map((a) => a.id)).size).toBe(10);
    expect(new Set(topics.map((t) => t.id)).size).toBe(10);
    for (const app of applications) {
      expect(sources[app.source]).toBeDefined();
      expect(app.flow).toHaveLength(4);
    }
    for (const topic of topics) {
      expect(topic.mechanism).toHaveLength(4);
      for (const s of topic.sources) expect(sources[s]).toBeDefined();
    }
    for (const item of [...layers, ...solutions])
      expect(sources[item.source]).toBeDefined();
  });
});
