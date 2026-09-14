# WhaleDEX — Kế hoạch phát triển dự án

Tài liệu này mô tả lộ trình tiếp theo từ bộ khung hiện tại đến MVP DEX trên testnet và các điều kiện để triển khai production. Đây là kế hoạch đề xuất; blockchain, giao thức giao dịch, nhà cung cấp hạ tầng và ngân sách chưa được chốt.

## 1. Hiện trạng

Codebase hiện có:

| Thành phần | Trạng thái |
| --- | --- |
| Workspace | pnpm 11, Turborepo 2, Node.js 24, TypeScript strict, ESM |
| Frontend | Next.js 16, React 19, App Router, trang chủ tĩnh, CSS cơ bản |
| Backend | Fastify 5, `GET /health`, logging, graceful shutdown |
| Shared | Zod schema và kiểu `HealthResponse` |
| Cấu hình | Preset TypeScript, ESLint, Prettier; kiểm tra biến môi trường |
| Kiểm thử | Vitest; test trang chủ, health endpoint, schema và biến môi trường |

Frontend chưa gọi backend. Biến `NEXT_PUBLIC_API_URL` mới được khai báo và kiểm tra. Nhãn “Frontend is ready” không phản ánh sức khỏe API.

Chưa có wallet, blockchain SDK, smart contract, swap, liquidity pool, indexer, database, authentication, CI hoặc deployment. Các mục bên dưới là công việc cần triển khai, không phải tính năng đã hoàn thành.

## 2. Mục tiêu và phạm vi

### MVP trên testnet

Người dùng có thể kết nối ví, chọn token được hỗ trợ, xem số dư và báo giá, cấp quyền chi tiêu khi cần, thực hiện swap, theo dõi giao dịch và xem lại lịch sử. Nếu lựa chọn xây AMM riêng, MVP bổ sung xem pool, thêm và rút thanh khoản.

Giả định để lập kế hoạch:

- Bắt đầu với một blockchain tương thích EVM và một testnet; tên mạng sẽ được quyết định ở giai đoạn 1.
- Ví người dùng ký giao dịch; backend không giữ private key hoặc seed phrase của người dùng.
- Ưu tiên swap exact-input cho danh sách token giới hạn.
- Chọn một hướng: tích hợp giao thức đã có hoặc xây AMM riêng. Không triển khai đồng thời hai hướng trong MVP.
- Hoàn thành một luồng swap xuyên suốt trước khi mở rộng màn hình và analytics.

Chưa đưa vào MVP: cross-chain bridge, futures, margin, order book, limit order, farming, staking, governance token, fiat on-ramp, mobile app riêng và hỗ trợ mọi loại token.

### Sau MVP

Ổn định vận hành, hoàn thiện dữ liệu pool và portfolio, đánh giá bảo mật, triển khai production có kiểm soát. Chỉ mở rộng đa mạng hoặc routing phức tạp khi có nhu cầu và số liệu sử dụng.

## 3. Các quyết định phải chốt trước khi tích hợp blockchain

| Quyết định | Nội dung cần xác định | Đầu ra |
| --- | --- | --- |
| Sản phẩm | Demo học tập, sản phẩm thử nghiệm hay dịch vụ production; nhóm người dùng mục tiêu | Product brief và phạm vi MVP |
| Blockchain | Chain ID, testnet, native token, RPC, explorer, faucet, chính sách xác nhận | Cấu hình mạng được kiểm chứng |
| Mô hình DEX | Tích hợp giao thức hiện có hoặc triển khai AMM riêng | ADR về mô hình giao dịch |
| Giao thức | Địa chỉ deployment, ABI, router, spender, loại pool, phí và giấy phép sử dụng | Danh sách hợp đồng tin cậy |
| Token | Địa chỉ, decimals, nguồn metadata; chính sách token không chuẩn | Token allowlist theo chain |
| Wallet | SDK tương thích stack, ví mục tiêu, chuyển mạng, khả năng test | Proof of concept kết nối ví |
| Dữ liệu | Nguồn quote, lịch sử, indexer, database và cách xử lý reorg | Sơ đồ luồng dữ liệu và ADR |
| Hạ tầng | Môi trường staging/production, RPC dự phòng, ngân sách, người vận hành | Kế hoạch triển khai và dự toán |
| Chất lượng | Trình duyệt hỗ trợ, mục tiêu độ trễ, độ sẵn sàng và độ mới dữ liệu | Tiêu chí đo được cho bản phát hành |

ADR là bản ghi quyết định kiến trúc, gồm bối cảnh, các lựa chọn, quyết định, hệ quả và người chịu trách nhiệm. Lưu tại `docs/adr/` khi phát sinh; không xem các giả định trong tài liệu này là quyết định đã duyệt.

## 4. Kiến trúc dự kiến

```text
Trình duyệt / Next.js
  ├── Wallet: kết nối, ký và gửi giao dịch
  ├── RPC: đọc số dư, allowance, simulation và receipt
  └── Fastify API: token, quote, pool và lịch sử
        ├── Adapter giao thức / RPC
        └── Database / cache nếu cần

Blockchain events
  └── Indexer: đọc log, kiểm tra block, xử lý reorg
        └── Database → API → giao diện
```

Quyền sở hữu dữ liệu và trách nhiệm:

- Blockchain là nguồn xác nhận giao dịch và trạng thái tài sản. Database là dữ liệu dẫn xuất để truy vấn.
- Frontend quản lý tương tác ví, trạng thái giao dịch và hiển thị dữ liệu; không chứa secret của máy chủ.
- API kiểm tra input, điều phối adapter và chuẩn hóa response; không ký giao dịch thay người dùng.
- Quote phục vụ thời điểm xem giá. Trước khi ký cần kiểm tra lại chain, tài khoản, route, spender, số tiền và độ mới của quote.
- Indexer chạy độc lập khi được bổ sung, có checkpoint và khả năng đồng bộ lại.
- `packages/shared` chứa contract dữ liệu dùng được ở cả browser và server; không import module chỉ dành cho Node hoặc secret.
- Các ứng dụng không import mã nguồn trực tiếp của nhau. Chỉ tách package mới khi có nhu cầu chia sẻ thực tế.

Cấu trúc có thể mở rộng:

```text
apps/web/src/
  app/                   # Routes và layout
  components/            # Thành phần UI dùng chung
  features/              # wallet, swap, pools, activity
  lib/                   # API client, cấu hình chain và tiện ích
apps/api/src/
  modules/               # tokens, quotes, pools, transactions
  plugins/               # Cấu hình HTTP và kết nối hạ tầng
  adapters/              # RPC, giao thức và nguồn dữ liệu
packages/shared/src/     # Schema, kiểu và tiện ích portable
apps/indexer/            # Chỉ thêm khi bắt đầu đồng bộ events
contracts/               # Chỉ thêm nếu chọn triển khai hợp đồng riêng
docs/adr/                # Các quyết định kiến trúc
```

## 5. Lộ trình triển khai

### Giai đoạn 1 — Chốt đặc tả và chứng minh hướng kỹ thuật

- [ ] Viết product brief, user stories và phạm vi MVP.
- [ ] Hoàn tất các quyết định trong mục 3, ưu tiên chain và mô hình DEX.
- [ ] Xác minh deployment, token thử nghiệm và nguồn thanh khoản trên testnet.
- [ ] Thử kết nối ví, đọc chain ID, số dư và một quote từ nguồn dự kiến.
- [ ] Ghi nhận các rủi ro, phụ thuộc và người chịu trách nhiệm.
- [ ] Phác thảo màn hình Swap, Pools nếu thuộc phạm vi, và Activity.

Nghiệm thu: có cấu hình testnet dùng được, lựa chọn giao thức rõ ràng, luồng giao dịch mô tả đầy đủ và backlog đã ưu tiên. Nếu thiếu liquidity hoặc deployment phù hợp, xử lý lựa chọn mạng/giao thức trước khi xây UI giao dịch.

### Giai đoạn 2 — Chuẩn hóa quy trình phát triển

- [ ] Cài dependency theo lockfile bằng phiên bản Node/pnpm của repository.
- [ ] Chạy các lệnh kiểm tra hiện có và ghi nhận lỗi nền nếu có.
- [ ] Thiết lập CI cho format, lint, typecheck, test và build.
- [ ] Bổ sung hướng dẫn branch, PR, review và xử lý migration.
- [ ] Tạo `.env.example` cho từng cấu hình mới, cập nhật validation và Turbo inputs/env tương ứng.
- [ ] Chuẩn hóa lỗi API, request ID và chính sách log không lộ secret.
- [ ] Chọn cách gọi API từ browser: cùng origin qua proxy hoặc khác origin với CORS allowlist.
- [ ] Dựng staging và quy trình cấu hình biến môi trường public trước build.

Nghiệm thu: một checkout mới có thể cài, chạy và build theo README; CI chạy thành công; staging có web và health endpoint truy cập được.

### Giai đoạn 3 — Giao diện nền và kết nối ví

- [ ] Xây layout responsive, navigation, button, input, dialog, toast và trạng thái loading/error/empty.
- [ ] Thêm trang `/swap`, `/activity` và `/pools` nếu có nghiệp vụ thanh khoản.
- [ ] Kết nối, ngắt kết nối, đổi tài khoản và đổi mạng.
- [ ] Xử lý ví chưa cài, người dùng từ chối, mạng không hỗ trợ và RPC lỗi.
- [ ] Đọc số dư native token/ERC-20 theo đúng chain và account.
- [ ] Xây token selector theo allowlist; hiển thị địa chỉ để phân biệt token trùng symbol.
- [ ] Kiểm tra keyboard navigation, focus của dialog và màn hình mobile.

Nghiệm thu: đổi ví hoặc mạng làm mới dữ liệu đúng; chưa có ví vẫn xem được trang; không thể tiếp tục giao dịch trên mạng không hỗ trợ.

### Giai đoạn 4 — Lớp giao thức và một giao dịch thử nghiệm

Phần chung:

- [ ] Tạo adapter đọc token, pool, allowance và quote từ nguồn đã chọn.
- [ ] Quản lý ABI và địa chỉ theo chain, kiểm tra bytecode/deployment và không dùng địa chỉ giả trong bản thật.
- [ ] Dùng số nguyên đơn vị nhỏ nhất cho tính toán; serialize số lượng thành chuỗi qua JSON.
- [ ] Xác định deadline, slippage bounds, rounding và quy tắc hết hạn quote.
- [ ] Thực hiện một swap testnet từ ví đến receipt trước khi hoàn thiện giao diện.

Nếu tích hợp giao thức có sẵn:

- [ ] Kiểm chứng ABI, router, spender và route tương thích với deployment được chọn.
- [ ] Đọc tài liệu và điều kiện sử dụng của phiên bản giao thức thực tế.
- [ ] Kiểm thử quote, approval, simulation và swap trên môi trường có dữ liệu tái lập.
- [ ] Nếu nhận calldata từ dịch vụ ngoài, kiểm tra target, chain, value, spender và các tham số quan trọng trước khi đề nghị ký.

Nếu xây AMM riêng:

- [ ] Đặc tả pool, factory, router, LP token, phí và các quyền quản trị.
- [ ] Xác định invariant của mô hình đã chọn, cách tính quote và rounding.
- [ ] Viết kiểm thử swap, thêm/rút thanh khoản, pool khởi tạo và thanh khoản tối thiểu.
- [ ] Kiểm thử reentrancy, token có hành vi bất thường, quyền truy cập và bảo toàn tài sản theo mô hình.
- [ ] Thêm fuzz/invariant tests và thử nghiệm tích hợp trên local chain.
- [ ] Viết script deploy tái lập, quản lý ABI/address và xác minh source trên explorer khi được hỗ trợ.
- [ ] Deploy testnet; dành một mốc đánh giá bảo mật riêng trước production.

Nghiệm thu: có ít nhất một giao dịch thử nghiệm được xác nhận và đối chiếu số dư; test cho quote và contract/adapter chạy được. Nhánh AMM riêng phải hoàn tất phần hợp đồng liên quan trước khi sang luồng swap hoàn chỉnh.

### Giai đoạn 5 — Hoàn thiện swap MVP

- [ ] Nhập số lượng với kiểm tra decimals, số dư, giá trị rỗng, âm và vượt giới hạn.
- [ ] Lấy quote có debounce, hủy hoặc bỏ qua response cũ khi input thay đổi.
- [ ] Hiển thị expected output, minimum received, route, price impact, phí và gas ước tính.
- [ ] Cho phép cấu hình slippage trong giới hạn sản phẩm đã chốt; có xác nhận riêng cho mức rủi ro cao.
- [ ] Kiểm tra allowance và đề nghị approval cho đúng spender, ưu tiên số lượng cần dùng.
- [ ] Tách approval và swap thành hai bước rõ ràng; chờ approval thành công rồi đọc lại allowance.
- [ ] Kiểm tra lại quote sau approval, mô phỏng giao dịch và ước tính gas trước khi ký.
- [ ] Xử lý native token/wrapped token nếu nằm trong phạm vi đã chọn.
- [ ] Hiển thị trạng thái chờ ký, đã gửi, đang chờ, đã xác nhận, thất bại và bị thay thế.
- [ ] Lưu hash kèm chain/account để tiếp tục theo dõi khi tải lại trang.
- [ ] Làm mới số dư, allowance và dữ liệu liên quan sau giao dịch.

Nghiệm thu: người dùng hoàn thành connect → quote → approve nếu cần → swap → receipt trên testnet. UI xử lý đúng từ chối ký, thiếu gas, quote hết hạn, revert, đổi mạng và giao dịch bị thay thế; không báo thành công chỉ vì đã nhận transaction hash.

### Giai đoạn 6 — Pool và thanh khoản, nếu thuộc phạm vi

- [ ] Danh sách pool và trang chi tiết với token, phí, reserves và thời điểm cập nhật.
- [ ] Thêm thanh khoản: nhập số lượng, xem tỷ lệ, approval và xác nhận giao dịch.
- [ ] Rút thanh khoản: chọn phần sở hữu, xem số lượng nhận dự kiến và giới hạn tối thiểu.
- [ ] Hiển thị vị thế LP theo mô hình giao thức; không giả định mọi giao thức đều dùng LP token giống nhau.
- [ ] Xử lý pool rỗng, thiếu thanh khoản, rounding và thay đổi tỷ lệ trước khi ký.
- [ ] Giải thích phí và rủi ro của vị thế bằng nội dung dễ hiểu trong luồng liên quan.

Nghiệm thu: thêm/rút thanh khoản trên testnet thành công và vị thế khớp dữ liệu on-chain. Nếu MVP chỉ tích hợp swap, ghi rõ giai đoạn này được hoãn.

### Giai đoạn 7 — Indexer, lịch sử và API dữ liệu

- [ ] Quyết định tự index hay dùng nguồn bên ngoài dựa trên độ đầy đủ, chi phí và khả năng xử lý reorg.
- [ ] Thiết kế database và migration trước khi thêm persistence.
- [ ] Đồng bộ events theo block range, lưu checkpoint sau khi commit dữ liệu thành công.
- [ ] Chống ghi trùng bằng khóa chain ID + transaction hash + log index.
- [ ] Lưu block hash/parent hash; phát hiện reorg và rollback/replay từ mốc phù hợp.
- [ ] Phân biệt dữ liệu chưa đủ xác nhận và dữ liệu đã đạt chính sách finality của chain.
- [ ] Bổ sung retry có giới hạn, backoff, chia nhỏ range và tiếp tục sau restart.
- [ ] Cung cấp lịch sử theo ví, pool và trạng thái giao dịch với cursor pagination.
- [ ] Bổ sung metric indexer lag và timestamp/block nguồn trong response.
- [ ] Chỉ thêm cache khi cần, có TTL và phân biệt dữ liệu cũ với dữ liệu mới.

Nghiệm thu: replay không sinh bản ghi trùng, restart không mất tiến độ, kiểm thử reorg phục hồi đúng và UI thể hiện dữ liệu đang trễ. Có thể bắt đầu giai đoạn này sớm sau khi ABI/events được chốt; không chặn giao dịch thử nghiệm ở giai đoạn 4.

### Giai đoạn 8 — Củng cố chất lượng và bảo mật

- [ ] Hoàn thiện unit, integration và E2E cho các luồng quan trọng.
- [ ] Kiểm thử browser mục tiêu, mobile, accessibility và thao tác khi mạng chậm.
- [ ] Kiểm thử API input, rate limit, timeout, lỗi upstream và giới hạn kích thước request.
- [ ] Rà soát đường đi của secret, dependency, quyền truy cập và log.
- [ ] Kiểm tra UI không hiển thị dữ liệu mô phỏng như dữ liệu thật.
- [ ] Kiểm thử RPC outage, quote stale, indexer lag và phục hồi dịch vụ.
- [ ] Đo độ trễ quote/API và tải dự kiến; đặt ngưỡng release từ kết quả thực nghiệm.
- [ ] Nếu có contract riêng, hoàn tất đánh giá bảo mật độc lập phù hợp phạm vi và xử lý phát hiện trước khi dùng tài sản thật.

Nghiệm thu: không còn lỗi nghiêm trọng đã biết trong luồng tài sản; các kịch bản thất bại có hành vi xác định; CI và bài kiểm thử phát hành đạt tiêu chí đã chốt.

### Giai đoạn 9 — Phát hành và vận hành

- [ ] Tạo artifact build tái lập; chọn container hoặc cơ chế deploy phù hợp hạ tầng.
- [ ] Tách cấu hình testnet/staging/production và kiểm tra chain/address trước release.
- [ ] Thiết lập HTTPS, domain, health/readiness, monitoring và cảnh báo có người nhận.
- [ ] Kiểm tra migration, backup/restore và phương án rollback ứng dụng.
- [ ] Viết runbook cho API lỗi, RPC lỗi, indexer trễ và phát hiện giao dịch bất thường.
- [ ] Chạy testnet beta, thu thập lỗi, sửa và nghiệm thu toàn bộ luồng chính.
- [ ] Chốt người chịu trách nhiệm vận hành, ngân sách, nguồn thanh khoản và điều kiện mở production.
- [ ] Rà soát các nghĩa vụ pháp lý liên quan phạm vi triển khai thực tế trước khi cung cấp dịch vụ công khai.
- [ ] Phát hành production có kiểm soát sau khi người phụ trách dự án duyệt checklist phát hành cụ thể.

Nghiệm thu: có phiên bản truy vết được tới commit, dashboard và runbook; diễn tập phục hồi thành công. Rollback web/API không đảo ngược giao dịch on-chain; hợp đồng cần chiến lược xử lý riêng theo thiết kế của giao thức.

## 6. API và mô hình dữ liệu dự kiến

Các endpoint sau là đề xuất, chỉ triển khai theo nhu cầu tính năng và adapter đã chọn:

| Endpoint | Mục đích |
| --- | --- |
| `GET /health` | Giữ endpoint hiện có để kiểm tra tiến trình |
| `GET /ready` | Kiểm tra các dependency bắt buộc cho môi trường triển khai |
| `GET /v1/chains` | Mạng được hỗ trợ và cấu hình public |
| `GET /v1/tokens?chainId=...` | Token allowlist theo mạng |
| `POST /v1/quotes` | Quote exact-input và thông tin hiệu lực |
| `GET /v1/pools?chainId=...` | Danh sách pool, nếu thuộc phạm vi |
| `GET /v1/pools/:address?chainId=...` | Chi tiết pool |
| `GET /v1/wallets/:address/transactions?chainId=...` | Lịch sử ví có phân trang |
| `GET /v1/transactions/:hash?chainId=...` | Trạng thái giao dịch và xác nhận |

Quy ước dữ liệu:

- Mỗi tài nguyên blockchain gắn với `chainId`; địa chỉ được kiểm tra và chuẩn hóa để so sánh.
- Số lượng token và giá trị số nguyên lớn truyền dưới dạng chuỗi; không dùng số thực JavaScript cho phép tính tài sản.
- Quote chứa token vào/ra, amountIn, amountOut dự kiến, minimum output, route, nguồn block/thời gian và hạn dùng.
- Error response có mã ổn định, thông báo phù hợp người dùng và request ID; không trả stack trace hoặc secret.
- Endpoint danh sách có giới hạn số phần tử và cursor; thông tin freshness không bị che bởi cache.
- Schema request/response đặt trong `packages/shared`; validation diễn ra ở biên API.

Các thực thể nếu cần database: `Chain`, `Token`, `Pool`, `Transaction`, `SwapEvent`, `LiquidityEvent`, `IndexerCheckpoint` và `IndexedBlock`. Dữ liệu receipt theo dõi ở client có thể tồn tại trước khi indexer đồng bộ xong.

Không cần tài khoản/mật khẩu cho các luồng public của MVP. Nếu bổ sung dữ liệu riêng hoặc quản trị, thiết kế authentication/authorization riêng; kết nối ví đơn thuần không chứng minh quyền truy cập API.

## 7. Chiến lược kiểm thử

| Lớp | Kịch bản ưu tiên |
| --- | --- |
| Unit | Parse/format amount, decimals, rounding, slippage, hết hạn quote, schema và env |
| UI | Đổi chain/account, dữ liệu cũ, từ chối ký, approval, pending và lỗi |
| API integration | Validation, adapter timeout, response contract, pagination và rate limit |
| Blockchain integration | Allowance, simulation, swap, receipt, revert và thay thế giao dịch |
| Contract riêng | Invariants, fuzz, quyền truy cập, reentrancy và thanh khoản |
| Indexer | Duplicate logs, restart, checkpoint, backfill và reorg |
| E2E | Connect → quote → approve → swap → cập nhật số dư/lịch sử |
| Vận hành | Health/readiness, lỗi RPC, migration, restore và rollback |

Test CI cần dữ liệu tái lập bằng fixture/local chain hoặc môi trường fork đã cố định. Smoke test trên testnet dùng để xác minh deployment thực tế; không làm toàn bộ test suite phụ thuộc RPC public đang hoạt động.

Các lệnh kiểm tra hiện có:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Thêm lệnh E2E, contract và indexer khi các thành phần đó được triển khai. Không yêu cầu chạy bài test chưa tồn tại.

## 8. Rủi ro kỹ thuật và cách xử lý

| Rủi ro | Hướng xử lý trong kế hoạch |
| --- | --- |
| Sai chain hoặc địa chỉ hợp đồng | Cấu hình theo chain, xác minh deployment, chặn ký khi context thay đổi |
| Quote cũ hoặc response về sai thứ tự | Gắn quote với input/context, hạn hiệu lực, bỏ response cũ và kiểm tra lại trước ký |
| Giá thay đổi hoặc MEV | Minimum output, deadline và giới hạn slippage; không cam kết loại bỏ MEV |
| Approval sai spender hoặc quá lớn | Spender allowlist theo deployment và hiển thị rõ quyền được cấp |
| Token không chuẩn | Allowlist, metadata được kiểm chứng và chính sách hỗ trợ rõ ràng |
| RPC mất kết nối hoặc rate limit | Timeout, retry có giới hạn, RPC dự phòng và trạng thái lỗi rõ ràng |
| Reorg hoặc indexer trễ | Block hash, checkpoint, replay và trạng thái xác nhận riêng |
| Sai decimals/rounding | Số nguyên đơn vị nhỏ nhất và kiểm thử biên |
| Lộ secret | Validation env, secret store ở deployment, lọc log và không dùng public prefix cho secret |
| Hợp đồng riêng có lỗi | Giảm phạm vi, invariant tests, review độc lập và tách mốc testnet/production |

ERC-20 định nghĩa `approve`, `allowance` và `transferFrom`; metadata như `decimals` là tùy chọn trong chuẩn. Adapter cần chính sách rõ ràng khi metadata thiếu hoặc token có hành vi ngoài phạm vi hỗ trợ. Tham khảo [ERC-20 specification](https://eips.ethereum.org/EIPS/eip-20).

Thiết kế giới hạn thực thi swap cần phân biệt báo giá quan sát được và giá tại thời điểm giao dịch được thực thi. Tài liệu [Uniswap v2 pricing](https://developers.uniswap.org/docs/protocols/v2/concepts/pricing) giải thích vấn đề này cho v2; chỉ áp dụng công thức cụ thể nếu dự án chọn đúng mô hình tương ứng.

Luồng theo dõi giao dịch cần xử lý các bước ký, gửi và đưa vào block. Tham khảo [Ethereum transactions](https://ethereum.org/developers/docs/transactions/), sau đó xác định chính sách xác nhận cụ thể cho chain được chọn.

## 9. Backlog ưu tiên và phụ thuộc

| Ưu tiên | Hạng mục | Phụ thuộc | Kết quả |
| --- | --- | --- | --- |
| P0 | Chốt chain và mô hình DEX | Product brief | ADR và cấu hình testnet |
| P0 | CI và baseline kiểm tra | Môi trường dev | Pipeline hoạt động |
| P0 | Wallet và số dư | Chain/SDK đã chọn | Kết nối ví ổn định |
| P0 | Adapter hoặc contract thử nghiệm | Giao thức/ABI | Quote và swap thử nghiệm |
| P0 | Swap xuyên suốt | Wallet + lớp giao thức | MVP giao dịch trên testnet |
| P1 | Lịch sử và indexer | Events/nguồn dữ liệu | Lịch sử có thể phục hồi |
| P1 | Thanh khoản | Thuộc phạm vi + giao thức hỗ trợ | Thêm/rút và xem vị thế |
| P1 | Củng cố, monitoring, staging | Luồng chính hoạt động | Testnet beta ổn định |
| P1 | Đánh giá và chuẩn bị production | Beta đạt nghiệm thu | Checklist phát hành đầy đủ |
| P2 | Analytics, portfolio mở rộng | Dữ liệu đáng tin cậy | Tính năng dựa trên nhu cầu |
| P2 | Multi-chain, advanced routing | MVP ổn định + đặc tả mới | ADR và kế hoạch riêng |

Đường phụ thuộc chính: đặc tả → wallet/lớp giao thức → swap → củng cố → beta → đánh giá production. UI nền và CI có thể làm đồng thời sau khi chốt phạm vi. Indexer bắt đầu khi dữ liệu events rõ ràng; nhánh AMM riêng bổ sung thời gian thiết kế, kiểm thử và đánh giá contract.

Chưa gán ngày hoàn thành vì chưa biết nhân sự, ngân sách và nhánh giao thức. Sau giai đoạn 1, mỗi hạng mục phải có người phụ trách, ước lượng, phụ thuộc, tiêu chí nghiệm thu và mốc dự kiến; cập nhật lại sau giao dịch thử nghiệm đầu tiên.

## 10. Definition of Done và cập nhật tài liệu

Một tính năng hoàn thành khi:

- [ ] Đáp ứng user story và tiêu chí nghiệm thu của giai đoạn.
- [ ] Có loading/error/empty states nếu áp dụng; không sử dụng dữ liệu giả trong luồng thật.
- [ ] Kiểm tra input và các trường hợp lỗi ảnh hưởng đến tài sản.
- [ ] Có kiểm thử phù hợp với mức độ ảnh hưởng, các check liên quan chạy thành công.
- [ ] Cập nhật schema, `.env.example`, migration và tài liệu khi thay đổi giao diện liên quan.
- [ ] Được review, không chứa secret và có cách xác minh trên môi trường đích.

Sau mỗi mốc, cập nhật checkbox và dẫn tới PR hoặc bằng chứng nghiệm thu. Giữ README tập trung vào cài đặt/chạy dự án; dùng tài liệu này cho lộ trình và `docs/adr/` cho quyết định kiến trúc. Tính năng được hoãn cần ghi lý do và điều kiện đưa trở lại backlog.

## 11. Các việc bắt đầu ngay

1. Chốt mục tiêu sản phẩm, chain testnet và lựa chọn tích hợp giao thức hay AMM riêng.
2. Kiểm chứng token, thanh khoản và deployment cần cho giao dịch thử nghiệm.
3. Cài dependency theo lockfile, chạy baseline checks và thiết lập CI.
4. Dựng layout `/swap`, kết nối ví và hiển thị số dư testnet.
5. Triển khai adapter tối thiểu để lấy quote, approve và thực hiện một swap có receipt.
6. Dùng kết quả thử nghiệm để cập nhật backlog, ước lượng và các quyết định còn mở.
