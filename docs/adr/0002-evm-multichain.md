# ADR-0002: EVM đa mạng và engine routing Sepolia

- **Trạng thái:** Superseded — được thay thế bởi [ADR-0003](0003-sui-deepbook-mvp.md) ngày 2026-09-29.
- **Ngày:** 2026-09-21.
- **Thay thế:** [ADR-0001](0001-sui-deepbook.md).
- **Nguồn quyết định:** người dùng yêu cầu BSC, Ethereum, Base, Polygon, Arbitrum và Ethereum Sepolia; cung cấp tài liệu tham khảo Web3 Wallet + DEX engine.

## Bối cảnh

> Tài liệu lịch sử: quyết định dưới đây không còn là phạm vi triển khai hiện hành. Xem [ADR-0003](0003-sui-deepbook-mvp.md) cho quyết định Sui Testnet + DeepBookV3.

WhaleDEX chuyển sang swap spot đa mạng EVM. Stack Next.js/Fastify/TypeScript và monorepo pnpm hiện tại được giữ. Registry 6 chain, env validation và GET /v1/chains đã có ở commit a13203e; các chức năng giao dịch chưa có.

## Quyết định

1. Hỗ trợ BSC 56, Ethereum 1, Base 8453, Polygon PoS 137 và Arbitrum One 42161; dùng Ethereum Sepolia 11155111 cho testnet.
2. Sepolia là default hiện tại. Mainnet có release gate riêng, không tự bật giao dịch khi thêm registry.
3. MVP-A xây engine routing Uniswap V3 một/hai chặng trên Sepolia, dùng contract hiện hữu được xác minh; không tự xây AMM/router contract/matching engine.
4. MVP-B dùng quote adapter cho 5 mainnet, chung schema/UI; LI.FI là ứng viên, chưa chốt nhà cung cấp.
5. Chỉ same-chain swap. Ví ngoài ký tại client; API không nhận khóa hoặc ký thay người dùng.
6. Approval riêng là luồng nền; permit chỉ thêm theo token/router/account capability sau khi luồng nền ổn định.
7. Shared registry/schema là nguồn cấu hình; dữ liệu/cache/history phải gắn chain/account. Native gas là BNB trên BSC, POL trên Polygon, ETH trên Ethereum/Base/Arbitrum, Sepolia ETH trên Sepolia.

## Hệ quả

Có thể tái sử dụng UI, quote contract và Transaction Center giữa các mạng. Cần kiểm chứng adapter/deployment, decimals, phí gas, RPC và confirmation policy riêng; test Sepolia không chứng minh mainnet hoạt động. Provider có thể thiếu route, bị giới hạn quota hoặc không hỗ trợ một số token.

Các luồng Sui/DeepBook/BalanceManager và CLOB không chuyển sang EVM MVP. DESIGN ở root còn cần đồng bộ trước khi triển khai các màn hình đặc thù giao thức. Các tài liệu trong docs dùng [PRD 2.0](../prd-whaledex.md) và [roadmap](../DOCS.md) mới.

## Quyết định còn mở

RPC và wallet SDK/version; mainnet quote/history provider; token allowlist; ABI/deployment; confirmation policy; slippage/deadline/gas limits và vận hành. Chi tiết nằm trong DEP-01..DEP-07 của PRD.

## Ngoài phạm vi

Bridge/cross-chain swap, limit order riêng, LP management, custody hoặc ví in-app, NFT và mainnet launch tự động. Mainnet nằm trong đích sản phẩm nhưng vẫn cần bằng chứng release từng chain.
