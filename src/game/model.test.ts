import { describe, expect, it } from "vitest";
import { buildAtlas } from "../atlas";
import { applications, topics } from "../content";
import { defaultNetwork, solutions } from "../models";
import { protocolStory } from "../spatial";
import { gameWorld } from "./spatial";
import {
  designDelivery,
  distance,
  freshSave,
  grade,
  hazardPosition,
  hit,
  initialRun,
  interact,
  missions,
  movePosition,
  objectives,
  readSave,
  recordBest,
  resumeMission,
  routeMilliseconds,
  stake,
  unlocked,
  type GameState,
} from "./model";
import {
  checkBridgeProof,
  checkVote,
  makeBridgeProof,
  makeVotes,
} from "./crypto";

const start = (mission: number): GameState => ({
  ...initialRun(mission),
  status: "playing",
});

describe("campaign protocol boundaries", () => {
  it("keeps every mission pathway attached to existing 3D stations, including an unrepaired network", () => {
    const base = buildAtlas({
      protocol: protocolStory(),
      network: defaultNetwork,
      solutionA: solutions[0],
      solutionB: solutions[2],
      bytes: 512,
      demand: 500,
      app: applications[0],
      topic: topics[0],
      area: "transaction",
    });
    for (let index = 0; index < missions.length; index++) {
      for (const topology of [null, "mesh"] as const) {
        const world = gameWorld(base, { ...start(index), topology });
        const ids = new Set(world.objects.map((actor) => actor.id));
        expect(ids.size).toBe(world.objects.length);
        for (const flow of world.flows) {
          expect(ids.has(flow.from), `mission ${index}: ${flow.from}`).toBe(
            true,
          );
          expect(ids.has(flow.to), `mission ${index}: ${flow.to}`).toBe(true);
        }
      }
    }
  });
  it("requires a recovered payload and successful signature verification", () => {
    let s = start(0);
    expect(interact(s, "sign", "original", true).status).toBe("playing");
    s = interact(s, "payload");
    expect(interact(s, "sign", "original", false).status).toBe("playing");
    expect(interact(s, "sign", "altered", false).energy).toBe(88);
    expect(interact(s, "sign", "original", true).status).toBe("won");
    expect(
      interact({ ...s, status: "paused" }, "sign", "original", true).status,
    ).toBe("paused");
  });

  it("evaluates resilience and latency together, then enforces real network edges", () => {
    expect(designDelivery("hub").qualifies).toBe(false);
    expect(designDelivery("ring").qualifies).toBe(false);
    expect(designDelivery("mesh").qualifies).toBe(true);
    let s = start(1);
    expect(interact(s, "peer0").route).toEqual([]);
    expect(interact(s, "repair", "hub").topology).toBeNull();
    s = interact(s, "repair", "mesh");
    expect(interact(s, "peer4").route).toEqual([]);
    s = interact(s, "peer0");
    expect(interact(s, "peer4").route).toEqual([0]);
    expect(interact(s, "peer4").energy).toBe(88);
    s = interact(interact(s, "peer3"), "peer4");
    expect(s.route).toEqual([0, 3, 4]);
    expect(s.status).toBe("won");
    expect(routeMilliseconds(s.route)).toBeCloseTo(192);
  });

  it("requires all four Merkle leaves and a matching actual root", () => {
    let s = start(2);
    expect(interact(s, "forge", undefined, true).status).toBe("playing");
    for (let i = 0; i < 4; i++) s = interact(s, `leaf${i}`);
    s = interact(s, "leaf0");
    expect(s.bag).toHaveLength(4);
    expect(interact(s, "forge", undefined, false).status).toBe("playing");
    expect(interact(s, "forge", undefined, true).status).toBe("won");
  });

  it("counts stake only once and rejects another block's vote", () => {
    let s = start(3);
    s = interact(
      interact(s, "vote0", undefined, true),
      "vote0",
      undefined,
      true,
    );
    expect(stake(s)).toBe(34);
    s = interact(s, "vote1", undefined, true);
    expect(stake(s)).toBe(60);
    expect(interact(s, "quorum").status).toBe("playing");
    s = interact(s, "vote3", undefined, false);
    expect(stake(s)).toBe(60);
    expect(s.energy).toBe(100);
    s = interact(s, "vote2", undefined, true);
    expect(stake(s)).toBe(82);
    expect(interact(s, "quorum").status).toBe("won");
  });

  it("requires capacity, settlement and validity proofs in the scaling scenario", () => {
    const s = start(4);
    for (const id of [
      "bitcoin",
      "ethereum",
      "lightning",
      "optimistic",
      "solana",
    ])
      expect(interact(s, id).status).toBe("playing");
    expect(interact(s, "solana").feedback.body).toContain("own base layer");
    expect(interact(s, "zk").status).toBe("won");
  });

  it("keeps ledger burns separate from issuer authorization and bank delivery", () => {
    let s = start(5);
    expect(interact(s, "customer").status).toBe("playing");
    expect(interact(s, "bank").bag).toEqual([]);
    expect(interact(s, "issuer", "bank").bag).toEqual([]);
    s = interact(s, "burn");
    expect(interact(s, "customer").status).toBe("playing");
    expect(interact(s, "issuer", "code").energy).toBe(88);
    s = interact(s, "issuer", "bank");
    expect(interact(s, "customer").status).toBe("playing");
    s = interact(s, "bank");
    expect(interact(s, "customer").status).toBe("won");
  });

  it("requires source event, checkpoint, valid proof, and destination acceptance", () => {
    let s = start(6);
    expect(interact(s, "shortcut").energy).toBe(88);
    expect(interact(s, "proof").bag).toEqual([]);
    s = interact(s, "lock");
    s = interact(s, "proof");
    expect(interact(s, "verifier", "authentic", true).bag).not.toContain(
      "verified",
    );
    expect(interact(s, "destination").status).toBe("playing");
    s = interact(s, "header");
    expect(interact(s, "verifier", "authentic", false).energy).toBe(88);
    s = interact(s, "verifier", "authentic", true);
    expect(interact(s, "destination").status).toBe("won");
    expect(
      objectives(interact(s, "destination")).every(([, complete]) => complete),
    ).toBe(true);
  });
});

describe("real local cryptographic puzzles", () => {
  it("verifies the same block and rejects changed commitments and signed dissent", async () => {
    const votes = await makeVotes("block-commitment");
    expect(
      await Promise.all(
        votes.map((vote) => checkVote(vote, "block-commitment")),
      ),
    ).toEqual([true, true, true, false]);
    expect(await checkVote(votes[0], "tampered-commitment")).toBe(false);
  });
  it("reconstructs a Merkle root and rejects altered events, paths and roots", async () => {
    const proof = await makeBridgeProof("seed123");
    expect(await checkBridgeProof(proof)).toBe(true);
    expect(await checkBridgeProof(proof, true)).toBe(false);
    expect(
      await checkBridgeProof({
        ...proof,
        siblings: ["0".repeat(64), proof.siblings[1]],
      }),
    ).toBe(false);
    expect(await checkBridgeProof({ ...proof, root: "0".repeat(64) })).toBe(
      false,
    );
  });
});

describe("courier movement and recoverable progress", () => {
  it("normalizes diagonal movement, bounds the arena and clamps frame spikes", () => {
    const origin = { x: 0, z: 0 };
    const straight = movePosition(origin, { x: 1, z: 0 }, 0.05);
    const diagonal = movePosition(origin, { x: 1, z: 1 }, 0.05);
    expect(distance(origin, straight)).toBeCloseTo(distance(origin, diagonal));
    expect(
      distance(origin, movePosition(origin, { x: 1, z: 0 }, 0.05, true)),
    ).toBeGreaterThan(distance(origin, straight));
    expect(movePosition({ x: 7.2, z: 6.1 }, { x: 1, z: 1 }, 30)).toEqual({
      x: 7.25,
      z: 6.15,
    });
    expect(movePosition(origin, { x: 0, z: 0 }, 0.05)).toEqual(origin);
    expect(movePosition(origin, { x: 1, z: 1 }, -1)).toEqual(origin);
    expect(hazardPosition(0, 0, true)).toEqual(hazardPosition(0, 900, true));
    expect(hazardPosition(0, 0, false)).not.toEqual(
      hazardPosition(0, 10, false),
    );
  });

  it("suspends damage while paused or choosing and ends an exhausted attempt", () => {
    const paused = { ...start(1), status: "paused" as const };
    expect(hit(paused)).toBe(paused);
    const choosing = { ...start(0), choice: "signature" as const };
    expect(hit(choosing)).toBe(choosing);
    let s = start(1);
    for (let i = 0; i < 6; i++) s = hit(s);
    expect(s.status).toBe("lost");
    expect(s.energy).toBe(0);
    expect(interact(s, "repair", "mesh")).toBe(s);
  });

  it("locks future missions, resumes checkpoints and preserves independent best records", () => {
    let save = freshSave();
    expect(unlocked(save, 0)).toBe(true);
    expect(unlocked(save, 1)).toBe(false);
    expect(resumeMission(save)).toBe(0);
    const result = grade(start(0), 17.4);
    expect(result.stars).toBe(3);
    expect(grade({ ...start(0), mistakes: 2 }, 2).stars).toBe(2);
    save = recordBest(save, 0, result);
    save = recordBest(save, 0, { score: 100, stars: 1, seconds: 5 });
    expect(save.best.seal).toEqual({ ...result, seconds: 5 });
    expect(resumeMission(save)).toBe(1);
    expect(unlocked(save, 1)).toBe(true);
    expect(unlocked(save, 2)).toBe(false);
    for (let i = 1; i < missions.length; i++)
      save = recordBest(save, i, result);
    expect(resumeMission(save)).toBe(0);
    expect(unlocked(save, 6)).toBe(true);
  });

  it("ignores corrupt or out-of-range saved records", () => {
    expect(readSave("broken-json")).toEqual(freshSave());
    expect(readSave('{"version":2,"best":{}}')).toEqual(freshSave());
    expect(
      readSave(
        '{"version":1,"best":{"seal":{"stars":99,"score":999999,"seconds":-5}}}',
      ),
    ).toEqual(freshSave());
    const save = recordBest(freshSave(), 0, grade(start(0), 20));
    expect(readSave(JSON.stringify(save))).toEqual(save);
  });
});
