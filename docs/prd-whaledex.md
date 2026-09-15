# PRD: WhaleDEX

**Trạng thái:** Approved 1.1 cho Testnet MVP

**Ngày:** 2026-09-15

**Phạm vi:** MVP chạy miễn phí trên testnet, kèm lộ trình đến DEX spot đầy đủ

**Nền tảng đã chọn:** Sui + DeepBookV3 ([ADR-0001](adr/0001-sui-deepbook.md))

## 1. Introduction/Overview

WhaleDEX là một sàn giao dịch phi tập trung, không lưu ký tài sản, phục vụ cả người mới lẫn trader chuyên nghiệp. Sản phẩm cung cấp hai trải nghiệm trên cùng một nguồn thanh khoản order book:

- **Swap đơn giản:** người dùng nhập số lượng và giao dịch ngay theo giá thị trường.
- **Trade nâng cao:** người dùng xem sổ lệnh, đặt lệnh giới hạn, quản lý lệnh mở và chủ động cung cấp thanh khoản bằng lệnh maker.

Dự án hiện có monorepo TypeScript gồm Next.js 16, React 19, Fastify 5, package dùng chung, kiểm thử Vitest và chưa tích hợp blockchain. PRD này giữ nguyên nền tảng đó và sử dụng Sui + DeepBookV3 vì DeepBook là central limit order book (CLOB) gốc trên Sui, có SDK TypeScript, pool thị trường, market/limit order và `BalanceManager` sẵn có. MVP không viết smart contract riêng; ứng dụng ghép các giao dịch DeepBook bằng SDK và để ví người dùng ký qua dApp Kit hiện hành.

Trong tài liệu này, **pool** là một thị trường order-book cho một cặp tài sản trong DeepBook. Cung cấp thanh khoản nghĩa là đặt lệnh maker trên sổ lệnh, không phải gửi tài sản vào AMM để nhận LP token.

MVP được triển khai trên **Sui Testnet**, ưu tiên dịch vụ và endpoint miễn phí. Mainnet chỉ được mở sau khi hoàn tất tiêu chí an toàn, pháp lý và vận hành trong roadmap.

### Quyết định đầu vào

- Tầm nhìn: DEX đầy đủ gồm swap, thị trường/pool và quản lý thanh khoản.
- Cơ chế khớp lệnh: order book.
- Người dùng mục tiêu: mọi người dùng crypto.
- Phạm vi tài liệu: MVP chi tiết và roadmap dài hạn.
- Ràng buộc: ưu tiên làm miễn phí trước.
- Blockchain: Sui Testnet và DeepBookV3 đã được chấp thuận cho MVP trong ADR-0001.

## 2. Goals

- Cho phép người dùng hoàn thành một giao dịch swap spot trực tiếp từ coin trong ví trên Sui Testnet, không cần `BalanceManager`, từ lúc kết nối ví đến khi xem kết quả on-chain.
- Cho phép trader đặt, theo dõi và hủy lệnh giới hạn trên ít nhất một pool DeepBook Testnet.
- Cho phép người dùng tạo hoặc tái sử dụng một `BalanceManager`, nạp tài sản và rút tài sản về ví.
- Hiển thị minh bạch giá, độ sâu sổ lệnh, phí ước tính, gas, số lượng nhận được và trạng thái giao dịch trước khi người dùng ký.
- Duy trì mô hình không lưu ký: WhaleDEX không nhận seed phrase, private key hoặc ký giao dịch thay người dùng.
- Hoàn thành MVP mà không bắt buộc dịch vụ trả phí định kỳ hoặc giao dịch mainnet.
- Đạt đầy đủ các kiểm tra format, lint, typecheck, test và build của monorepo trước khi phát hành Testnet MVP.

## 3. Target Users

### Persona A: Người dùng swap phổ thông

Muốn đổi token nhanh, không cần hiểu cấu trúc sổ lệnh. Cần giao diện đơn giản, giải thích rõ phí và cảnh báo dễ hiểu.

### Persona B: Trader DeFi

Muốn xem bid/ask, spread, độ sâu, đặt limit order, theo dõi partial fill và hủy lệnh.

### Persona C: Nhà cung cấp thanh khoản/cá voi

Muốn đặt lệnh maker khối lượng lớn, tránh tự khớp lệnh, kiểm soát giá và theo dõi tài sản đang khả dụng, bị khóa hoặc đã khớp.

## 4. User Stories

### US-001: Cấu hình blockchain và schema dùng chung

**Description:** Là developer, tôi muốn cấu hình network, coin và pool được xác thực tập trung để web và API sử dụng cùng một hợp đồng dữ liệu.

**Acceptance Criteria:**

- [ ] Package `shared` có schema cho network, coin metadata, pool metadata, order book snapshot, trade, order và transaction status.
- [ ] Môi trường mặc định là Sui Testnet; không có private key hoặc secret trong biến `NEXT_PUBLIC_*`.
- [ ] Pool MVP dùng key/constant từ SDK thay vì hard-code package hoặc object ID trong component UI.
- [ ] Dữ liệu số nguyên on-chain không đi qua JavaScript `number` nếu có nguy cơ mất độ chính xác; dùng chuỗi hoặc `bigint` ở ranh giới phù hợp.
- [ ] Unit test xác nhận dữ liệu hợp lệ và từ chối network, coin, pool hoặc amount không hợp lệ.
- [ ] Typecheck/lint passes.

### US-002: Kết nối đến Sui và DeepBook

**Description:** Là developer, tôi muốn ứng dụng đọc dữ liệu Sui/DeepBook qua API hiện hành để tránh phụ thuộc vào giao thức RPC đã lỗi thời.

**Acceptance Criteria:**

- [ ] Tích hợp SDK chính thức `@mysten/sui` và `@mysten/deepbook-v3`.
- [ ] Kết nối ví React bằng `@mysten/dapp-kit-react`; không dùng package `@mysten/dapp-kit` legacy phụ thuộc JSON-RPC.
- [ ] Tất cả truy vấn mới dùng gRPC, GraphQL hoặc DeepBook Indexer; không thêm phụ thuộc JSON-RPC mới.
- [ ] API health trả riêng trạng thái ứng dụng và trạng thái upstream Sui/DeepBook, có timeout hữu hạn.
- [ ] Có adapter để thay endpoint/provider mà không đổi component UI.
- [ ] Test dùng mock adapter và không phụ thuộc mạng công khai.
- [ ] Typecheck/lint passes.

### US-003: Kết nối và ngắt kết nối ví

**Description:** Là người dùng, tôi muốn kết nối ví Sui để xem tài sản và ký giao dịch mà WhaleDEX không giữ khóa của tôi.

**Acceptance Criteria:**

- [ ] Nút Connect Wallet hiển thị khi chưa kết nối.
- [ ] Wallet selector chỉ hiển thị connector tương thích Sui được SDK hỗ trợ.
- [ ] Sau khi kết nối, UI hiển thị địa chỉ rút gọn, network và số dư SUI dùng cho gas.
- [ ] Người dùng có thể ngắt kết nối; UI xóa trạng thái phụ thuộc ví nhưng không xóa dữ liệu on-chain.
- [ ] Khi ví ở sai network, thao tác giao dịch bị khóa và có hướng dẫn chuyển sang Testnet.
- [ ] Ứng dụng không yêu cầu hoặc ghi log seed phrase/private key.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill or equivalent available browser tooling.

### US-004: Khám phá thị trường

**Description:** Là người dùng, tôi muốn xem các pool được hỗ trợ để chọn cặp tài sản cần giao dịch.

**Acceptance Criteria:**

- [ ] Trang Markets hiển thị ít nhất pool Testnet chính đã cấu hình, gồm base coin, quote coin, giá gần nhất và trạng thái dữ liệu.
- [ ] Người dùng có thể tìm theo symbol hoặc tên token.
- [ ] Chỉ pool trong allowlist cấu hình được phép giao dịch ở MVP.
- [ ] Trường hợp không có dữ liệu, dữ liệu trễ hoặc upstream lỗi có empty/error state khác nhau.
- [ ] Chọn một market điều hướng đến URL ổn định chứa pool key.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill or equivalent available browser tooling.

### US-005: Xem sổ lệnh và giao dịch gần nhất

**Description:** Là trader, tôi muốn xem bid, ask, spread và giao dịch gần nhất để đánh giá thanh khoản trước khi đặt lệnh.

**Acceptance Criteria:**

- [ ] Order book hiển thị tối thiểu 10 mức bid và 10 mức ask khi dữ liệu có sẵn.
- [ ] Mỗi mức hiển thị giá, số lượng tại mức và tổng số lượng tích lũy.
- [ ] UI hiển thị best bid, best ask, mid-price và spread tuyệt đối/phần trăm.
- [ ] Trades hiển thị giá, số lượng, phía taker và thời gian.
- [ ] Snapshot có timestamp; UI đánh dấu stale nếu vượt ngưỡng cấu hình.
- [ ] Cập nhật không làm mất lựa chọn hoặc nội dung đang nhập trong order form.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill or equivalent available browser tooling.

### US-006: Tạo và tái sử dụng BalanceManager

**Description:** Là trader, tôi muốn có một tài khoản giao dịch DeepBook để quản lý tài sản dùng cho limit order.

**Acceptance Criteria:**

- [ ] Ứng dụng tìm `BalanceManager` hiện có của địa chỉ trước khi đề nghị tạo mới.
- [ ] Nếu chưa có, UI giải thích mục đích và tạo đúng một manager sau khi người dùng xác nhận và ký.
- [ ] Object ID vừa tạo được lưu phía client theo network và owner để tái sử dụng.
- [ ] Khi indexer chưa đồng bộ, ứng dụng vẫn dùng object ID đã lưu và không tự động tạo manager thứ hai.
- [ ] UI hiển thị rõ số dư trong ví, số dư khả dụng trong manager, số dư bị khóa và số dư đã settle.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill or equivalent available browser tooling.

### US-007: Nạp tài sản vào BalanceManager

**Description:** Là trader, tôi muốn nạp token từ ví vào BalanceManager để đặt limit order.

**Acceptance Criteria:**

- [ ] Người dùng chọn coin được pool hỗ trợ và nhập amount lớn hơn 0, không vượt số dư ví.
- [ ] Khi nạp SUI, hệ thống giữ lại mức gas reserve cấu hình và không cho chọn Max vượt reserve.
- [ ] Màn hình review hiển thị coin, amount, manager ID, network và gas estimate trước khi ký.
- [ ] Sau finality, số dư ví và manager được refresh và hiển thị transaction digest.
- [ ] Lỗi thiếu số dư, faucet rate limit, từ chối ký và transaction failure có thông báo riêng.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill or equivalent available browser tooling.

### US-008: Rút tài sản về ví

**Description:** Là trader, tôi muốn rút tài sản đã settle khỏi BalanceManager để luôn kiểm soát tiền của mình.

**Acceptance Criteria:**

- [ ] Người dùng có thể rút một amount hợp lệ hoặc toàn bộ số dư khả dụng của từng coin.
- [ ] Không cho rút phần đang bị khóa trong open order; UI giải thích cần hủy/khớp lệnh trước.
- [ ] Màn hình review hiển thị recipient là địa chỉ ví đang kết nối.
- [ ] Sau finality, số dư ví và manager được refresh.
- [ ] Có link đến explorer bằng transaction digest.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill or equivalent available browser tooling.

### US-009: Swap theo giá thị trường

**Description:** Là người dùng phổ thông, tôi muốn swap token theo giá hiện tại mà không cần thao tác trực tiếp với sổ lệnh.

**Acceptance Criteria:**

- [ ] Tab Swap cho phép chọn chiều base/quote và nhập exact input amount.
- [ ] Swap sử dụng coin trực tiếp trong ví và không yêu cầu tạo, tìm hoặc nạp tiền vào `BalanceManager`.
- [ ] Preview được tính từ order book hiện tại và hiển thị estimated output, average execution price, price impact, fee asset, phí giao dịch và gas estimate.
- [ ] Người dùng cấu hình max slippage; mặc định MVP là 0,5% và hiển thị cảnh báo từ 1% trở lên.
- [ ] Nút Swap bị vô hiệu nếu không đủ số dư, không đủ gas, book rỗng, dữ liệu stale hoặc amount không hợp lệ.
- [ ] Giao dịch đặt `minOut` lớn hơn 0 từ preview cùng slippage đã chấp nhận; không cho review khi book rỗng hoặc output dưới minimum.
- [ ] WhaleDEX không cam kết giá preview là giá khớp cuối cùng; UI hiển thị thời điểm preview.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill or equivalent available browser tooling.

### US-010: Đặt limit order

**Description:** Là trader, tôi muốn đặt bid hoặc ask ở mức giá xác định để kiểm soát giá khớp.

**Acceptance Criteria:**

- [ ] Order form hỗ trợ Buy/Sell, price, quantity và order type `LIMIT` hoặc `POST_ONLY`.
- [ ] Price và quantity được validate/round theo `tickSize`, `lotSize` và `minSize` của pool; UI hiển thị giá trị sau khi round trước khi ký.
- [ ] `clientOrderId` là chuỗi số hợp lệ trong phạm vi `u64` và không trùng trong phạm vi owner/manager hiện tại.
- [ ] Self-matching mặc định dùng lựa chọn hủy taker hoặc cơ chế an toàn tương đương; không tự khớp im lặng.
- [ ] `POST_ONLY` giải thích rằng lệnh sẽ không được đặt nếu nó lập tức cross book.
- [ ] Preview hiển thị tổng giá trị, tài sản sẽ bị khóa, fee asset và gas estimate.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill or equivalent available browser tooling.

### US-011: Review và ký giao dịch

**Description:** Là người dùng, tôi muốn xem lại đầy đủ tác động tài chính trước khi ký để tránh gửi nhầm lệnh.

**Acceptance Criteria:**

- [ ] Modal review hiển thị network, pool, side, order type, price/estimated price, quantity, estimated total, fees, gas và manager ID nếu liên quan.
- [ ] Với market order khối lượng lớn hoặc price impact từ ngưỡng cấu hình, modal hiển thị cảnh báo nổi bật và yêu cầu xác nhận bổ sung.
- [ ] Nút Confirm chỉ khả dụng khi dữ liệu đầu vào vẫn còn hợp lệ và wallet vẫn đúng account/network.
- [ ] Thay đổi account, network hoặc pool đóng review và yêu cầu tạo preview mới.
- [ ] App chỉ gửi payload transaction tới ví; không nhận khóa ký.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill or equivalent available browser tooling.

### US-012: Theo dõi vòng đời giao dịch

**Description:** Là người dùng, tôi muốn biết giao dịch đang chờ ký, đã gửi, thành công hay thất bại để không gửi trùng.

**Acceptance Criteria:**

- [ ] UI có trạng thái `awaiting_signature`, `submitted`, `confirmed`, `failed` và `unknown`.
- [ ] Sau khi có digest, thao tác submit tương ứng bị khóa cho đến khi có kết quả hoặc người dùng chủ động dismiss trạng thái unknown.
- [ ] Thành công hiển thị digest, explorer link và thay đổi số dư/order liên quan.
- [ ] Thất bại hiển thị lý do đã chuẩn hóa và hành động thử lại an toàn.
- [ ] Reload trang không làm mất giao dịch đã submitted gần nhất trên cùng browser/network/account.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill or equivalent available browser tooling.

### US-013: Quản lý lệnh mở và lịch sử khớp

**Description:** Là trader, tôi muốn xem open orders, partial fills và lịch sử để quản lý vị thế spot.

**Acceptance Criteria:**

- [ ] Open Orders hiển thị order ID, side, price, original quantity, filled quantity, remaining quantity và thời gian.
- [ ] Filled, canceled và expired order không còn trong Open Orders sau khi dữ liệu được refresh.
- [ ] Người dùng có thể hủy một open order sau màn hình xác nhận.
- [ ] Partial fill hiển thị riêng phần đã khớp và phần còn lại.
- [ ] History phân biệt order history và trade/fill history.
- [ ] Khi indexer trễ, UI hiển thị trạng thái đang đồng bộ thay vì báo lệnh biến mất.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill or equivalent available browser tooling.

### US-014: Trải nghiệm miễn phí trên Testnet

**Description:** Là người thử nghiệm, tôi muốn có hướng dẫn lấy tài sản Testnet để dùng toàn bộ WhaleDEX mà không tiêu tiền thật.

**Acceptance Criteria:**

- [ ] Banner Testnet luôn hiển thị rõ rằng token không có giá trị thật.
- [ ] Onboarding dùng Sui faucet chính thức cho gas và token-request form DeepBook làm đường chính để lấy DEEP/quote asset.
- [ ] Swap SUI → DEEP trên `DEEP_SUI` chỉ là fallback khi quote đủ minimum và order book có thanh khoản; UI không hứa luồng này luôn hoạt động.
- [ ] Khi faucet hoặc token request bị giới hạn, UI giải thích trạng thái và dẫn tới hướng dẫn chính thức; không tự động gửi yêu cầu lặp lại.
- [ ] Checklist MVP-A gồm kết nối ví, chuyển Testnet, có gas và có token giao dịch; không yêu cầu `BalanceManager` cho swap.
- [ ] Checklist MVP-B bổ sung tạo/tái sử dụng `BalanceManager`, deposit, place order, cancel/fill và withdraw.
- [ ] Mỗi lát cắt xác nhận được ít nhất một luồng hoàn chỉnh trên pool Testnet cấu hình trước khi được đánh dấu hoàn thành.
- [ ] Không yêu cầu API key trả phí hoặc dịch vụ trả phí để chạy local và hoàn thành luồng kiểm thử chuẩn.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill or equivalent available browser tooling.

### US-015: Khả năng phục hồi và thông báo lỗi

**Description:** Là người dùng, tôi muốn lỗi được giải thích rõ và không làm tôi vô tình gửi giao dịch lặp lại.

**Acceptance Criteria:**

- [ ] Chuẩn hóa tối thiểu các lỗi: wallet rejected, wrong network, insufficient coin, insufficient gas, below minimum, off tick/lot, empty book, stale data, RPC timeout, indexer lag và on-chain abort.
- [ ] Mỗi lỗi có thông báo bằng ngôn ngữ người dùng và một hành động phù hợp; không hiển thị stack trace hoặc secret.
- [ ] Read request có retry giới hạn với backoff; write transaction không tự động gửi lại.
- [ ] API có timeout, rate limit và cache ngắn cho dữ liệu công khai phù hợp.
- [ ] Log có correlation ID nhưng không ghi địa chỉ đầy đủ nếu không cần thiết và không ghi payload nhạy cảm.
- [ ] Typecheck/lint passes.

### US-016: Telemetry tối thiểu và tôn trọng riêng tư

**Description:** Là product owner, tôi muốn biết funnel hoạt động ra sao mà không thu thập khóa hoặc dữ liệu không cần thiết.

**Acceptance Criteria:**

- [ ] Event schema gồm market_viewed, wallet_connected, order_previewed, signature_requested, transaction_submitted, transaction_confirmed và transaction_failed.
- [ ] Không event nào chứa seed phrase, private key, chữ ký, raw transaction hoặc số dư đầy đủ.
- [ ] Development có console/in-memory sink; không bắt buộc dịch vụ analytics trả phí.
- [ ] Có thể tắt telemetry bằng cấu hình.
- [ ] Test xác nhận các field bị cấm không xuất hiện trong event payload.
- [ ] Typecheck/lint passes.

### US-017: Kiểm thử end-to-end và release gate

**Description:** Là maintainer, tôi muốn có tiêu chí phát hành rõ ràng để Testnet MVP không được gắn nhãn sẵn sàng khi luồng tài chính chưa được kiểm chứng.

**Acceptance Criteria:**

- [ ] Unit/contract test bao phủ amount conversion, rounding tick/lot, schema parsing, transaction-state reducer và error mapping.
- [ ] Integration test dùng adapter giả cho Sui/DeepBook và kiểm chứng wallet-independent transaction construction.
- [ ] Testnet smoke checklist bao phủ connect, deposit, swap/market order, limit order, partial/full fill nếu khả thi, cancel và withdraw.
- [ ] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` và `pnpm build` đều pass.
- [ ] Không có mainnet endpoint/package ID trong cấu hình phát hành MVP.
- [ ] Verify in browser using dev-browser skill or equivalent available browser tooling.

## 5. Functional Requirements

- **FR-1:** Hệ thống phải mặc định chạy trên Sui Testnet trong MVP.
- **FR-2:** Hệ thống phải sử dụng DeepBookV3 làm matching/liquidity layer và không xây matching engine riêng trong MVP.
- **FR-3:** Hệ thống phải dùng SDK/PTB TypeScript để tích hợp; không yêu cầu publish Move package riêng trong MVP.
- **FR-4:** Hệ thống phải dùng gRPC, GraphQL hoặc DeepBook Indexer cho tích hợp mới; không xây mới trên JSON-RPC.
- **FR-4a:** Web phải dùng dApp Kit React hiện hành hỗ trợ gRPC/GraphQL; không thêm package dApp Kit legacy.
- **FR-5:** Web và API phải trao đổi qua schema đã xác thực trong package `shared`.
- **FR-6:** Hệ thống phải hỗ trợ kết nối/ngắt kết nối ví Sui và phát hiện account/network change.
- **FR-7:** WhaleDEX không được nhận, lưu hoặc log seed phrase/private key của người dùng.
- **FR-8:** Hệ thống phải có danh sách coin và pool allowlist theo từng network.
- **FR-9:** MVP phải hỗ trợ ít nhất một pool DeepBook Testnet có đủ tài sản thử nghiệm để hoàn thành smoke test.
- **FR-10:** Hệ thống phải hiển thị bid, ask, spread, depth và recent trades của pool đã chọn.
- **FR-11:** Dữ liệu thị trường phải có timestamp và trạng thái stale rõ ràng.
- **FR-12:** Hệ thống phải hỗ trợ swap exact-input trực tiếp từ coin trong ví, không yêu cầu `BalanceManager`, với `minOut` lớn hơn 0 theo slippage đã duyệt.
- **FR-13:** Preview swap phải hiển thị estimated output, average execution price, price impact, fee và gas.
- **FR-14:** Hệ thống phải hỗ trợ limit bid/ask và `POST_ONLY`.
- **FR-15:** Price/quantity phải tuân thủ tick size, lot size và minimum size lấy từ pool.
- **FR-15a:** Maker/taker fee, stake requirement và fee asset phải lấy từ dữ liệu pool/preview hiện hành; không hard-code theo một pool Testnet.
- **FR-16:** Mặc định phải ngăn self-matching bằng tùy chọn DeepBook phù hợp.
- **FR-17:** Hệ thống phải tìm và tái sử dụng `BalanceManager` trước khi tạo mới.
- **FR-18:** Hệ thống phải cho phép nạp token vào và rút token khỏi `BalanceManager`.
- **FR-19:** Hệ thống phải phân biệt số dư wallet, available, locked và settled.
- **FR-20:** Mọi write transaction phải có màn hình review trước khi gọi ví ký.
- **FR-21:** Hệ thống phải chặn submit khi dữ liệu stale, sai network, thiếu gas/tài sản hoặc input không hợp lệ.
- **FR-22:** Hệ thống phải theo dõi transaction từ yêu cầu chữ ký đến confirmed/failed/unknown.
- **FR-23:** Hệ thống không được tự động gửi lại write transaction sau lỗi mạng.
- **FR-24:** Hệ thống phải hiển thị open orders, partial fills, order history và trade history.
- **FR-25:** Người dùng phải hủy được từng open order.
- **FR-26:** Mọi giao dịch có digest phải liên kết được tới explorer đúng network.
- **FR-27:** Hệ thống phải chuẩn hóa lỗi blockchain/DeepBook thành thông báo có hành động xử lý.
- **FR-28:** Backend phải có timeout, rate limit và cache cho public read endpoints.
- **FR-29:** Luồng local/Testnet chuẩn không được bắt buộc dịch vụ có phí.
- **FR-30:** UI phải luôn phân biệt rõ Testnet và Mainnet.
- **FR-31:** Hệ thống phải hỗ trợ responsive layout từ 375 px; giao diện nâng cao được tối ưu cho desktop nhưng chức năng cốt lõi vẫn dùng được trên mobile.
- **FR-32:** Các control giao dịch phải dùng được bằng bàn phím, có label truy cập được và không chỉ dựa vào màu để truyền đạt trạng thái.

## 6. Non-Goals (Out of Scope for MVP)

- Không triển khai mainnet hoặc giao dịch tiền thật.
- Không viết matching engine/order-book smart contract riêng.
- Không tạo AMM pool, LP token, concentrated liquidity hoặc yield farming.
- Không tạo pool DeepBook permissionless từ giao diện ở MVP.
- Không hỗ trợ margin, leverage, perpetual, options hoặc prediction market.
- Không hỗ trợ cross-chain bridge hoặc multi-chain routing.
- Không hỗ trợ fiat on-ramp/off-ramp.
- Không có custodial account, email/password auth hoặc lưu private key.
- Không có token WhaleDEX, staking hoặc governance riêng.
- Không có referral, affiliate, trading competition hoặc rewards.
- Không cam kết mobile app native; MVP là web responsive.
- Không tự vận hành full node/indexer ở giai đoạn miễn phí.
- Không dùng thuật toán market-making tự động hoặc bot giao dịch thay người dùng.

## 7. Design Considerations

### Information architecture

- `/markets`: danh sách market/pool.
- `/trade/[poolKey]`: trang giao dịch với tab Swap và Limit.
- `/portfolio`: wallet balance, manager balance, open orders và history.
- `/learn/testnet`: onboarding lấy token test và giải thích mô hình BalanceManager.

### Simple mode

- Mặc định cho người dùng mới.
- Tập trung vào amount, token in/out, preview, slippage và nút Swap.
- Thuật ngữ DeepBook/BalanceManager được giải thích bằng tooltip và nội dung ngắn.

### Advanced mode

- Hiển thị order book, recent trades, limit order, POST_ONLY, open orders và balances.
- Không ẩn fee, gas, tick/lot rounding hoặc trạng thái partial fill.

### Safety UX

- Testnet dùng badge cố định và màu riêng.
- Cảnh báo price impact/giao dịch lớn phải xuất hiện trước ví ký.
- Các amount quan trọng hiển thị cả symbol và decimal hợp lý; giá trị raw không xuất hiện với người dùng.
- Không dùng thông báo “success” trước khi transaction confirmed.

## 8. Technical Considerations

### Architecture

```text
Sui Wallet
    ↕ ký PTB ở client
Next.js Web ── đọc dữ liệu ──> Fastify API/cache ──> Sui gRPC/GraphQL
    │                                      └──────> DeepBook Indexer
    └── @mysten/sui + @mysten/deepbook-v3
```

- Web sở hữu UX, wallet connection, transaction review và yêu cầu ví ký.
- API chủ yếu đọc, chuẩn hóa và cache market data; API không ký lệnh cho người dùng.
- Package `shared` định nghĩa schema/type cho các ranh giới API.
- Không thêm database ở MVP nếu dữ liệu order/history có thể đọc từ chain/indexer và pending transaction có thể giữ cục bộ.

### Lý do chọn Sui + DeepBookV3

- Phù hợp trực tiếp với lựa chọn CLOB/order book.
- Có sẵn market/limit order, pool, liquidity maker, fees và `BalanceManager`.
- Có SDK TypeScript nên phù hợp monorepo hiện tại.
- Có quy trình Testnet hoàn chỉnh với token thử nghiệm, cho phép phát triển trước không dùng tiền thật.
- Không cần publish/duy trì custom Move package cho MVP; giảm phạm vi bảo mật và chi phí ban đầu.

### RPC và dữ liệu

- Không dùng JSON-RPC cho code mới. Tài liệu Sui hiện yêu cầu chuyển sang gRPC hoặc GraphQL và DeepBook workflow hiện dùng `SuiGrpcClient`.
- Bao adapter cho endpoint để có thể chuyển từ endpoint công khai miễn phí sang provider trả phí khi traffic vượt giới hạn.
- Cache market catalog và metadata lâu hơn; order book/trades có TTL ngắn và phải hiển thị freshness.

### Số học tài chính

- Dùng base units dạng `bigint`/decimal-safe representation.
- Không thực hiện tính amount quan trọng bằng floating-point thuần.
- Rounding phải theo hướng an toàn cho người dùng và theo tick/lot/minimum của pool.
- Tất cả estimated values phải được gắn nhãn estimate.

### Security

- Tích hợp wallet theo mô hình non-custodial.
- Không cho arbitrary package/object ID từ query string đi thẳng vào transaction builder.
- Coin/pool allowlist là cấu hình phát hành và được validate.
- Hiển thị transaction intent rõ trước khi ký.
- Mainnet yêu cầu threat model, dependency review, audit phạm vi tích hợp và incident runbook.

### Free-first constraints

- Local development dùng endpoint Testnet công khai, DeepBook Indexer và faucet chính thức trong giới hạn hợp lý.
- Telemetry mặc định dùng sink local/in-memory.
- CI có thể chạy bằng local command trước; chọn free tier khi thêm provider CI.
- Hosting public demo chỉ được chọn nếu free tier đáp ứng; PRD không phụ thuộc một vendor cụ thể.
- Khi quota miễn phí không đủ, ứng dụng phải degrade có kiểm soát thay vì âm thầm trả dữ liệu cũ như mới.

## 9. Success Metrics

### MVP completion metrics

- MVP-A hoàn thành 100% luồng bắt buộc trên Testnet: connect, fund, direct-wallet swap và xác nhận kết quả.
- MVP-B hoàn thành 100% luồng bắt buộc trên Testnet: reuse/create manager, deposit, limit order, cancel hoặc fill, và withdraw.
- 100% write transaction có review screen và yêu cầu người dùng ký bằng ví.
- 0 private key/seed phrase được truyền tới API, log hoặc telemetry.
- 100% release checks (`format:check`, `lint`, `typecheck`, `test`, `build`) pass.
- 0 cấu hình mainnet được bật trong bản phát hành MVP.
- 0 dịch vụ trả phí bắt buộc cho local development và luồng Testnet chuẩn.

### Product quality targets

- Ít nhất 90% người thử nghiệm nội bộ hoàn thành một swap Testnet mà không cần hướng dẫn trực tiếp, trên mẫu tối thiểu 10 người.
- Ít nhất 80% người thử nghiệm hiểu khác biệt giữa wallet balance và BalanceManager sau onboarding, đo bằng câu hỏi kiểm tra ngắn.
- P95 thời gian hiển thị snapshot đầu tiên dưới 3 giây trong điều kiện endpoint Testnet hoạt động bình thường.
- 100% lỗi trong danh sách chuẩn hóa của US-015 hiển thị thông báo có hành động xử lý.
- Không có trường hợp UI báo confirmed khi chain chưa xác nhận giao dịch.

### Mainnet readiness gates

- Hoàn tất threat model và review bảo mật độc lập cho transaction construction.
- Có RPC/indexer SLA hoặc chiến lược nhiều provider phù hợp traffic dự kiến.
- Có monitoring, alerting, incident runbook và kill switch ở cấp UI/config.
- Có quyết định pháp lý về khu vực phục vụ, điều khoản sử dụng và token/pool policy.
- Có ít nhất hai đợt Testnet beta không phát hiện lỗi nghiêm trọng làm mất hoặc khóa tài sản ngoài ý muốn.

## 10. Roadmap

### Phase 0 — Foundation (đã có)

- Monorepo Next.js/Fastify/shared/config.
- Strict TypeScript, lint, format, test và build.
- Health endpoint cơ bản.

### Phase 1 — Free Testnet MVP

#### MVP-A — Swap

- Wallet Sui, market catalog, order book và recent trades.
- Swap trực tiếp từ ví, preview có `minOut`, fee asset và transaction lifecycle.
- Testnet onboarding, error handling và release gates tối thiểu.
- Chỉ allowlisted pools; không custom contract, database hoặc paid infrastructure bắt buộc.

#### MVP-B — Giao dịch nâng cao

- BalanceManager, deposit, withdraw và phân biệt settled/locked balance.
- Limit/POST_ONLY order, self-match protection, open orders, fills và cancel.
- History, telemetry local và hardening cần thiết cho public Testnet beta.

MVP-B chỉ bắt đầu sau khi MVP-A hoàn thành smoke test xuyên suốt trên pool Testnet đã cấu hình.

### Phase 2 — Public Testnet Beta

- Mở rộng cặp giao dịch và UX mobile.
- Watchlist, reusable preferences và export trade history.
- Batch cancel/cancel-all và công cụ maker cơ bản.
- Load testing, multiple read providers, hosted monitoring và security review.
- Đánh giá permissionless pool creation nhưng chưa bật mặc định.

### Phase 3 — Mainnet Spot Launch

- Mainnet configuration, verified token/pool registry và production RPC/indexer.
- Compliance/terms, incident response, analytics và support workflow.
- Fee/revenue model nếu có, được hiển thị minh bạch trong preview.
- Permissionless pool creation chỉ mở sau threat model và policy review.

### Phase 4 — Full Product Vision

- Liquidity-provider dashboard, batch order management và advanced order controls.
- zkLogin hoặc onboarding thân thiện hơn cho người mới nếu phù hợp mô hình custody.
- Margin/prediction market chỉ là nhánh nghiên cứu riêng với PRD và risk framework riêng.
- Multi-chain hoặc bridge chỉ được xem xét sau khi spot product trên Sui đạt product-market fit.

## 11. Open Questions

1. Pool Testnet đầu tiên sẽ là `DEEP_SUI` hay một pool khác có nguồn token và độ sâu phù hợp tại thời điểm smoke test?
2. “DEX đầy đủ” có yêu cầu tạo pool permissionless ngay ở mainnet launch hay chỉ giao dịch/cung cấp thanh khoản trên pool có sẵn?
3. WhaleDEX có thu interface fee ở mainnet không? Nếu có, mức phí và địa chỉ nhận phí là gì?
4. Khu vực địa lý nào được phép truy cập mainnet, và có cần geo-block/sanctions screening không?
5. Token/pool allowlist do ai quản trị và quy trình xác minh token giả mạo là gì?
6. Có cần chart nến trong MVP-B không, hay order book/recent trades đủ cho bản đầu?
7. Có cần hỗ trợ nhiều `BalanceManager` cho một ví trong UI nâng cao không? MVP-B mặc định tái sử dụng một manager.
8. Ngưỡng cảnh báo “giao dịch lớn” nên dựa trên USD, phần trăm độ sâu hay price impact?

## 12. References

- [Sui DeepBook overview](https://docs.sui.io/onchain-finance/deepbook)
- [DeepBookV3 integration models and SDK](https://docs.sui.io/onchain-finance/deepbook/deepbookv3/deepbook)
- [DeepBookV3 design](https://docs.sui.io/onchain-finance/deepbook/deepbookv3/design)
- [DeepBook fees and funding](https://docs.sui.io/onchain-finance/deepbook/deepbookv3/fees-and-funding)
- [DeepBook Testnet spot workflow](https://docs.sui.io/onchain-finance/deepbook/deepbookv3/spot-workflow)
- [Sui SDKs and RPC migration notice](https://docs.sui.io/references/sui-sdks)

## 13. PRD Completion Checklist

- [x] Đã hỏi 5 câu hỏi làm rõ với lựa chọn bằng chữ cái.
- [x] Đã đưa câu trả lời của người dùng vào quyết định và phạm vi.
- [x] User stories nhỏ, cụ thể và có acceptance criteria kiểm chứng được.
- [x] Mọi UI story đều yêu cầu xác minh trong browser; dùng dev-browser skill hoặc công cụ browser tương đương đang khả dụng.
- [x] Functional requirements được đánh số và viết không mơ hồ.
- [x] Non-goals xác định ranh giới MVP.
- [x] Có success metrics, roadmap và open questions.
- [x] Tài liệu được lưu tại `docs/prd-whaledex.md` bằng định dạng Markdown và được liên kết từ README.
