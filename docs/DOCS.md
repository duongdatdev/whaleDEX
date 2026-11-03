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

Đã có monorepo, Sui gRPC/env, health/readiness/catalog API, landing page tích hợp kết nối ví Sui, số dư SUI, sổ lệnh SUI/DBUSDC và luồng swap DeepBook Testnet: quote → mô phỏng → review → yêu cầu ký → theo dõi digest. Pool và quote đã kiểm tra lại chỉ đọc trên Testnet ngày 2026-11-03; xem [bằng chứng Testnet](testnet-verification.md). Test tự động kiểm tra các trạng thái giao dịch, vô hiệu quote khi đổi account và response xác nhận thiếu/sai digest. CI kiểm tra PR đã được cấu hình. Chưa kiểm thử chữ ký/giao dịch end-to-end bằng ví thật và chưa kiểm tra trực quan trình duyệt. Limit order, BalanceManager, cancel và lịch sử đầy đủ chưa triển khai; MVP chưa đạt release gate.

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
- [x] Chạy baseline format/lint/typecheck/test/build khi tích hợp các nhánh ngày 2026-11-03.
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

- [x] Thêm `@mysten/sui` và cấu hình `SuiGrpcClient` cho API/web với Testnet mặc định.
- [x] Thêm URL override, timeout, readiness và test lỗi provider/network mismatch.
- [x] Thêm `@mysten/dapp-kit-react`, wallet provider và connect/disconnect flow.
- [ ] Xử lý account/network change, rejected connection và missing wallet.
- [x] Đọc và hiển thị SUI gas balance; loại bỏ kết quả cũ khi đổi account.
- [ ] Hiển thị đầy đủ coin balances; hiện DBUSDC/DEEP mới được kiểm tra ở bước preflight.

Nghiệm thu: kết nối ví Testnet, đổi account làm mới đúng dữ liệu và ứng dụng không nhận private key.

Commit dự kiến: `feat(wallet): add Sui wallet connection`

### Giai đoạn 3 — DeepBook market data

- [x] Thêm `@mysten/deepbook-v3` và adapter tại `apps/web/src/lib/deepbook.ts`.
- [x] Đối chiếu pool SUI/DBUSDC, coin type từ SDK với registry Testnet.
- [x] Đọc pool metadata, các mức bid/ask và timestamp; làm mới thủ công.
- [x] Xây loading, empty, stale và error states; không dựng volume/price giả.

Nghiệm thu: một market Testnet đã xác minh hiển thị dữ liệu có nguồn và lỗi tách biệt.

Commit dự kiến: `feat(markets): integrate DeepBook spot market data`

### Giai đoạn 4 — Market order

- [x] Form swap hai chiều với amount validation, lot/minimum size phía bán và gas reserve; mô phỏng kiểm tra điều kiện on-chain.
- [x] Quote/preflight, minimum output theo slippage, phí DEEP/gas và review intent.
- [x] Tích hợp yêu cầu ký qua ví, theo dõi digest và link Explorer; chờ kiểm thử ví thật.
- [x] Refresh số dư SUI và book sau confirmed result; lưu digest gần nhất để kiểm tra lại sau reload.
- [ ] Kiểm thử chữ ký và giao dịch end-to-end bằng token Testnet; chuẩn bị DBUSDC/DEEP cho ví thử nghiệm.
- [ ] Hoàn thiện price impact, lịch sử và refresh toàn bộ coin balances.

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
| `GET /ready`                       | Đã có: kiểm tra kết nối và network Sui |
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

## 8. Phân công vòng tiếp theo (nhóm 3 người)

Baseline ngày **03/11/2026**: [PR #6](https://github.com/duongdatdev/whaleDEX/pull/6)
đã merge vào `main` bằng merge commit `b1617ac`. CI của PR đạt format, lint,
typecheck, 122 test và build. Đây là code tích hợp để phát triển tiếp; chưa nghiệm thu
ký bằng ví thật, chưa hoàn thành kiểm tra trực quan và chưa phải Testnet beta.

Mục tiêu vòng này là kiểm chứng và hoàn thiện luồng swap hiện có trước khi mở Limit
order/BalanceManager. Cả ba phần có thể bắt đầu song song từ `main` mới nhất.

| Người phụ trách     | Nhánh công việc            | Kết quả bàn giao                                                      | Người review        |
| ------------------- | -------------------------- | --------------------------------------------------------------------- | ------------------- |
| Đạt — `duongdatdev` | `feat/dat-ui-qa`           | Giao diện responsive, bàn phím và bằng chứng kiểm tra trình duyệt     | Sơn — `sonnhuynhh`  |
| Lâm — `it2kvku`     | `feat/lam-swap-e2e`        | Funding Testnet, nghiệm thu swap bằng ví thật và độ tin cậy giao dịch | Đạt — `duongdatdev` |
| Sơn — `sonnhuynhh`  | `feat/son-wallet-balances` | Số dư SUI/DBUSDC/DEEP, trạng thái ví và cập nhật sau giao dịch        | Lâm — `it2kvku`     |

### 8.1. Đạt — giao diện và kiểm tra trình duyệt

- Phạm vi chính: `apps/web/src/app/page.tsx`, `page.test.tsx`, `layout.tsx`,
  `globals.css`; kiểm tra các component giao dịch đang render, không thay logic ký.
- Kiểm tra trên production build ở 375px, 768px và 1440px: không tràn ngang, nội dung
  đọc được, vùng chạm tối thiểu 44px, form dùng được bằng bàn phím và focus không bị header che.
- Kiểm tra loading, empty, stale, RPC error, review và digest; dữ liệu fixture chỉ dùng
  trong test. Giữ cảnh báo Testnet, trạng thái Limit chưa khả dụng và reduced motion.
- Bàn giao PR kèm ảnh/chứng cứ trình duyệt, kích thước kiểm tra, kết quả bàn phím và các
  lỗi đã sửa. Điều phối sửa CSS cần cho phần của Sơn/Lâm để tránh cùng sửa `globals.css`.
- Nghiệm thu: các kích thước và trạng thái trên được kiểm tra, test giao diện liên quan
  và CI đạt; ghi rõ phần chưa thể kiểm tra, không xem HTTP smoke là visual QA.

### 8.2. Lâm — swap và nghiệm thu Testnet

- Phạm vi chính: `apps/web/src/components/trade-desk.tsx` và test;
  `apps/web/src/lib/deepbook.ts`, `amounts.ts`, `sui-client.ts` và test;
  `apps/web/scripts/*`, `docs/testnet-verification.md`.
- Làm trước: kiểm tra lại pool/quote/liquidity, chuẩn bị SUI/DBUSDC/DEEP đúng coin type
  theo hướng dẫn funding. Chủ ví tự ký; không chia sẻ seed/private key trong nhóm.
- Nghiệm thu buy và sell: quote → mô phỏng → review → ký → digest → confirmed;
  so sánh lượng nhận thực tế với minimum output, kiểm tra phí/gas và phần dư trả về ví.
- Kiểm tra từ chối ký, thiếu token/gas/DEEP, quote hết hạn, RPC lỗi/unknown và reload.
  Không tự gửi lại khi kết quả chưa rõ; watcher của giao dịch cũ vẫn hoạt động khi đổi account.
- Bàn giao PR ghi network, thời gian, digest/Explorer, kết quả từng ca và bug fix có test.
  Token chưa được cấp hoặc liquidity không đủ phải ghi là blocked, không dùng quote
  simulation thay cho bằng chứng giao dịch đã ký.
- Ghi riêng quota/provider dự phòng còn thiếu trong DEP-01; vòng này không tự mở rộng
  runtime fallback, pool allowlist hay Limit order. Kết quả signed E2E là điều kiện đóng
  phần nghiệm thu swap, không đồng nghĩa toàn bộ WHA-6 hoặc beta đã hoàn thành.

### 8.3. Sơn — số dư coin và trạng thái ví

- Phạm vi chính: `apps/web/src/components/wallet-panel.tsx`, `wallet-panel.test.tsx`,
  `wallet-app.tsx` và test liên quan. Dùng coin type/decimals từ allowlist hiện có;
  thay đổi shared contract hoặc adapter phải thống nhất với Lâm trước.
- Hiển thị số dư ví SUI, DBUSDC và DEEP đúng decimals, kể cả số dư bằng 0; không thay
  lỗi đọc thành số 0. Phân biệt loading/error/disconnected/unsupported account.
- Vô hiệu kết quả đọc cũ khi đổi account/disconnect; mỗi coin có trạng thái lỗi có thể
  thử lại. Làm mới cả ba số dư sau confirmed bằng callback hiện có, giữ focus và trạng thái ví.
- Kiểm tra missing wallet, hủy kết nối, account không hỗ trợ Testnet, RPC lỗi và retry.
  Tái sử dụng dApp Kit; không làm modal ví hay cơ chế quản lý khóa riêng.
- Bàn giao PR kèm test race account, decimals/số 0, lỗi/retry và refresh sau confirmed;
  phối hợp Lâm đối chiếu số dư sau signed E2E. Không merge trực tiếp preview cũ từ `sondaden`.
- Nghiệm thu: đủ ba coin, các trạng thái và test trên đạt; UI không nhận hay lưu khóa bí mật.

### 8.4. Cách bắt đầu và phối hợp merge

Các nhánh trong bảng dùng chung baseline `main`; không tiếp tục tính năng mới từ
`lam`, `sondaden`, `dat-welcome-page` hoặc nhánh tích hợp cũ. Giữ các nhánh cũ làm lịch sử.

```sh
git fetch origin
# Thay tên nhánh bằng nhánh của bạn trong bảng; lệnh này tạo nhánh local lần đầu.
git switch --track origin/feat/dat-ui-qa
pnpm install --frozen-lockfile
```

- Mỗi lát cắt hoàn chỉnh có commit Conventional Commit riêng và PR về `main`.
  Owner và reviewer trong bảng là phân công; chưa có PR tính năng nào được coi là hoàn tất.
- Không sửa file người khác phụ trách trong cùng thời điểm. Nếu cần, thống nhất phần sửa
  và cập nhật nhánh bằng merge `origin/main`; không force-push/rebase nhánh của thành viên khác.
- Ưu tiên merge phần số dư của Sơn trước lượt E2E tổng hợp cuối của Lâm. Đạt có thể merge
  sửa layout độc lập; sau hai phần kia cần kiểm tra lại các trạng thái giao dịch trên UI cuối.
- Trước mỗi merge: reviewer xem diff, CI xanh đúng head mới nhất; chạy kiểm tra phù hợp
  theo mục 6. Testnet smoke và signed E2E tách khỏi unit CI ổn định.
- Mỗi owner cung cấp bằng chứng và trạng thái yêu cầu liên quan khi bàn giao.
  Đạt tổng hợp vào `docs/chapter-3/traceability-matrix.md` sau các PR; hiện matrix còn
  mô tả baseline cũ. Cách này tránh ba người cùng sửa bảng trong một thời điểm.
- Sau vòng này, chỉ mở lát cắt Limit/BalanceManager khi swap và trạng thái ví đã được
  nghiệm thu; history/database và Mainnet tiếp tục theo phạm vi roadmap/PRD.
