# WhaleDEX EVM Swap MVP — Learning PRD

| Field                 | Value                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- |
| Status                | Learning companion aligned with the current product scope; not an independent approval |
| Version               | 2.0                                                                                    |
| Updated               | 2026-09-21                                                                             |
| Canonical product PRD | [WhaleDEX PRD](../prd-whaledex.md)                                                     |
| Architecture          | [ADR-0002](../adr/0002-evm-multichain.md)                                              |
| Delivery order        | [Roadmap](../DOCS.md)                                                                  |
| Named owners          | Not assigned; role labels below are responsibilities, not appointments                 |

## 1. Executive summary

WhaleDEX targets same-chain spot swaps on five EVM mainnets: BSC (56), Ethereum (1), Base (8453), Polygon PoS (137), and Arbitrum One (42161). Ethereum Sepolia (11155111) is the sole testnet and current default. MVP-A implements a custom Uniswap V3 routing engine on Sepolia; MVP-B supplies the same user flow on all five mainnets using a mainnet quote adapter. LI.FI is a candidate to evaluate, not a verified dependency.

Custom routing means route generation, quotes, scoring and calldata on an existing protocol. It does not mean implementing an AMM or matching engine. The chapter teaches requirements analysis against this scope; students must not reopen settled chain choices or present proposed trading behaviour as implemented.

## 2. Evidence and problem

Implemented at commit `a13203e`:

- Static web landing page and Fastify process health.
- Immutable six-chain metadata registry, Zod schemas and strict chain-ID environment validation.
- API `GET /v1/chains` returning `{ defaultChainId, chains }`.
- Web `chains`/`defaultChain` exports and configurable defaults in both apps.
- Tests for chain metadata, default/invalid inputs and API contract.

See [shared registry](../../packages/shared/src/chains.ts), [API](../../apps/api/src/app.ts) and [web configuration](../../apps/web/src/lib/chains.ts).

Not implemented: network-selector UI, wallet connection, RPC transport/fallback execution, balances, token list, quote, approval, routing, swap, Transaction Center, history, CI or deployment. Public RPC URLs in a registry are not evidence of live endpoint availability.

Problem hypothesis: users need a transparent, recoverable swap flow because chain context, token identity, approval and transaction outcomes can be misunderstood. Personas and lab observations are provisional or fictional, not validated user research.

## 3. Goals and measurable outcomes

- `G-01`: Complete a Sepolia exact-input swap through a successful receipt and balance reconciliation.
- `G-02`: Understand network, token, spender, quote boundaries and submitted versus confirmed states.
- `G-03`: Establish repeatable tests and release evidence for each slice.
- `G-04`: Deliver the same swap journey on all five mainnets with per-chain readiness.

Engineering criteria: required happy/failure paths pass; no known critical asset-flow defect remains at release; each mainnet has its own deployment/provider/fork-test evidence. Proposed usability exercises may use 4/5 participants explaining approval and transaction states correctly. Such a formative threshold is not statistical market validation or an observed result.

Quote/refresh p50/p95 targets must be measured and agreed after provider selection. Do not copy gas numbers, route counts or success rates from the reference project as WhaleDEX results.

## 4. Scope and journey

MVP-A: external wallet, Sepolia funding instructions, verified native/ERC-20 tokens, balances, exact-input one/two-hop V3 routes, bounded quote, approval, review/simulation, transaction submission and recovery.

MVP-B: BSC/Ethereum/Base/Polygon/Arbitrum adapter coverage, same-chain validation, allowance/revoke, history and per-chain rollout. Permit is a later capability-based optimization with an explicit approve fallback.

Not in the MVP: bridges, cross-chain swaps, exact-output, custom split-route execution, arbitrary token import, limit orders, custom AMM/router contracts, LP management, leverage, fiat, NFT or in-app seed storage. Evaluating multiple route candidates is in scope; splitting a trade across several routes is not.

Happy path:

1. Select a supported, transaction-enabled chain and connect an external wallet.
2. Choose allowlisted tokens and enter a valid exact-input amount.
3. Read a quote bound to chain, account, recipient, tokens, amount and slippage.
4. Review spender and approve the required amount if allowance is insufficient.
5. Wait for approval, read allowance again and refresh the quote.
6. Revalidate transaction intent, simulate exact calldata and review before signing.
7. Record submission as pending, not success; track original/replacement hashes.
8. Confirm using the chain policy and refresh balances/allowance/history.

Changing the active chain invalidates the form quote, but pending transactions remain tracked on their original chain. A timeout does not prove a transaction was dropped.

## 5. Requirements and acceptance IDs

Use the definitions in [canonical PRD sections 4–6](../prd-whaledex.md); the IDs below are shared across chapter, lab and matrix.

| Group                                  | Requirement IDs                                          | Story                          |
| -------------------------------------- | -------------------------------------------------------- | ------------------------------ |
| Network metadata and runtime selection | FR-CONFIG-01, FR-NETWORK-01                              | US-NETWORK-01                  |
| External wallet and context changes    | FR-WALLET-01, FR-WALLET-02                               | US-WALLET-01                   |
| Tokens, balances and input             | FR-TOKEN-01, FR-BALANCE-01, FR-INPUT-01                  | US-WALLET-01 / US-QUOTE-01     |
| Quote request, display and expiry      | FR-QUOTE-01, FR-QUOTE-02, FR-QUOTE-03                    | US-QUOTE-01                    |
| Sepolia engine                         | FR-ROUTING-01                                            | US-ROUTING-01                  |
| Approval and refresh                   | FR-APPROVAL-01, FR-APPROVAL-02                           | US-APPROVAL-01                 |
| Execution and tracking                 | FR-SWAP-01, FR-TX-01, FR-TX-02, FR-TX-03, FR-EXPLORER-01 | US-SWAP-01                     |
| Mainnet adapters and permissions       | FR-MAINNET-01, FR-ALLOWANCE-01                           | US-MAINNET-01 / US-APPROVAL-01 |
| Optional permit                        | FR-PERMIT-01                                             | US-PERMIT-01                   |

Non-functional IDs: NFR-SEC-01, NFR-SEC-02, NFR-DATA-01, NFR-A11Y-01, NFR-REL-01, NFR-OBS-01, NFR-COMPAT-01 and NFR-PERF-01. Their definitions and verification methods live in the canonical PRD, and each appears in the matrix.

## 6. Dependencies and risks

DEP-01..DEP-07 in the product PRD cover RPC/finality, aggregator, deployments, token/liquidity/funding, slippage/gas policy, wallet compatibility and history/privacy/operations. Chain names and IDs are settled; deployed contracts and provider capability are not.

| Risk                                             | Required response and evidence                                                            |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Cross-chain or untrusted provider payload        | Validate same-chain intent, spender/target/recipient/value and output bound               |
| Old response after account/network/input changes | Context fingerprint and race-condition tests                                              |
| Incorrect token decimals or gas conversion       | Integer/decimal-safe boundary tests; nullable valuations when unavailable                 |
| Missing simulation support or RPC outage         | Distinguish unknown from revert; retry/alternate read provider before signing             |
| Replacement, cancel or long pending transaction  | Stable intent ID and hash lineage; unknown instead of timeout-based dropped               |
| Mainnet assumed ready after Sepolia test         | Independent fork/deployment/provider evidence on all five mainnets                        |
| Overstated wallet or permit capability           | Capability checks and tested approval fallback; no inference solely from account bytecode |

## 7. Rollout and definition of done

1. Preserve the implemented configuration and complete remaining baseline/CI/provider decisions.
2. Build wallet/balances and prove the Sepolia routing/approval/swap path.
3. Test the five mainnet adapters on reproducible forks before per-chain release.
4. Add permit/hardening and then separately specified wallet extensions.

The lab uses fixtures, local execution or Sepolia; it never asks students to move real funds. Mainnet is part of the product scope, not an exercise side effect.

Done requires accepted tests, correct loading/empty/stale/error states, browser verification for UI, relevant format/lint/typecheck/test/build checks, updated docs/env and an atomic commit. Implementation evidence must replace proposed test descriptions in the [traceability matrix](traceability-matrix.md).
