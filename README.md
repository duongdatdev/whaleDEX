# WhaleDEX

Foundation monorepo cho dự án DEX, gồm frontend và backend chạy độc lập. Chưa triển khai nghiệp vụ giao dịch hoặc tích hợp blockchain.

## Công nghệ

| Thành phần | Công nghệ                     | Vai trò                                      |
| ---------- | ----------------------------- | -------------------------------------------- |
| Frontend   | Next.js 16, React 19          | App Router, giao diện và production build    |
| Backend    | Fastify 5, Node.js 24 LTS     | HTTP API độc lập, logging, graceful shutdown |
| Workspace  | pnpm 11, Turborepo 2          | Dependency nội bộ, task graph và build cache |
| Ngôn ngữ   | TypeScript strict, ESM        | Chia sẻ type, biên dịch API thành JavaScript |
| Chất lượng | ESLint, Prettier              | Lint và định dạng thống nhất                 |
| Cấu hình   | Zod, dotenv cho API           | Kiểm tra biến môi trường trước khi khởi động |
| Kiểm thử   | Vitest, React Testing Library | Component, environment và HTTP contract      |

TypeScript được pin ở 6.0.3 để nằm trong dải hỗ trợ của typescript-eslint. ESLint 10 dùng preset chung cùng plugin Next.js và React Hooks trực tiếp; tránh kéo plugin React cũ chỉ hỗ trợ ESLint 9 qua `eslint-config-next`.

## Cấu trúc

```text
apps/
  web/                 # Next.js: http://localhost:3000
  api/                 # Fastify: http://localhost:3001/health
packages/
  shared/              # Schema/type portable, xuất dist ESM + declaration
  config/              # Preset TypeScript, ESLint, Prettier
```

Ứng dụng có thể phụ thuộc package, nhưng không import mã của nhau. `shared` không import API, Node-only modules hoặc secret. `config` chỉ phục vụ tooling. Package nội bộ dùng `workspace:*` và không publish npm.

## Bắt đầu

Yêu cầu Node.js **24.x** và pnpm **11.19.0**. `.nvmrc`, `.node-version`, `engines` và `packageManager` ghi nhận các phiên bản này.

Nếu chưa có pnpm:

```sh
npm install --global pnpm@11.19.0
```

Chạy tại root repository:

```sh
pnpm install --frozen-lockfile
```

Tạo cấu hình local bằng PowerShell:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item apps/api/.env.example apps/api/.env
```

Hoặc bằng macOS/Linux:

```sh
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

```sh
pnpm dev
```

Web hiển thị **DEX App** tại http://localhost:3000. API trả `{"status":"ok"}` tại http://localhost:3001/health. Trang web hiện độc lập với API; nhãn “Frontend is ready” không phải kết quả kiểm tra API.

## Lệnh thường dùng

| Lệnh tại root       | Tác dụng                                        |
| ------------------- | ----------------------------------------------- |
| `pnpm dev`          | Chạy shared watcher, web và API                 |
| `pnpm dev:web`      | Chạy web cùng dependency watcher                |
| `pnpm dev:api`      | Chạy API cùng dependency watcher                |
| `pnpm build`        | Build shared trước, sau đó web và API           |
| `pnpm start:web`    | Chạy production web đã build                    |
| `pnpm start:api`    | Chạy JavaScript API đã build                    |
| `pnpm lint`         | Kiểm tra ESLint các workspace                   |
| `pnpm typecheck`    | Sinh Next.js route types và kiểm tra TypeScript |
| `pnpm test`         | Chạy test một lần, không watch                  |
| `pnpm format`       | Định dạng mã nguồn                              |
| `pnpm format:check` | Kiểm tra định dạng mà không sửa file            |

Các lệnh dev qua root chuẩn bị shared trước khi chạy ứng dụng; không cần tự build shared. Sau đó TypeScript watch biên dịch shared và API watch theo dõi JavaScript đầu ra. Hãy dùng lệnh root cho lần khởi động đầu tiên của một checkout mới.

## Environment

| Ứng dụng | Biến                  | Mặc định                |
| -------- | --------------------- | ----------------------- |
| API      | `NODE_ENV`            | `development`           |
| API      | `HOST`                | `127.0.0.1`             |
| API      | `PORT`                | `3001`                  |
| Web      | `NEXT_PUBLIC_API_URL` | `http://localhost:3001` |

API đọc `apps/api/.env` qua dotenv; biến môi trường của process được ưu tiên. Next.js dùng cơ chế `.env*` tích hợp; ưu tiên đặt cấu hình local trong `apps/web/.env.local`. Cả hai dùng Zod để báo tên biến không hợp lệ mà không in giá trị cấu hình.

`NEXT_PUBLIC_*` là dữ liệu công khai và được Next.js nhúng vào client bundle khi được sử dụng; cấu hình chúng trước build. Không đặt secret dưới prefix này. Hiện URL API chỉ được chuẩn bị và kiểm tra, chưa phát sinh request frontend → backend hoặc cần cấu hình CORS.

Env thật không được commit; chỉ `.env.example` được theo dõi. Turbo khai báo biến và file env ảnh hưởng build để tránh dùng cache sai cấu hình.

## Production build local

```sh
pnpm build
pnpm start:web
```

Mở terminal khác và chạy API với môi trường production, ví dụ PowerShell:

```powershell
$env:NODE_ENV = 'production'
pnpm start:api
```

Trên macOS/Linux: `NODE_ENV=production pnpm start:api`.

API chạy `dist/server.js` bằng Node.js, không cần tsx runtime. Đặt `HOST=0.0.0.0` khi môi trường triển khai cần lắng nghe trên mọi interface. Bản build local sử dụng workspace đã cài dependencies; đây chưa phải artifact container độc lập. Không chạy web dev và production đồng thời trên cổng 3000.

## Kiểm tra trước commit

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Test API dùng Fastify injection, không mở cổng thật; test web kiểm tra heading; test shared kiểm tra health contract; test env bao gồm giá trị sai và mặc định.

## Bước phát triển tiếp theo

Foundation này chưa có smart contract, wallet connection, swap, liquidity pool, indexing, authentication, database hoặc blockchain SDK. Chưa thêm Docker, deployment và CI provider. Các thành phần đó sẽ được chọn khi có yêu cầu cụ thể.
