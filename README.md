# Chain Atlas

**An interactive, 3D field guide to how blockchain works.**

Explore the website at **https://sloth-os.github.io/Blockchain/**.

Chain Atlas connects a visual peer network to actual browser cryptography, network experiments, system design trade-offs, real applications and a sourced research agenda. It is a static website: no account, wallet, API key, backend or real funds are required.

## Play Chain Runner

**[Start the 3D expedition](https://sloth-os.github.io/Blockchain/?play=1)**, or select **Play** in the header. Pilot a packet courier through seven missions: exact-byte signing, network repair, Merkle commitments, weighted consensus, scaling requirements, stablecoin redemption and bridge verification. Fly with WASD/arrows, interact with E and dash with Space; touch controls and automatic station travel are available.

The game adds interference hazards, checkpoints, three-star rewards, XP, local progress, a minimap and tactical camera to the same immersive world. Carry data as orbiting cargo, follow real peer links and watch commitment/stake rings fill as you restore each sector. Signatures, vote checks and Merkle proofs run locally in the browser. Reduced effects and a WebGL-free route list preserve access. See the [game design, controls, model boundaries and verification](docs/GAME_DESIGN.md).

## One immersive world

The website opens directly into a full-screen 3D workspace. There are no separate lab pages or immersive-mode toggle. Five connected areas coexist in the same scene:

| In-world area                 | What you can explore                                                                                                                                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Transaction anatomy**       | Compose → sign → broadcast → validate → build → agree → settle. Inspect real local Ed25519 signatures, UTF-8 bytes, SHA-256 hashes, four-leaf Merkle commitments and a linked block header. Alter the signed amount to fail authorization.                     |
| **Peer network**              | The transaction travels through this actual adjustable graph. Change mesh/ring/hub topology, node count, latency, bandwidth, message size and failures. Broadcast and inspect first-arrival routes, p50/p95, reachability and modeled wire data.               |
| **Scaling & trade-offs**      | Two physical lanes compare Bitcoin, Ethereum, optimistic/ZK rollups, Solana and Lightning under a shared workload. Explore saturation, backlogs, settlement, fees, trust and six system-design layers. Message size is shared with the propagation experiment. |
| **Real-world connections**    | Ten applications: Bitcoin, USDC, Uniswap, Aave, NFTs/ERC-721, ENS/Web3, Chainlink, BlackRock BUIDL, Helium and WFP Building Blocks. Follow participants, messages, value and institutional boundaries in the world.                                            |
| **Questions at the frontier** | Ten sourced mechanisms: rollup fragmentation, stablecoins, asset tokenization, MEV, bridges, availability, account abstraction, privacy, post-quantum security and physical infrastructure. Each application connects to a relevant open question.             |

Use **Explore** to pull back and select a glowing landmark, select objects directly, or follow the connected learning path below the scene. Moving between areas preserves the transaction draft, experiments, selections and playback positions. The same canvas and WebGL context stay mounted, including when the peer graph or application changes.

**Experiment** opens controls beside the selected process (a bottom sheet on mobile). **Explain** opens the underlying requirements, formulas and primary sources. Selecting an object opens its facts, exact data and trust assumptions in that same workbench. **Objects** provides a keyboard-accessible alternative to selecting objects in 3D. All 23 primary sources are available through the header book icon.

## Immersive controls

Play/pause, restart, change speed or scrub the seven-phase transaction timeline. Application and issue mechanisms have four selectable phases. **Follow**, **Frame** and **Above** change the camera (under **Camera** on smaller screens); **Data**, **Messages** and **Trust** change the information lens. The signature exercise blocks later phases after tampering and allows recovery by restoring the signed bytes.

Drag to orbit, pinch with two fingers to zoom, or focus the canvas and use arrow keys, `+`/`−`, Enter and Home. Search (`Ctrl/Cmd + K`) focuses a concept, application or question within the world. Escape closes a workbench or native dialog while retaining the immersive workspace. Phones and tablets also offer a phase selector and Previous/Next controls. Previous hash links still open the corresponding focus; internal exploration does not navigate between pages.

Reduced motion disables automatic playback and continuous movement while retaining manual controls. Motion can be toggled globally and pauses while a dialog is open or the document is hidden. The scene accommodates open controls, and labels avoid the introduction and workbench. Without WebGL, semantic objects and all educational controls remain available in a scrollable compatibility view.

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
npm run review:ui       # 144 visual captures; requires a running preview
npm run review:game     # play and capture the seven-mission 3D campaign
```

Build before running the browser suite. When Chromium is already installed, avoid downloading another browser by running:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Use the existing checkout in isolated cloud tasks. A separate Git worktree is unnecessary unless explicitly requested. This development workflow needs no running external services or environment secrets.

The [browser and visual UX review](docs/UX_REVIEW.md) records findings, fixes, before/after screenshots and coverage. `review:ui` writes a browsable gallery, contact sheets and measurements to `artifacts/ux-review/latest/`. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` when using system Chromium.

## Publish

The [GitHub Pages workflow](.github/workflows/pages.yml) runs on pushes to `main`, pull requests targeting `main`, and manual dispatch. It installs from `package-lock.json`, runs unit tests, builds/type-checks, runs Chromium tests against the production output, and uploads/deploys `dist/`. Pull requests validate without deploying. Actions are pinned to their verified commit SHAs; build permissions are read-only, and only the deployment job gets Pages/OIDC write permissions.

In repository **Settings → Pages**, select **GitHub Actions** as the source. Push to `main` or dispatch the workflow. The site uses relative asset paths and backward-compatible hash links, so it works at `/Blockchain/` without rewrite rules or a custom server. For a different repository, update the public links in `README.md` and `src/Workspace.tsx`.

## Research and interpretation

See [research notes and sources](docs/RESEARCH.md) for provenance, the editorial selection method and protocol-specific caveats. The header opens the source library, and each process includes contextual citations.

**Models are not network benchmarks.** Throughput bars disclose fixed, illustrative resource budgets. Network propagation is deterministic and omits congestion, transport overhead and adversarial behavior. Ethereum inclusion, checkpoint finality, rollup settlement and canonical withdrawal delays are treated separately. The hot-topic sequence is an editorial learning agenda, not a live or measured popularity ranking.

The signing lab uses real browser-native **Ed25519 signatures and SHA-256**, but a generic JSON payload and fictional ATLAS asset. Its displayed sender names are teaching labels, not derived on-chain addresses. The nonce is fixed for illustration; balances, replay protection, block production and consensus are explained rather than implemented as a real chain. It is not Bitcoin or Ethereum transaction encoding. Keys are ephemeral and are not persisted, transmitted or used with real wallets.

## Architecture and accessibility

- **React + TypeScript + Vite** for the static app; **Three.js** for the persistent 3D world; **Lucide** for icons. Fonts are bundled locally.
- `src/content.ts`: applications, transaction stages, issue research, glossary and source registry.
- `src/models.ts`: deterministic propagation, comparative workload math, hashing, Merkle commitments, signing and verification.
- `src/spatial.ts`: typed semantic scene graphs, actor explanations, trust assumptions, source links and causally ordered message windows for the protocol, every application and every issue.
- `src/atlas.ts`: one namespaced world graph, shared transaction-to-peer routing, landmarks, spatial connections and legacy-link interpretation.
- `src/useAtlas.ts`: persistent experiment state, linked controls, cryptography, playback and camera focus.
- `src/Workspace.tsx`: the full-screen workspace, contextual workbench, connected timeline, search and source library.
- `src/Scene.tsx`: Three.js object geometry, projected DOM annotations with collision-aware placement and leader lines, raycasting, camera easing, inertial orbit, touch pinch, object inspection and semantic 2D fallback. Rendering targets at most 30 FPS, stops off-screen/hidden work, and renders paused scenes only when needed. Live data and timeline changes reuse the existing renderer; geometry, materials, textures, observers and GPU contexts are cleaned up on unmount.
- `src/usability.css`: readable type, touch targets, compact phase navigation and contextual phone/landscape layouts.
- `scripts/review-ui.mjs`: reproducible full-interface visual capture matrix.
- `src/models.test.ts`, `src/spatial.test.ts`, `src/atlas.test.ts`, `e2e/atlas.spec.ts` and `e2e/usability.spec.ts`: meaningful unit and production-browser checks.

Responsive layouts support mobile and desktop. Motion respects the initial system preference and can be toggled globally. Canvas controls support arrow keys, `+`/`−`, and `Enter` to select peers; the network inspector also exposes every peer as a standard button. Native dialogs support Escape and focus containment. A 2D fallback and all textual explanations remain available without WebGL. No analytics, wallet connection or runtime third-party fonts are included.

## License

MIT. See [LICENSE](LICENSE). Referenced organizations, trademarks and research publications belong to their respective owners; source links do not imply endorsement.
