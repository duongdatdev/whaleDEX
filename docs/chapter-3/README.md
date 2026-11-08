# Chapter 3 — AI-Assisted Requirements for WhaleDEX

This chapter uses WhaleDEX as a continuous case study for evidence-led product requirements. AI may accelerate repository inspection, synthesis, drafting and consistency checks, but accountable humans retain product, security and release decisions.

## Canonical context

- Product source of truth: [WhaleDEX PRD 3.0](../prd-whaledex.md)
- Architecture decision: [ADR-0003](../adr/0003-sui-deepbook-mvp.md)
- Delivery order: [Sui/DeepBook roadmap](../DOCS.md)
- Learning summary: [Sui Spot MVP PRD](whaledex-mvp-prd.md)
- Hands-on exercise: [Practical Lab 3](practical-lab.md)
- Evidence tracking: [Traceability matrix](traceability-matrix.md)

The settled MVP target is **Sui Testnet + DeepBookV3**. The product is a non-custodial spot DEX interface with market/limit orders. EVM/Sepolia, multi-chain, mainnet assets and a custom matching engine are outside this MVP.

## Evidence discipline

Use this authority order when describing implementation:

1. Running behavior and tests.
2. Source code, schema and configuration.
3. Accepted ADR and canonical PRD.
4. Roadmap and learning documents.
5. Assumptions, mockups and AI suggestions.

The repository currently has application foundations and a Sui network registry/API contract, but no Sui client, wallet or DeepBook integration. Configuration evidence does not prove live network or trading capability.

Classify claims explicitly:

| Class      | Meaning                        | WhaleDEX example                    |
| ---------- | ------------------------------ | ----------------------------------- |
| Fact       | Direct repository evidence     | Fastify health route exists         |
| Decision   | Approved scope or architecture | MVP uses Sui Testnet and DeepBookV3 |
| Hypothesis | Needs user/product validation  | Testnet traders need a Pro Terminal |
| Dependency | Needs technical verification   | Target DeepBook pool and coin types |
| Proposal   | Not approved or implemented    | Sui Mainnet launch                  |

## Product framing

Problem hypothesis:

> Testnet spot traders need a transparent way to inspect market context, balances, execution limits and transaction outcomes because on-chain order flows are easy to misread.

Primary outcomes:

- complete a market order with a confirmed digest;
- create and cancel a limit order;
- understand wallet/trading balances, price source, fees and transaction states;
- preserve self-custody and avoid secret handling by WhaleDEX.

Non-goals include EVM networks, bridges, leverage, arbitrary coin import, custom matching, fiat and in-app seed custody.

## AI-assisted discovery workflow

### 1. Inspect

Search narrowly for code, schemas, tests and configuration related to the feature. Ask AI to report implemented/proposed/absent/legacy separately and cite file paths.

### 2. Synthesize

Cluster stakeholder notes while retaining source IDs. Separate observed statements from interpretations and generate counter-hypotheses. Never present fictional workshop observations as real research.

### 3. Specify

Turn approved outcomes into atomic, testable requirements. Avoid “fast”, “safe”, “best” or “real-time” unless the comparison set, boundary and measurement are defined.

For trading requirements, include:

- network, account and market identity;
- coin type, decimals and amount representation;
- side, order type, price, tick/lot constraints;
- freshness and invalidation behavior;
- signature, submission and confirmation states;
- error/recovery behavior and verification method.

### 4. Red-team

Ask AI to find ambiguity, missing negative paths, hidden custody, stale-data races, unsafe retry behavior, unsupported SDK assumptions and untestable claims. Reviewers decide which findings require changes.

### 5. Trace

Map goals → requirements → acceptance evidence → component → implementation status. Planned tests are not implementation evidence. Update the matrix in the same change that implements or changes a requirement.

## Core requirement themes

### Network and wallet

MVP accepts Sui Testnet only. Wallet account/network changes invalidate account-derived state. The API never accepts seed phrases, private keys or signing secrets.

### Market identity

Markets are identified by verified network, package/object/pool identifiers and full coin types. Symbols are display labels and cannot establish identity.

### Order data

Order-book reads expose freshness. Missing, empty, stale and failed states remain distinct. The UI never substitutes invented price, volume, gas or liquidity data.

### Order execution

Market orders require a current preflight and reviewed price limit. Limit orders require tick/lot validation. Every transaction remains tied to the network, account, market and input context used to build it.

### Transaction lifecycle

Awaiting signature, rejected, submitted, confirmed, failed and unknown are separate states. A digest is evidence of submission, not success. Unknown outcomes are investigated; writes are not blindly retried.

### Derived data

History, charts and portfolio aggregation may use an indexer/database, but DeepBook/Sui remains authoritative for balances, orders, fills and settlement. Indexer failure must not create backend custody or block protocol-level recovery.

## Responsible AI and security

- Do not paste secrets, seed phrases, private keys, production credentials or personal data into prompts.
- Treat AI-generated addresses, package IDs, pool IDs and API behavior as untrusted until checked against official sources and runtime evidence.
- Do not ask AI to claim legal, financial or security guarantees.
- Record meaningful prompts, inputs, reviewer changes and rejected suggestions for auditability.
- Require human review for asset-flow changes and independent security review before any mainnet decision.

## Current decisions and open dependencies

| Item                                  | Status              |
| ------------------------------------- | ------------------- |
| Sui Testnet + DeepBookV3              | Settled by ADR-0003 |
| Non-custodial client signing          | Settled             |
| No custom Move trading package in MVP | Settled             |
| gRPC/GraphQL for new reads            | Settled direction   |
| RPC provider/fallback                 | Open, DEP-01        |
| First verified market and coin types  | Open, DEP-02        |
| Faucet onboarding                     | Open, DEP-03        |
| Wallet compatibility set              | Open, DEP-04        |
| Price-limit/gas/freshness policy      | Open, DEP-05        |
| History/chart source                  | Open, DEP-06        |

## Review checklist

- Does every implementation claim cite code/test evidence?
- Are historical EVM documents clearly marked superseded?
- Are Sui Testnet and token non-value visible in user-facing requirements?
- Does every asset-changing action require the user wallet signature?
- Are full identifiers used instead of symbols for trust decisions?
- Are stale/unknown states explicit?
- Are integer math, decimals, tick and lot boundaries testable?
- Does the traceability matrix match current PRD IDs?
- Are mainnet and multi-chain claims excluded unless separately approved?

The companion [practical lab](practical-lab.md) applies this workflow to a market-order review slice. The [traceability matrix](traceability-matrix.md) starts with planned evidence and must evolve with the code.
