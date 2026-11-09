import type { Pattern } from "./models";

export const researchDate = "08 Nov 2026";
export const sources: Record<
  string,
  { title: string; publisher: string; url: string }
> = {
  bitcoin: {
    title: "Bitcoin: A Peer-to-Peer Electronic Cash System",
    publisher: "Satoshi Nakamoto · 2008",
    url: "https://bitcoin.org/bitcoin.pdf",
  },
  "ethereum-transactions": {
    title: "Transactions",
    publisher: "Ethereum.org",
    url: "https://ethereum.org/en/developers/docs/transactions/",
  },
  "ethereum-network": {
    title: "Networking layer",
    publisher: "Ethereum.org",
    url: "https://ethereum.org/en/developers/docs/networking-layer/",
  },
  "ethereum-pos": {
    title: "Proof of stake",
    publisher: "Ethereum.org",
    url: "https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/",
  },
  "ethereum-rollups": {
    title: "Optimistic rollups",
    publisher: "Ethereum.org",
    url: "https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/",
  },
  "ethereum-zk": {
    title: "Zero-knowledge rollups",
    publisher: "Ethereum.org",
    url: "https://ethereum.org/en/developers/docs/scaling/zk-rollups/",
  },
  "ethereum-da": {
    title: "Data availability",
    publisher: "Ethereum.org",
    url: "https://ethereum.org/en/developers/docs/data-availability/",
  },
  "ethereum-mev": {
    title: "Maximal extractable value",
    publisher: "Ethereum.org",
    url: "https://ethereum.org/en/developers/docs/mev/",
  },
  "ethereum-aa": {
    title: "Account abstraction",
    publisher: "Ethereum.org",
    url: "https://ethereum.org/en/roadmap/account-abstraction/",
  },
  "ethereum-bridges": {
    title: "Bridges and their risks",
    publisher: "Ethereum.org",
    url: "https://ethereum.org/en/developers/docs/bridges/",
  },
  circle: {
    title: "USDC reserve transparency",
    publisher: "Circle",
    url: "https://www.circle.com/transparency",
  },
  uniswap: {
    title: "Understanding swaps",
    publisher: "Uniswap documentation",
    url: "https://docs.uniswap.org/concepts/protocol/swaps",
  },
  aave: {
    title: "Aave V3 overview",
    publisher: "Aave documentation",
    url: "https://aave.com/docs/aave-v3/overview",
  },
  erc721: {
    title: "ERC-721: Non-Fungible Token Standard",
    publisher: "Ethereum Improvement Proposals",
    url: "https://eips.ethereum.org/EIPS/eip-721",
  },
  ens: {
    title: "The ENS protocol",
    publisher: "ENS documentation",
    url: "https://docs.ens.domains/learn/protocol/",
  },
  chainlink: {
    title: "Chainlink Data Feeds",
    publisher: "Chainlink documentation",
    url: "https://docs.chain.link/data-feeds",
  },
  wfp: {
    title: "Building Blocks",
    publisher: "UN World Food Programme",
    url: "https://innovation.wfp.org/project/building-blocks",
  },
  buidl: {
    title: "BlackRock launches BUIDL on Ethereum",
    publisher: "Securitize · 20 Mar 2024",
    url: "https://securitize.io/learn/press/blackrock-launches-first-tokenized-fund-buidl-on-the-ethereum-network",
  },
  helium: {
    title: "The Helium Network",
    publisher: "Helium documentation",
    url: "https://docs.helium.com/",
  },
  privacy: {
    title: "Zero-knowledge proofs",
    publisher: "Ethereum.org",
    url: "https://ethereum.org/en/zero-knowledge-proofs/",
  },
  quantum: {
    title: "First three finalized post-quantum encryption standards",
    publisher: "NIST · 13 Aug 2024",
    url: "https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards",
  },
  solana: {
    title: "Transactions and account model",
    publisher: "Solana documentation",
    url: "https://solana.com/docs/core/transactions",
  },
  lightning: {
    title: "The Bitcoin Lightning Network",
    publisher: "Poon & Dryja · 2016",
    url: "https://lightning.network/lightning-network-paper.pdf",
  },
};

export const stages = [
  {
    title: "Compose",
    subtitle: "An intention becomes data",
    icon: "file",
    pattern: "identity" as Pattern,
    heading: "“Send 2.5 ATLAS to Maya.”",
    body: "A wallet turns a human request into structured fields: sender, recipient, value, nonce and chain identifier. The nonce orders actions from this account; the chain ID separates this demo from other networks.",
    detail:
      "Production formats differ. Bitcoin spends unspent transaction outputs (UTXOs). Ethereum uses an account model with a nonce, gas limit, fee fields and optional contract calldata. Solana transactions list accounts and instructions.",
    wire: "Human intent → canonical payload → UTF-8 bytes",
    source: "ethereum-transactions",
  },
  {
    title: "Sign",
    subtitle: "Prove permission, keep the secret",
    icon: "key",
    pattern: "shield" as Pattern,
    heading: "Your key says “I authorized this.”",
    body: "This lab creates an ephemeral Ed25519 key pair in your browser and signs the exact payload bytes. Anyone with the public key can check the signature. The private key never needs to travel with the transaction.",
    detail:
      "This is a generic teaching format: Ed25519 signatures and SHA-256 identifiers. Bitcoin and Ethereum generally use secp256k1; Ethereum transaction encoding and hashing also differ. A signature proves authorization, not the truth of an off-chain claim.",
    wire: "Payload + private key → digital signature",
    source: "solana",
  },
  {
    title: "Broadcast",
    subtitle: "One copy becomes many",
    icon: "radio",
    pattern: "globe" as Pattern,
    heading: "A message leaves your wallet.",
    body: "The wallet submits signed bytes to a node, commonly using an RPC endpoint. That node checks basic validity, stores the transaction in a pending pool where applicable, and gossips it to peers. Peers forward useful new messages.",
    detail:
      "Ethereum has separate execution and consensus networking stacks. Execution uses peer discovery and encrypted peer connections; consensus uses libp2p and gossip. Real networks use deduplication, peer scoring and request/response paths, not a single global broadcast.",
    wire: "Wallet → RPC node → peers → peers of peers",
    source: "ethereum-network",
  },
  {
    title: "Validate",
    subtitle: "Trust the rules, verify the message",
    icon: "check",
    pattern: "mesh" as Pattern,
    heading: "Every full node checks for itself.",
    body: "Nodes check the signature, transaction format, replay protection, available balance or spendable inputs, and protocol limits. This lab actually verifies the signature. Change the amount after signing and verification fails.",
    detail:
      "A valid signature alone is insufficient. A correctly signed double spend, expired transaction or underfunded call must still fail other checks. Validation filters invalid actions; it does not decide the final ordering of competing valid actions.",
    wire: "Signature + state + rules → accept or reject",
    source: "ethereum-transactions",
  },
  {
    title: "Build a block",
    subtitle: "Transactions become a commitment",
    icon: "box",
    pattern: "chain" as Pattern,
    heading: "A batch becomes part of history.",
    body: "A block producer selects and orders transactions, executes the applicable state transitions, and commits to the result. A block header links to its parent. Hash commitments make later alterations detectable.",
    detail:
      "Bitcoin commits to transaction IDs using a Merkle tree. Ethereum uses trie-based commitments for transactions, receipts and state. The Merkle exercise below is a simplified binary tree, not either chain’s exact encoding.",
    wire: "Transactions → execution → commitments → parent-linked header",
    source: "bitcoin",
  },
  {
    title: "Agree",
    subtitle: "One shared order emerges",
    icon: "network",
    pattern: "orbit" as Pattern,
    heading: "Agreement has a cost—and a model.",
    body: "Consensus helps honest nodes converge on a chain. Bitcoin uses accumulated proof of work and a fork-choice rule. Ethereum combines stake-weighted attestations, fork choice and checkpoint finality. Nodes still independently validate the proposed block.",
    detail:
      "Temporary forks can occur. Inclusion is not the same as finality: proof-of-work confidence grows with confirmations; proof-of-stake finality depends on supermajority checkpoint votes and protocol assumptions. No protocol makes a permanent network partition disappear.",
    wire: "Proposal → independent checks → votes/work → fork choice",
    source: "ethereum-pos",
  },
  {
    title: "Settle",
    subtitle: "The ledger changes; the world reacts",
    icon: "flag",
    pattern: "vault" as Pattern,
    heading: "A receipt closes the loop.",
    body: "The recipient’s usable balance changes once the transaction is accepted under the chosen confirmation policy. An application watches receipts or indexed events, updates its interface, and decides when a payment is final enough for its business risk.",
    detail:
      "A successful on-chain transaction does not guarantee off-chain delivery. Exchanges, merchants and bridges choose their own confirmation thresholds. Rollup withdrawals may need additional proof or challenge periods after a fast sequencer receipt.",
    wire: "Accepted state → receipt/event → app → recipient",
    source: "ethereum-rollups",
  },
];

export interface UseCase {
  id: string;
  name: string;
  mark: string;
  category: string;
  color: string;
  headline: string;
  summary: string;
  pattern: Pattern;
  flow: [string, string][];
  actors: string;
  economy: string;
  boundary: string;
  risks: string;
  source: string;
}
export const applications: UseCase[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    mark: "₿",
    category: "Money",
    color: "#f5b66d",
    headline: "Value without a central ledger keeper.",
    summary:
      "Peer-to-peer bearer money with a publicly verifiable issuance and spending history.",
    pattern: "chain",
    flow: [
      [
        "Create a spend",
        "A wallet selects UTXOs, constructs outputs and signs the spending conditions.",
      ],
      [
        "Relay and mine",
        "Peers validate the spend; a miner includes it in a proof-of-work block.",
      ],
      [
        "Accumulate confidence",
        "Additional blocks increase the cost of rewriting this history.",
      ],
      [
        "Use in the economy",
        "A recipient accepts the payment, holds BTC or converts it through a service.",
      ],
    ],
    actors:
      "Senders, recipients, full-node operators, miners, exchanges and payment processors.",
    economy:
      "Miners earn a block subsidy and transaction fees. Fees buy scarce block space. BTC’s exchange value is market-driven and volatile.",
    boundary:
      "The chain records spend authorization and ownership of outputs. It does not certify a merchant’s identity, settle tax obligations or reverse a mistaken payment.",
    risks:
      "Key loss, volatility, custody concentration, reorgs and proof-of-work energy use.",
    source: "bitcoin",
  },
  {
    id: "usdc",
    name: "USDC",
    mark: "$",
    category: "Money",
    color: "#78b6f7",
    headline: "A dollar-shaped token, with real-world reserves.",
    summary:
      "A stablecoin connects bank money and reserve assets to programmable transfers.",
    pattern: "vault",
    flow: [
      [
        "Fund an issuer account",
        "An eligible customer delivers dollars through banking rails and completes required onboarding.",
      ],
      [
        "Mint tokens",
        "Circle issues USDC on a supported blockchain against its reserve model.",
      ],
      [
        "Move on-chain",
        "People or applications transfer USDC; validators settle token ownership.",
      ],
      [
        "Redeem and burn",
        "Eligible holders redeem through the issuer; tokens are burned and dollars return via banks.",
      ],
    ],
    actors:
      "Circle, reserve custodians, banks, assurance providers, exchanges, businesses and token holders.",
    economy:
      "Reserve assets support redemption; banking eligibility and issuer terms matter. Blockchain transfer fees are separate from issuer or intermediary fees.",
    boundary:
      "Token balances are on-chain. Reserve assets and enforceable redemption rights depend on off-chain institutions. A market price near $1 is not an unconditional guarantee.",
    risks:
      "Issuer/custodian failure, depegging, freezes, bank availability, bridge-wrapped variants and regulation.",
    source: "circle",
  },
  {
    id: "uniswap",
    name: "Uniswap",
    mark: "U",
    category: "Finance",
    color: "#ee99c3",
    headline: "An exchange made of pools and code.",
    summary:
      "Automated liquidity pools let a smart contract quote and settle token swaps.",
    pattern: "orbit",
    flow: [
      [
        "Provide liquidity",
        "Liquidity providers deposit token pairs or ranges into a pool.",
      ],
      [
        "Quote a swap",
        "A router finds a path; the trader sets limits on price movement.",
      ],
      [
        "Execute atomically",
        "The pool enforces its version-specific pricing and payment rules; invalid swaps revert.",
      ],
      [
        "Distribute outcomes",
        "The trader receives tokens and liquidity providers earn applicable fees.",
      ],
    ],
    actors:
      "Traders, liquidity providers, routers, arbitrageurs, governance and contract developers.",
    economy:
      "Trading fees compensate liquidity provision. Arbitrage connects pool prices to external markets; LPs face adverse selection and impermanent loss.",
    boundary:
      "Uniswap v2’s x·y=k is a useful starting model. V3 uses concentrated liquidity; V4 adds hooks. Not every version is the same simple constant-product pool.",
    risks:
      "Slippage, sandwiching/MEV, malicious tokens or hooks, contract flaws and LP losses.",
    source: "uniswap",
  },
  {
    id: "aave",
    name: "Aave",
    mark: "A",
    category: "Finance",
    color: "#aea4ed",
    headline: "Borrowing with collateral, not a credit desk.",
    summary:
      "Smart contracts pool deposits and enforce collateralized lending rules.",
    pattern: "vault",
    flow: [
      [
        "Supply assets",
        "A depositor supplies supported tokens and receives interest-bearing aTokens.",
      ],
      [
        "Borrow against collateral",
        "Risk parameters determine how much a user may borrow.",
      ],
      [
        "Update prices and interest",
        "Oracles inform asset values and rates respond to market utilization.",
      ],
      [
        "Repay or liquidate",
        "Borrowers repay with interest; unhealthy positions can be liquidated.",
      ],
    ],
    actors:
      "Suppliers, borrowers, liquidators, oracle providers, risk managers and governance.",
    economy:
      "Borrower interest supports supplier yields. Liquidation incentives motivate third parties to cover unhealthy debt; parameters differ by market.",
    boundary:
      "Aave automates supported collateral rules. It does not eliminate credit exposure, price gaps, oracle dependence or governance risk.",
    risks:
      "Rapid price falls, oracle faults, smart-contract bugs, bad debt and collateral concentration.",
    source: "aave",
  },
  {
    id: "nft",
    name: "NFTs / ERC-721",
    mark: "◈",
    category: "Ownership",
    color: "#c4f568",
    headline: "A unique identifier that an app can recognize.",
    summary:
      "NFT contracts track individual token ownership, transfers and permissions.",
    pattern: "shield",
    flow: [
      [
        "Define a collection",
        "A contract defines token IDs and ownership/approval behavior.",
      ],
      [
        "Mint an identifier",
        "Minting associates a unique token ID with an account.",
      ],
      [
        "Transfer or trade",
        "The owner or an approved operator calls a transfer through a marketplace or app.",
      ],
      [
        "Resolve the experience",
        "A game, membership service or gallery reads ownership and optional metadata.",
      ],
    ],
    actors:
      "Creators, token holders, marketplaces, application operators and metadata hosts.",
    economy:
      "Primary sales, resale markets and access benefits can fund creators. ERC-721 alone does not guarantee royalties or commercial rights.",
    boundary:
      "A token is an on-chain record, not automatic copyright ownership. Images, game assets and physical claims can rely on external storage and legal agreements.",
    risks:
      "Mutable or unavailable metadata, wash trading, phishing, unclear rights and marketplace dependence.",
    source: "erc721",
  },
  {
    id: "ens",
    name: "ENS / Web3",
    mark: "ε",
    category: "Identity",
    color: "#84c5ed",
    headline: "A readable name across an open web.",
    summary:
      "A naming protocol maps names such as maya.eth to addresses and other records.",
    pattern: "identity",
    flow: [
      [
        "Register a name",
        "A registrar’s rules govern name allocation, renewal and ownership.",
      ],
      [
        "Choose a resolver",
        "The owner sets which contract answers queries for this name.",
      ],
      [
        "Publish records",
        "A resolver stores addresses, content hashes or supported profile records.",
      ],
      [
        "Resolve in an app",
        "A wallet queries ENS so a person can use a name instead of a long address.",
      ],
    ],
    actors:
      "Name owners, registrars, registry and resolver contracts, wallets and governance.",
    economy:
      "Registration and renewal costs fund the naming system under its rules. Subnames can delegate identity to communities or organizations.",
    boundary:
      "ENS makes records composable. A name is not a verified legal identity, and resolution depends on the wallet and resolver implementation.",
    risks:
      "Expired names, malicious resolvers, homograph phishing, compromised keys and privacy leaks.",
    source: "ens",
  },
  {
    id: "chainlink",
    name: "Chainlink",
    mark: "⬡",
    category: "Infrastructure",
    color: "#8da4ff",
    headline: "A bridge from external facts to contracts.",
    summary:
      "Decentralized oracle networks publish aggregated external data on-chain.",
    pattern: "bridge",
    flow: [
      [
        "Observe external sources",
        "Data providers report prices or other supported information.",
      ],
      [
        "Aggregate observations",
        "Oracle nodes use a feed’s aggregation and reporting design.",
      ],
      [
        "Publish an update",
        "An on-chain contract receives the report when update conditions are met.",
      ],
      [
        "Consume with safeguards",
        "An application checks freshness, decimals and feed-specific constraints before acting.",
      ],
    ],
    actors:
      "Data providers, oracle node operators, feed sponsors, contract developers and end users.",
    economy:
      "Applications need reliable data to value collateral or settle agreements. Service funding and update costs depend on the particular feed/product.",
    boundary:
      "Consensus cannot independently know an external market price. Oracle decentralization reduces some dependencies but does not turn source data into guaranteed truth.",
    risks:
      "Stale prices, correlated sources, integration mistakes, market manipulation and outage handling.",
    source: "chainlink",
  },
  {
    id: "buidl",
    name: "BlackRock BUIDL",
    mark: "B",
    category: "Finance",
    color: "#d6d9dd",
    headline: "Fund shares become programmable tokens.",
    summary:
      "A tokenized fund connects eligible investors to a traditional legal investment structure.",
    pattern: "rollup",
    flow: [
      [
        "Onboard an investor",
        "Eligible investors satisfy the fund’s identity, jurisdiction and subscription requirements.",
      ],
      [
        "Hold fund assets",
        "The fund invests in assets under its legal mandate and custody arrangements.",
      ],
      [
        "Issue a tokenized share",
        "Securitize supports the tokenization and transfer-agent layer; tokens represent fund interests.",
      ],
      [
        "Distribute and redeem",
        "Approved transfers, distributions and redemptions follow fund and platform rules.",
      ],
    ],
    actors:
      "BlackRock, Securitize, eligible investors, the fund’s administrator, custodians and banks.",
    economy:
      "Fund income comes from underlying investments, not from the mere existence of a token. Access restrictions and fund fees still apply.",
    boundary:
      "The launch on Ethereum illustrates tokenization of fund interests, not permissionless access to all securities or direct title to each underlying Treasury.",
    risks:
      "Legal and counterparty exposure, investor eligibility, redemption constraints and smart-contract controls.",
    source: "buidl",
  },
  {
    id: "helium",
    name: "Helium",
    mark: "H",
    category: "Infrastructure",
    color: "#ab97ed",
    headline: "Token incentives meet physical wireless coverage.",
    summary:
      "Community-operated hotspots provide IoT or mobile offload connectivity.",
    pattern: "mesh",
    flow: [
      [
        "Deploy hardware",
        "An operator installs compatible hotspot equipment and provides connectivity.",
      ],
      [
        "Provide a service",
        "Devices use IoT coverage or mobile offload networks according to the network’s rules.",
      ],
      [
        "Account for activity",
        "Network-specific systems measure eligible coverage and service contribution.",
      ],
      [
        "Reward and pay",
        "Token-based incentives and data-credit mechanisms connect operators and network users.",
      ],
    ],
    actors:
      "Hotspot operators, network service providers, device owners, customers and ecosystem governance.",
    economy:
      "Rewards aim to bootstrap useful infrastructure. Sustainable economics require real demand for connectivity, not just rewards for deployment.",
    boundary:
      "Blockchain coordinates accounting and incentives; radio coverage, bandwidth, installation quality and customer demand exist in the physical world.",
    risks:
      "Reward gaming, uneven coverage, hardware costs, token volatility and weak customer demand.",
    source: "helium",
  },
  {
    id: "wfp",
    name: "WFP Building Blocks",
    mark: "W",
    category: "Public good",
    color: "#83d7b2",
    headline: "Aid organizations coordinate a shared picture.",
    summary:
      "A humanitarian blockchain platform helps organizations coordinate assistance and avoid unintended overlap.",
    pattern: "globe",
    flow: [
      [
        "Enroll with safeguards",
        "Participating organizations establish assistance records through their own operational processes.",
      ],
      [
        "Share a coordination layer",
        "A permissioned network reconciles participating agencies’ assistance information.",
      ],
      [
        "Coordinate assistance",
        "Organizations check relevant shared records to reduce unintended duplication.",
      ],
      [
        "Deliver and reconcile",
        "Aid delivery and financial reconciliation remain tied to real operations and accountable institutions.",
      ],
    ],
    actors:
      "WFP, participating humanitarian organizations, implementation partners and people receiving assistance.",
    economy:
      "The goal is coordination efficiency and improved use of aid budgets. It is not a public cryptocurrency investment or token-reward program.",
    boundary:
      "A shared ledger can coordinate records. It cannot decide who deserves aid or replace consent, privacy protections and field verification.",
    risks:
      "Sensitive-data governance, exclusion, operational errors, access controls and institutional accountability.",
    source: "wfp",
  },
];

export interface Topic {
  id: string;
  title: string;
  tag: string;
  color: string;
  pattern: Pattern;
  question: string;
  body: string;
  mechanism: string[];
  tradeoff: string;
  watch: string;
  sources: string[];
}
export const topics: Topic[] = [
  {
    id: "scaling",
    title: "The rollup maze",
    tag: "SCALING",
    color: "#c4f568",
    pattern: "rollup",
    question: "If execution moves to L2, what still has to be trusted?",
    body: "Rollups batch execution and anchor commitments to a base chain. This can amortize data costs, but users encounter fragmented balances, sequencers, bridges and different upgrade rules. “Secured by Ethereum” is the beginning of an analysis, not its conclusion.",
    mechanism: [
      "Bundle many calls into an L2 batch.",
      "Publish data or commitments to the chosen data layer.",
      "Verify validity proofs or allow fault challenges.",
      "Distinguish a fast receipt from final L1 settlement.",
    ],
    tradeoff:
      "Lower per-user cost and more execution capacity ↔ more moving parts, implementation-specific trust and cross-rollup friction.",
    watch:
      "Proof-system maturity, permissionless exits, upgrade controls, sequencer recovery and interoperability.",
    sources: ["ethereum-rollups", "ethereum-zk"],
  },
  {
    id: "stablecoins",
    title: "The dollar goes on-chain",
    tag: "STABLECOINS",
    color: "#78b6f7",
    pattern: "vault",
    question: "Who guarantees the dollar behind a digital dollar?",
    body: "Stablecoins make a familiar unit programmable, useful for payments, trading and settlement. Reserve quality, redemption eligibility, custody, banking hours and freeze authority remain real-world dependencies. Designs backed by fiat, crypto collateral or algorithms have different failure modes.",
    mechanism: [
      "Dollars enter an issuer’s banking system.",
      "An issuer mints a redeemable token.",
      "Tokens move across wallets and applications.",
      "Redemption burns tokens and releases bank money.",
    ],
    tradeoff:
      "Stable denomination and composability ↔ issuer, reserve, regulatory and redemption risk.",
    watch:
      "Independent reserve assurance, holder rights, redemption terms, supported chains and wrapped-token exposure. This is a structural issue, not a claim about a new law.",
    sources: ["circle"],
  },
  {
    id: "rwa",
    title: "Real assets, digital rails",
    tag: "TOKENIZATION",
    color: "#d5c5a5",
    pattern: "chain",
    question: "Does a token actually convey an enforceable legal right?",
    body: "Tokenized funds and other real-world assets connect a blockchain register to contracts, custodians, transfer agents and courts. Faster token transfer can coexist with restricted investor access and traditional redemption processes.",
    mechanism: [
      "A legal structure defines the holder’s rights.",
      "A custodian holds the underlying asset.",
      "A controlled contract records eligible token holders.",
      "Off-chain administration honors distributions and redemptions.",
    ],
    tradeoff:
      "Programmable ownership records ↔ legal complexity, restricted transfers and persistent counterparty dependence.",
    watch:
      "The legal claim, insolvency treatment, investor eligibility, redemption windows and the authoritative ownership register.",
    sources: ["buidl"],
  },
  {
    id: "mev",
    title: "The race to reorder",
    tag: "MEV",
    color: "#eab488",
    pattern: "swarm",
    question: "Who captures the value of choosing transaction order?",
    body: "Searchers, builders and block producers can benefit from transaction ordering. Arbitrage can align prices, while sandwich attacks worsen a trader’s execution. Public pending transactions can expose users before their trades are included.",
    mechanism: [
      "A pending trade becomes observable.",
      "A searcher simulates profitable ordering.",
      "A builder assembles transactions or bundles.",
      "The final ordering redistributes execution value.",
    ],
    tradeoff:
      "Competitive price discovery and efficient block building ↔ extraction, censorship incentives and concentration.",
    watch:
      "Private order flow, intent execution, encrypted mempools, builder concentration and the new trust assumptions of each mitigation.",
    sources: ["ethereum-mev", "uniswap"],
  },
  {
    id: "bridges",
    title: "Crossing the trust gap",
    tag: "INTEROPERABILITY",
    color: "#a69bf5",
    pattern: "bridge",
    question: "Can one chain safely act on another chain’s history?",
    body: "A bridge represents or moves value across systems. Its safety depends on how destination contracts verify source events, how keys and upgrades are controlled, and how reorgs or delayed messages are handled. Chains do not automatically share one security boundary.",
    mechanism: [
      "Lock or burn an asset on the source.",
      "Observe and verify the source-chain event.",
      "Deliver an authenticated cross-chain message.",
      "Release or mint the destination representation.",
    ],
    tradeoff:
      "Reach across ecosystems ↔ additional verification, custody, liquidity and upgrade risks.",
    watch:
      "Verification design, multisig thresholds, light-client assumptions, rate limits, exit paths and incident response.",
    sources: ["ethereum-bridges"],
  },
  {
    id: "availability",
    title: "Who keeps the data?",
    tag: "DATA AVAILABILITY",
    color: "#7ed7d0",
    pattern: "mesh",
    question:
      "A proof says a transition is valid. Can you reconstruct the state?",
    body: "Execution correctness and data availability answer different questions. Users need access to transaction data to reconstruct state or exit certain systems. Sampling, erasure coding and dedicated data layers aim to scale publication without requiring every participant to download everything.",
    mechanism: [
      "Encode and publish a transaction batch.",
      "Distribute data across a network.",
      "Check availability using the chosen protocol.",
      "Reconstruct state from accessible data.",
    ],
    tradeoff:
      "More capacity through specialized data infrastructure ↔ sampling, retention, retrieval and external security assumptions.",
    watch:
      "Where data is published, how long it is retained, how users retrieve it and which failures still permit an exit.",
    sources: ["ethereum-da", "ethereum-zk"],
  },
  {
    id: "wallets",
    title: "Wallets that feel human",
    tag: "ACCOUNT ABSTRACTION",
    color: "#e9a8d6",
    pattern: "identity",
    question: "Can recovery and better UX avoid becoming a new custodian?",
    body: "Smart accounts can support recovery policies, spending limits, sponsored fees and batched actions. Bundlers and paymasters add useful services, while recovery modules and permissions create new code and policy to audit.",
    mechanism: [
      "An account defines a custom authorization policy.",
      "A user signs an operation or supported delegation.",
      "Bundling and fee sponsorship route execution.",
      "The account enforces permissions and recovery rules.",
    ],
    tradeoff:
      "Better onboarding and recoverability ↔ module security, service dependence and more complex authorization.",
    watch:
      "Recovery guardians, session-key scope, paymaster policies, upgrade paths and whether users can leave a service.",
    sources: ["ethereum-aa"],
  },
  {
    id: "privacy",
    title: "Prove more. Reveal less.",
    tag: "PRIVACY",
    color: "#b7a3f0",
    pattern: "shield",
    question: "Which facts must be public to verify a claim?",
    body: "Zero-knowledge systems can prove a statement without revealing its private witness. This supports private transfers or selective credentials, but privacy also depends on metadata, circuits, key management, anonymity sets and application design.",
    mechanism: [
      "Keep a witness private.",
      "Compute a proof for a precise public statement.",
      "Verify the proof against public inputs.",
      "Reject invalid claims without publishing the witness.",
    ],
    tradeoff:
      "Selective disclosure and confidentiality ↔ proving cost, circuit complexity, metadata leakage and difficult compliance design.",
    watch:
      "What the statement actually proves, trusted setup assumptions, linkable metadata and whether disclosure is selective or universal.",
    sources: ["privacy", "ethereum-zk"],
  },
  {
    id: "security",
    title: "The next key problem",
    tag: "POST-QUANTUM SECURITY",
    color: "#f3c871",
    pattern: "orbit",
    question: "How do long-lived systems replace their cryptography?",
    body: "Sufficiently capable quantum computers would threaten common elliptic-curve signatures. NIST finalized initial post-quantum standards in 2024. This does not mean today’s chains have been broken; migration requires protocol, wallet and operational changes long before a precise threat date is known.",
    mechanism: [
      "Inventory exposed keys and cryptographic assumptions.",
      "Evaluate standardized post-quantum signature options.",
      "Design compatible account and protocol migrations.",
      "Coordinate upgrades and protect inactive holdings.",
    ],
    tradeoff:
      "Long-term cryptographic resilience ↔ larger signatures, verification cost, compatibility and coordination challenges.",
    watch:
      "Peer-reviewed implementations, crypto-agility proposals, migration paths and realistic resource estimates rather than predicted “Q-day” dates.",
    sources: ["quantum"],
  },
  {
    id: "depin",
    title: "From tokens to useful things",
    tag: "PHYSICAL INFRASTRUCTURE",
    color: "#9cd1b2",
    pattern: "globe",
    question: "Can token rewards bootstrap infrastructure people actually use?",
    body: "Decentralized physical infrastructure networks connect token accounting to wireless, compute or storage services. Rewards can attract supply, but useful service quality and paying demand determine whether economics persist when subsidies decline.",
    mechanism: [
      "An operator supplies real hardware.",
      "A measurement system checks eligible contribution.",
      "A network distributes incentives and collects usage payments.",
      "Customers decide whether the service is worth paying for.",
    ],
    tradeoff:
      "Distributed capital formation and open participation ↔ measurement fraud, speculative subsidies and physical service constraints.",
    watch:
      "Actual service demand, customer retention, fraud resistance, operator unit economics and non-token revenue.",
    sources: ["helium"],
  },
];

export const layers = [
  {
    name: "Trust",
    number: "01",
    problem: "Strangers need a shared record without one unchecked editor.",
    requirement: "Independent verification and resistance to forged history.",
    solutions:
      "Public validation + cryptographic commitments; permissioned ledgers when participants already share a governance structure.",
    cost: "Replicating verification costs more than a conventional database. If one trusted operator is acceptable, a database may be the better solution.",
    metric: "Who can verify? Who can change the rules?",
    source: "bitcoin",
  },
  {
    name: "Data",
    number: "02",
    problem: "A small change must be detectable; inclusion must be provable.",
    requirement:
      "Integrity, compact proofs, available history and replay protection.",
    solutions:
      "Hash-linked headers, Merkle/trie commitments, signatures, nonces and domain-separated identifiers.",
    cost: "A hash authenticates supplied bytes; it does not store missing data or prove an external statement. Archival data adds storage and retrieval costs.",
    metric: "Proof size · storage growth · data retention",
    source: "ethereum-da",
  },
  {
    name: "Network",
    number: "03",
    problem:
      "Messages arrive late, out of order, and through unreliable peers.",
    requirement:
      "Redundant propagation, peer discovery and robustness to failures.",
    solutions:
      "Gossip meshes, deduplication, peer scoring, compact announcements and request/response retrieval.",
    cost: "More peers reduce some propagation paths but increase duplicate traffic. A hub saves links while creating a single failure domain.",
    metric: "p95 propagation · reachable nodes · wire bytes",
    source: "ethereum-network",
  },
  {
    name: "Consensus",
    number: "04",
    problem: "Two valid transactions can compete for the same funds.",
    requirement: "A convergent order with an explicit safety/liveness model.",
    solutions:
      "Proof of work + chain selection; stake-weighted voting + fork choice/finality; permissioned BFT among known operators.",
    cost: "PoW consumes physical resources; PoS uses economic collateral and penalties. Both need network and honest-participation assumptions. A partition forces difficult liveness/safety choices.",
    metric: "Time to inclusion vs finality · fault tolerance",
    source: "ethereum-pos",
  },
  {
    name: "Execution",
    number: "05",
    problem: "Every state update consumes scarce compute and bandwidth.",
    requirement:
      "Predictable execution, bounded resource use and scalable verification.",
    solutions:
      "Gas metering, parallel execution for independent state, payment channels, batching, optimistic or validity rollups.",
    cost: "Parallelism helps only when state access is independent. Rollups add proof/data costs; channels require liquidity. Moving work changes bottlenecks rather than removing them.",
    metric: "User transactions/s · contention · settlement latency",
    source: "ethereum-zk",
  },
  {
    name: "Economy",
    number: "06",
    problem:
      "An internally consistent ledger must still serve the outside world.",
    requirement:
      "Useful incentives, accurate external inputs and enforceable rights.",
    solutions:
      "Transaction fees, staking/mining incentives, oracle networks, reserve assurance, legal wrappers and accountable governance.",
    cost: "Tokens do not make false inputs true or create customer demand. Real-world assets and stablecoins retain institutional dependencies.",
    metric: "Security budget · redemption quality · real demand",
    source: "chainlink",
  },
];

export const glossary = [
  {
    term: "Block",
    definition:
      "A producer’s batch of transactions and protocol metadata, linked to its parent by a cryptographic commitment.",
    route: "journey",
  },
  {
    term: "Hash",
    definition:
      "A fixed-length digest of bytes. A secure hash makes changes detectable, but does not encrypt or store the original data.",
    route: "journey",
  },
  {
    term: "Digital signature",
    definition:
      "A proof that the holder of a private key authorized particular bytes. It is not encryption or proof that a real-world claim is true.",
    route: "journey",
  },
  {
    term: "Mempool",
    definition:
      "A node’s local collection of pending transactions. Different nodes may see different sets; not every chain exposes the same model.",
    route: "networks",
  },
  {
    term: "Gossip",
    definition:
      "Peer-to-peer message dissemination in which nodes relay information to selected peers, who relay it onward.",
    route: "networks",
  },
  {
    term: "Finality",
    definition:
      "A protocol-specific settlement assurance. It differs from inclusion, a sequencer receipt or a wallet confirmation message.",
    route: "compare",
  },
  {
    term: "Rollup",
    definition:
      "A system that executes transactions off a base chain and uses it for some combination of data publication, verification and settlement.",
    route: "compare",
  },
  {
    term: "Oracle",
    definition:
      "A mechanism that supplies externally sourced data to a smart contract, with its own trust and freshness assumptions.",
    route: "applications",
    id: "chainlink",
  },
  {
    term: "Stablecoin",
    definition:
      "A token designed to track a reference value, using reserves or another stabilization design. Its peg and redemption are not risk-free.",
    route: "applications",
    id: "usdc",
  },
  {
    term: "Smart contract",
    definition:
      "Code and state on a blockchain executed under protocol rules; its behavior still depends on code correctness and supplied inputs.",
    route: "applications",
  },
  {
    term: "Zero-knowledge proof",
    definition:
      "A cryptographic proof that a precise statement holds without disclosing the private witness used to prove it.",
    route: "signals",
    id: "privacy",
  },
  {
    term: "MEV",
    definition:
      "Value obtainable through inclusion, exclusion or reordering of transactions, beyond standard block rewards and gas fees.",
    route: "signals",
    id: "mev",
  },
];
