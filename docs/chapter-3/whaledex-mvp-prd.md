# WhaleDEX Testnet Swap MVP — Product Requirement Document

| Field         | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Status        | Draft for discovery and feasibility validation         |
| Version       | 0.1                                                    |
| Product       | WhaleDEX                                               |
| Product owner | Unassigned                                             |
| Reviewers     | Product, engineering, design, QA, security, operations |
| Last updated  | 2026-09-15                                             |

## 1. Executive summary

WhaleDEX currently has a tested web/API monorepo foundation but no blockchain or trading capability. This PRD proposes a narrow MVP in which a user can complete and verify an exact-input token swap using supported tokens on one approved EVM-compatible testnet.

The MVP is a learning and validation release. It must not imply mainnet readiness, custody user keys, or use unverified contracts. Chain, protocol model, deployment addresses, and liquidity remain open decisions and block implementation beyond a prototype.

## 2. Evidence and problem

### Verified evidence

- The web application is currently a static foundation page.
- The API exposes only `GET /health`.
- Shared schemas, environment validation, unit/component tests, linting, type checking, and build commands exist.
- The project roadmap identifies connect → quote → approve if required → swap → receipt as the intended critical path.

### Problem hypothesis

Testnet users need a clear and recoverable swap flow because network context, token identity, allowance, quote boundaries, and transaction state are easy to misunderstand. This hypothesis requires user validation.

### Target user

Primary provisional segment: a Web3 learner or evaluator who has a compatible browser wallet and testnet funds but needs guidance through approval and transaction lifecycle states.

## 3. Goals, outcomes, and non-goals

### Goals

- `G-01`: Enable a qualified test user to complete one supported exact-input swap from connection through confirmed receipt.
- `G-02`: Make network, token, spender, quote boundary, and transaction state understandable before and after signing.
- `G-03`: Establish a testable vertical slice and evidence base for the next product decision.

### Proposed success measures

Targets are provisional until discovery establishes a baseline.

| Metric                              | Proposed target                                                                                                 | Measurement note                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Moderated task completion           | At least 80% of qualified participants complete the testnet flow without facilitator intervention               | Minimum five formative sessions; not market-level statistical proof |
| Critical comprehension              | At least 80% correctly explain approval vs swap and submitted vs confirmed                                      | Ask neutral post-task questions                                     |
| Supported-path technical completion | At least 95% in a controlled test environment excluding deliberate wallet rejection and upstream testnet outage | Instrument stable failure codes                                     |
| Recoverability                      | At least 80% recover a submitted transaction after refresh in usability testing                                 | Same browser/profile for MVP                                        |
| Asset-safety defects                | Zero known critical/high defects at release gate                                                                | Severity model approved by security owner                           |

### Non-goals

- Mainnet or real-fund launch.
- Custody, accounts/passwords, seed phrase, or private-key storage.
- Cross-chain, exact-output, limit orders, advanced routing, farming, staking, governance, or fiat.
- Arbitrary token import.
- Guaranteed portfolio or cross-device transaction history.
- Simultaneous implementation of an existing-protocol integration and a custom AMM.

## 4. Scope and user journey

### In scope

- One approved EVM-compatible testnet.
- A small verified token allowlist.
- Wallet connect/disconnect, account change, and network handling.
- Token balance and allowance reads.
- Exact-input quote with expected output, minimum received, expiry, route, fees, and gas estimate where available.
- Configurable slippage within an approved safe range.
- Approval for a verified spender when required.
- Preflight context checks and transaction simulation.
- Swap submission and tracking through confirmed, failed, or replaced state.
- Same-browser recovery of submitted transaction tracking.

### Happy path

1. User opens the swap page without being forced to connect.
2. User connects a supported wallet and selects/switches to the supported network.
3. User selects two supported tokens and enters an exact input amount.
4. WhaleDEX shows a current quote and execution boundaries.
5. If allowance is insufficient, the user reviews and signs a separate approval.
6. WhaleDEX re-reads allowance and refreshes the quote.
7. WhaleDEX revalidates context, simulates, and requests the swap signature.
8. The wallet broadcasts the transaction; WhaleDEX marks it submitted.
9. WhaleDEX tracks the receipt to the configured outcome and refreshes balances.

## 5. Functional requirements

| ID             | Requirement                                                                                                                                                                       | Priority |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-WALLET-01   | The system shall connect and disconnect an approved wallet without requesting a seed phrase or private key.                                                                       | P0       |
| FR-WALLET-02   | The system shall react to account and chain changes by invalidating account/chain-derived state and reloading current data.                                                       | P0       |
| FR-NETWORK-01  | The system shall identify unsupported networks and prevent transaction preparation until the approved network is active.                                                          | P0       |
| FR-TOKEN-01    | The system shall list only tokens verified for the active chain and display address information sufficient to distinguish duplicate symbols.                                      | P0       |
| FR-BALANCE-01  | The system shall read and display balances for the active account and chain using token decimals.                                                                                 | P0       |
| FR-INPUT-01    | The system shall reject empty, zero, negative, malformed, over-precision, same-token, and above-balance input before requesting a quote.                                          | P0       |
| FR-QUOTE-01    | The system shall request a new quote when its input context changes and shall ignore responses for a superseded context.                                                          | P0       |
| FR-QUOTE-02    | The system shall show expected output, minimum received, route, fee, price impact when reliable, gas estimate when available, source freshness, and expiry.                       | P0       |
| FR-QUOTE-03    | The system shall prevent confirmation of an expired quote or a quote bound to different chain, account, tokens, amount, slippage, route, or deployment context.                   | P0       |
| FR-APPROVAL-01 | The system shall read allowance for the verified token/spender pair and present approval separately when allowance is insufficient.                                               | P0       |
| FR-APPROVAL-02 | The system shall disclose spender and approved allowance policy before signature, re-read allowance after confirmation, and require a fresh quote.                                | P0       |
| FR-SWAP-01     | The system shall validate chain, account, quote, balance, allowance, target, spender, deadline, and output bound and simulate the transaction before requesting a swap signature. | P0       |
| FR-TX-01       | The system shall distinguish awaiting signature, submitted, confirmed, failed, rejected, and replaced states.                                                                     | P0       |
| FR-TX-02       | The system shall store enough chain/account/hash context to resume same-browser tracking after refresh.                                                                           | P0       |
| FR-TX-03       | The system shall refresh relevant balance, allowance, and activity state after finalization.                                                                                      | P0       |
| FR-EXPLORER-01 | The system shall construct explorer links only from an approved chain configuration.                                                                                              | P1       |

## 6. Non-functional and data requirements

| ID            | Requirement                                                                                                                          | Verification                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| NFR-SEC-01    | User keys and seed phrases shall never enter WhaleDEX application state, API requests, logs, analytics, or storage.                  | Threat review and instrumentation/log inspection           |
| NFR-SEC-02    | Contract addresses, spender, transaction target, and chain shall come from version-controlled approved configuration.                | Configuration review and negative integration tests        |
| NFR-DATA-01   | Asset quantities crossing JSON boundaries shall use decimal strings in integer smallest units.                                       | Schema and boundary tests                                  |
| NFR-A11Y-01   | The critical flow shall be keyboard operable, have visible focus, labelled controls, text status, and announced async errors/status. | Automated checks plus manual keyboard/screen-reader review |
| NFR-REL-01    | Async responses from stale chain/account/form context shall not update the active transaction path.                                  | Race-condition component/integration tests                 |
| NFR-OBS-01    | Failures shall use stable error codes and request/correlation IDs without logging secrets.                                           | API/UI contract tests and log inspection                   |
| NFR-COMPAT-01 | Supported browser and wallet versions shall be explicitly listed and tested before release.                                          | Approved compatibility matrix                              |
| NFR-PERF-01   | Quote and state-refresh percentile targets shall be baselined against the selected provider and approved before release.             | Staging measurement report                                 |

## 7. Dependencies and decisions

| ID     | Dependency/decision                                                        | Owner                              | Needed by                              |
| ------ | -------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------- |
| DEP-01 | Approved chain ID, testnet, RPC, explorer, faucet, and confirmation policy | Architecture                       | Wallet spike                           |
| DEP-02 | Existing protocol integration vs custom AMM                                | Product + architecture             | Protocol design                        |
| DEP-03 | Verified deployment, ABI, router/target, spender, fees, and licence        | Architecture + legal as applicable | Quote/transaction adapter              |
| DEP-04 | Verified token addresses, decimals, metadata, and test liquidity           | Product + engineering              | Token list and feasibility transaction |
| DEP-05 | Approval policy and slippage boundaries                                    | Product + security                 | Approval and settings UI               |
| DEP-06 | Wallet SDK/provider and supported compatibility matrix                     | Frontend architecture              | Wallet implementation                  |
| DEP-07 | Analytics/privacy policy                                                   | Product + privacy owner            | Production instrumentation             |

No dependency row is permission to invent an answer. Each approved choice should be recorded in `docs/adr/` and linked here.

## 8. Risks and mitigations

| Risk                             | Impact                                      | Mitigation/evidence required                                                  |
| -------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| Wrong chain, target, or spender  | User signs unintended action                | Approved per-chain configuration, runtime validation, negative tests          |
| Stale or out-of-order quote      | Output differs from user expectation        | Context key, expiry, minimum output, revalidation                             |
| Misleading transaction success   | User acts on an unconfirmed hash            | Explicit lifecycle and receipt/confirmation policy                            |
| Testnet/RPC instability          | False product failures                      | Bounded retries, clear upstream error, deterministic integration environment  |
| Token metadata/behaviour differs | Incorrect amount or failed transfer         | Allowlist, verified decimals, explicit unsupported-token policy               |
| Excessive approval               | Larger permission exposure                  | Product/security decision, disclosure, least-privilege default where feasible |
| Custom AMM defects               | Loss of assets if later used beyond testnet | Separate design, invariant/fuzz tests, independent review before real funds   |

## 9. Rollout

1. Validate discovery hypotheses with interviews and a clickable prototype.
2. Complete chain/protocol feasibility spike and one manual testnet transaction.
3. Implement behind a testnet-only environment flag/configuration.
4. Run deterministic automated tests and moderated internal usability sessions.
5. Run a limited testnet beta with visible testnet messaging and monitored failure codes.
6. Review evidence and decide whether to iterate, expand, or stop.

This PRD does not authorize a mainnet launch. Mainnet requires a separate PRD/release decision, threat model, operational readiness, and security assessment appropriate to the selected protocol.

## 10. Definition of done

- All P0 requirements trace to accepted tests in [`traceability-matrix.md`](traceability-matrix.md).
- Supported happy path and required failure/recovery paths pass on the approved environment.
- Product, design, engineering, QA, security, and operations approvals are recorded.
- No unverified contract address, placeholder deployment, private key, or seed phrase is shipped.
- Metrics are implemented under an approved privacy policy or explicitly deferred with an owner.
- README, environment examples, API/data schemas, ADRs, support notes, and runbooks match released behaviour.

## 11. Open questions

1. Who is the validated primary user and what evidence supports the problem?
2. Which chain and protocol deployment provide stable testnet liquidity?
3. Will WhaleDEX integrate an existing protocol or build a custom AMM?
4. What slippage range, approval policy, and confirmation threshold are acceptable?
5. Is same-browser local activity sufficient, or is indexed cross-session history P0?
6. Which browsers and wallets are supported?
7. Which performance, availability, analytics, privacy, and support targets apply?

The PRD remains a draft until these blocking decisions have owners and the discovery/feasibility gates are satisfied.
