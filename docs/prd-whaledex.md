# PRD: WhaleDEX — DEX đa mạng EVM

**Phiên bản:** 2.0 — cập nhật theo định hướng EVM của người dùng ngày 2026-09-21.

**Trạng thái:** Phạm vi mạng đã xác định; thiết kế tích hợp, deployment, token và provider còn cần kiểm chứng. Tài liệu không chứng minh đã sẵn sàng phát hành mainnet.

**Quyết định kiến trúc:** [ADR-0002](adr/0002-evm-multichain.md). **Thứ tự triển khai:** [Roadmap](DOCS.md). **Bộ học tập và truy vết:** [Chapter 3](chapter-3/README.md).

## 1. Tổng quan và bằng chứng hiện tại

WhaleDEX là DEX spot không lưu ký, hỗ trợ swap trong từng mạng EVM. MVP-A dùng engine routing Uniswap V3 tự viết trên Ethereum Sepolia. MVP-B đưa cùng luồng swap lên BSC, Ethereum, Base, Polygon PoS và Arbitrum One qua quote adapter mainnet. LI.FI là ứng viên tham khảo, chưa phải provider đã chốt.

Engine tự viết thực hiện tìm route, báo giá, đánh giá output sau gas khi đủ dữ liệu và dựng calldata trên giao thức có sẵn. Không đồng nghĩa tự viết AMM, router contract hoặc matching engine.

| Năng lực                                                                              | Trạng thái và bằng chứng                                                          |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Monorepo Next.js 16/React 19, Fastify 5, shared/config                                | Đã có; xem package manifests và source trong apps/packages                        |
| Trang chủ tĩnh                                                                        | Đã có: `apps/web/src/app/page.tsx`                                                |
| Health và chain catalog                                                               | Đã có: `apps/api/src/app.ts`, `GET /health`, `GET /v1/chains`                     |
| Registry 6 chain và schema                                                            | Đã có: `packages/shared/src/chains.ts`                                            |
| Default chain/env validation                                                          | Đã có: `apps/api/src/env.ts`, `apps/web/src/env.ts`, `apps/web/src/lib/chains.ts` |
| Test registry, env và endpoint                                                        | Đã có trong các file test tương ứng; commit `a13203e`                             |
| Wallet, RPC client/fallback thực thi, token registry, routing, approve, swap, history | Chưa triển khai                                                                   |
| CI, deployment, database/indexer                                                      | Chưa triển khai                                                                   |

Registry chứa danh sách RPC public có thứ tự; chưa có kiểm tra sức khỏe endpoint hoặc đảm bảo khả dụng tại runtime. Việc endpoint trả 6 chain không chứng minh có 6 luồng swap hoạt động.

## 2. Mạng và môi trường

| Mạng                  | Chain ID   | Gas token   | Môi trường |
| --------------------- | ---------- | ----------- | ---------- |
| BNB Smart Chain (BSC) | `56`       | BNB         | Mainnet    |
| Ethereum              | `1`        | ETH         | Mainnet    |
| Base                  | `8453`     | ETH         | Mainnet    |
| Polygon PoS           | `137`      | POL         | Mainnet    |
| Arbitrum One          | `42161`    | ETH         | Mainnet    |
| Ethereum Sepolia      | `11155111` | Sepolia ETH | Testnet    |

Sepolia mặc định trong mọi môi trường hiện tại. API dùng `DEFAULT_CHAIN_ID`, web dùng `NEXT_PUBLIC_DEFAULT_CHAIN_ID`; cần cấu hình cùng giá trị khi triển khai, web lấy giá trị trước build. Schema từ chối ID ngoài allowlist và input rỗng/sai định dạng. Việc tự động đối chiếu config web/API chưa triển khai.

ARB nghĩa là Arbitrum One, không phải gas token ARB. Testnet duy nhất trong phạm vi là Ethereum Sepolia. Không thêm Base Sepolia, Arbitrum Sepolia hoặc Polygon Amoy vào cấu hình phát hành này.

## 3. Mục tiêu, người dùng và phạm vi

- **G-01:** Hoàn thành exact-input swap Sepolia từ kết nối ví đến receipt thành công có đối chiếu số dư.
- **G-02:** Người dùng hiểu network, token identity, quyền spender, minimum received và trạng thái giao dịch.
- **G-03:** Có kiểm thử tái lập và bằng chứng để triển khai từng chain.
- **G-04:** Cung cấp cùng luồng swap trên đủ 5 mainnet, tách trạng thái triển khai theo chain.

Nhóm người dùng dự kiến: người thử nghiệm Sepolia và người dùng ví EVM muốn swap spot trên các mạng được hỗ trợ. Đây là phân khúc cần xác thực; chưa có nghiên cứu người dùng hoặc số liệu sử dụng được chứng minh trong repository.

### MVP-A: Ethereum Sepolia

Wallet ngoài; native/ERC-20 balances; token allowlist; routing V3 một/hai chặng; quote; approval; review/simulation; swap; Transaction Center và phục hồi sau reload. Permit bổ sung sau khi luồng approve ổn định.

### MVP-B: 5 mainnet

Mainnet adapter dùng chung schema quote/UI; kiểm chứng provider, spender và calldata từng chain; lịch sử và allowance/revoke; local fork tests; monitoring và cờ bật giao dịch từng mạng. Mainnet nằm trong phạm vi sản phẩm, nhưng chỉ bật giao dịch sau nghiệm thu riêng.

### Ngoài MVP

Bridge/cross-chain swap, exact-output, engine chia lệnh nhiều route, limit order/CLOB riêng, quản lý vị thế LP, farming, margin, perpetual, token riêng, fiat và ví tự lưu seed/private key. NFT, gửi/nhận và ví in-app là mở rộng có đặc tả riêng. Engine có thể đánh giá nhiều route ứng viên nhưng bản đầu chọn một route để thực thi.

## 4. User stories và tiêu chí nghiệm thu

Các ID dưới đây thay bộ US-001..US-017 cũ; bộ FR/NFR ở mục 5–6 là mã truy vết chung cho toàn thư mục docs.

### US-NETWORK-01 — Dùng đúng mạng

Là người dùng, tôi muốn biết mạng đang chọn và chỉ ký trên đúng mạng đó.

- [x] Registry đủ 6 chain, mặc định Sepolia, có gas token/explorer/public RPC URLs.
- [x] API chain catalog và env validation dùng chung schema.
- [ ] Network selector, wallet switch và kiểm tra chain trước ký.
- [ ] Chain chưa bật giao dịch không cho submit; đổi chain vô hiệu quote/permit cũ.
- [ ] Pending transaction tiếp tục được theo dõi trên chain gốc sau khi đổi mạng.

### US-WALLET-01 — Kết nối ví và xem số dư

- [ ] Connect/disconnect ví EVM ngoài; không hỏi seed phrase/private key.
- [ ] Đổi account làm mới balance/allowance và hủy intent cũ.
- [ ] Hiển thị native/ERC-20 balances theo decimals và đúng chain/account.
- [ ] Thiếu ví, từ chối kết nối, sai mạng và lỗi RPC có hành động khắc phục riêng.

### US-QUOTE-01 — Đọc báo giá có ràng buộc

- [ ] Chỉ token thuộc allowlist của chain; phân biệt symbol trùng bằng địa chỉ.
- [ ] Chặn amount rỗng, âm, 0, vượt precision/số dư và cặp cùng token.
- [ ] Quote gắn chain/account/recipient/token/amount/slippage/deployment, fingerprint và thời hạn.
- [ ] Hiển thị output, minimum received, route, phí, gas và freshness; optional data thiếu dùng null/unavailable.
- [ ] Response cũ không thay quote của input mới; quote hết hạn không được dùng để ký.

### US-ROUTING-01 — Chọn route Sepolia

- [ ] Deployment V3, ABI, token và liquidity được xác minh trước smoke test.
- [ ] Sinh route một/hai chặng có giới hạn; route lỗi không làm hỏng toàn batch.
- [ ] So sánh block context nhất quán; xử lý token ordering và decimals chính xác.
- [ ] Chấm output ròng sau gas khi có tỷ giá đáng tin cậy; công bố fallback nếu không có.
- [ ] Calldata có minimum output, recipient, deadline và native value/wrap/unwrap phù hợp ABI.

### US-APPROVAL-01 — Cấp đúng quyền

- [ ] Đọc allowance theo chain/token/owner/spender, phân biệt spender với transaction target.
- [ ] Hiển thị spender và amount trước approve; ưu tiên amount cần cho swap.
- [ ] Hỗ trợ reset về 0 khi token yêu cầu; sau receipt đọc allowance và refresh quote.
- [ ] Revoke có review và chỉ báo thành công sau receipt.

### US-SWAP-01 — Review, ký và theo dõi

- [ ] Kiểm tra chain/account, target, spender, recipient, value, deadline và minimum output trước ký.
- [ ] Mô phỏng đúng transaction sẽ gửi; revert chặn ký, unknown yêu cầu thử lại/đổi RPC theo chính sách hiện tại.
- [ ] Không tự retry write transaction sau timeout.
- [ ] Transaction Center lưu ID intent ổn định, chain/account và hash lineage để xử lý replacement/cancel.
- [ ] Receipt thành công và chính sách xác nhận của chain mới cho phép báo confirmed; timeout chỉ là unknown.
- [ ] Reload khôi phục watcher, cập nhật balance/allowance đúng account/chain.

### US-MAINNET-01 — Cùng trải nghiệm trên 5 mainnet

- [ ] Adapter hỗ trợ BSC/Ethereum/Base/Polygon PoS/Arbitrum One; có ma trận capability thực tế.
- [ ] Chỉ yêu cầu và chấp nhận same-chain route.
- [ ] Provider response được validate; không đề nghị ký target/spender chưa xác minh.
- [ ] Mỗi chain có bằng chứng fork test, deployment verification và release checklist trước khi bật.

### US-PERMIT-01 — Tối ưu cấp quyền sau MVP-A

- [ ] Xác minh token/router/account capability và domain/nonce/deadline trước khi ký.
- [ ] Đổi intent làm signature cũ mất hiệu lực; không persist signature vào history/log.
- [ ] Có fallback approve; không suy capability chỉ từ việc account có bytecode.

## 5. Functional requirements chuẩn

| ID              | Yêu cầu                                                                                         | Mốc           |
| --------------- | ----------------------------------------------------------------------------------------------- | ------------- |
| FR-CONFIG-01    | Registry immutable đúng 6 chain; Sepolia mặc định, schema/env validation và API catalog         | Đã triển khai |
| FR-NETWORK-01   | Selector/wallet/transaction cùng chain; chặn mạng không hỗ trợ hoặc chưa bật giao dịch          | MVP-A/B       |
| FR-WALLET-01    | Kết nối/ngắt ví ngoài không nhận khóa                                                           | MVP-A         |
| FR-WALLET-02    | Account/chain change vô hiệu state dẫn xuất và không mất pending watcher cũ                     | MVP-A         |
| FR-TOKEN-01     | Token allowlist định danh chain + address, native có kiểu riêng                                 | MVP-A/B       |
| FR-BALANCE-01   | Đọc số dư đúng decimals, account và chain                                                       | MVP-A         |
| FR-INPUT-01     | Validate amount/cặp token trước quote                                                           | MVP-A         |
| FR-QUOTE-01     | Fingerprint/context version và bỏ response cũ                                                   | MVP-A         |
| FR-QUOTE-02     | Quote có expected/minimum output, route, phí, freshness, expiry; optional metrics nullable      | MVP-A         |
| FR-QUOTE-03     | Chặn quote hết hạn hoặc khác context/deployment                                                 | MVP-A         |
| FR-ROUTING-01   | Engine V3 Sepolia một/hai chặng có kiểm chứng deployment và số học                              | MVP-A         |
| FR-APPROVAL-01  | Kiểm tra allowance đúng spender, review trước approve                                           | MVP-A         |
| FR-APPROVAL-02  | Approve amount cần dùng, reset nếu cần, đọc lại allowance và refresh quote                      | MVP-A         |
| FR-SWAP-01      | Validate intent/calldata và simulation trước yêu cầu ký                                         | MVP-A/B       |
| FR-TX-01        | Phân biệt chờ ký, submitted/pending, confirmed, reverted, rejected, replaced/cancelled, unknown | MVP-A         |
| FR-TX-02        | Phục hồi theo chain/account/intent/hash lineage sau reload                                      | MVP-A         |
| FR-TX-03        | Refresh dữ liệu liên quan sau kết quả được xác nhận                                             | MVP-A         |
| FR-EXPLORER-01  | Link transaction dùng explorer của chain gốc                                                    | MVP-A         |
| FR-MAINNET-01   | Cùng schema quote và same-chain validation cho đủ 5 mainnet                                     | MVP-B         |
| FR-ALLOWANCE-01 | Discovery nêu rõ coverage và revoke theo receipt                                                | MVP-B         |
| FR-PERMIT-01    | Permit tùy capability, kiểm tra nonce/domain/deadline, fallback approve                         | Sau MVP-A     |

Các ID là nguồn chung cho [PRD học tập](chapter-3/whaledex-mvp-prd.md), [bài thực hành](chapter-3/practical-lab.md) và [traceability matrix](chapter-3/traceability-matrix.md). Không dùng một ID cho hai hành vi khác nhau.

## 6. Yêu cầu phi chức năng

| ID            | Yêu cầu và phương pháp kiểm chứng                                                    |
| ------------- | ------------------------------------------------------------------------------------ |
| NFR-SEC-01    | Không nhận/lưu/log seed, private key hoặc permit signature; review storage/log/API   |
| NFR-SEC-02    | Deployment/target/spender theo allowlist mỗi chain; negative integration tests       |
| NFR-DATA-01   | Amount JSON là integer string; bigint/decimal-safe và test biên/rounding             |
| NFR-A11Y-01   | Bàn phím, visible focus, label, live region và trạng thái có text; browser review    |
| NFR-REL-01    | Async race không làm lẫn chain/account; read retry giới hạn, write không tự retry    |
| NFR-OBS-01    | Stable error code/request ID, redacted logs, freshness và provider/chain diagnostics |
| NFR-COMPAT-01 | Có browser/wallet/RPC capability matrix được kiểm thử trước release                  |
| NFR-PERF-01   | Đo p50/p95 quote/refresh và đặt ngưỡng theo provider; không bịa SLA                  |

Không thêm database/indexer khi provider đủ đáp ứng. Dữ liệu thiếu/chậm có loading/empty/stale/error riêng; không thay thiếu price impact bằng 0 hoặc hiển thị dữ liệu giả như thật.

## 7. Kiến trúc và dữ liệu

Web quản lý wallet, intent/review và Transaction Center. API cung cấp public reads, quote adapters, validation/cache và dữ liệu history. Shared chứa schema portable; không chứa provider secret. RPC client/fallback sẽ được xây từ registry hiện có.

Schema quote và RPC transport chưa triển khai. Hợp đồng dự kiến phải có chainId, account, recipient, tokens, amount, slippage, minimum output, quoteId/fingerprint/expiry, route/source và unsigned request. Spender và target là hai trường riêng. Native token không được gán một contract ERC-20 giả.

Engine sử dụng giá tham chiếu pool để đánh giá route; không mặc định spot price là giá thị trường độc lập. Calldata và gas phải kiểm chứng theo ABI/deployment thật. Các số route, gas overhead, token address và storage slot trong tài liệu tham khảo không phải cấu hình đã chấp nhận.

## 8. UX, success metrics và rollout

Các màn hình dự kiến: Swap, Assets, Activity và Allowances với network selector chung. Chi tiết URL/tab được quyết định khi đồng bộ DESIGN ở root; các màn hình Sui/BalanceManager/CLOB cũ không áp dụng cho EVM MVP. UI tiếng Việt, thông báo ngắn và có hành động khắc phục; pending state không biến mất khi đổi màn hình.

Tiêu chí kỹ thuật: 100% luồng P0 và negative scenarios của mốc phát hành đạt kiểm thử; MVP-A có swap Sepolia được đối chiếu receipt/số dư; MVP-B có bằng chứng riêng cho 5 mainnet. Không còn lỗi nghiêm trọng đã biết ở luồng tài sản trước khi bật chain. Ngưỡng hiệu năng và tỷ lệ hoàn thành usability là mục tiêu cần đo, chưa phải kết quả đạt được.

Rollout: cấu hình/baseline → wallet/tài sản → engine + swap Sepolia → mainnet adapters/fork tests → bật từng mainnet → permit/hardening. Tất cả 5 mainnet thuộc đích triển khai; thay đổi tài liệu không tự bật giao dịch tài sản thật.

## 9. Quyết định còn mở

| ID     | Nội dung                                                                        | Vai trò phụ trách     | Cần trước          |
| ------ | ------------------------------------------------------------------------------- | --------------------- | ------------------ |
| DEP-01 | RPC provider, fallback, chain health và confirmation/finality policy từng chain | Engineering           | RPC client/release |
| DEP-02 | Mainnet aggregator và khả năng same-chain quote của 5 mạng                      | Architecture          | Mainnet adapter    |
| DEP-03 | ABI/router/quoter/factory/spender và deployment verification                    | Architecture          | Quote/calldata     |
| DEP-04 | Token decimals/allowlist, Sepolia liquidity và funding                          | Engineering + product | Smoke test         |
| DEP-05 | Slippage bounds, deadline, cảnh báo và gas policy                               | Product + engineering | Review UI          |
| DEP-06 | Wallet SDK/version và compatibility matrix                                      | Frontend + QA         | Wallet             |
| DEP-07 | History provider, coverage, privacy/retention và vận hành                       | Product + operations  | History/beta       |

Tên chain, số mạng, Sepolia mặc định và hướng engine V3/adapter đã xác định. Những mục trên không được dùng để mở lại quyết định chain hoặc quay về tự xây AMM.

## 10. Definition of Done và tài liệu

Mỗi lát cắt cần acceptance criteria, kiểm chứng code/schema, test theo rủi ro, format/lint/typecheck/test/build liên quan, UI review khi có UI, tài liệu/env đồng bộ và commit nguyên tử. Traceability cập nhật bằng đường dẫn test/bằng chứng thật; không đánh dấu done chỉ vì có PRD.

Nguồn dữ liệu kỹ thuật và network registry được dẫn tại [roadmap](DOCS.md). Tài liệu người dùng “Web3 Wallet — Ví Web3 đa chain kèm DEX engine tự viết” là đầu vào tham khảo, không phải code hay bằng chứng runtime của WhaleDEX. ADR cũ giữ nguyên vai trò lịch sử và đã bị [ADR-0002](adr/0002-evm-multichain.md) thay thế.
