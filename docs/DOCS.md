# WhaleDEX — Lộ trình Sui Testnet + DeepBookV3

Tài liệu này quy định thứ tự triển khai cho [PRD 3.0](prd-whaledex.md) và [ADR-0003](adr/0003-sui-deepbook-mvp.md). Mục tiêu là spot DEX không lưu ký trên Sui Testnet, dùng DeepBookV3 làm liquidity và matching layer.

## 1. Nguyên tắc

- Chỉ Sui Testnet trong MVP; không triển khai EVM/Sepolia song song.
- Người dùng tự ký; API không giữ khóa và không có quyền rút tài sản.
- DeepBook/Sui là nguồn sự thật; cache/database chỉ là dữ liệu dẫn xuất.
- Dùng `@mysten/dapp-kit-react`, `@mysten/sui` và `@mysten/deepbook-v3` hiện hành.
- Không tự xây matching engine hoặc publish Move package trong MVP.
- Mỗi lát cắt phải có test, kiểm chứng và commit riêng trước lát cắt kế tiếp.

## 2. Trạng thái hiện tại

Đã có monorepo Next.js/Fastify/TypeScript, landing page, shared package, health API, Sui network registry/env validation, `GET /v1/networks` và test nền tảng. Wallet, Sui client, DeepBook integration và giao dịch chưa được triển khai.

## 3. Kiến trúc mục tiêu

```text
Browser + Sui Wallet
        │
        ▼
Next.js web ─────────────► Sui gRPC / DeepBookV3
        │                         │
        │ public derived reads    │ on-chain state/events
        ▼                         ▼
Fastify API/cache ◄──────── optional indexer
        │
        └── PostgreSQL only when history/chart requires persistence
```

Ranh giới trách nhiệm:

- **Web:** wallet, form state, intent review, signing, transaction tracking.
- **Shared:** network/market schemas, amount types, error contracts; không chứa secret.
- **API:** health/readiness, cache/index/history, request validation và observability.
- **DeepBook/Sui:** custody rules, order state, matching, fills và settlement.

## 4. Lộ trình theo lát cắt

### Giai đoạn 0 — Đồng bộ quyết định và baseline

- [x] Ghi ADR-0003 và đồng bộ PRD, roadmap, README, Chapter 3.
- [ ] Chạy đầy đủ baseline repository trước thay đổi code.
- [ ] Chốt tiêu chí nghiệm thu cho market đầu tiên và các dependency DEP-01..DEP-05.

Nghiệm thu: không còn tài liệu hiện hành mô tả EVM/Sepolia là phạm vi mục tiêu; tài liệu lịch sử được đánh dấu rõ.

### Giai đoạn 1 — Cấu hình Sui

- [x] Thay chain ID số và EVM registry bằng network schema `testnet | mainnet` phù hợp Sui.
- [x] Đặt Testnet là network duy nhất được bật giao dịch.
- [x] Cấu hình public gRPC endpoint và Sui Explorer; fallback provider vẫn thuộc DEP-01.
- [x] Cập nhật env, API catalog, shared exports và toàn bộ test liên quan.

Nghiệm thu: config sai/thiếu bị từ chối; API và web thống nhất network; không còn EVM registry trong runtime MVP.

Commit dự kiến: `refactor(networks): replace EVM registry with Sui configuration`

### Giai đoạn 2 — Ví và public reads

- [ ] Thêm `@mysten/sui` và `@mysten/dapp-kit-react`.
- [ ] Tạo `SuiGrpcClient`, provider và connect/disconnect flow.
- [ ] Xử lý account/network change, rejected connection và missing wallet.
- [ ] Đọc SUI gas balance và coin balances theo coin type/decimals.

Nghiệm thu: kết nối ví Testnet, đổi account làm mới đúng dữ liệu và ứng dụng không nhận private key.

Commit dự kiến: `feat(wallet): add Sui wallet connection`

### Giai đoạn 3 — DeepBook market data

- [ ] Thêm `@mysten/deepbook-v3` và `SuiDeepBookAdapter`.
- [ ] Xác minh deployment/pool/coin type từ SDK/config chính thức.
- [ ] Đọc pool metadata, order book, best bid/ask và freshness.
- [ ] Xây loading, empty, stale và error states; không dựng volume/price giả.

Nghiệm thu: một market Testnet đã xác minh hiển thị dữ liệu có nguồn và lỗi tách biệt.

Commit dự kiến: `feat(markets): integrate DeepBook spot market data`

### Giai đoạn 4 — Market order

- [ ] Form buy/sell với amount validation và gas reserve.
- [ ] Quote/preflight, price limit, phí và review intent.
- [ ] Ký qua ví, theo dõi digest và link Explorer.
- [ ] Refresh balance/book/history sau confirmed result.

Nghiệm thu: connect → quote → review → sign → confirmed chạy end-to-end bằng token Testnet; rejected/failed/unknown không bị báo thành công.

Commit dự kiến: `feat(trade): support DeepBook market orders`

### Giai đoạn 5 — Limit order và trading account

- [ ] Tích hợp BalanceManager/deposit/withdraw nếu luồng DeepBook yêu cầu.
- [ ] Limit và post-only order với tick/lot validation.
- [ ] Open orders, partial fills và cancel.
- [ ] Tách rõ wallet balance, available, locked và settled balance.

Nghiệm thu: người dùng tạo và hủy limit order; số dư/locked amount khớp on-chain state.

Commit dự kiến: `feat(orders): add DeepBook limit order management`

### Giai đoạn 6 — History, chart và API read model

- [ ] Đánh giá direct reads/DeepBook indexer trước khi thêm database.
- [ ] Thêm API có cursor cho fills/history nếu UI thực sự cần.
- [ ] Thêm PostgreSQL chỉ cho read model dẫn xuất.
- [ ] Xây candlestick/chart từ nguồn có freshness và provenance rõ.

Nghiệm thu: indexer outage không làm mất khả năng rút/hủy qua protocol; dữ liệu stale được gắn nhãn.

Commit dự kiến: `feat(api): index DeepBook trading activity`

### Giai đoạn 7 — Hardening và Testnet beta

- [ ] Test rounding, decimals, tick/lot, stale quote và race condition.
- [ ] Test rejected signature, insufficient balance/gas, RPC outage và reload recovery.
- [ ] Kiểm tra keyboard, screen reader, mobile và reduced motion.
- [ ] Thêm monitoring, redacted logs, dependency review và runbook Testnet.

Nghiệm thu: toàn bộ release gate trong PRD đạt và không còn lỗi nghiêm trọng đã biết trong luồng tài sản.

Commit dự kiến: `test(trade): cover Sui spot trading flows`

## 5. API dự kiến

Chỉ thêm endpoint khi có consumer thực tế:

| Endpoint                           | Mục đích                               |
| ---------------------------------- | -------------------------------------- |
| `GET /health`                      | Liveness hiện có                       |
| `GET /ready`                       | Trạng thái dependency bắt buộc         |
| `GET /v1/networks`                 | Sui network metadata và release status |
| `GET /v1/markets`                  | Allowlisted DeepBook markets           |
| `GET /v1/markets/:id/book`         | Cached public order-book read nếu cần  |
| `GET /v1/wallets/:address/history` | Derived history có cursor nếu cần      |

API không nhận private key, không ký hoặc tự submit transaction thay người dùng. Transaction builders ưu tiên chạy ở client bằng SDK chính thức; mọi server-built payload phải được client kiểm tra đầy đủ trước khi ký.

## 6. Test và release workflow

Ưu tiên test phạm vi hẹp trước, sau đó chạy:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

- Unit: amount, decimals, tick/lot, schema và state transitions.
- Integration: Sui client/DeepBook adapter với fixture và Testnet smoke test tách khỏi CI ổn định.
- UI: wallet states, order review, async races và accessibility.
- E2E: connect → order → digest → confirmed → refreshed state trên production build.

Public Testnet/RPC không phải dependency bắt buộc của unit CI. Mock test không chứng minh deployment hoặc thanh khoản thực tế.

## 7. Sau MVP

Sui Mainnet chỉ được cân nhắc sau Testnet beta và cần ADR/PRD riêng. EVM/multi-chain không bị cấm vĩnh viễn, nhưng chỉ được mở lại khi có nhu cầu sản phẩm, protocol cụ thể, threat model và nguồn lực vận hành; không giữ code EVM chưa dùng trong MVP chỉ để “phòng tương lai”.
