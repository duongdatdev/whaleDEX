# WhaleDEX — Lộ trình phát triển

Tài liệu này chuyển PRD thành thứ tự triển khai từ bộ khung hiện tại đến bản Testnet MVP. Nguồn nghiệp vụ là [PRD WhaleDEX](prd-whaledex.md), chuẩn giao diện là [DESIGN.md](../DESIGN.md), và quyết định nền tảng được ghi tại [ADR-0001](adr/0001-sui-deepbook.md).

WhaleDEX là DEX spot không lưu ký trên **Sui Testnet**, sử dụng **DeepBookV3** làm lớp thanh khoản CLOB. MVP không dùng EVM/ERC-20, allowance/approval, AMM, LP token hoặc smart contract riêng.

## 1. Hiện trạng

Codebase hiện có:

| Thành phần | Trạng thái                                                         |
| ---------- | ------------------------------------------------------------------ |
| Workspace  | pnpm 11, Turborepo 2, Node.js 24, TypeScript strict, ESM           |
| Frontend   | Next.js 16, React 19, App Router, trang chủ tĩnh, CSS cơ bản       |
| Backend    | Fastify 5, `GET /health`, logging, graceful shutdown               |
| Shared     | Zod schema và kiểu `HealthResponse`                                |
| Cấu hình   | Preset TypeScript, ESLint, Prettier; kiểm tra biến môi trường      |
| Kiểm thử   | Vitest; test trang chủ, health endpoint, schema và biến môi trường |

Frontend chưa gọi backend. Chưa có Sui SDK, dApp Kit, DeepBook SDK, ví, dữ liệu thị trường, giao dịch, indexer, database, CI hoặc deployment. Mọi mục bên dưới là kế hoạch, không phải tính năng đã hoàn thành.

## 2. Phạm vi phát hành

### MVP-A — Swap Testnet

Mục tiêu đầu tiên là một lát cắt nhỏ có thể kiểm chứng xuyên suốt:

- Cấu hình Sui Testnet, coin và pool allowlist dùng chung.
- Kết nối ví Sui bằng dApp Kit hiện hành.
- Xem market catalog, order book cơ bản và trạng thái freshness.
- Lấy preview và thực hiện swap exact-input trực tiếp từ coin trong ví.
- Theo dõi giao dịch từ lúc chờ ký đến confirmed, failed hoặc unknown.
- Hướng dẫn lấy SUI/DEEP/token Testnet với phương án dự phòng rõ ràng.

Swap DeepBook là ngoại lệ không cần `BalanceManager`. Không bắt người chỉ muốn swap phải tạo hoặc nạp tiền vào tài khoản giao dịch.

### MVP-B — Giao dịch nâng cao

Chỉ bắt đầu sau khi MVP-A đạt nghiệm thu:

- Tìm hoặc tạo và tái sử dụng một `BalanceManager`.
- Nạp/rút tài sản và phân biệt wallet, settled và locked balance.
- Đặt lệnh `LIMIT`/`POST_ONLY`, theo dõi partial fill và hủy lệnh.
- Hiển thị open orders, order history và fill history.
- Hoàn thiện giao diện nâng cao trên desktop và chức năng cốt lõi trên mobile.

### Public Testnet Beta

- Mở rộng pool được hỗ trợ dựa trên thanh khoản thực tế.
- Củng cố cache, rate limit, telemetry, monitoring và khả năng phục hồi upstream.
- Load test, security review và chạy beta trước mọi đánh giá mainnet.

Không thuộc MVP: mainnet, margin, leverage, perpetual, prediction market, cross-chain, fiat, AMM/LP, farming, token WhaleDEX, referral và matching engine riêng.

## 3. Kiến trúc mục tiêu

```text
Sui Wallet
    ↕ ký transaction ở client
Next.js Web ── public reads ──> Fastify API/cache ──> Sui gRPC/GraphQL
    │                                      └──────> DeepBook Indexer
    └── @mysten/dapp-kit-react + @mysten/sui + @mysten/deepbook-v3
```

Trách nhiệm:

- Web quản lý wallet connection, transaction review, yêu cầu ký và trạng thái giao dịch cục bộ.
- API chỉ đọc, kiểm tra input, chuẩn hóa và cache dữ liệu công khai; không nhận private key và không ký thay người dùng.
- Sui/DeepBook là nguồn sự thật cho giao dịch và tài sản. Indexer là nguồn truy vấn dẫn xuất và có thể trễ.
- `packages/shared` chứa schema portable cho network, coin, pool, quote, order book, order và transaction status.
- Pool/coin/package ID đến từ cấu hình đã xác thực hoặc SDK constants; query string không được chọn tùy ý transaction target.
- Code mới dùng gRPC, GraphQL hoặc DeepBook Indexer. Không thêm dependency dựa trên JSON-RPC cũ.

Cấu trúc dự kiến:

```text
apps/web/src/
  app/                   # routes và layout
  components/            # component dùng chung
  features/              # wallet, markets, swap, orders, portfolio
  lib/                   # dApp Kit, API client, cấu hình và số học
apps/api/src/
  modules/               # health, markets, quotes, orders
  adapters/              # Sui/DeepBook/indexer
  plugins/               # HTTP, cache, rate limit, observability
packages/shared/src/     # schema và kiểu portable
docs/adr/                # quyết định kiến trúc
```

Chỉ thêm database hoặc một `apps/indexer` riêng khi nguồn DeepBook/Sui hiện có không đáp ứng lịch sử, freshness hoặc SLA đã chốt.

## 4. Lộ trình triển khai

### Giai đoạn 0 — Baseline và cấu hình

- [ ] Chạy format, lint, typecheck, test và build trên checkout sạch.
- [ ] Thiết lập CI cho các lệnh kiểm tra hiện có.
- [ ] Thêm schema network, coin, pool và amount vào `packages/shared`.
- [ ] Cấu hình Testnet và pool bằng SDK key; không hard-code object/package ID trong component.
- [ ] Thêm `.env.example`, validation và Turbo env inputs cho endpoint public mới.
- [ ] Thêm `@mysten/sui`, `@mysten/deepbook-v3` và `@mysten/dapp-kit-react`; không dùng package dApp Kit legacy.

Nghiệm thu: checkout mới cài và chạy được; CI xanh; cấu hình không chứa mainnet ID hoặc secret trong `NEXT_PUBLIC_*`.

### Giai đoạn 1 — Wallet và public market data

- [ ] Kết nối/ngắt ví, khôi phục kết nối, nhận biết account/network change.
- [ ] Hiển thị network, địa chỉ rút gọn và SUI dành cho gas.
- [ ] Đọc danh sách pool allowlist, book params, order book và recent trades.
- [ ] Gắn mọi snapshot với timestamp và trạng thái fresh/stale/error.
- [ ] Chuẩn hóa timeout và lỗi upstream; test bằng adapter giả, không phụ thuộc public network.

Nghiệm thu: người dùng không kết nối ví vẫn xem được thị trường; sai mạng chặn mọi thao tác ký; refresh không làm mất form hoặc lựa chọn.

### Giai đoạn 2 — MVP-A swap

- [ ] Hỗ trợ swap exact-input trực tiếp từ ví, không yêu cầu `BalanceManager`.
- [ ] Preview hiển thị output dự kiến, minimum output, giá khớp trung bình, price impact, fee asset, phí, gas và timestamp.
- [ ] `minOut` phải lớn hơn 0 và được tính từ quote cùng slippage người dùng đã duyệt.
- [ ] Quote hết hạn khi input, account, network, pool hoặc dữ liệu nguồn thay đổi.
- [ ] Review transaction target, pool, coin types, recipient, amount, `minOut`, fee asset và gas trước khi mở ví.
- [ ] Không tự retry write transaction; theo dõi digest đến kết quả xác định hoặc `unknown`.
- [ ] Refresh số dư và dữ liệu liên quan sau finality; không báo thành công chỉ vì nhận được digest.

Nghiệm thu: hoàn thành connect → quote → review → sign → confirmed trên pool Testnet đã cấu hình, đồng thời xử lý được từ chối ký, thiếu gas, book rỗng, stale quote và kết quả chưa rõ.

### Giai đoạn 3 — MVP-B BalanceManager và limit order

- [ ] Tìm manager theo owner và kiểm tra ID đã lưu trước khi đề nghị tạo mới.
- [ ] Lưu manager ID theo network/owner và không tạo manager thứ hai chỉ vì indexer chưa đồng bộ.
- [ ] Deposit/withdraw có review, gas reserve và refresh sau finality.
- [ ] Đọc `tickSize`, `lotSize`, `minSize` và fee params theo pool; không hard-code.
- [ ] `clientOrderId` là numeric string trong phạm vi `u64` và không trùng trong phạm vi ứng dụng.
- [ ] Mặc định đặt `selfMatchingOption` thành `CANCEL_TAKER` hoặc chính sách an toàn đã duyệt; không dùng mặc định cho phép self-match của SDK.
- [ ] Hỗ trợ `LIMIT` và `POST_ONLY`; lệnh không được đặt phải có kết quả UI khác với lỗi transaction.
- [ ] Hủy lệnh và hiển thị original, filled, remaining, settled và locked balance.

Nghiệm thu: hoàn thành create/reuse manager → deposit → place → cancel hoặc fill → withdraw trên Testnet, không tạo manager mồ côi trong lần chạy lại.

### Giai đoạn 4 — Beta hardening

- [ ] Chuẩn hóa error code, request ID, log redaction, cache và rate limit.
- [ ] Kiểm thử số học, tick/lot rounding, transaction-state reducer và duplicate submission.
- [ ] Kiểm thử browser, responsive, keyboard, zoom 200% và reduced motion.
- [ ] Kiểm thử RPC outage, indexer lag, dữ liệu cũ và recovery.
- [ ] Bổ sung monitoring, runbook và kill switch cấu hình trước beta công khai.
- [ ] Hoàn thành threat model và dependency review trước khi cân nhắc mainnet.

## 5. API dự kiến

Chỉ triển khai endpoint mà UI thực sự cần. Tên trường cuối cùng phải được định nghĩa bằng schema trong `packages/shared`.

| Endpoint                               | Mục đích                                        |
| -------------------------------------- | ----------------------------------------------- |
| `GET /health`                          | Liveness của tiến trình hiện có                 |
| `GET /ready`                           | Readiness và trạng thái upstream bắt buộc       |
| `GET /v1/networks`                     | Network public được hỗ trợ                      |
| `GET /v1/coins?network=testnet`        | Coin allowlist và metadata                      |
| `GET /v1/pools?network=testnet`        | Pool catalog và book/fee params                 |
| `GET /v1/pools/:poolKey/orderbook`     | Snapshot bid/ask có timestamp                   |
| `GET /v1/pools/:poolKey/trades`        | Recent trades có cursor                         |
| `POST /v1/quotes/swap`                 | Preview exact-input, `minOut`, fee và freshness |
| `GET /v1/balance-managers?owner=...`   | Dữ liệu indexer best-effort cho manager         |
| `GET /v1/orders?owner=...&poolKey=...` | Open/history orders khi MVP-B cần               |

Quy ước:

- Dùng `network` và SDK `poolKey`; API ánh xạ sang object ID đã xác thực.
- Coin type, object ID, address và transaction digest là các kiểu khác nhau, không gọi chung là `address` hoặc `hash`.
- Integer on-chain truyền qua JSON dưới dạng chuỗi. Không dùng JavaScript `number` cho giá trị có thể mất độ chính xác.
- Response thị trường có source timestamp, retrieval timestamp và trạng thái freshness.
- Quote có input fingerprint, thời điểm hết hạn và dữ liệu đủ để UI phát hiện response cũ.
- Kết nối ví không tự động chứng minh quyền truy cập API; endpoint public không cần tài khoản/mật khẩu.

## 6. Phí, funding và số học

- Phí maker/taker, stake requirement và tick/lot/minimum là tham số theo pool, có thể thay đổi; luôn đọc từ nguồn hiện hành.
- `payWithDeep` mặc định của SDK không được biến thành giả định sản phẩm. Preview phải nêu rõ phí trả bằng DEEP hay input token.
- Pool `DEEP_SUI` có thể miễn phí tại thời điểm kiểm thử nhưng code và UI không được giả định mọi pool đều như vậy.
- Không có Testnet DEEP faucet bảo đảm. Onboarding ưu tiên token-request form chính thức; swap SUI sang DEEP chỉ là fallback khi `DEEP_SUI` có đủ thanh khoản.
- SUI faucet có rate limit. UI không được hứa cấp token thành công và phải để lại đủ SUI cho gas.
- Amount quan trọng dùng base units/`bigint` hoặc biểu diễn decimal-safe. Chuỗi đã format không được dùng để tạo transaction.
- `minOut` không được bằng 0 trong luồng người dùng; book rỗng hoặc quote không đủ minimum phải chặn review.

Các endpoint, form và link funding là dữ liệu vận hành dễ thay đổi; xác minh lại theo tài liệu Sui/DeepBook chính thức khi bắt đầu mỗi mốc phát hành.

## 7. Kiểm thử và release gate

| Lớp          | Kịch bản ưu tiên                                                                  |
| ------------ | --------------------------------------------------------------------------------- |
| Unit         | Parse/format amount, base units, slippage, tick/lot rounding, freshness và schema |
| UI           | Wallet/account/network change, stale data, review, từ chối ký và pending/unknown  |
| API          | Validation, adapter timeout, cache freshness, pagination và rate limit            |
| Sui/DeepBook | Quote, `minOut`, transaction construction, finality và abort mapping              |
| MVP-B        | Manager reuse, deposit/withdraw, self-match protection, partial fill và cancel    |
| E2E          | Luồng MVP-A; sau đó luồng manager/order của MVP-B                                 |

Release gate cho mỗi lát cắt:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Test CI dùng fixture hoặc adapter giả. Public Testnet chỉ dùng cho smoke test và không được làm toàn bộ suite phụ thuộc endpoint công khai.

## 8. Definition of Done

Một lát cắt chỉ hoàn thành khi:

- [ ] Đáp ứng user story và acceptance criteria tương ứng trong PRD.
- [ ] Có loading, empty, stale và error state áp dụng cho luồng đó.
- [ ] Input và transaction intent được kiểm tra ở ranh giới phù hợp.
- [ ] Có test theo mức rủi ro và toàn bộ release gate liên quan chạy thành công.
- [ ] UI được kiểm chứng trong browser bằng công cụ khả dụng.
- [ ] Schema, env, ADR và tài liệu được cập nhật cùng thay đổi hành vi.
- [ ] Không chứa secret, mainnet ID ngoài chủ đích hoặc dữ liệu giả được trình bày như dữ liệu thật.
- [ ] Có commit nguyên tử và bằng chứng smoke test khi tác động tới giao dịch.

## 9. Việc bắt đầu ngay

1. Hoàn thành Giai đoạn 0 và xác minh SDK hiện hành hoạt động với Next.js.
2. Kiểm tra `DEEP_SUI` cùng nguồn token Testnet trước khi khóa pool mặc định.
3. Xây wallet connection và public market adapter.
4. Hoàn thành một swap trực tiếp có `minOut` và receipt trước khi bắt đầu `BalanceManager`.
5. Cập nhật PRD/roadmap theo bằng chứng từ smoke test, không theo giả định cũ.
