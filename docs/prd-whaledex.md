# PRD: WhaleDEX — Spot DEX trên Sui

**Phiên bản:** 3.0

**Cập nhật:** 2026-09-29

**Trạng thái:** Phạm vi MVP đã được chốt; tích hợp blockchain chưa được triển khai.

**Quyết định kiến trúc:** [ADR-0003](adr/0003-sui-deepbook-mvp.md)

**Thứ tự triển khai:** [Roadmap](DOCS.md)

## 1. Tóm tắt sản phẩm

WhaleDEX là ứng dụng spot DEX không lưu ký trên Sui. Người dùng kết nối ví Sui, xem thị trường DeepBookV3, đặt market/limit order và tự ký mọi giao dịch ảnh hưởng đến tài sản.

DeepBookV3 cung cấp thanh khoản, sổ lệnh và khớp lệnh on-chain. WhaleDEX cung cấp trải nghiệm giao dịch, kiểm tra intent, trình bày giá/phí, theo dõi giao dịch, lịch sử và dữ liệu danh mục. Backend không giữ private key, không ký thay người dùng và không phải nguồn sự thật về số dư.

MVP chỉ chạy trên **Sui Testnet**. Sui Mainnet, EVM, bridge, cross-chain, margin và perpetual không nằm trong phạm vi phát hành này.

## 2. Bằng chứng hiện tại

| Năng lực                                              | Trạng thái                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| Monorepo Next.js 16, React 19, Fastify 5, TypeScript  | Đã có                                                                          |
| Landing page và design system                         | Đã có trên nhánh giao diện, chưa phải ứng dụng giao dịch hoàn chỉnh            |
| Health API, shared schema/config và test nền tảng     | Đã có                                                                          |
| Registry EVM/Sepolia                                  | Đã có trong code nhưng là kiến trúc cũ, phải thay trong lát cắt triển khai Sui |
| Sui wallet, gRPC client, DeepBookV3, balances, orders | Chưa triển khai                                                                |
| Indexer, database, deployment và CI                   | Chưa triển khai                                                                |

Tài liệu mô tả mục tiêu đã chấp thuận, không phải bằng chứng tính năng đã hoạt động. Source code, schema và test là nguồn sự thật về trạng thái triển khai.

## 3. Mục tiêu

- **G-01:** Hoàn thành luồng kết nối ví → xem thị trường → review → ký → xác nhận market order trên Sui Testnet.
- **G-02:** Hỗ trợ limit order, open orders và cancel order qua DeepBookV3.
- **G-03:** Người dùng luôn nhận biết đây là Testnet, token không có giá trị thật và trạng thái submitted khác confirmed.
- **G-04:** Đảm bảo non-custodial: WhaleDEX không nhận seed phrase/private key và không có quyền rút tài sản của người dùng.
- **G-05:** Thiết lập test và release evidence đủ để cân nhắc Sui Mainnet bằng một quyết định riêng.

## 4. Người dùng mục tiêu

- Người học và thử nghiệm spot trading bằng token Testnet.
- Người dùng ví Sui muốn trải nghiệm swap/market order đơn giản.
- Người dùng nâng cao muốn xem order book và dùng limit order.

Các nhóm này là giả thuyết sản phẩm, chưa phải kết quả nghiên cứu người dùng đã được xác minh.

## 5. Phạm vi MVP

### Trong phạm vi

- Sui Testnet duy nhất; không có network selector đa chain.
- Kết nối/ngắt ví Sui bằng dApp Kit hiện hành.
- Hiển thị địa chỉ, SUI gas balance và các coin được allowlist.
- Danh sách pool/market DeepBook đã được xác minh.
- Order book, best bid/ask, last price và trạng thái dữ liệu.
- Market order với quote/preflight, giới hạn giá và review trước khi ký.
- Limit order, post-only khi SDK/protocol hỗ trợ, open orders và cancel.
- BalanceManager/deposit/withdraw chỉ khi cần cho luồng DeepBook đã chọn.
- Transaction digest, trạng thái và link Sui Explorer.
- Lịch sử/biểu đồ từ dữ liệu on-chain hoặc indexer; dữ liệu dẫn xuất không thay thế on-chain state.

### Ngoài phạm vi

- Sui Mainnet launch hoặc giao dịch tiền thật.
- Ethereum Sepolia, EVM mainnet và multi-chain.
- Tự xây matching engine, AMM hoặc Move package giao dịch riêng.
- Bridge/cross-chain, margin, perpetual, prediction market, farming và NFT.
- Token WhaleDEX, fiat on-ramp, ví giữ seed phrase và cam kết lợi nhuận.
- Tạo pool tùy ý hoặc import coin không có allowlist trong UI MVP.

## 6. Hành trình chính

1. Người dùng mở ứng dụng và thấy banner Sui Testnet.
2. Người dùng kết nối ví; ứng dụng xác minh network và account hiện tại.
3. Ứng dụng tải coin balance, pool metadata và order book từ nguồn đã cấu hình.
4. Người dùng chọn market, phía mua/bán, loại lệnh và số lượng.
5. WhaleDEX kiểm tra tick size, lot size, balance, gas reserve, giá/phí và transaction freshness.
6. Người dùng xem lại intent rồi ký bằng ví.
7. WhaleDEX lưu digest, theo dõi kết quả và chỉ báo thành công khi chain xác nhận.
8. Sau xác nhận, ứng dụng làm mới balance, orders, fills và history liên quan.

## 7. Functional requirements

| ID            | Yêu cầu                                                                                           | Mốc                    |
| ------------- | ------------------------------------------------------------------------------------------------- | ---------------------- |
| FR-NETWORK-01 | Chỉ cho phép Sui Testnet trong MVP; sai mạng phải chặn ký và có hướng dẫn khắc phục               | MVP                    |
| FR-WALLET-01  | Kết nối/ngắt ví Sui bên ngoài; không nhận hoặc lưu khóa bí mật                                    | MVP                    |
| FR-WALLET-02  | Account/network change vô hiệu dữ liệu dẫn xuất cũ nhưng không làm mất watcher giao dịch đã gửi   | MVP                    |
| FR-MARKET-01  | Chỉ hiển thị pool/coin đã xác minh bằng coin type và object/package ID                            | MVP                    |
| FR-BALANCE-01 | Đọc balance đúng decimals và tách wallet balance với trading-account balance nếu có               | MVP                    |
| FR-BOOK-01    | Hiển thị order book và best bid/ask cùng freshness; không thay dữ liệu thiếu bằng số giả          | MVP                    |
| FR-ORDER-01   | Validate side, type, amount, price, tick size, lot size, balance và gas trước khi tạo transaction | MVP                    |
| FR-ORDER-02   | Market order có quote/preflight và giới hạn thực thi; quote stale không được ký                   | MVP                    |
| FR-ORDER-03   | Limit/post-only order hiển thị rõ giá, quantity, time-in-force khả dụng và phí                    | MVP                    |
| FR-ORDER-04   | Open orders, partial fills và cancel phản ánh trạng thái on-chain                                 | MVP                    |
| FR-ASSET-01   | Deposit/withdraw yêu cầu owner signature và review coin/amount/destination                        | Khi cần BalanceManager |
| FR-TX-01      | Phân biệt awaiting-signature, submitted, confirmed, failed, rejected và unknown                   | MVP                    |
| FR-TX-02      | Theo dõi digest qua reload và liên kết đúng Sui Explorer                                          | MVP                    |
| FR-HISTORY-01 | History/fills có cursor, nguồn và freshness; indexer chỉ là dữ liệu dẫn xuất                      | Beta                   |
| FR-PRICE-01   | Giá thực thi lấy từ DeepBook; giá oracle chỉ là tham chiếu và phải được gắn nhãn                  | Beta                   |

## 8. Yêu cầu phi chức năng

| ID            | Yêu cầu và cách kiểm chứng                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| NFR-SEC-01    | Không nhận/lưu/log seed phrase, private key hoặc raw signing secret; review API, storage và logs         |
| NFR-SEC-02    | Allowlist network, package/object ID, pool và coin type; negative integration tests                      |
| NFR-DATA-01   | Amount on-chain dùng `bigint`/integer string; test decimals, rounding, tick và lot boundaries            |
| NFR-REL-01    | Read có retry giới hạn; không tự retry transaction ghi khi chưa biết lần gửi trước đã được nhận hay chưa |
| NFR-A11Y-01   | Điều khiển bàn phím, visible focus, label và live status cho wallet/order/transaction                    |
| NFR-OBS-01    | Error code ổn định, request ID và log đã redacted; có RPC/network diagnostics                            |
| NFR-PERF-01   | Đo p50/p95 cho market refresh và transaction preflight trước khi đặt SLA                                 |
| NFR-COMPAT-01 | Ma trận trình duyệt, ví Sui và RPC/gRPC được kiểm thử trước release                                      |

## 9. Kiến trúc được chấp thuận

```text
Sui Wallet
    │ ký transaction
    ▼
Next.js web
    ├── @mysten/dapp-kit-react
    ├── @mysten/sui (SuiGrpcClient)
    └── @mysten/deepbook-v3
              │
              ▼
       DeepBookV3 / Sui Testnet
              │ events/reads
              ▼
 Fastify cache/index API → PostgreSQL (khi cần)
```

- Web tạo và gửi transaction thông qua ví của người dùng.
- DeepBook/Sui là nguồn sự thật cho tài sản, lệnh và settlement.
- API chỉ cung cấp public reads, cache, index/history và telemetry.
- PostgreSQL chỉ được thêm khi một use case UI cần index/history; không lưu số dư chính thức.
- MVP không publish Move package riêng.
- Code mới dùng gRPC/GraphQL hoặc DeepBook indexer phù hợp; không xây mới trên JSON-RPC legacy.

## 10. Dependency và quyết định còn mở

| ID     | Nội dung                                            | Điều kiện đóng                                               |
| ------ | --------------------------------------------------- | ------------------------------------------------------------ |
| DEP-01 | Sui RPC/gRPC provider và fallback                   | Smoke test, quota và failure policy được ghi nhận            |
| DEP-02 | DeepBook deployment, pool và coin allowlist Testnet | Đối chiếu SDK/config chính thức và transaction thử           |
| DEP-03 | Faucet và nguồn token thử nghiệm                    | Luồng onboarding tái lập được, không yêu cầu mua token       |
| DEP-04 | Wallet compatibility                                | Kiểm thử ít nhất các ví mục tiêu và trường hợp từ chối       |
| DEP-05 | Market-order price limit, gas reserve và freshness  | Có test biên và UX review                                    |
| DEP-06 | Nguồn chart/history                                 | Đánh giá direct reads so với indexer trước khi thêm database |

## 11. Release gate

MVP Testnet chỉ được xem là hoàn thành khi:

- Market và limit order chạy end-to-end bằng token Testnet.
- Cancel, rejection, insufficient balance/gas, stale data và RPC failure có test.
- Không còn lỗi nghiêm trọng đã biết trong luồng tài sản.
- Người dùng luôn thấy network, coin type/symbol, price/quantity, phí và digest trước/sau khi ký.
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` và `pnpm build` đạt.
- Tài liệu và trạng thái triển khai được cập nhật; tính năng chưa có không được mô tả như đã hoạt động.

Sui Mainnet cần PRD/ADR, threat model, operational plan, legal review và release evidence riêng.

## 12. Nguồn kỹ thuật

- [Sui documentation](https://docs.sui.io/)
- [Sui dApp Kit](https://sdk.mystenlabs.com/dapp-kit)
- [Sui dApp Kit React setup](https://sdk.mystenlabs.com/dapp-kit/getting-started/react)
- [DeepBook TypeScript SDK](https://www.npmjs.com/package/@mysten/deepbook-v3)
