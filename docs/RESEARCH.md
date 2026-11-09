# Research notes

Research snapshot: **8 November 2026 (America/Los_Angeles)**. Linked documentation was retrieved during implementation. This is an educational synthesis, not an exhaustive literature review, financial recommendation, news service or empirical performance study.

## Method

1. Start with primary protocol explanations and standards for mechanics: Bitcoin’s paper; Ethereum’s transaction, networking, consensus and scaling documentation; Solana’s account/transaction documentation; the Lightning paper; ERC-721.
2. Use an organization’s own product documentation or publication to explain its real-world application. These describe the organization’s system, not an independent audit of its claims. Avoid volatile adoption totals, TVL, prices, yields or projected TPS.
3. Separate a ledger’s cryptographic guarantees from real-world inputs, reserve assets, ownership rights, governance, service quality and customer demand.
4. Choose ten hot issues because they expose different design boundaries: scaling, money, legal rights, ordering, cross-chain verification, data, account authorization, information disclosure, future cryptography and physical-world incentives. Their ordering is editorial, **not** a measured ranking of search or social activity. No claim is made that these are the latest breaking events.
5. Make examples adjustable, cite assumptions next to results, and provide formulas. Use actual local cryptography where it can meaningfully demonstrate integrity.

## Primary sources and their role

| Source                                                                                                                                                                       | What it informs                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [Bitcoin white paper](https://bitcoin.org/bitcoin.pdf) (2008)                                                                                                                | UTXO-style spending, hashes, Merkle commitments, proof of work, chain selection and confirmation confidence.                        |
| [Ethereum transactions](https://ethereum.org/en/developers/docs/transactions/)                                                                                               | Transaction fields, authorization, execution and the account model.                                                                 |
| [Ethereum networking](https://ethereum.org/en/developers/docs/networking-layer/)                                                                                             | Peer discovery; execution vs consensus stacks; gossip and request/response.                                                         |
| [Ethereum proof of stake](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/)                                                                                 | 12-second slots, 32-slot epochs, stake-weighted votes, checkpoint justification/finality.                                           |
| [Optimistic rollups](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/)                                                                                    | Batching, L1 data, sequencers, fault challenges and canonical withdrawal periods.                                                   |
| [ZK rollups](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)                                                                                                    | Validity proofs, verification, settlement, data and proving costs.                                                                  |
| [Data availability](https://ethereum.org/en/developers/docs/data-availability/)                                                                                              | Why correct execution does not imply reconstructible, accessible data.                                                              |
| [MEV](https://ethereum.org/en/developers/docs/mev/)                                                                                                                          | Reordering, inclusion/exclusion, arbitrage, extraction and mitigations.                                                             |
| [Account abstraction](https://ethereum.org/en/roadmap/account-abstraction/)                                                                                                  | Custom authorization, recovery, sponsorship, bundlers and usability.                                                                |
| [Bridges](https://ethereum.org/en/developers/docs/bridges/)                                                                                                                  | Interoperability and added verification/custody assumptions.                                                                        |
| [Circle transparency](https://www.circle.com/transparency)                                                                                                                   | USDC issuance/redemption, reserve reporting and institutional boundaries.                                                           |
| [Uniswap swaps](https://docs.uniswap.org/concepts/protocol/swaps)                                                                                                            | Pool swaps, version-specific invariants, concentrated liquidity, price impact and slippage.                                         |
| [Aave V3 overview](https://aave.com/docs/aave-v3/overview)                                                                                                                   | Supplied liquidity, interest-bearing aTokens, collateralized borrowing and liquidation.                                             |
| [ERC-721](https://eips.ethereum.org/EIPS/eip-721)                                                                                                                            | Unique token IDs, ownership, approvals and transfer semantics; no automatic copyright/royalty guarantee.                            |
| [ENS protocol](https://docs.ens.domains/learn/protocol/)                                                                                                                     | Registry, registrar, resolver, hierarchical names and records.                                                                      |
| [Chainlink Data Feeds](https://docs.chain.link/data-feeds)                                                                                                                   | Source aggregation, oracle reports, on-chain consumers and freshness safeguards.                                                    |
| [WFP Building Blocks](https://innovation.wfp.org/project/building-blocks)                                                                                                    | Coordination of humanitarian assistance through a shared blockchain platform. No public token investment is implied.                |
| [BUIDL launch publication](https://securitize.io/learn/press/blackrock-launches-first-tokenized-fund-buidl-on-the-ethereum-network) (Securitize, 20 March 2024)              | Ethereum tokenization of BlackRock fund interests, with eligible investors and traditional legal/administrative dependencies.       |
| [Helium documentation](https://docs.helium.com/)                                                                                                                             | IoT/mobile wireless networks, community hotspots, service and incentives.                                                           |
| [Zero-knowledge proofs](https://ethereum.org/en/zero-knowledge-proofs/)                                                                                                      | Statements, private witnesses, verification and disclosure boundaries.                                                              |
| [NIST post-quantum standards announcement](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards) (13 August 2024) | Finalized initial post-quantum standards and migration context. It does not establish a date when blockchain signatures will break. |
| [Solana transactions](https://solana.com/docs/core/transactions)                                                                                                             | Account lists, instructions, signatures and differences from EVM transaction formats.                                               |
| [Lightning paper](https://lightning.network/lightning-network-paper.pdf) (2016)                                                                                              | Payment channels, off-chain updates, routed liquidity and on-chain dispute/close paths.                                             |

The GitHub deployment follows [GitHub’s custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Interpretation details

### Different questions, different solutions

The six-layer comparison makes requirements explicit:

1. **Trust:** Independent verification vs a trusted operator. A conventional database can be appropriate when parties accept a central authority.
2. **Data:** Integrity, replay protection, compact inclusion commitments, availability and retention. A hash alone does not supply missing data.
3. **Network:** Propagation and robustness. Redundant edges cost traffic; a hub concentrates failure risk.
4. **Consensus:** Convergent ordering and settlement assurances. Signatures do not resolve competing valid spends. PoW and PoS incur different physical/economic costs.
5. **Execution:** Compute, storage, bandwidth, state contention and verification. Parallel execution, channels and rollups solve different bottlenecks.
6. **Economy:** Incentives, external data, actual demand, redemption and legal rights. Internal consistency cannot establish external truth.

### Throughput experiment

The common model is:

```text
capacity        = min(effective bytes per second / bytes per call, execution ceiling)
completed/s     = min(capacity, incoming demand/s)
backlog at 60 s = max(0, incoming demand/s - completed/s) × 60
```

All budgets below are fixed teaching assumptions, **not present-day measurements or advertised chain TPS**:

| Design            | Effective byte budget/s |             Execution ceiling/s | Important omission                                                                                  |
| ----------------- | ----------------------: | ------------------------------: | --------------------------------------------------------------------------------------------------- |
| Bitcoin L1        |         1,000,000 / 600 |                    Byte-limited | Payload is interpreted as virtual bytes; witness composition and actual block intervals vary.       |
| Ethereum L1       |                 100,000 | 30,000,000 / 12 / 70,000 ≈ 35.7 | Assumed gas budget and contract-call cost are illustrative, not current network parameters.         |
| Optimistic rollup |                 250,000 |                           1,200 | No named rollup benchmark; no congestion, compression variability or challenge delay in throughput. |
| ZK rollup         |                 350,000 |                           2,000 | No proving delay or hardware model; receipt throughput is not settlement speed.                     |
| Solana L1         |                 900,000 |                           3,000 | No vote transactions, contention, compute variation or hardware benchmarking.                       |
| Lightning         |       600,000 aggregate |                 5,000 aggregate | Assumes independent, successfully routed, liquid channels; not additional Bitcoin L1 capacity.      |

These bars teach saturation and resource limits. They cannot determine which production system performs best. Real comparisons need equivalent workloads, reproducible hardware, transaction semantics, measured success rates, fee conditions, contention and a stated confirmation/finality policy.

### Network experiment

The deterministic undirected graph adds a ring edge per node and, for a mesh, a chord five nodes away (deduplicated). A hub connects all spokes to node zero. Offline nodes are removed, starting from the hub in the hub experiment and from the last node otherwise. The first remaining online node is the source. Dijkstra-style first arrival uses:

```text
link time = latency × [1 + ((a × 7 + b × 3) mod 9) / 30]
            + payload bits / bandwidth
```

Percentiles include the source at time zero and only reachable nodes. Reachability is reported independently so a disconnected graph cannot appear healthy because it has a small percentile. Traffic counts one payload in each direction over each edge reachable from the source. At 1× playback the animation runs at one quarter model speed; the speed control scales this presentation. Reduced motion completes a requested broadcast immediately. Transport overhead, queues, packet loss, hash announcements, compact blocks, retransmission, adversarial peers and real gossip fanout are excluded.

### Cryptographic exercise

The browser’s Web Crypto API generates an ephemeral Ed25519 key, signs a JSON payload and verifies its bytes. Altering the amount invalidates the signature. A separate exercise computes real SHA-256 hashes and a simplified four-leaf Merkle root, hashing concatenated hexadecimal child digests and duplicating odd final leaves. These encodings are explicitly pedagogical; Bitcoin, Ethereum and Solana specify their own structures and domain rules.

The demo does not implement real balances, consensus, a replay-protected network, legal ownership or production wallet software. It demonstrates integrity and authorization while explaining the remaining requirements.

### Spatial narratives and motion

The seven-phase transaction uses an editorial 42-second timeline. Its elapsed seconds are **narration time**, not a measured blockchain’s confirmation or finality time. The broadcast phase routes through the same adjustable peer graph used by the propagation experiment, with the same topology, failed nodes, message-size budget and modeled arrivals. The graph defaults to 18 peers; there is no separate miniature relay network. Only the displayed model milliseconds follow the deterministic link calculation.

Protocol message paths have explicit causal windows: submission precedes relay, relay precedes forwarding, child hashes precede parent commitments, the root precedes the header commitment, and proposals precede returning votes. Full local signatures, public keys, transaction hashes, all four Merkle leaves, both intermediate hashes, the root and the header hash are inspectable. Cryptography is computed locally when the draft is prepared; animation explains the relationship between those results rather than timing the computation.

The semantic scene model distinguishes data, value, proof and vote paths. For example, an oracle report is not a transfer of money; a redemption request and a redemption settlement have different directions. Application arrows represent conceptual participants and processing stages rather than complete production message protocols. Domain-specific trust boundaries remain linked to primary sources.

Application/issue message motions repeat while their process is playing; manual phase selection pauses playback. All five learning areas and both comparison lanes coexist in one world. Camera focus changes the active explanation, while the transaction and experiment settings persist. Dashed cross-area connections are learning relationships, not simulated protocol messages. Comparison motion is normalized to offered load to emphasize a bottleneck; particle velocities, geometric sizes and decorative pulses are not empirical latency or throughput measurements. Predicted peer arrival is explicitly distinguished from receipt; offline and disconnected peers never claim to have received a message.

The three validator glyphs are an equal-weight schematic. Ethereum uses stake-weighted checkpoint votes, Bitcoin uses accumulated proof of work, and neither is implemented as real consensus here. Fast display motion does not imply instant settlement, a guaranteed peg, legal ownership or off-chain delivery.
