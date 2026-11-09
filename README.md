# Chain Atlas

**An interactive, 3D field guide to how blockchain works.**

Explore the website at **https://sloth-os.github.io/Blockchain/**.

Chain Atlas connects a visual peer network to actual browser cryptography, network experiments, system design trade-offs, real applications and a sourced research agenda. It is a static website: no account, wallet, API key, backend or real funds are required.

## Explore

| Chapter             | What you can do                                                                                                                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Overview**        | Enter Protocol Theater: scrub a seven-phase transaction, follow the guided camera, inspect 24 semantic 3D objects and their real local cryptographic data, switch Data/Messages/Trust lenses, or expand into immersive mode.                                                |
| **Transaction lab** | Follow compose → sign → broadcast → validate → build → agree → settle. Inspect UTF-8 wire bytes, hashes and an actual Ed25519 signature. Tamper with the signed amount and see verification reject it. Edit a transaction to change its SHA-256 hash and Merkle commitment. |
| **Network lab**     | Change mesh/ring/hub topology, node count, latency, bandwidth, payload size and offline percentage. Broadcast a message, inspect each peer’s first relay and arrival time, and compare reachability, p50/p95 and modeled traffic.                                           |
| **The trade-offs**  | Compare Bitcoin, Ethereum, optimistic rollups, ZK rollups, Solana and Lightning under the same adjustable teaching workload. Inspect settlement, fees, security assumptions and bottlenecks, then explore six levels of system design.                                      |
| **Real world**      | Explore ten mechanisms and their human/economic boundaries: Bitcoin, USDC, Uniswap, Aave, NFTs/ERC-721, ENS/Web3, Chainlink, BlackRock BUIDL, Helium and WFP Building Blocks. Filter by category and step through each value flow.                                          |
| **Hot topics**      | Explore ten animated issue explainers: rollup fragmentation, stablecoins, asset tokenization, MEV, bridges, data availability, account abstraction, privacy, post-quantum security and physical infrastructure. Each links to primary sources.                              |

Global search (`Ctrl/Cmd + K`) covers chapters, glossary concepts, applications and issues. URL hash routes support direct links and browser back/forward navigation under a GitHub Pages project path.

## Immersive controls

The landing page is a 42-second **Protocol Theater**. Play/pause, replay, change speed, scrub the timeline, or select a phase. Follow the transaction with the camera, inspect the complete protocol map, or switch to an overhead view. **Go immersive** fills the viewport; Escape returns you to the page and restores keyboard focus.

Every visual object represents a participant, data structure, or verification boundary. Select an object directly or use **Objects** to inspect exact payload bytes, full signatures and public keys, complete Merkle hashes, the block commitment, remaining trust assumptions, and a primary source. Data, Messages and Trust lenses change which information is emphasized. Alter the signed amount to make real local verification fail and block later phases; restore the payload to continue.

Drag to orbit, use two fingers to pinch-zoom on touch screens, use arrow keys to orbit, `+`/`−` to zoom, Enter to inspect the next object, and Home or the reset button to restore the camera. Reduced motion disables automatic playback and continuous movement while preserving manual exploration. Playback pauses when the theater is off-screen or the document is hidden.

Application and hot-topic scenes use domain-specific actors and distinguish data messages, cryptographic proofs, votes and value movements. The transaction scene shows four Merkle leaves, two intermediate commitments and the root, all computed from the actual local payload. Network labels distinguish predicted, waiting, received, offline and unreachable states. Comparison objects show the same demand, resource ceiling and completed calls as the adjustable model.

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
- `src/spatial.ts`: typed semantic scene graphs, actor explanations, trust assumptions, source links and causally ordered message windows for the protocol, every application and every issue.
- `src/Experience.tsx`: protocol playback, scrubbing, information lenses, camera modes, real local cryptography and accessible immersive mode.
- `src/Scene.tsx`: Three.js object geometry, projected DOM annotations with collision-aware placement and leader lines, raycasting, camera easing, inertial orbit, touch pinch, object inspection and semantic 2D fallback. Rendering targets at most 30 FPS, stops off-screen/hidden work, and renders paused scenes only when needed. Live data and timeline changes reuse the existing renderer; geometry, materials, textures, observers and GPU contexts are cleaned up on unmount.
- `src/Labs.tsx` and `src/Stories.tsx`: explorable chapters; `src/App.tsx` handles routing, search and the source dialog.
- `src/models.test.ts`, `src/spatial.test.ts` and `e2e/atlas.spec.ts`: meaningful unit and production-browser checks.

Responsive layouts support mobile and desktop. Motion respects the initial system preference and can be toggled globally. Canvas controls support arrow keys, `+`/`−`, and `Enter` to select peers; the network inspector also exposes every peer as a standard button. Native dialogs support Escape and focus containment. A 2D fallback and all textual explanations remain available without WebGL. No analytics, wallet connection or runtime third-party fonts are included.

## License

MIT. See [LICENSE](LICENSE). Referenced organizations, trademarks and research publications belong to their respective owners; source links do not imply endorsement.
