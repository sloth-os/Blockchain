# Chain Atlas

**An interactive, 3D field guide to how blockchain works.**

Explore the website at **https://sloth-os.github.io/Blockchain/**.

Chain Atlas connects a visual peer network to actual browser cryptography, network experiments, system design trade-offs, real applications and a sourced research agenda. It is a static website: no account, wallet, API key, backend or real funds are required.

## Explore

| Chapter             | What you can do                                                                                                                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Overview**        | Orbit a living Three.js network, inspect peers and illustrative block headers, and choose a learning path.                                                                                                                                                                  |
| **Transaction lab** | Follow compose → sign → broadcast → validate → build → agree → settle. Inspect UTF-8 wire bytes, hashes and an actual Ed25519 signature. Tamper with the signed amount and see verification reject it. Edit a transaction to change its SHA-256 hash and Merkle commitment. |
| **Network lab**     | Change mesh/ring/hub topology, node count, latency, bandwidth, payload size and offline percentage. Broadcast a message, inspect each peer’s first relay and arrival time, and compare reachability, p50/p95 and modeled traffic.                                           |
| **The trade-offs**  | Compare Bitcoin, Ethereum, optimistic rollups, ZK rollups, Solana and Lightning under the same adjustable teaching workload. Inspect settlement, fees, security assumptions and bottlenecks, then explore six levels of system design.                                      |
| **Real world**      | Explore ten mechanisms and their human/economic boundaries: Bitcoin, USDC, Uniswap, Aave, NFTs/ERC-721, ENS/Web3, Chainlink, BlackRock BUIDL, Helium and WFP Building Blocks. Filter by category and step through each value flow.                                          |
| **Hot topics**      | Explore ten animated issue explainers: rollup fragmentation, stablecoins, asset tokenization, MEV, bridges, data availability, account abstraction, privacy, post-quantum security and physical infrastructure. Each links to primary sources.                              |

Global search (`Ctrl/Cmd + K`) covers chapters, glossary concepts, applications and issues. URL hash routes support direct links and browser back/forward navigation under a GitHub Pages project path.

## Develop

Use **Node.js 24** (see `.nvmrc`) and npm.

```sh
cd /workspace/Blockchain # or your existing checkout
npm ci
npm run dev
```

Commands:

```sh
npm run check           # TypeScript checks
npm test                # model, crypto and research-integrity tests
npm run build           # type check + optimized static site in dist/
npm run preview         # serve the production site
npx playwright install chromium
npm run test:e2e        # launches its own production preview on port 4173
```

Build before running the browser suite. When Chromium is already installed, avoid downloading another browser by running:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Use the existing checkout in isolated cloud tasks. A separate Git worktree is unnecessary unless explicitly requested. This development workflow needs no running external services or environment secrets.

## Publish

The [GitHub Pages workflow](.github/workflows/pages.yml) runs on pushes to `main`, pull requests targeting `main`, and manual dispatch. It installs from `package-lock.json`, runs unit tests, builds/type-checks, runs Chromium tests against the production output, and uploads/deploys `dist/`. Pull requests validate without deploying. Actions are pinned to their verified commit SHAs; build permissions are read-only, and only the deployment job gets Pages/OIDC write permissions.

In repository **Settings → Pages**, select **GitHub Actions** as the source. Push to `main` or dispatch the workflow. The site uses relative asset paths and hash routing, so it works at `/Blockchain/` without rewrite rules or a custom server. For a different repository, update the public links in `README.md` and `src/App.tsx`.

## Research and interpretation

See [research notes and sources](docs/RESEARCH.md) for provenance, the editorial selection method and protocol-specific caveats. The site also includes a source library in its footer and contextual links in each chapter.

**Models are not network benchmarks.** Throughput bars disclose fixed, illustrative resource budgets. Network propagation is deterministic and omits congestion, transport overhead and adversarial behavior. Ethereum inclusion, checkpoint finality, rollup settlement and canonical withdrawal delays are treated separately. The hot-topic sequence is an editorial learning agenda, not a live or measured popularity ranking.

The signing lab uses real browser-native **Ed25519 signatures and SHA-256**, but a generic JSON payload and fictional ATLAS asset. Its displayed sender names are teaching labels, not derived on-chain addresses. The nonce is fixed for illustration; balances, replay protection, block production and consensus are explained rather than implemented as a real chain. It is not Bitcoin or Ethereum transaction encoding. Keys are ephemeral and are not persisted, transmitted or used with real wallets.

## Architecture and accessibility

- **React + TypeScript + Vite** for the static app; **Three.js** for 3D scenes; **Lucide** for icons. Fonts are bundled locally.
- `src/content.ts`: applications, transaction stages, issue research, glossary and source registry.
- `src/models.ts`: deterministic propagation, comparative workload math, hashing, Merkle commitments, signing and verification.
- `src/Scene.tsx`: procedural scenes, pointer orbit, keyboard rotation/zoom, raycast node selection, reduced-motion controls and 2D WebGL fallback. Geometry, materials, textures, observers and GPU contexts are cleaned up on unmount.
- `src/Labs.tsx` and `src/Stories.tsx`: explorable chapters; `src/App.tsx` handles routing, search and the source dialog.
- `src/models.test.ts` and `e2e/atlas.spec.ts`: meaningful unit and production-browser checks.

Responsive layouts support mobile and desktop. Motion respects the initial system preference and can be toggled globally. Canvas controls support arrow keys, `+`/`−`, and `Enter` to select peers; the network inspector also exposes every peer as a standard button. Native dialogs support Escape and focus containment. A 2D fallback and all textual explanations remain available without WebGL. No analytics, wallet connection or runtime third-party fonts are included.

## License

MIT. See [LICENSE](LICENSE). Referenced organizations, trademarks and research publications belong to their respective owners; source links do not imply endorsement.
