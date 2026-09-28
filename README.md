# WhaleDEX

A foundation monorepo for a DEX project, with independently runnable frontend and backend applications. Trading logic and blockchain integrations are not implemented yet.

## Technology stack

| Component     | Technology                    | Purpose                                              |
| ------------- | ----------------------------- | ---------------------------------------------------- |
| Frontend      | Next.js 16, React 19          | App Router, UI, and production builds                |
| Backend       | Fastify 5, Node.js 24 LTS     | Independent HTTP API, logging, and graceful shutdown |
| Workspace     | pnpm 11, Turborepo 2          | Internal dependencies, task graph, and build caching |
| Language      | Strict TypeScript, ESM        | Shared types and API compilation to JavaScript       |
| Code quality  | ESLint, Prettier              | Consistent linting and formatting                    |
| Configuration | Zod, dotenv for the API       | Environment validation before startup                |
| Testing       | Vitest, React Testing Library | Component, environment, and HTTP contract tests      |

TypeScript is pinned to 6.0.3 to stay within the range supported by typescript-eslint. ESLint 10 uses shared presets with the Next.js and React Hooks plugins directly, avoiding the older React plugin limited to ESLint 9 that `eslint-config-next` pulls in.

## Project structure

```text
apps/
  web/                 # Next.js: http://localhost:3000
  api/                 # Fastify: http://localhost:3001/health
packages/
  shared/              # Portable schemas/types, compiled ESM + declarations in dist
  config/              # TypeScript, ESLint, and Prettier presets
```

Applications may depend on packages but must not import each other's code. `shared` must not import API code, Node-only modules, or secrets. `config` is for tooling only. Internal packages use `workspace:*` and are not published to npm.

## Project documentation

| Document                                      | Purpose                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| [Product requirements](docs/prd-whaledex.md)  | Approved Testnet MVP scope, user stories, requirements, and success metrics          |
| [Development roadmap](docs/DOCS.md)           | Delivery order from Sui configuration through DeepBook trading and Testnet beta      |
| [UI/UX design](DESIGN.md)                     | Target information architecture, interaction rules, visual system, and accessibility |
| [ADR-0003](docs/adr/0003-sui-deepbook-mvp.md) | Current decision: Sui Testnet and DeepBookV3 for the spot DEX MVP                    |
| [ADR-0001](docs/adr/0001-sui-deepbook.md)     | Historical first Sui decision, superseded by ADR-0002                                |
| [ADR-0002](docs/adr/0002-evm-multichain.md)   | Historical EVM decision, superseded by ADR-0003                                      |

The PRD is the product source of truth, code and schemas describe implemented behavior, the roadmap controls delivery order, and ADRs record accepted architecture decisions. Planned behavior is not considered implemented until it exists in code and passes the relevant release checks.

The supporting Chapter 3 requirements package contains the [AI-assisted requirements guide](docs/chapter-3/README.md), [MVP PRD](docs/chapter-3/whaledex-mvp-prd.md), [practical lab](docs/chapter-3/practical-lab.md), and [traceability matrix](docs/chapter-3/traceability-matrix.md). It is a requirements baseline, not proof that the described product features are implemented; assumption-derived items must be validated before blockchain integration begins.

## Getting started

Requires Node.js **24.x** and pnpm **11.19.0**. These versions are recorded in `.nvmrc`, `.node-version`, `engines`, and `packageManager`.

If pnpm is not installed:

```sh
npm install --global pnpm@11.19.0
```

From the repository root:

```sh
pnpm install --frozen-lockfile
```

Create local environment files with PowerShell:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item apps/api/.env.example apps/api/.env
```

Or on macOS/Linux:

```sh
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

```sh
pnpm dev
```

The web app displays **DEX App** at http://localhost:3000. The API returns `{"status":"ok"}` at http://localhost:3001/health. The page currently runs independently of the API; the “Frontend is ready” label does not indicate API health.

## Common commands

| Command from the root | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `pnpm dev`            | Run the shared watcher, web app, and API          |
| `pnpm dev:web`        | Run the web app and its dependency watcher        |
| `pnpm dev:api`        | Run the API and its dependency watcher            |
| `pnpm build`          | Build shared first, then the web app and API      |
| `pnpm start:web`      | Run the built web app in production mode          |
| `pnpm start:api`      | Run the compiled JavaScript API                   |
| `pnpm lint`           | Run ESLint across workspaces                      |
| `pnpm typecheck`      | Generate Next.js route types and check TypeScript |
| `pnpm test`           | Run tests once, without watch mode                |
| `pnpm format`         | Format source files                               |
| `pnpm format:check`   | Check formatting without modifying files          |

Root development commands prepare shared before starting the applications, so no manual shared build is required. TypeScript then watches and compiles shared, while the API watcher monitors its JavaScript output. Use root commands when starting a fresh checkout for the first time.

## Environment

| Application | Variable              | Default                 |
| ----------- | --------------------- | ----------------------- |
| API         | `NODE_ENV`            | `development`           |
| API         | `HOST`                | `127.0.0.1`             |
| API         | `PORT`                | `3001`                  |
| Web         | `NEXT_PUBLIC_API_URL` | `http://localhost:3001` |

The API loads `apps/api/.env` through dotenv; process environment variables take precedence. Next.js uses its built-in `.env*` loading, with `apps/web/.env.local` recommended for local configuration. Both applications use Zod to report invalid variable names without printing configuration values.

`NEXT_PUBLIC_*` variables are public and are embedded in the client bundle by Next.js when used; configure them before building. Never put secrets under this prefix. The API URL is currently prepared and validated only; there are no frontend-to-backend requests or CORS configuration requirements yet.

Actual environment files are excluded from Git; only `.env.example` files are tracked. Turbo declares environment variables and files that affect builds to avoid reusing cached output for a different configuration.

## Blockchain direction and current configuration

The approved MVP target is **Sui Testnet + DeepBookV3**. Wallet signing will use
`@mysten/dapp-kit-react`; chain access will use `@mysten/sui` with a gRPC client; spot market
integration will use `@mysten/deepbook-v3`. Sui/DeepBook remains the source of truth for assets,
orders, fills, and settlement. The API may later cache or index public data but must not receive
private keys or sign transactions for users.

The current source still contains the previous EVM/Sepolia registry in
`packages/shared/src/chains.ts`, its environment variables, and `GET /v1/chains`. This is legacy
implementation evidence, not the target architecture. The first implementation slice in the
[roadmap](docs/DOCS.md) replaces it with Sui network configuration and updates the related tests.
Until that change lands, the repository does not have a working Sui client, wallet connection, or
DeepBook trading flow.

## Running a production build locally

```sh
pnpm build
pnpm start:web
```

Open another terminal and run the API with the production environment, for example in PowerShell:

```powershell
$env:NODE_ENV = 'production'
pnpm start:api
```

On macOS/Linux: `NODE_ENV=production pnpm start:api`.

The API runs `dist/server.js` with Node.js and does not require tsx at runtime. Set `HOST=0.0.0.0` when the deployment environment requires listening on all interfaces. The local build uses the workspace with dependencies installed; it is not a standalone container artifact. Do not run the web app in development and production mode simultaneously on port 3000.

## Pre-commit checks

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

API tests use Fastify injection without opening a real port. Web tests verify the heading, shared tests validate the health contract, and environment tests cover invalid values and defaults.

## Future development

The roadmap targets a non-custodial spot DEX on Sui Testnet: replace the legacy EVM registry,
connect a Sui wallet, integrate DeepBook market data, then deliver market orders, limit orders,
history, and Testnet hardening. Sui Mainnet and EVM/multi-chain require separate future decisions.
Wallet connection, Sui RPC/gRPC clients, DeepBook trading, indexing, a database, Docker,
deployment, and CI are not implemented yet. Follow [the development roadmap](docs/DOCS.md) for
the accepted delivery order.
