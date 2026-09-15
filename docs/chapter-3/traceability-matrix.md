# WhaleDEX MVP Requirements Traceability Matrix

This matrix links intent to verification. `Proposed` means the requirement is documented but not implemented. Update status and evidence links in the pull request that implements each slice.

| Goal/source          | Requirement    | Story                      | Acceptance/test evidence                                   | Component/owner           | Status                     |
| -------------------- | -------------- | -------------------------- | ---------------------------------------------------------- | ------------------------- | -------------------------- |
| G-01, H-01           | FR-WALLET-01   | US-WALLET-01               | Connect success; rejection                                 | Web/wallet                | Proposed                   |
| G-01                 | FR-WALLET-02   | US-WALLET-01               | Account change invalidates prior context                   | Web/wallet                | Proposed                   |
| G-02, OBS-02         | FR-NETWORK-01  | US-WALLET-01               | Unsupported network blocks transaction path                | Web/wallet                | Proposed                   |
| G-02                 | FR-TOKEN-01    | US-QUOTE-01                | Duplicate symbols remain distinguishable by address        | Web/token selector        | Proposed                   |
| G-01                 | FR-BALANCE-01  | US-WALLET-01               | Balance refreshes for active chain/account                 | Web/RPC adapter           | Proposed                   |
| G-01                 | FR-INPUT-01    | US-QUOTE-01                | Invalid/over-precision/above-balance table tests           | Web/swap form             | Proposed                   |
| G-01, H-02           | FR-QUOTE-01    | US-QUOTE-01                | Superseded response cannot replace current quote           | Web/quote client          | Proposed                   |
| G-02, H-02           | FR-QUOTE-02    | US-QUOTE-01                | Current quote fields display; optional values labelled     | Web/quote panel           | Proposed                   |
| G-02                 | FR-QUOTE-03    | US-QUOTE-01                | Expiry and context-change scenarios                        | Web/quote client          | Proposed                   |
| G-02, H-01           | FR-APPROVAL-01 | US-APPROVAL-01             | Insufficient allowance exposes separate approval           | Web + chain adapter       | Proposed                   |
| G-02, H-01           | FR-APPROVAL-02 | US-APPROVAL-01             | Spender disclosure; reread allowance; refresh quote        | Web + chain adapter       | Proposed                   |
| G-01, G-02           | FR-SWAP-01     | US-SWAP-01                 | Context validation and failed-simulation integration tests | Web + protocol adapter    | Proposed                   |
| G-01, OBS-03         | FR-TX-01       | US-SWAP-01                 | Submitted/confirmed/failed/replaced state tests            | Web/transaction tracker   | Proposed                   |
| G-01, H-04           | FR-TX-02       | US-SWAP-01                 | Refresh restores chain/account/hash tracking               | Web/local persistence     | Proposed                   |
| G-01                 | FR-TX-03       | US-SWAP-01                 | Final receipt refreshes derived state                      | Web/data clients          | Proposed                   |
| G-02                 | FR-EXPLORER-01 | US-SWAP-01                 | Explorer URL allowlist/configuration test                  | Web/chain config          | Proposed                   |
| Asset-safety policy  | NFR-SEC-01     | All                        | Threat review; API/log/storage inspection                  | Security + all components | Proposed                   |
| DEP-01..03           | NFR-SEC-02     | US-APPROVAL-01, US-SWAP-01 | Invalid chain/target/spender negative tests                | Shared config + adapters  | Blocked by decision        |
| Data convention      | NFR-DATA-01    | US-QUOTE-01, US-SWAP-01    | Schema and large-value/rounding boundary tests             | Shared + API + web        | Proposed                   |
| Accessibility policy | NFR-A11Y-01    | All UI stories             | Keyboard, focus, labels, live-region review                | Design + web + QA         | Proposed                   |
| Async correctness    | NFR-REL-01     | US-WALLET-01, US-QUOTE-01  | Account/chain/input race-condition tests                   | Web                       | Proposed                   |
| Operations policy    | NFR-OBS-01     | All                        | Stable error contract and redacted-log inspection          | API + web + operations    | Proposed                   |
| DEP-06               | NFR-COMPAT-01  | US-WALLET-01               | Approved browser/wallet matrix results                     | QA                        | Blocked by decision        |
| G-03                 | NFR-PERF-01    | US-QUOTE-01                | Staging percentile baseline/report                         | Engineering + product     | Blocked by provider choice |

## Coverage rules

- Every approved P0 goal must map to at least one requirement.
- Every P0 functional requirement must map to a story and one or more executable or manually repeatable acceptance tests.
- Every non-functional requirement must name a verification method and evidence owner.
- A `Blocked by decision` row cannot enter implementation until its dependency is approved.
- A requirement change updates this matrix, affected stories/specifications, and tests in the same review.
- Implementation PRs replace descriptive test names with links to exact test files, cases, runs, or signed review evidence.

## Current audit summary

- Goals `G-01` through `G-03` are represented.
- All documented P0 functional requirements have a proposed story/test path.
- No product feature in this matrix is implemented by the current foundation.
- Security configuration, compatibility, and performance rows remain blocked by explicit decisions.
- Fictional lab observations (`OBS-*`) illustrate traceability only and are not real discovery evidence.
