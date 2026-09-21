# WhaleDEX — Lộ trình DEX đa mạng EVM

## 1. Định hướng và hiện trạng

WhaleDEX hướng tới DEX spot không lưu ký trên **5 mainnet: BNB Smart Chain (BSC), Ethereum, Base, Polygon PoS và Arbitrum One**, cùng **Ethereum Sepolia** để phát triển và kiểm thử. Tổng cộng có **6 mạng** trong cấu hình mục tiêu.

Lộ trình tham khảo tài liệu người dùng cung cấp, “Web3 Wallet — Ví Web3 đa chain kèm DEX engine tự viết”: dùng chung hợp đồng quote, routing engine Uniswap V3 trên Sepolia, adapter aggregator trên mainnet, Transaction Center và quản lý quyền chi tiêu. Đây là kế hoạch, không phải mô tả tính năng đã hoàn thành.

**Quyết định hiện hành:** [PRD EVM 2.0](prd-whaledex.md), [ADR-0002](adr/0002-evm-multichain.md) và bộ [Chapter 3](chapter-3/README.md) thống nhất phạm vi này. [ADR-0001](adr/0001-sui-deepbook.md) chỉ là lịch sử đã bị thay thế. DESIGN ở root còn cần đồng bộ các màn hình đặc thù giao thức trước khi dùng cho EVM UI.

Codebase hiện có Next.js 16, React 19, Fastify 5, TypeScript strict, pnpm/Turborepo, Zod và bộ kiểm tra. Commit `a13203e` đã thêm registry immutable 6 chain, schema/env validation, API `GET /v1/chains` và web `chains`/`defaultChain`. API còn có `GET /health`; frontend vẫn là trang tĩnh. Chưa có wallet, RPC transport/fallback thực thi, token registry, routing, approval, swap, history, database/indexer, CI hoặc deployment. RPC metadata chưa chứng minh endpoint đang hoạt động.

API dùng `DEFAULT_CHAIN_ID`, web dùng `NEXT_PUBLIC_DEFAULT_CHAIN_ID`, mặc định `11155111`; cần cấu hình đồng nhất khi deploy, web lấy giá trị trước build. Token/spender allowlist, capability và cờ bật giao dịch bên dưới vẫn là kế hoạch.

## 2. Ma trận mạng mục tiêu

| Mạng                  | Loại    | Chain ID   | Native gas token | Explorer               |
| --------------------- | ------- | ---------- | ---------------- | ---------------------- |
| BNB Smart Chain (BSC) | Mainnet | `56`       | BNB              | `bscscan.com`          |
| Ethereum              | Mainnet | `1`        | ETH              | `etherscan.io`         |
| Base                  | Mainnet | `8453`     | ETH              | `basescan.org`         |
| Polygon PoS           | Mainnet | `137`      | POL              | `polygonscan.com`      |
| Arbitrum One          | Mainnet | `42161`    | ETH              | `arbiscan.io`          |
| Ethereum Sepolia      | Testnet | `11155111` | Sepolia ETH      | `sepolia.etherscan.io` |

Nguồn đối chiếu registry: [BSC](https://github.com/ethereum-lists/chains/blob/master/_data/chains/eip155-56.json), [Ethereum](https://github.com/ethereum-lists/chains/blob/master/_data/chains/eip155-1.json), [Base](https://github.com/ethereum-lists/chains/blob/master/_data/chains/eip155-8453.json), [Arbitrum One](https://github.com/ethereum-lists/chains/blob/master/_data/chains/eip155-42161.json), [Sepolia](https://github.com/ethereum-lists/chains/blob/master/_data/chains/eip155-11155111.json) và [Polygon network details](https://docs.polygon.technology/pos/reference/rpc-endpoints).

Quy tắc cấu hình:

- “ARB” là mạng Arbitrum One; gas trả bằng ETH. Polygon là Polygon PoS, gas trả bằng POL.
- Sepolia là Ethereum Sepolia, không phải Base Sepolia hoặc Arbitrum Sepolia.
- Mỗi chain có RPC chính/dự phòng, explorer, native/wrapped token, token allowlist, router/spender allowlist và cờ bật đọc/giao dịch riêng.
- Dev/staging mặc định Sepolia. Production có 5 mainnet; chế độ testnet được phân biệt rõ.
- Swap thực hiện trong từng mạng. Bridge và swap xuyên mạng chưa thuộc phạm vi.
- Thêm mạng vào selector chưa đủ để coi là hỗ trợ: phải có quote, allowance, simulation, receipt và bằng chứng kiểm thử.
- Có thể rollout từng mainnet theo mức sẵn sàng; mục tiêu hoàn thành vẫn là đủ 5 mạng, bao gồm Base.

## 3. Phạm vi phát hành

### MVP-A — Swap trên Ethereum Sepolia

- Kết nối ví ngoài, chọn mạng, đọc số dư native/ERC-20 và token allowlist.
- Routing engine tự viết dựa trên Uniswap V3: tìm route, lấy quote, đánh giá output và dựng transaction.
- Preview route, output dự kiến, minimum received, phí và gas ước tính.
- Approve nếu cần, review, simulation, ký swap và theo dõi receipt.
- Transaction Center lưu metadata và khôi phục giao dịch pending sau reload.
- Permit là bước tối ưu sau khi approve/swap cơ bản ổn định.

“Engine tự viết” là lớp tìm route, đánh giá quote và dựng calldata trên giao thức có sẵn; chưa bao gồm tự viết AMM, router contract hoặc matching engine.

### MVP-B — Swap trên 5 mainnet

- Dùng chung schema quote và UI cho BSC, Ethereum, Base, Polygon PoS, Arbitrum One.
- Hướng tham khảo: aggregator adapter cho mainnet; LI.FI là ứng viên cần kiểm chứng theo chain/token và điều kiện API trước khi chốt.
- Chỉ chấp nhận route cùng chain; từ chối response cross-chain.
- Kiểm tra chain, target, spender, recipient, value và ràng buộc đầu ra trước khi ký calldata từ nguồn ngoài.
- Price impact, USD valuation hoặc dữ liệu phí chưa biết phải hiển thị chưa có dữ liệu; không thay bằng số 0.
- Lịch sử, quyền chi tiêu và revoke gắn với chain/account cụ thể.

### Sau MVP

Có thể mở rộng tài sản, gửi/nhận, NFT, command palette và ví in-app. Ví tự lưu khóa cần đặc tả, threat model, review bảo mật và kiểm thử vòng đời khóa riêng; MVP swap dùng ví ngoài.

Chưa thuộc MVP: bridge, cross-chain swap, margin, perpetual, farming, token riêng, matching engine, limit order/CLOB riêng và quản lý vị thế LP. Không chuyển nguyên luồng BalanceManager của DeepBook sang EVM.

## 4. Kiến trúc mục tiêu

```text
Ví EVM ngoài
  ↕ kết nối, xác nhận và ký tại client
Next.js Web
  ├── Network selector + Wallet + Swap + Transaction Center
  ├── Public RPC client: balance, allowance, simulation, receipt
  └── Fastify API
        ├── Chain/token registry + validation + cache
        ├── Mainnet quote adapter → aggregator được chọn
        ├── Sepolia quote adapter → routing engine → EVM RPC
        └── History/allowance discovery → provider theo chain

packages/shared: schema chain, token, quote, route, transaction và error
```

- Web quản lý wallet và transaction intent; API không nhận private key, ký hoặc gửi giao dịch thay người dùng.
- Đánh giá wagmi, viem, wallet UI connector và query cache theo hướng mẫu; xác minh phiên bản tương thích stack hiện tại trước khi thêm dependency.
- Provider wallet/query/transaction đặt ở layout ổn định để giao dịch không mất khi đổi tab/route.
- Engine tách logic thuần khỏi React. API cung cấp quote và unsigned transaction request; client kiểm chứng trước khi yêu cầu ký.
- RPC có timeout, fallback và kiểm tra `eth_chainId`; không tự gửi lại write transaction qua nhiều endpoint.
- Cache và định danh token gắn chain + address; native token có kiểu riêng. Registry chứa deployment được xác minh, không hard-code trong component.
- API key máy chủ lưu ở backend. Chỉ công khai identifier/key được provider thiết kế cho browser với giới hạn domain/quota phù hợp.
- Giữ `apps/web`, `apps/api`, `packages/shared`, `packages/config`; chỉ thêm package hoặc indexer khi có nhu cầu thực tế.

Cấu trúc mở rộng dự kiến:

```text
apps/web/src/features/     # wallet, assets, swap, allowances, transactions
apps/web/src/lib/          # chain config, public client, API client, format
apps/api/src/modules/      # chains, tokens, quotes, history
apps/api/src/adapters/     # RPC, aggregator, explorer/indexer
apps/api/src/routing/      # path, pools, quoter, scoring, calldata
packages/shared/src/      # schema portable và số học dùng chung
```

## 5. Quote và engine Uniswap V3 trên Sepolia

Quote dự kiến gồm `quoteId`, `chainId`, account/recipient, tokenIn/tokenOut, amountIn, amountOut, minimumAmountOut, route, source, timestamp, expiresAt và input fingerprint. Approval request và transaction request có schema riêng.

- Amount trong JSON là chuỗi base units; phép tính dùng `bigint` hoặc decimal-safe.
- Phân biệt approval spender và transaction target; không giả định hai địa chỉ luôn giống nhau.
- Price impact, USD valuation và gas valuation có thể là `null`, kèm nguồn hoặc lý do thiếu dữ liệu.
- Đổi chain/account/recipient/token/amount/slippage làm quote và permit cũ mất hiệu lực. TTL/debounce/refetch là cấu hình cần đo.

Backlog engine:

- [ ] Xác minh factory, quoter, router, wrapped native và Multicall deployment qua tài liệu giao thức và bytecode.
- [ ] Xác minh test token, decimals và thanh khoản; không sao chép địa chỉ mẫu thành deployment mặc định.
- [ ] Sinh route một/hai chặng qua connector allowlist; lọc trùng, vòng lặp và pool không tồn tại.
- [ ] Xác minh fee tiers; giới hạn route count, batch size, concurrency và timeout.
- [ ] Batch quote xử lý lỗi từng route, so sánh trên block context nhất quán.
- [ ] Xếp hạng output ròng sau gas khi có tỷ giá native/tokenOut đáng tin cậy; công bố fallback khi thiếu tỷ giá.
- [ ] Đọc pool state để tính giá tham chiếu, xử lý token ordering, decimals và multi-hop bằng số học chính xác.
- [ ] Phân biệt phí LP và price impact bằng định nghĩa có test; không coi spot price của pool là giá thị trường độc lập.
- [ ] Dựng exact-input calldata với minimum output, recipient, deadline và wrap/unwrap đúng ABI router.
- [ ] Test native value, nhận native đầu ra và hoàn phần dư nếu router yêu cầu.

Không cam kết 36 route, 3 vòng RPC, overhead 46.000 gas hoặc gas limit cộng 80.000 như bản mẫu. Phải đo và ước tính từ transaction thực tế theo chain/provider.

## 6. Approval, permit và simulation

Luồng nền: quote → allowance → approve nếu thiếu → chờ receipt → đọc lại allowance → làm mới quote → review → simulate → ký swap.

- Approve đúng spender đã xác minh, ưu tiên số lượng cần dùng. Token yêu cầu reset allowance về 0 có luồng riêng.
- Permit là tối ưu tùy capability token/router/wallet, có fallback approve rõ ràng.
- Kiểm tra domain, owner, spender, value, nonce và deadline; đọc lại nonce trước ký và hủy chữ ký khi intent thay đổi. Tham khảo [ERC-2612](https://eips.ethereum.org/EIPS/eip-2612).
- Không mặc định mọi token hỗ trợ selfPermit hoặc chèn permit vào calldata aggregator chưa hiểu cấu trúc.
- Không kết luận permit luôn thất bại chỉ vì account có bytecode: [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) cho phép EOA có delegation code. Cần test capability thực tế.
- Simulation dùng đúng from/to/data/value sẽ gửi. Sau approval vẫn cần làm mới quote và simulate lại.
- State override chỉ thử nghiệm khi RPC hỗ trợ và storage layout đã xác minh; không dò slot tùy ý cho mọi ERC-20 hoặc coi override là allowance thật.
- Phân biệt simulation thành công, revert và chưa xác minh. Revert chặn ký; lỗi hạ tầng không được coi là thành công. Mặc định yêu cầu thử lại/đổi RPC trước ký nếu chưa xác minh được.
- Không tự retry giao dịch ghi khi chưa biết lần gửi trước đã được chấp nhận hay chưa.

## 7. Transaction Center và quản lý quyền

Transaction Center quản lý approve, swap, revoke và send nếu triển khai, tồn tại ngoài từng màn hình nghiệp vụ.

- ID nội bộ ổn định; lưu chainId, account, nonce khi có và danh sách original/replacement hash.
- Tra cứu bằng chain + hash; speed-up/cancel thay hash phải giữ liên kết với intent gốc.
- Trạng thái: chờ ký, đã gửi, pending, confirmed, reverted, replaced/cancelled và unknown.
- Pending quá TTL chuyển sang cần kiểm tra/unknown; không kết luận dropped chỉ theo thời gian.
- Persist metadata để khôi phục watcher; không lưu permit signature hoặc secret trong log/history.
- Refresh balance/allowance/history/quote đúng chain/account sau receipt và chính sách xác nhận của chain.
- Confirmation/finality phải cấu hình riêng theo mạng; không dùng một số block cho mọi mainnet.

Allowance discovery kết hợp Approval logs và spender allowlist rồi đọc lại allowance on-chain. UI phải thể hiện giới hạn pagination, lịch sử quét và provider coverage. Revoke là `approve(spender, 0)`, chỉ báo thành công sau receipt. Kiểm chứng nguồn dữ liệu cho Base/BSC thay vì kế thừa bảng hỗ trợ trong bản mẫu.

## 8. Lộ trình triển khai

### Giai đoạn 0 — Phạm vi, baseline và cấu hình

- [x] Đồng bộ tài liệu trong docs và ghi ADR-0002 thay thế quyết định cũ.
- [ ] Đồng bộ phần thiết kế đặc thù giao thức trong DESIGN và liên kết tài liệu ở README root.
- [ ] Chạy format, lint, typecheck, test, build và thiết lập CI theo lockfile hiện có.
- [x] Thêm registry/schema 6 chain, default chain env validation và Turbo env inputs (`a13203e`).
- [ ] Thêm runtime RPC health/fallback, token/deployment registry và capability/release flags.
- [ ] Kiểm chứng wallet SDK, mainnet quote provider, deployment Sepolia và nguồn test token.
- [ ] Lập bảng capability theo chain: RPC, quote, allowance, simulation, explorer/history và release status.

Nghiệm thu: cấu hình tách mainnet/testnet, baseline checks xanh, có nguồn dữ liệu thực tế và các quyết định còn mở được ghi rõ.

### Giai đoạn 1 — Wallet và dữ liệu tài sản

- [ ] Connect/disconnect, account/network change và từ chối chuyển mạng.
- [ ] Native/ERC-20 balances, token selector và gas token đúng chain.
- [ ] Đổi mạng vô hiệu quote/permit cũ; pending transaction tiếp tục được theo dõi ở chain gốc.
- [ ] Dùng chuẩn typography/accessibility trong DESIGN còn phù hợp; đồng bộ các luồng EVM khi cập nhật thiết kế.

Nghiệm thu: chọn đủ 6 mạng, dữ liệu không lẫn chain/account; chain chưa bật swap có thông báo rõ và không mở ví ký nhầm chain.

### Giai đoạn 2 — Swap Sepolia bằng engine tự viết

- [ ] Route generation, quote, scoring, calldata và test số học.
- [ ] Approval, review, simulation và Transaction Center.
- [ ] Swap native/ERC-20 trên cặp đã xác minh thanh khoản.
- [ ] Test thiếu gas, stale quote, không có route, từ chối ký và revert.

Nghiệm thu: connect → quote → approve nếu cần → review → sign → receipt thành công, đối chiếu số dư. Không báo thành công chỉ vì có hash.

### Giai đoạn 3 — Tích hợp đủ 5 mainnet

- [ ] Adapter quote chung cho BSC, Ethereum, Base, Polygon PoS và Arbitrum One.
- [ ] Xác minh deployment/spender/token và calldata validation từng chain.
- [ ] Test local fork cố định block cho mỗi mainnet; CI không gửi tài sản thật.
- [ ] Lịch sử, allowance/revoke và lỗi upstream theo chain.
- [ ] Bật giao dịch/kill switch theo chain, monitoring và smoke test phát hành trong phạm vi vận hành được duyệt.

Nghiệm thu: cả 5 mainnet đạt checklist quote → approval → review/simulation → submission → receipt, có bằng chứng kiểm thử và release status riêng. Sepolia thành công không thay thế kiểm chứng từng mainnet.

### Giai đoạn 4 — Permit và củng cố production

- [ ] Permit trên token/router đủ capability; test nonce/domain/deadline và fallback approve.
- [ ] Test replacement, cancel, reload, RPC outage, quote stale và receipt/reorg thay đổi.
- [ ] Review CSP/security headers, calldata, dependencies, secrets và API limits.
- [ ] Test mobile, keyboard, zoom 200%, reduced motion và lỗi từng widget/route.
- [ ] Monitoring, runbook, rollback ứng dụng và xử lý sự cố giao dịch.

Nghiệm thu: không còn lỗi nghiêm trọng đã biết trong luồng tài sản; release checks xanh và tắt riêng được chain/provider lỗi.

### Giai đoạn 5 — Mở rộng

Gửi/nhận, portfolio nâng cao, NFT hoặc ví in-app triển khai theo đặc tả riêng. Engine tự viết có thể mở rộng sang mainnet sau khi đánh giá chất lượng route/chi phí; aggregator vẫn là adapter độc lập với UI.

## 9. API và dữ liệu dự kiến

| Endpoint                                          | Mục đích                                         |
| ------------------------------------------------- | ------------------------------------------------ |
| `GET /health`                                     | Liveness hiện có                                 |
| `GET /ready`                                      | Dependency readiness theo môi trường             |
| `GET /v1/chains`                                  | 6 chain và capability/release status             |
| `GET /v1/tokens?chainId=...`                      | Token allowlist và metadata                      |
| `POST /v1/quotes/swap`                            | Same-chain quote và unsigned transaction request |
| `GET /v1/transactions/:hash?chainId=...`          | Transaction status nếu UI cần API proxy          |
| `GET /v1/wallets/:address/history?chainId=...`    | Lịch sử có cursor và nguồn dữ liệu               |
| `GET /v1/wallets/:address/allowances?chainId=...` | Discovery best-effort và mức độ đầy đủ           |

`GET /health` và `GET /v1/chains` đã triển khai; endpoint chains hiện trả `defaultChainId` và metadata, chưa có capability/release status. Các endpoint khác là dự kiến. Chỉ triển khai thêm endpoint có UI sử dụng. Schema chain đã có; schema address, amount, recipient, slippage và request limits còn cần triển khai. API không nhận private key hoặc tự ký. Error dự kiến có mã ổn định, thông báo tiếng Việt hữu ích và request ID; không trả stack trace/secret. Chưa thêm database/indexer riêng khi provider hiện có vẫn đáp ứng.

## 10. Kiểm thử và release gate

| Lớp              | Kịch bản ưu tiên                                                                   |
| ---------------- | ---------------------------------------------------------------------------------- |
| Unit             | Base units, decimals, path encoding, rounding, slippage, gas conversion, freshness |
| Routing          | Token ordering, route lỗi từng phần, output ròng, thiếu tỷ giá, calldata           |
| Wallet/UI        | Account/chain change, quote race, review, từ chối ký                               |
| Transaction      | Approval, permit nonce/domain, receipt revert, replacement, cancel, reload         |
| API              | Schema, chain allowlist, timeout, cache isolation, rate limit                      |
| Fork integration | Deployment, spender, quote, simulation trên từng mainnet                           |
| E2E              | Wallet → quote → approve → swap → receipt trên production build                    |

CI dùng fixture/mock và local chain/fork được cấu hình; public RPC phục vụ smoke test riêng. E2E cần fixture quote/simulation và một luồng swap hoàn chỉnh, không chỉ navigation. Mock không chứng minh thanh khoản/deployment thực tế.

Giữ các lệnh repository:

```sh
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Chỉ thêm script E2E/fork khi có cấu hình tương ứng. Không đổi sang npm ci hoặc hạ framework theo bản mẫu.

Definition of Done: acceptance criteria đạt, loading/empty/stale/error đầy đủ, UI được kiểm chứng nếu liên quan, test theo rủi ro đạt, tài liệu/config đồng bộ và có commit nguyên tử. Phần chưa kiểm chứng không được đánh dấu đã hỗ trợ.

## 11. Việc bắt đầu ngay và lưu ý từ bản mẫu

1. Hoàn thiện baseline/CI và đồng bộ DESIGN cùng các liên kết README root với bộ tài liệu EVM trong docs.
2. Chọn wallet SDK, mainnet quote source và provider theo capability thực tế, có Base.
3. Xác minh deployment/token/liquidity Sepolia, chốt engine V3 một/hai chặng.
4. Dùng registry đã có để xây RPC transport, wallet connection và network selector.
5. Hoàn thành swap Sepolia có receipt, rồi kiểm chứng/rollout đủ 5 mainnet.
6. Thêm permit và tính năng ví mở rộng sau khi approve/swap ổn định.

Bản mẫu là đầu vào thiết kế, không phải bằng chứng WhaleDEX có 119 test, engine hoàn chỉnh hay số liệu gas đã đo. Địa chỉ, faucet, gas, provider coverage và hạn mức miễn phí phải kiểm tra lại khi triển khai. Tham khảo [LI.FI API overview](https://docs.li.fi/api-reference/introduction) khi đánh giá adapter; không mặc định API luôn miễn phí hoặc có đủ route trên mọi chain.
