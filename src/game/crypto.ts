import { merkleLevels, sha256 } from "../models";

export async function makeVotes(commitment: string) {
  return Promise.all(
    [0, 1, 2, 3].map(async (index) => {
      const keys = await crypto.subtle.generateKey("Ed25519", true, [
        "sign",
        "verify",
      ]);
      const bytes = new TextEncoder().encode(
        index === 3 ? `another-block:${commitment}` : commitment,
      );
      const signature = await crypto.subtle.sign(
        "Ed25519",
        keys.privateKey,
        bytes,
      );
      return { publicKey: keys.publicKey, signature };
    }),
  );
}
export async function checkVote(
  vote: Awaited<ReturnType<typeof makeVotes>>[number],
  commitment: string,
) {
  return crypto.subtle.verify(
    "Ed25519",
    vote.publicKey,
    vote.signature,
    new TextEncoder().encode(commitment),
  );
}
export async function makeBridgeProof(seed: string) {
  const event = JSON.stringify({
    type: "demo-lock",
    asset: "ATLAS",
    amount: 1,
    source: "A",
    nonce: seed.slice(0, 12),
  });
  const tree = await merkleLevels([
    event,
    "source event 2",
    "source event 3",
    "source event 4",
  ]);
  return { event, siblings: [tree[0][1], tree[1][1]], root: tree[2][0] };
}
export async function checkBridgeProof(
  proof: Awaited<ReturnType<typeof makeBridgeProof>>,
  altered = false,
) {
  let hash = await sha256(
    altered ? proof.event.replace('"amount":1', '"amount":9') : proof.event,
  );
  for (const sibling of proof.siblings) hash = await sha256(hash + sibling);
  return hash === proof.root;
}
