# ADR-0003: Trở lại Sui và DeepBookV3 cho spot DEX MVP

- **Trạng thái:** Accepted
- **Ngày:** 2026-09-29
- **Thay thế:** [ADR-0002](0002-evm-multichain.md)
- **Phạm vi:** WhaleDEX Testnet MVP

## Bối cảnh

ADR-0002 chuyển WhaleDEX sang EVM đa mạng và một routing engine trên Ethereum Sepolia. Sau khi làm rõ mục tiêu, sản phẩm cần spot trading dạng order book với market/limit order, trải nghiệm Pro Terminal và mô hình không lưu ký. Triển khai đồng thời Sui và EVM làm tăng gấp đôi bề mặt wallet, transaction, indexer và kiểm thử trong khi chưa có giao thức EVM cụ thể được chốt.

DeepBookV3 đã cung cấp CLOB on-chain phù hợp trực tiếp với mục tiêu. Codebase vẫn chưa có blockchain integration, nên thay đổi hướng ở thời điểm này tránh được migration dữ liệu/tài sản và giảm phạm vi xây matching engine.

## Quyết định

1. MVP chỉ hỗ trợ **Sui Testnet**; Sui Mainnet cần quyết định phát hành riêng.
2. **DeepBookV3** là matching và liquidity layer cho spot trading.
3. Dùng `@mysten/sui`, `@mysten/dapp-kit-react` và `@mysten/deepbook-v3` hiện hành.
4. Code đọc mới dùng gRPC/GraphQL hoặc DeepBook indexer phù hợp, không xây mới trên JSON-RPC legacy.
5. Người dùng ký bằng ví Sui; WhaleDEX không nhận khóa và backend không ký thay.
6. Sui/DeepBook là nguồn sự thật; Fastify/PostgreSQL chỉ cung cấp cache và read model dẫn xuất khi cần.
7. Không tự xây matching engine, AMM hoặc Move trading package trong MVP.
8. Registry EVM/Sepolia hiện có là code legacy cần được thay bằng cấu hình Sui trong lát cắt triển khai đầu tiên.
9. Giữ một ranh giới adapter nội bộ hợp lý, nhưng không triển khai hoặc hiển thị EVM trong MVP.

## Hệ quả tích cực

- Khớp trực tiếp với yêu cầu order book, market/limit order và Pro Terminal.
- Giảm phạm vi bảo mật so với tự viết protocol hoặc engine.
- Stack TypeScript hiện tại có SDK chính thức phù hợp.
- Có thể kiểm thử end-to-end bằng token Testnet không có giá trị thật.

## Đánh đổi và rủi ro

- Phụ thuộc deployment, SDK, endpoint và thanh khoản Testnet của Sui/DeepBook.
- Wallet/tooling Sui khác EVM; registry và test hiện tại phải được thay đổi.
- Testnet price/liquidity không đại diện cho thị trường thật.
- WhaleDEX là ứng dụng DEX xây trên DeepBook, không phải một matching protocol độc lập.

## Ngoài phạm vi quyết định

- Không phê duyệt Sui Mainnet hoặc tài sản có giá trị thật.
- Không phê duyệt EVM, multi-chain, bridge, margin, perpetual hoặc prediction market.
- Không phê duyệt token/interface fee của WhaleDEX.
- Không phê duyệt pool creation tùy ý trong UI.

Các hạng mục trên cần PRD/ADR và release gate riêng nếu được mở lại.
