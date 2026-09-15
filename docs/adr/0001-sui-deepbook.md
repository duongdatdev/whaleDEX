# ADR-0001: Sử dụng Sui và DeepBookV3 cho Testnet MVP

- **Trạng thái:** Accepted
- **Ngày quyết định:** 2026-09-15
- **Phạm vi:** WhaleDEX Testnet MVP

## Bối cảnh

WhaleDEX cần một lớp thanh khoản spot dạng central limit order book (CLOB), hỗ trợ swap đơn giản và trải nghiệm giao dịch nâng cao mà không giữ private key của người dùng. Codebase hiện tại là monorepo TypeScript với Next.js và Fastify, chưa có blockchain integration.

Các hướng đã cân nhắc gồm tích hợp AMM trên EVM, tự triển khai smart contract/order book, hoặc tích hợp một CLOB có sẵn. Việc duy trì matching engine hoặc smart contract riêng làm tăng đáng kể phạm vi bảo mật và vận hành của MVP.

## Quyết định

Testnet MVP sử dụng:

- **Sui Testnet** làm blockchain.
- **DeepBookV3** làm matching và liquidity layer cho spot trading.
- `@mysten/sui`, `@mysten/deepbook-v3` và dApp Kit React hiện hành để đọc dữ liệu, tạo transaction và kết nối ví.
- SDK/PTB integration, không publish Move package riêng trong MVP.
- gRPC, GraphQL hoặc DeepBook Indexer cho code đọc dữ liệu mới; không xây mới trên JSON-RPC legacy.
- Pool và coin allowlist theo network, dùng SDK key/config đã xác thực.

MVP-A ưu tiên swap trực tiếp từ coin trong ví, không yêu cầu `BalanceManager`. MVP-B mới bổ sung `BalanceManager`, deposit/withdraw và limit order.

## Hệ quả

### Tích cực

- Phù hợp trực tiếp với yêu cầu order book, market/limit order và maker liquidity.
- SDK TypeScript phù hợp stack hiện tại.
- Không phải xây và audit matching engine hoặc Move package riêng cho MVP.
- Có thể kiểm thử bằng tài sản Testnet trước khi cân nhắc mainnet.

### Đánh đổi và rủi ro

- Phụ thuộc vào contract, SDK, public endpoint và indexer của hệ sinh thái Sui/DeepBook.
- Thanh khoản và nguồn token Testnet có thể không ổn định.
- `BalanceManager` tạo thêm khái niệm cần giải thích cho người dùng nâng cao.
- Mainnet sẽ cần provider, monitoring, threat model, review pháp lý và quy trình ứng phó riêng.

## Không thuộc quyết định này

- Không chấp thuận mainnet launch.
- Không chấp thuận margin, prediction market, bridge hoặc multi-chain.
- Không chấp thuận permissionless pool creation trong UI.
- Không chấp thuận interface fee hoặc token WhaleDEX.

Các hạng mục trên cần PRD/ADR riêng nếu được đưa vào phạm vi sau này.
