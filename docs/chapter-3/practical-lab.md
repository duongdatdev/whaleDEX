# Practical Lab 3 — From Evidence to a Testable Feature Specification

## Lab objective

Use AI to analyse the existing WhaleDEX repository and produce a reviewable requirements slice for “review a swap quote”. The exercise demonstrates the full chain:

```text
repository evidence -> discovery hypothesis -> PRD goal -> requirement -> story -> acceptance test -> release evidence
```

Recommended duration: 90–120 minutes. Work in pairs where possible: one learner operates the AI assistant and one challenges evidence and acceptance criteria; swap roles halfway.

## Rules

- Do not use real funds, private keys, seed phrases, production credentials, or personal interview data.
- Use the repository and approved stakeholder notes as evidence.
- Mark unsupported statements as assumptions or questions.
- Do not ask AI to select a chain, contract, or provider without human verification.
- Keep an audit note containing input sources, prompt, output, edits, reviewer, and date.

## Part A — Inspect before proposing

### Task

Inspect the repository and complete this table:

| Question                                          | Evidence path                         | Answer |
| ------------------------------------------------- | ------------------------------------- | ------ |
| What can the frontend do today?                   | `apps/web/src/app/page.tsx` and tests |        |
| What can the API do today?                        | `apps/api/src/app.ts` and tests       |        |
| Which shared contracts exist?                     | `packages/shared/src/`                |        |
| Which trading capabilities are explicitly absent? | `README.md`                           |        |
| Which decisions block blockchain work?            | `docs/DOCS.md`                        |        |

### Example AI prompt

```text
Analyse only the supplied repository excerpts. Return a table with:
Capability, Status (implemented/proposed/absent), Evidence path, Confidence.
Do not infer implementation from roadmap text. List contradictions and missing evidence.
```

### Illustrative answer

| Capability              | Status      | Evidence                                                     | Confidence |
| ----------------------- | ----------- | ------------------------------------------------------------ | ---------- |
| Static web landing page | Implemented | `apps/web/src/app/page.tsx`                                  | High       |
| API process health      | Implemented | `GET /health` in `apps/api/src/app.ts`                       | High       |
| Wallet connection       | Absent      | README future-development statement; no wallet feature files | High       |
| Quote/swap              | Proposed    | Roadmap phases 4–5                                           | High       |
| Target user validated   | No evidence | No research artefact in repository                           | High       |

## Part B — Discovery synthesis

### Input cards

Treat the following as fictional workshop observations, not real user research:

- `OBS-01`: Three of five participants thought token approval executed the swap.
- `OBS-02`: Four of five looked for network name before signing.
- `OBS-03`: Two participants treated “submitted” as final success.
- `OBS-04`: Four participants wanted to see the least they could receive.
- `OBS-05`: One advanced participant requested split routing; no other participant needed it.

### Task

Ask AI to cluster the observations, but require it to keep observation IDs attached. Produce:

1. one problem hypothesis;
2. up to three opportunities;
3. one counter-hypothesis;
4. questions for the next interview;
5. a recommendation about split routing.

### Example prompt

```text
Cluster OBS-01..OBS-05. Every theme and recommendation must cite observation IDs.
Separate observed facts from interpretation. Generate one counter-hypothesis and
three non-leading follow-up questions. Do not generalise beyond this small sample.
```

### Illustrative answer excerpt

- Observation: approval and swap were confused (`OBS-01`). Interpretation: the two-step permission model needs clearer presentation.
- Observation: participants checked network and minimum output (`OBS-02`, `OBS-04`). Opportunity: place execution context beside the confirmation action.
- Counter-hypothesis: the confusion may come from the prototype copy rather than the underlying two-step flow.
- Split routing should remain outside the first slice: demand appears once in a five-person formative sample (`OBS-05`), which is insufficient evidence for P0 complexity.

## Part C — Draft and challenge a requirement

### Bad AI-generated requirement

> The application should use AI to instantly find the best and safest swap price for every token.

### Task

Identify at least eight defects. A strong review finds:

- “should” does not establish a firm baseline;
- “AI” is an unjustified implementation choice;
- “instantly” is not measurable;
- “best” lacks a route/provider comparison set and objective;
- “safest” lacks a defined risk model;
- “every token” conflicts with the proposed allowlist;
- chain, amount, account, slippage, freshness, expiry, and failures are missing;
- output and verification method are undefined;
- the selected protocol may provide only one route;
- no source evidence supports the claim.

### Improved requirement

> `FR-QUOTE-02`: For a quote bound to the current chain, account, supported token pair, input amount, slippage, route, and deployment context, WhaleDEX shall display expected output, minimum received, route, applicable fees, source freshness, expiry, and gas estimate when available. If the quote expires or its bound context changes, WhaleDEX shall disable transaction confirmation until a current quote is available.

### AI red-team prompt

```text
Act as a requirements reviewer. Do not rewrite immediately.
For the requirement below, list ambiguity, missing boundary cases, conflicting goals,
security assumptions, dependencies, and ways to verify it. Label each finding as
blocking or non-blocking. Then propose the smallest corrected wording.
```

## Part D — Convert to a story and tests

### Story

> As a testnet user, I want to review a current quote and its execution boundaries so that I can decide whether to continue to approval or swap.

### Learner task

Write Given/When/Then criteria for:

1. a valid current quote;
2. input validation;
3. quote expiry;
4. an out-of-order response;
5. account or chain change;
6. provider timeout;
7. missing gas estimate;
8. keyboard and screen-reader behaviour.

### Illustrative tests

```gherkin
Scenario: Older response arrives last
  Given request A exists for input amount "1000000"
  And request B exists for the current input amount "2000000"
  When response B arrives and is displayed
  And response A arrives afterward
  Then the displayed quote still belongs to request B
  And the confirmation action remains bound to request B

Scenario: Account changes while quote is displayed
  Given a current quote is displayed for account A
  When the wallet reports account B
  Then the quote and account-derived allowance are invalidated
  And transaction confirmation is disabled

Scenario: Optional gas estimate is unavailable
  Given a current quote is otherwise valid
  When the provider cannot supply a gas estimate
  Then the interface labels the estimate as unavailable
  And the product applies its approved policy on whether the user may continue
```

Notice that the last criterion exposes a product decision rather than inventing one.

## Part E — Build traceability

Add the story and tests to [`traceability-matrix.md`](traceability-matrix.md). Each row must contain:

- evidence or approved business goal;
- requirement ID;
- story ID;
- acceptance scenario/test;
- implementation owner or component;
- current status.

Then use AI for a consistency audit:

```text
Compare the PRD, user stories, feature specification, and traceability matrix.
Report orphan goals, requirements without tests, tests without requirements,
conflicting priorities, undefined terms, and stale IDs. Cite document and heading.
Do not add missing decisions; place them in an open-question list.
```

## Part F — Change-impact exercise

Stakeholder change request:

> “Let users import any ERC-20 token in the MVP.”

### Expected impact analysis

| Area          | Impact                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| Product scope | Conflicts with the verified allowlist and non-goal                                                                |
| Discovery     | Requires evidence that arbitrary-token import is a P0 user need                                                   |
| Security      | Adds spoofed symbols, malicious/non-standard token behaviour, and scam-token risks                                |
| UX            | Needs address entry, verification cues, warnings, and duplicate-symbol handling                                   |
| Data          | Needs metadata fallback and explicit decimals policy                                                              |
| Testing       | Adds missing/invalid metadata, fee-on-transfer, rebasing, and malicious-token cases according to supported policy |
| Schedule      | Expands design, threat modelling, implementation, and test scope                                                  |

The correct outcome is not automatically “accept” or “reject”. The product owner records a decision after evidence, risk, effort, and release goal are reviewed.

## Deliverables

Submit:

1. completed evidence table;
2. discovery synthesis with observation IDs;
3. defect review and corrected requirement;
4. story plus at least eight acceptance scenarios;
5. updated traceability rows;
6. change-impact analysis;
7. a short AI audit note describing what was accepted, edited, or rejected and why.

## Assessment rubric

| Criterion               | Weight | Excellent evidence                                                      |
| ----------------------- | -----: | ----------------------------------------------------------------------- |
| Evidence discipline     |    20% | Facts, assumptions, and suggestions are clearly separated and sourced   |
| Requirement quality     |    20% | Atomic, unambiguous, feasible, bounded, and verifiable wording          |
| Acceptance coverage     |    20% | Happy, negative, async race, recovery, and accessibility paths          |
| Traceability            |    15% | No orphan P0 goal, requirement, story, or test                          |
| Risk/change analysis    |    15% | Asset-safety, data, UX, dependency, and schedule impacts identified     |
| Responsible AI practice |    10% | Sensitive data excluded; output challenged and human decisions recorded |

Suggested passing threshold: 70%, with no zero score in evidence discipline or requirement quality.

## Facilitator debrief

Ask learners:

- Which AI suggestion sounded plausible but lacked evidence?
- Which acceptance criterion forced a product decision into the open?
- Which repository fact changed the proposed scope?
- How would the artefacts differ for a custom AMM?
- What would have to be true before this package could authorize mainnet work?
