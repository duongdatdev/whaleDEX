# WhaleDEX Sui Spot MVP — Learning PRD

| Field                 | Value                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- |
| Status                | Learning companion aligned with the current product scope; not an independent approval |
| Version               | 3.0                                                                                    |
| Updated               | 2026-09-29                                                                             |
| Canonical product PRD | [WhaleDEX PRD](../prd-whaledex.md)                                                     |
| Architecture          | [ADR-0003](../adr/0003-sui-deepbook-mvp.md)                                            |
| Delivery order        | [Roadmap](../DOCS.md)                                                                  |

## 1. Executive summary

WhaleDEX targets a non-custodial spot DEX on Sui Testnet. DeepBookV3 provides the on-chain order book, matching and settlement layer. WhaleDEX provides wallet connection, market presentation, order review, transaction tracking and derived history.

The MVP supports one verified Testnet market first, then market orders, limit orders, open orders and cancellation. It does not build a custom matching engine, publish a Move trading package, support EVM networks or launch with real-value assets.

## 2. Evidence and problem

Implemented in the repository:

- Next.js, React, Fastify and strict TypeScript monorepo foundations.
- Static landing-page work, health API, shared configuration and baseline tests.
- Sui Testnet/Mainnet metadata, strict network environment validation and a public network catalog API.

Not implemented: Sui wallet connection, gRPC client, DeepBook SDK integration, balances, order book, trading, indexer, database, deployment or CI.

Problem hypothesis: testnet traders need a transparent order flow because network context, wallet versus trading-account balances, price limits and submitted versus confirmed states are easy to misunderstand. This hypothesis still requires user validation.

## 3. Goals

- `G-01`: Complete a Sui Testnet market order through confirmed on-chain execution.
- `G-02`: Create, display and cancel a DeepBook limit order.
- `G-03`: Explain Testnet value, price source, fees and transaction states without fabricated data.
- `G-04`: Preserve non-custodial control and prevent backend signing or secret handling.
- `G-05`: Produce repeatable test and release evidence for each slice.

Performance targets must be measured after provider and market selection. Do not present illustrative latency, gas, liquidity or completion-rate values as observed WhaleDEX results.

## 4. Scope and journey

MVP: Sui Testnet, external Sui wallet, allowlisted coins/markets, balances, order book, market order, limit/post-only order when supported, open orders, cancel, transaction digest and Sui Explorer links.

Later beta: indexed fills/history, charts and reference-price display. Sui Mainnet requires a separate release decision.

Out of scope: EVM/Sepolia, multi-chain, bridge, custom AMM/CLOB, margin, perpetual, prediction markets, arbitrary coin import, fiat, NFT and in-app seed storage.

Happy path:

1. Confirm the Sui Testnet banner and connect an external wallet.
2. Select a verified DeepBook market and read balances/order book.
3. Enter a valid side, type, amount and price where applicable.
4. Review price limit, quantity, fees, gas needs and affected account.
5. Build/preflight the current transaction and request wallet signature.
6. Record the digest as submitted, then wait for confirmed or failed state.
7. Refresh balances, book, orders and fills for the same account/network.

## 5. Shared requirement IDs

Canonical definitions live in [PRD sections 7–8](../prd-whaledex.md).

| Group                        | Requirement IDs                                    |
| ---------------------------- | -------------------------------------------------- |
| Network and wallet context   | FR-NETWORK-01, FR-WALLET-01, FR-WALLET-02          |
| Market identity and balances | FR-MARKET-01, FR-BALANCE-01                        |
| Order-book data              | FR-BOOK-01                                         |
| Order validation/execution   | FR-ORDER-01, FR-ORDER-02, FR-ORDER-03, FR-ORDER-04 |
| Trading-account assets       | FR-ASSET-01                                        |
| Transaction tracking         | FR-TX-01, FR-TX-02                                 |
| History and reference price  | FR-HISTORY-01, FR-PRICE-01                         |

Non-functional IDs: NFR-SEC-01, NFR-SEC-02, NFR-DATA-01, NFR-REL-01, NFR-A11Y-01, NFR-OBS-01, NFR-PERF-01 and NFR-COMPAT-01.

## 6. Risks and responses

| Risk                                     | Required response                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| Stale order book or price                | Display freshness, preflight again and prevent signing stale intent          |
| Wrong coin/pool/package                  | Verify full identifiers against the allowlist, not symbol alone              |
| Decimal, tick or lot error               | Use integer-safe math and boundary tests                                     |
| Account/network changes during a request | Bind derived state to a context fingerprint and discard old responses        |
| Unknown submission outcome               | Track digest; never retry writes blindly or label timeout as failure/success |
| Indexer outage                           | Keep protocol-critical actions independent from the derived read model       |
| Testnet price mistaken for value         | Persistent Testnet labeling and explicit price-source text                   |
| Backend custody creep                    | No key endpoints or server signer; security review before release            |

## 7. Definition of done

Done requires accepted happy/failure-path tests, correct loading/empty/stale/error states, browser verification for UI, relevant format/lint/typecheck/test/build checks, updated docs/config and an atomic commit. Planned descriptions must be replaced with source and test evidence in the [traceability matrix](traceability-matrix.md) as implementation lands.
