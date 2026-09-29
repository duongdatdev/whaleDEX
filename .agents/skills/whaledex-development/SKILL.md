---
name: whaledex-development
description: Implement, review, debug, or plan code changes in the WhaleDEX repository. Use for WhaleDEX web, API, shared contracts, configuration, tests, and Sui/DeepBook integration; do not use for unrelated repositories or product-document-only work.
---

# WhaleDEX Development

Work from the repository root and follow every applicable `AGENTS.md`. Preserve the user's existing changes and keep each change aligned with the implemented system and the accepted Sui Testnet MVP direction.

## Establish the truth

1. Inspect `git status` and locate relevant files with `rg` or `rg --files`.
2. Read the closest source, tests, package manifest, and configuration before editing. If persistence exists for the requested area, inspect its schema and migrations first.
3. Treat implemented code, schemas, configuration, and tests as evidence of current behavior. Treat `docs/prd-whaledex.md` as approved product scope, `docs/DOCS.md` as delivery order, and accepted ADRs as architecture decisions. Planned documentation is not evidence that a feature exists.
4. For UI work, also read the relevant parts of `DESIGN.md`; preserve its tokens, responsive behavior, accessibility rules, and crisp flat visual language.
5. When sources conflict, state the conflict and make the smallest coherent change that preserves the accepted product direction.

## Preserve repository boundaries

- This is a pnpm/Turborepo monorepo using Node.js 24, strict TypeScript, and ESM.
- `apps/web` is a Next.js App Router application. `apps/api` is Fastify. Neither application may import code from the other.
- Put portable runtime schemas, inferred types, and cross-application contracts in `packages/shared`. Keep that package browser-safe: no secrets, API internals, or Node-only dependencies.
- Keep reusable TypeScript, ESLint, and Prettier presets in `packages/config`; do not place product runtime logic there.
- Use `workspace:*` for internal package dependencies. Import compiled shared modules with ESM-compatible paths and preserve the package export boundary.
- Validate environment input with Zod. Keep real environment files untracked, update the matching `.env.example`, and never expose secrets through `NEXT_PUBLIC_*` variables or error messages.

## Respect the blockchain architecture

- The accepted MVP is non-custodial spot trading on Sui Testnet with DeepBookV3. Sui Mainnet, EVM/multichain, bridges, margin, perpetuals, and custom matching or Move trading engines are out of scope unless a newer accepted decision explicitly changes this.
- The existing EVM/Sepolia registry is legacy implementation evidence, not the target architecture. Do not extend it as new MVP functionality.
- Users sign with their Sui wallet. The API must never receive private keys, custody funds, or sign transactions for users.
- Treat Sui and DeepBook as the source of truth for assets, orders, fills, and settlement. Server storage, when justified by an actual consumer, is only a derived cache/read model.
- Prefer current official Mysten SDKs and a narrow internal adapter boundary. Verify deployment identifiers, coin types, decimals, tick/lot rules, and endpoint behavior from authoritative sources before encoding them.
- Never fabricate balances, liquidity, prices, volume, confirmation, or transaction success. Model loading, empty, stale, rejected, failed, and unknown states explicitly.

## Implement coherent vertical slices

- For a shared contract change, update the Zod schema and inferred type first, then exports, consumers, fixtures, and contract tests in the same slice.
- For API behavior, validate requests and responses at the boundary. Test Fastify routes with injection rather than opening a real port.
- For web behavior, cover user-visible states, keyboard/focus behavior, reduced motion, responsive layout, and async races relevant to the change.
- For trading flows, make review details explicit before wallet signing and distinguish submission from on-chain confirmation. Cover rounding, decimals, gas reserve, slippage or price limits, insufficient balance, signature rejection, RPC failure, stale quotes, and reload recovery as applicable.
- Add an endpoint, dependency, database, or abstraction only when the current slice has a concrete consumer. Avoid speculative infrastructure.

## Verify proportionally

Start with the affected workspace and escalate to the full repository when the change crosses package boundaries or is ready to commit.

```sh
pnpm --filter @whaledex/shared test
pnpm --filter @whaledex/api test
pnpm --filter @whaledex/web test
```

Use the root release checks for completed cross-cutting work:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Public Testnet or RPC availability must not be a hard dependency of deterministic unit tests. Separate live smoke tests from stable CI tests, and do not present mocks as proof of a live deployment or market.

Before handoff, review the diff, follow the repository's atomic Conventional Commit policy, and report the exact checks run plus any remaining risk.
