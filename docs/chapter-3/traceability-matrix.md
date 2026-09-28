# WhaleDEX Sui Requirements Traceability Matrix

Canonical definitions: [product PRD](../prd-whaledex.md). Learning summary: [MVP PRD](whaledex-mvp-prd.md). Scope: Sui Testnet spot trading through DeepBookV3.

`Implemented` requires source and test evidence. `Planned` describes future acceptance tests, not passing tests. `Partial` means an enabling foundation exists while runtime behavior is missing.

| Goal/source  | Requirement   | Acceptance evidence                                                                | Component           | Current status                     |
| ------------ | ------------- | ---------------------------------------------------------------------------------- | ------------------- | ---------------------------------- |
| G-01, G-03   | FR-NETWORK-01 | Testnet config validates; wrong network blocks signing with recovery guidance      | Shared/web          | Planned; legacy EVM config exists  |
| G-01, G-04   | FR-WALLET-01  | Connect/disconnect/reject flows work without API receiving secrets                 | Web                 | Planned                            |
| G-01         | FR-WALLET-02  | Account/network change invalidates derived state; submitted digest remains tracked | Web                 | Planned                            |
| G-01, DEP-02 | FR-MARKET-01  | Unknown coin type/pool/package is rejected; verified market metadata renders       | Shared/adapter      | Planned                            |
| G-01         | FR-BALANCE-01 | Decimals and wallet/trading balances reconcile with chain reads                    | Adapter/web         | Planned                            |
| G-01, G-03   | FR-BOOK-01    | Fresh bid/ask renders; empty, stale and provider-error states remain distinct      | Adapter/web         | Planned                            |
| G-01, G-02   | FR-ORDER-01   | Invalid side/type/amount/price/tick/lot/balance/gas is blocked                     | Shared/web          | Planned                            |
| G-01         | FR-ORDER-02   | Current market-order preflight succeeds; stale quote/limit blocks signing          | Adapter/web         | Planned                            |
| G-02         | FR-ORDER-03   | Limit/post-only review shows price, quantity, availability and fees                | Adapter/web         | Planned                            |
| G-02         | FR-ORDER-04   | Create, partial-fill display and cancel reconcile with on-chain order state        | Adapter/web         | Planned                            |
| G-02         | FR-ASSET-01   | Deposit/withdraw review and owner signature reconcile balances                     | Adapter/web         | Planned if BalanceManager required |
| G-01, G-03   | FR-TX-01      | Awaiting-signature/submitted/confirmed/failed/rejected/unknown transitions tested  | Web                 | Planned                            |
| G-01         | FR-TX-02      | Reload restores digest watcher and Explorer link for original network              | Web/storage         | Planned                            |
| G-03         | FR-HISTORY-01 | Cursor, source and freshness are explicit; indexer outage has bounded impact       | API/web             | Planned for beta                   |
| G-03         | FR-PRICE-01   | DeepBook execution price and optional oracle reference are labeled separately      | Adapter/web         | Planned for beta                   |
| G-04         | NFR-SEC-01    | API/log/storage review finds no seed, private key or signing secret                | All/security        | Planned release review             |
| G-04, DEP-02 | NFR-SEC-02    | Invalid network/package/pool/coin negative tests pass                              | Shared/adapter      | Planned                            |
| G-01, G-02   | NFR-DATA-01   | Decimal, integer, rounding, tick and lot boundary tests pass                       | Shared/adapter      | Planned                            |
| G-01, G-05   | NFR-REL-01    | Async race, bounded read retry and no blind write retry tests pass                 | Web/adapter         | Planned                            |
| G-03         | NFR-A11Y-01   | Keyboard/focus/label/live-status review passes on actual trading UI                | Web/QA              | Planned                            |
| G-05         | NFR-OBS-01    | Stable errors, request IDs and redacted provider diagnostics verified              | API/operations      | Planned                            |
| G-05         | NFR-PERF-01   | Staging p50/p95 baseline is measured before thresholds are accepted                | Engineering/product | Planned                            |
| G-05, DEP-04 | NFR-COMPAT-01 | Target wallet/browser/gRPC matrix has recorded evidence                            | QA                  | Planned                            |

## Coverage rules

- Each canonical FR/NFR ID appears exactly once in this matrix.
- A linked test proves only the behavior it executes; configuration tests do not prove wallet or trading readiness.
- Replace planned descriptions with exact source, test, smoke-run or review evidence in the implementing change.
- Update PRD, learning PRD, lab and matrix together when scope changes.
- Fictional workshop observations are learning inputs, not user-research evidence.

## Current audit

The repository foundation is implemented, but all Sui/DeepBook requirements above remain planned. The existing EVM chain registry is legacy code scheduled for replacement; it is not partial proof of Sui network support. No document may claim live wallet, market data or trading until corresponding source and test evidence lands.
