# Chapter 3 — AI in Requirement Analysis & Product Management

This chapter uses WhaleDEX as one continuous case study. It shows how AI can speed up synthesis, drafting, consistency checks, and test generation while keeping product decisions with accountable humans.

## Learning outcomes

After completing this chapter, a learner can:

1. separate repository evidence, stakeholder input, assumptions, and AI-generated suggestions;
2. turn discovery evidence into an explicit product hypothesis;
3. write a concise PRD with measurable outcomes and bounded scope;
4. analyse requirements for ambiguity, conflicts, dependencies, and risk;
5. write user stories and verifiable acceptance criteria;
6. produce a feature specification that engineering, design, and QA can use;
7. maintain traceability from product goals to tests.

## Case-study baseline

The repository currently provides a runnable monorepo foundation:

- a static Next.js frontend;
- a Fastify API with `GET /health`;
- shared Zod schemas and TypeScript types;
- environment validation, linting, formatting, tests, and builds;
- a development roadmap in [`docs/DOCS.md`](../DOCS.md).

It does **not** yet implement a wallet connection, blockchain integration, token list, quote, approval, swap, transaction history, smart contracts, database, indexer, CI, or deployment. Any example below that mentions those capabilities is a requirement or prototype scenario, not a statement of completed functionality.

The case study assumes an EVM-compatible testnet and exact-input swaps to make the analysis concrete. The chain, protocol, contracts, supported tokens, confirmation policy, and infrastructure provider remain product/architecture decisions. They must be recorded in ADRs before implementation.

## Responsible AI workflow

Use AI as an analysis assistant, not as a source of stakeholder truth.

```text
Evidence -> structured context -> AI draft -> human challenge -> validation -> approved baseline
                                  |             |
                                  +-- gaps -----+-- decision owner
```

For every AI-assisted output:

1. provide only the minimum necessary context and remove secrets, private keys, personal data, and confidential commercial terms;
2. label facts, stakeholder statements, assumptions, constraints, and suggestions separately;
3. ask for missing information and contradictions, not just a polished answer;
4. verify technical claims against the selected protocol and chain documentation;
5. require a named human owner to approve scope, risk, and release decisions;
6. retain the prompt, model/version where required by the organization, source references, reviewer, and date;
7. re-run traceability and consistency checks when an approved requirement changes.

A useful prompt contract is:

```text
Role: You are assisting a product analyst.
Context: <approved evidence only>
Task: <one bounded analysis task>
Constraints: Do not invent stakeholder facts or technical capabilities.
Output: Separate Evidence, Assumptions, Questions, Risks, and Recommendations.
Quality check: Cite each conclusion to an input item and flag unsupported claims.
```

## 3.1 Product Discovery

Product discovery reduces uncertainty before delivery. AI is most useful for clustering interview notes, extracting themes, drafting hypotheses, generating interview probes, and spotting inconsistent signals. It cannot replace interviews, usage data, protocol verification, or stakeholder decisions.

### Discovery inputs

| Input                            | Current WhaleDEX status                                  | Confidence |
| -------------------------------- | -------------------------------------------------------- | ---------- |
| Repository inspection            | Foundation exists; trading features do not               | High       |
| Development roadmap              | Testnet swap is proposed as the MVP path                 | High       |
| Target users                     | Learners/testnet evaluators are a working assumption     | Low        |
| User pain points                 | Complexity and uncertainty in a swap flow are hypotheses | Low        |
| Chain and protocol               | Not selected                                             | Unknown    |
| Liquidity and token availability | Not verified                                             | Unknown    |

### Opportunity statement

> People evaluating a DEX on testnet need a transparent way to understand and complete a token swap because wallet, network, approval, pricing, and transaction states are fragmented and easy to misinterpret.

This is a hypothesis. Validate it with target-user interviews and an observed usability test before treating it as a product fact.

### Proto-persona and jobs to be done

**Proto-persona:** Minh, a technically curious Web3 learner, has a browser wallet and testnet funds but limited knowledge of approvals, slippage, and transaction finality.

**Functional job:** When exchanging one supported test token for another, Minh wants to understand the expected result and safely complete the transaction.

**Emotional job:** Minh wants confidence that the app is connected to the intended network and is not requesting an unexpected permission.

**Social job:** Minh wants a transaction reference that can be shared with a mentor or tester.

The persona is provisional. Do not add demographic detail that has no bearing on product behaviour.

### Hypotheses and discovery tests

| ID   | Hypothesis                                                    | Cheapest useful test                   | Success signal                                           |
| ---- | ------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------- |
| H-01 | New testnet users cannot distinguish approval from swap       | Five moderated prototype sessions      | At least 4/5 explain both steps without coaching         |
| H-02 | Showing minimum received and quote expiry improves confidence | Compare two clickable prototypes       | At least 80% choose the safer quote correctly            |
| H-03 | A guided single-route swap is enough for the first MVP        | Stakeholder review plus ten interviews | No validated P0 need for advanced routing                |
| H-04 | Transaction status must survive refresh                       | Task-based usability test              | At least 4/5 recover a pending transaction after refresh |

These thresholds are learning criteria, not statistically significant market validation.

### Interview guide

Ask about real behaviour before presenting a solution:

1. Tell me about the last time you swapped tokens on a testnet.
2. What information did you check before signing?
3. Where did you hesitate or leave the flow?
4. How did you know which network and token contract you were using?
5. What did “approval” mean to you at that moment?
6. How did you decide the transaction succeeded?
7. Show me how you found the transaction again after closing the page.

Avoid leading questions such as “Would minimum received make you feel safer?” Observe the task first, then probe the reason behind behaviour.

### Discovery exit criteria

Discovery is sufficient to baseline an MVP when:

- the target user and problem are supported by evidence;
- a chain/protocol feasibility spike confirms a usable testnet deployment and liquidity;
- P0 outcomes and exclusions are agreed;
- assumptions, risks, and unresolved decisions have owners;
- at least one prototype test has challenged the critical swap flow.

## 3.2 Product Requirement Document (PRD)

A PRD explains why a product increment should exist, whom it serves, what outcomes matter, and what is in scope. It should not silently decide every implementation detail.

The case-study PRD is in [`whaledex-mvp-prd.md`](whaledex-mvp-prd.md). Its structure is:

1. document control and decision status;
2. evidence, problem, and target user;
3. goals, success metrics, and non-goals;
4. scope and end-to-end journey;
5. functional and non-functional requirements;
6. dependencies, risks, assumptions, and open questions;
7. rollout and definition of done.

### AI review checklist for a PRD

Ask AI to identify, without rewriting the PRD automatically:

- goals without metrics;
- features without a user problem;
- vague terms such as “fast”, “secure”, “easy”, or “real time”;
- hidden implementation decisions;
- conflicting requirements or non-goals;
- missing failure, loading, empty, and recovery states;
- requirements that cannot be tested;
- assumptions presented as facts;
- asset-safety or privacy risks without controls;
- IDs that do not appear in the traceability matrix.

The product owner accepts or rejects each suggested change. AI does not approve the baseline.

## 3.3 Requirement Analysis

Requirement analysis transforms product intent into a coherent, feasible, and testable system baseline.

### Requirement classes

| Class          | Question                                  | WhaleDEX example                                                  |
| -------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| Business       | Why invest?                               | Demonstrate a safe end-to-end testnet swap                        |
| User           | What outcome does the user need?          | Know the network, price boundary, and transaction result          |
| Functional     | What must the system do?                  | Refresh quote when amount or token changes                        |
| Non-functional | How well or under what constraint?        | Keyboard-operable token selector                                  |
| Data           | What is stored and how is it represented? | Token amounts use integer strings at API boundaries               |
| Interface      | What crosses a system boundary?           | Quote response includes chain, tokens, expiry, and minimum output |
| Transition     | How do states change?                     | `awaiting_signature -> submitted -> confirmed/failed/replaced`    |
| Constraint     | What is deliberately limited?             | Supported-token allowlist on one testnet                          |

### Quality test

Each requirement should be:

- necessary and linked to a goal;
- atomic enough to reason about;
- unambiguous about actor, trigger, behaviour, and result;
- feasible within known platform constraints;
- verifiable by inspection, test, demonstration, or measurement;
- uniquely identified and version controlled;
- traceable to a source and downstream acceptance test.

### Ambiguity example

Weak requirement:

> The app should quickly show the best swap price and safely process it.

Problems: “quickly”, “best”, and “safely” are undefined; quote source, comparison set, freshness, failure behaviour, and execution boundary are missing.

Analysed requirements:

- `FR-QUOTE-01`: When input token, output token, chain, account, or amount changes, the client requests a new quote after the configured debounce interval.
- `FR-QUOTE-02`: A quote is bound to chain ID, token addresses, input amount, route, source block/time, and expiry.
- `FR-QUOTE-03`: The confirmation action is unavailable after quote expiry or when its bound context differs from the current context.
- `NFR-PERF-01`: The product team must define and validate a quote-response percentile target against the selected provider before release; “fast” is not an accepted target.

### Conflict and dependency analysis

| Tension                                  | Analysis                                                 | Required decision                         |
| ---------------------------------------- | -------------------------------------------------------- | ----------------------------------------- |
| Frictionless swap vs explicit approval   | Removing explanation may increase asset-permission risk  | UX owner approves two-step presentation   |
| Fresh quote vs provider cost/rate limit  | Aggressive refresh can overload an RPC/quote provider    | Set debounce, caching, and request budget |
| Unlimited approval vs least privilege    | Convenience increases exposure if spender is compromised | Choose approval policy and disclose it    |
| Immediate success vs blockchain finality | A hash is not confirmation                               | Define confirmation policy by chain       |
| Rich history vs no indexer/database      | Client-only history is incomplete across devices         | Bound MVP history or fund an indexer      |

### Swap state model

```text
idle
  -> invalid_input
  -> quoting -> quote_ready -> quote_expired
                            -> approval_required
approval_required -> awaiting_approval_signature -> approval_pending
approval_pending  -> quote_refresh_required -> quote_ready
quote_ready       -> awaiting_swap_signature -> submitted
submitted         -> confirmed | failed | replaced
any async state   -> context_changed -> revalidate
```

Changing account, chain, token, or amount invalidates derived state. The UI must not reuse a quote or allowance from a previous context.

### Assumption and decision log

| ID   | Type            | Statement                                            | Owner                  | Validation/decision gate       |
| ---- | --------------- | ---------------------------------------------------- | ---------------------- | ------------------------------ |
| A-01 | Assumption      | First release uses one EVM-compatible testnet        | Product                | Discovery exit                 |
| A-02 | Assumption      | Exact-input swaps cover the first validated use case | Product                | PRD approval                   |
| D-01 | Decision needed | Integrate an existing protocol or build an AMM       | Product + architecture | Before protocol implementation |
| D-02 | Decision needed | Chain, RPC, explorer, and confirmation policy        | Architecture           | Before wallet spike            |
| D-03 | Decision needed | Exact approval amount or broader allowance           | Security + product     | Before approval UI             |
| D-04 | Decision needed | Client-only activity or indexed history              | Product + architecture | Before activity implementation |

## 3.4 User Stories & Acceptance Criteria

User stories are planning tools, not complete specifications. Apply INVEST: independent where practical, negotiable, valuable, estimable, small, and testable. Acceptance criteria define observable boundaries.

### Story US-WALLET-01 — Connect a wallet

> As a testnet user, I want to connect a supported browser wallet so that WhaleDEX can show account-specific balances and prepare transactions for my approval.

Acceptance criteria:

```gherkin
Scenario: Connect on a supported network
  Given a supported wallet is available
  And the wallet is on a supported chain
  When the user approves the connection request
  Then the interface shows the shortened account address
  And account-scoped balances are refreshed

Scenario: Reject connection
  Given a supported wallet is available
  When the user rejects the connection request
  Then no connected state is shown
  And a recoverable message explains that the request was rejected

Scenario: Change account
  Given a wallet is connected
  When the wallet reports a different active account
  Then prior account balances, allowance, quote, and pending form context are invalidated
  And data is loaded for the new account
```

### Story US-QUOTE-01 — Review a bounded quote

> As a user, I want to see the expected output, minimum received, route, fees, gas estimate, and expiry so that I can make an informed decision before signing.

Acceptance criteria:

```gherkin
Scenario: Display a current quote
  Given different supported input and output tokens are selected
  And the input amount is positive and does not exceed the available balance
  When a quote is returned for the current chain, tokens, account, and amount
  Then expected output and minimum received are displayed
  And route, fees, gas estimate, source freshness, and expiry are displayed when supplied

Scenario: Ignore a stale response
  Given quote request A is in progress
  When the user changes the input and quote request B starts
  And response A arrives after response B
  Then response A does not replace quote B

Scenario: Quote expires
  Given a quote is displayed
  When its expiry time passes
  Then transaction confirmation is disabled
  And the user can request or receive a refreshed quote
```

### Story US-APPROVAL-01 — Approve the intended spender

> As a token holder, I want to understand and approve only the intended spender and amount so that I retain informed control of token permissions.

Acceptance criteria:

```gherkin
Scenario: Approval is required
  Given the selected input is an ERC-20 token
  And allowance for the verified spender is below the required amount
  When a current quote is ready
  Then approval and swap are presented as separate steps
  And the spender and requested allowance policy are disclosed before signature

Scenario: Approval succeeds
  Given an approval transaction was submitted
  When its required confirmation policy is met
  Then allowance is read again from the current chain and account
  And a fresh quote is required before swap confirmation
```

### Story US-SWAP-01 — Execute and track a swap

> As a user, I want to sign a validated swap and track it to a final outcome so that I know whether my assets changed.

Acceptance criteria:

```gherkin
Scenario: Submit a valid swap
  Given the wallet, chain, account, quote, allowance, balance, deadline, and spender are valid
  And transaction simulation succeeds
  When the user signs and the wallet submits the transaction
  Then the interface records the transaction hash with chain and account
  And the state is shown as submitted, not confirmed

Scenario: Confirm a swap
  Given a submitted transaction is being tracked
  When a successful receipt reaches the configured confirmation policy
  Then the state is shown as confirmed
  And relevant balances, allowance, and activity data are refreshed

Scenario: Transaction fails or is replaced
  Given a submitted transaction is being tracked
  When the transaction reverts or is replaced
  Then the interface shows the distinct final state
  And it does not report success solely because a transaction hash exists
```

### Negative and accessibility criteria

- Zero, negative, malformed, over-precision, same-token, and above-balance input is rejected before quote submission.
- Unsupported chain, unavailable wallet, RPC failure, insufficient native gas token, rejected signature, stale quote, and simulation failure have distinct recoverable messages.
- Token identity includes a shortened address, not symbol alone.
- Status is conveyed by text in addition to colour.
- Every control is keyboard operable; focus is placed and restored correctly for dialogs.
- Dynamic errors and transaction-state changes are announced through an appropriate live region.

## 3.5 Feature Specification

This section specifies the first vertical slice: an exact-input testnet swap. It stays protocol-neutral until the project approves the chain and trading model.

### Feature boundary

**In scope:** supported-token selection, amount entry, quote display, slippage within an approved range, allowance check, approval when required, preflight validation/simulation, wallet submission, receipt tracking, refresh recovery, and explorer link.

**Out of scope:** mainnet funds, cross-chain, exact-output, split routes, limit orders, fiat, arbitrary tokens, portfolio accounting, and guaranteed cross-device history.

### Preconditions

- An ADR approves chain, protocol model, deployment addresses, RPC, explorer, and confirmation policy.
- Contract bytecode and ABI are verified for the selected chain.
- Supported tokens have verified address and decimals.
- A testnet feasibility transaction proves quote, approval, swap, and receipt behaviour.

### Data contract sketch

All asset quantities are decimal strings representing integer smallest units.

```ts
type QuoteRequest = {
  chainId: number;
  account: `0x${string}`;
  tokenIn: `0x${string}` | 'native';
  tokenOut: `0x${string}` | 'native';
  amountIn: string;
  slippageBps: number;
};

type QuoteResponse = {
  quoteId: string;
  chainId: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedAmountOut: string;
  minimumAmountOut: string;
  spender: `0x${string}`;
  transactionTarget: `0x${string}`;
  transactionValue: string;
  route: Array<{ pool: string; tokenIn: string; tokenOut: string }>;
  estimatedGas?: string;
  sourceBlock?: string;
  createdAt: string;
  expiresAt: string;
};
```

The final contract may differ by protocol. If an external service returns calldata, the client/server adapter must verify chain, target, value, spender, tokens, amount, deadline, and output bound against the approved deployment before offering it for signature.

### Interaction rules

1. Parse display input with the selected token decimals; never calculate asset amounts with JavaScript floating point.
2. Debounce quote requests and assign a context/version key. Ignore responses whose key is not current.
3. Invalidate quote and allowance-derived actions when chain, account, token, amount, slippage, route, or relevant deployment changes.
4. Disable signing after quote expiry.
5. Present approval separately and read allowance again after confirmation.
6. Refresh the quote after approval because price, route, block, or deadline may have changed.
7. Simulate and estimate gas against current context before requesting a swap signature.
8. Treat wallet signature, broadcast, inclusion, confirmation, failure, and replacement as distinct states.
9. Persist only the minimum transaction tracking tuple: chain ID, account, hash, submitted time, and last known state.
10. Never request or store a seed phrase or private key.

### Observability and analytics

Product events must avoid wallet secrets and unnecessary full-address collection. Suggested events:

| Event                | Required properties                                                  |
| -------------------- | -------------------------------------------------------------------- |
| `quote_requested`    | chain, token pair identifier, request context ID                     |
| `quote_succeeded`    | provider, latency bucket, route count, source freshness              |
| `quote_failed`       | stable error code, provider, latency bucket                          |
| `approval_submitted` | chain, token identifier, spender identifier, policy                  |
| `swap_submitted`     | chain, quote ID, transaction hash or privacy-safe correlation policy |
| `swap_finalized`     | chain, outcome, confirmation duration bucket                         |

Retention, consent, address pseudonymisation, and analytics-provider choices require privacy review before instrumentation.

### Release gates

- All P0 acceptance criteria pass on a deterministic local/fork environment where possible.
- A smoke test passes against the approved testnet deployment.
- No known critical/high asset-safety issue remains open.
- Unsupported-network, stale-quote, rejection, revert, replacement, and RPC-outage paths are demonstrated.
- Product, engineering, QA, security, and operations owners approve the evidence relevant to their area.
- Documentation and the [traceability matrix](traceability-matrix.md) match the released behaviour.

## Chapter review questions

1. Which statements in the case study are evidence, and which are assumptions?
2. Why is a transaction hash insufficient to claim swap success?
3. Which context changes must invalidate a quote?
4. What information should a user see before approving an ERC-20 spender?
5. Where can AI accelerate analysis, and where is human approval mandatory?
6. How would the PRD change if the team chose to build an AMM rather than integrate an existing protocol?

Continue with [Practical Lab 3](practical-lab.md), then use the [traceability matrix](traceability-matrix.md) to audit the result.
