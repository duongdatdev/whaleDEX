# Practical Lab 3 — From Evidence to a Testable Sui Trading Specification

## Lab objective

Use AI to analyze the WhaleDEX repository and produce a reviewable requirements slice for “review a DeepBook market order”. The exercise follows this chain:

```text
repository evidence → discovery hypothesis → PRD goal → requirement → acceptance test → release evidence
```

Recommended duration: 90–120 minutes. Work in pairs when possible: one learner operates the AI assistant while the other challenges evidence and acceptance criteria.

## Current scope

Use [ADR-0003](../adr/0003-sui-deepbook-mvp.md) and the [product PRD](../prd-whaledex.md). The target is Sui Testnet + DeepBookV3. Sui network metadata and validation are implemented; the live client, wallet and trading integration are not. Lab execution uses fixtures, local tests or token-only Testnet activity—never real funds.

## Rules

- Do not use real funds, private keys, seed phrases, production credentials or personal interview data.
- Treat code, schemas and tests as implementation evidence; treat roadmap text as proposed behavior.
- Mark unsupported statements as assumptions or questions.
- Do not invent package IDs, pool IDs, coin types, liquidity or SDK behavior.
- Keep an audit note with input sources, prompt, output, edits, reviewer and date.

## Part A — Inspect before proposing

Complete this table:

| Question                                      | Evidence path                         | Answer |
| --------------------------------------------- | ------------------------------------- | ------ |
| What can the frontend do today?               | `apps/web/src/app/page.tsx` and tests |        |
| What can the API do today?                    | `apps/api/src/app.ts` and tests       |        |
| Which shared schemas exist?                   | `packages/shared/src/`                |        |
| Which current configs conflict with ADR-0003? | chain/env source and tests            |        |
| Which dependencies block the first market?    | `docs/prd-whaledex.md`                |        |

Example prompt:

```text
Analyze only the supplied repository excerpts. Return Capability, Status
(implemented/proposed/absent/legacy), Evidence path and Confidence. Do not infer
Sui support from documentation. List contradictions and missing evidence.
```

Expected distinction: the TypeScript monorepo, health API and Sui network catalog are implemented; Sui wallet, DeepBook market data and trading are proposed.

## Part B — Discovery synthesis

Treat these as fictional workshop observations, not real research:

- `OBS-01`: Three of five participants confused wallet balance with trading-account balance.
- `OBS-02`: Four of five looked for the network before signing.
- `OBS-03`: Two participants treated “submitted” as final success.
- `OBS-04`: Four participants wanted to see the worst acceptable execution price.
- `OBS-05`: One advanced participant requested margin trading.

Produce one problem hypothesis, up to three opportunities, one counter-hypothesis, three non-leading interview questions and a recommendation about margin scope. Every statement must retain observation IDs and separate observation from interpretation.

## Part C — Challenge a requirement

Bad requirement:

> The application should use AI to instantly find the safest price for every Sui coin.

Identify defects, including unjustified AI use, unmeasurable “instantly/safest”, arbitrary-coin conflict, missing market identity, amount, side, freshness, price limit, fee and failure handling.

Improved requirements:

> FR-BOOK-01: Display the current DeepBook order book and best bid/ask with source freshness; unavailable or stale data must remain explicitly unavailable or stale.

> FR-ORDER-02: Before requesting a market-order signature, use the current account/network/market/amount context to preflight execution and enforce the reviewed price limit; invalidate stale results.

Use an AI red-team prompt to list ambiguity, boundary cases, security assumptions, dependencies and verification methods before rewriting requirements.

## Part D — Story and acceptance tests

Story:

> As a Sui Testnet trader, I want to review a current market order and its execution boundary so that I can decide whether to sign it.

Write Given/When/Then scenarios for at least:

1. valid current order preview;
2. invalid amount;
3. amount not aligned to lot size;
4. stale order book/preflight;
5. old response arriving after new input;
6. account change;
7. network mismatch;
8. insufficient asset balance;
9. insufficient SUI gas reserve;
10. wallet rejection;
11. submitted digest timing out before a known result;
12. keyboard and screen-reader status behavior.

Example:

```gherkin
Scenario: Older preflight response arrives last
  Given request A exists for amount "1000000"
  And request B exists for the current amount "2000000"
  When response B arrives and is displayed
  And response A arrives afterward
  Then the displayed review still belongs to request B
  And signing remains bound to request B

Scenario: Account changes while review is displayed
  Given a current review is displayed for account A
  When the wallet reports account B
  Then the review and account-derived balances are invalidated
  And signing is disabled until a new preflight succeeds

Scenario: Submission outcome is unknown
  Given the wallet returned a transaction digest
  When the status provider times out
  Then the application keeps the transaction in unknown or pending state
  And it does not submit a duplicate transaction automatically
  And it provides the Testnet Explorer link when the digest is available
```

## Part E — Traceability

Add the story/tests to [traceability-matrix.md](traceability-matrix.md). Each row must contain source goal, requirement ID, acceptance evidence, component and current status. Audit for orphan goals, requirements without tests, stale IDs and claims unsupported by source.

## Part F — Change impact

Stakeholder request:

> “Let users import any Sui coin in the MVP.”

Analyze impact on allowlists, spoofed symbols, coin type verification, decimals, unsupported DeepBook pools, UX warnings, tests and schedule. The outcome is not automatically accept/reject; record a product decision after evidence and risk review.

Additional context-change exercise:

A market-order preflight is pending when the wallet account changes. Explain why the old response cannot populate the new form, why any already-submitted digest remains tied to the original sender, and why missing market/provider data must be unavailable rather than fabricated.

## Deliverables

1. Completed evidence table.
2. Discovery synthesis retaining observation IDs.
3. Defect review and corrected requirements.
4. Story with at least twelve acceptance scenarios.
5. Updated traceability rows.
6. Change-impact analysis.
7. Short AI audit note describing accepted, edited and rejected suggestions.

## Assessment rubric

| Criterion               | Weight |
| ----------------------- | -----: |
| Evidence discipline     |    20% |
| Requirement quality     |    20% |
| Acceptance coverage     |    20% |
| Traceability            |    15% |
| Risk/change analysis    |    15% |
| Responsible AI practice |    10% |

Suggested passing threshold: 70%, with no zero score in evidence discipline or requirement quality.
