# WhaleDEX: Chuẩn thiết kế UI/UX (Design System)

## 1. Tổng quan và phạm vi

WhaleDEX là sàn giao dịch phi tập trung (Spot DEX) không lưu ký trên **Sui Testnet**, xây dựng trên sổ lệnh trung tâm **DeepBookV3**.

- **Phong cách thị giác:** Cyber-Fintech Trading Terminal (tối công nghệ, sắc sảo, tối ưu mật độ dữ liệu).
- **Môi trường & Ngôn ngữ:** Chỉ áp dụng giao diện Dark Mode; ngôn ngữ chuẩn tiếng Việt (`lang="vi"`).
- **Phạm vi MVP:**
  - Giao diện Landing Page và Web App giao dịch đáp ứng đa thiết bị (Responsive).
  - Hai chế độ chính: **Đổi token (Swap)** và **Bàn giao dịch Nâng cao (Pro Trading Terminal)**.
  - Quản lý tài sản ví và tài khoản giao dịch on-chain (`BalanceManager`).
  - Không hỗ trợ luồng EVM, AMM LP token hay yield farming trong phạm vi MVP.
- **Tài liệu tham chiếu:** [PRD WhaleDEX](docs/prd-whaledex.md) • [Lộ trình triển khai](docs/DOCS.md) • [ADR-0001 DeepBookV3](docs/adr/0001-sui-deepbook.md).

---

## 2. Nguyên tắc thiết kế cốt lõi

1. **Dual-Mode Simplicity:** Mặc định chế độ Đổi token (Swap) tối giản cho người dùng phổ thông; cung cấp Bàn giao dịch Nâng cao (Sổ lệnh, Lịch sử khớp, Limit/Post-Only) cho nhà giao dịch chuyên nghiệp.
2. **Transparency (Rõ trước khi ký):** Luôn hiển thị đầy đủ số lượng nhận tối thiểu, tỷ giá, tác động giá, phí giao dịch và gas ước tính bằng SUI trước khi người dùng xác nhận mở ví ký.
3. **Contextual Balances:** Tách bạch rõ ràng giữa **Số dư ví** và **Tài khoản giao dịch** (`BalanceManager`). Dữ liệu cũ (stale) luôn có nhãn cảnh báo thời gian.
4. **Operation Stability:** Cập nhật dữ liệu thời gian thực không làm mất focus, không tự động sửa giá trị đang nhập và không làm nhảy giật vị trí các nút thao tác.
5. **Cyber-Fintech Aesthetic:** Ngôn ngữ thị giác công nghệ cao: nền than obsidian sâu, các module panel viền laser mảnh sắc nét, điểm nhấn xanh điện quang (Electric Cyan) và màu giao dịch Cyber Emerald / Crimson.
6. **Data Integrity:** Dữ liệu trung thực 100%. Không hiển thị volume ảo, không cam kết lợi nhuận, luôn gắn banner nhận diện môi trường Sui Testnet.

---

## 3. Hệ thống Design Tokens

### 3.1. Bảng màu (Color Palette)

| Token                    | Giá trị                     | Vai trò                                                     |
| ------------------------ | --------------------------- | ----------------------------------------------------------- |
| `--color-background`     | `#060B14`                   | Nền toàn trang (Deep Obsidian Dark)                         |
| `--color-surface`        | `#0B1322`                   | Nền panel module, khung form, bảng dữ liệu                  |
| `--color-surface-raised` | `#111C30`                   | Hộp thoại modal, dropdown menu, tooltip                     |
| `--color-surface-hover`  | `#182742`                   | Trạng thái hover của hàng dữ liệu và control phụ            |
| `--color-border`         | `#1E2E48`                   | Viền laser mảnh 1px ngăn cách các module                    |
| `--color-border-subtle`  | `rgba(255, 255, 255, 0.08)` | Viền siêu mảnh phân chia hàng/cột nội bộ                    |
| `--color-control-border` | `#3B5278`                   | Viền cần thiết để nhận biết ô nhập dữ liệu (input)          |
| `--color-text`           | `#F1F5FA`                   | Văn bản chính, tiêu đề                                      |
| `--color-text-muted`     | `#8E9FB8`                   | Chú thích phụ, label nhãn, placeholder                      |
| `--color-primary`        | `#00F0FF`                   | Xanh điện quang (Electric Cyan / Sui Blue), hành động chính |
| `--color-primary-hover`  | `#38BDF8`                   | Trạng thái hover nút chính                                  |
| `--color-on-primary`     | `#060B14`                   | Màu chữ/icon trên nền nút chính (độ tương phản cao)         |
| `--color-focus`          | `#00F0FF`                   | Vòng focus viền sắc nét 2px                                 |
| `--color-positive`       | `#00E599`                   | Cyber Emerald: Mua, nến tăng, thành công (luôn kèm nhãn)    |
| `--color-negative`       | `#FF3B69`                   | Cyber Crimson: Bán, nến giảm, lỗi (luôn kèm nhãn)           |
| `--color-warning`        | `#F5C56A`                   | Cảnh báo trượt giá / tác động giá lớn                       |
| `--color-testnet`        | `#A78BFA`                   | Nhận biết môi trường Sui Testnet                            |
| `--color-overlay`        | `rgb(3 6 12 / 80%)`         | Lớp nền tối mờ sau modal                                    |
| `--color-tick-up`        | `rgba(0, 229, 153, 0.18)`   | Nền chớp flash khi giá khớp tăng                            |
| `--color-tick-down`      | `rgba(255, 59, 105, 0.18)`  | Nền chớp flash khi giá khớp giảm                            |

**Quy tắc áp dụng:**

- **Nút chính (Primary CTA):** Nền đặc `--color-primary` và chữ đậm `--color-on-primary`; thiết kế phẳng, sắc nét, tuyệt đối không dùng hiệu ứng phát sáng mờ (glow/aura/neon). Trạng thái active/hover nhận biết qua màu nền và đường viền sắc gọn.
- **Phân tách module:** Dùng đường viền sắc nét `1px solid var(--color-border)` thay vì đổ bóng mờ lớn. Dialog/popover dùng shadow: `0 12px 36px rgb(0 0 0 / 50%)`.
- **Kính kỹ thuật mờ nhẹ:** Cho phép `backdrop-filter: blur(8px)` trên Header và floating widget nhưng không áp dụng trực tiếp che lấp số liệu sổ lệnh.

---

### 3.2. Typography (Kiến trúc Font kép)

Hệ thống kết hợp 2 font chuẩn hệ thống giao dịch quốc tế:

1. **Be Vietnam Pro:** Font giao diện chính cho văn bản, tiêu đề, nhãn và mô tả hướng dẫn tiếng Việt.
2. **JetBrains Mono:** Font Monospace bắt buộc cho toàn bộ số liệu: Ticker giá, Sổ lệnh (Orderbook), Số dư, Khối lượng, Địa chỉ ví (`0x...`), Object ID, Transaction Digest, và Telemetry.

| Token              | Cỡ chữ / Line-height           | Weight | Font Family    | Mục đích sử dụng                         |
| ------------------ | ------------------------------ | ------ | -------------- | ---------------------------------------- |
| `--type-display`   | `clamp(32px, 4vw, 56px)` / 1.2 | 700    | Be Vietnam Pro | Tiêu đề lớn trang Landing                |
| `--type-heading-1` | 32px / 1.3                     | 700    | Be Vietnam Pro | Tiêu đề trang chính                      |
| `--type-heading-2` | 24px / 1.35                    | 600    | Be Vietnam Pro | Tiêu đề phân khu module                  |
| `--type-heading-3` | 18px / 1.45                    | 600    | Be Vietnam Pro | Tiêu đề panel, dialog                    |
| `--type-body`      | 16px / 1.5                     | 400    | Be Vietnam Pro | Nội dung đọc, giải thích                 |
| `--type-label`     | 14px / 1.5                     | 500    | Be Vietnam Pro | Nhãn form, nút bấm, header bảng          |
| `--type-caption`   | 12px / 1.5                     | 400    | Be Vietnam Pro | Chú thích phụ, timestamp                 |
| `--type-mono-lg`   | 24px / 1.3                     | 600    | JetBrains Mono | Giá lớn ticker, ô nhập số lượng lớn      |
| `--type-mono-md`   | 14px / 1.4                     | 500    | JetBrains Mono | Sổ lệnh, số lượng, hàng khớp lệnh        |
| `--type-mono-sm`   | 12px / 1.4                     | 400    | JetBrains Mono | Địa chỉ rút gọn, digest, latency mạng ms |

- Toàn bộ số liệu tài chính dùng `font-variant-numeric: tabular-nums lining-nums` và căn lề phải để đảm bảo thẳng hàng tuyệt đối khi cập nhật dữ liệu.

---

### 3.3. Khoảng cách và Hình khối (Grid & Spacing)

Thiết kế sắc nét theo phong cách Module Terminal, tối ưu mật độ thông tin:

| Token                                    | Giá trị                         | Quy tắc áp dụng                               |
| ---------------------------------------- | ------------------------------- | --------------------------------------------- |
| `--space-1` đến `--space-8`              | 4, 8, 12, 16, 24, 32, 48, 64 px | Hệ thống khoảng cách chuẩn                    |
| `--radius-control`                       | 4 px                            | Nút bấm, input, tab item (sắc gọn)            |
| `--radius-panel`                         | 8 px                            | Khung module giao dịch (chắc chắn)            |
| `--radius-badge`                         | 4 px                            | Thẻ tag/badge kỹ thuật số (không bo tròn)     |
| `--radius-dialog`                        | 10 px                           | Modal hộp thoại nổi                           |
| `--size-control`                         | 44 px                           | Chiều cao tương tác tối thiểu (chuẩn di động) |
| `--size-header`                          | 64 px                           | Thanh điều hướng tích hợp Telemetry           |
| `--width-content`                        | 1200 px                         | Độ rộng tối đa trang Landing, Markets         |
| `--width-trade`                          | 1440 px                         | Độ rộng tối đa Bàn giao dịch Nâng cao         |
| `--width-swap`                           | 480 px                          | Khung form Đổi token chuẩn                    |
| `--z-base`, `--z-sticky`, `--z-popover`  | 0, 10, 20                       | Thứ tự phân lớp giao diện                     |
| `--z-overlay`, `--z-dialog`, `--z-toast` | 30, 40, 50                      | Lớp phủ, modal và thông báo nổi               |

---

### 3.4. Chuyển động & Hiệu ứng công nghệ (Tech Polish)

| Token             | Thời gian / Easing           | Mục đích sử dụng               |
| ----------------- | ---------------------------- | ------------------------------ |
| `--motion-fast`   | 100 ms                       | Phản hồi hover, active control |
| `--motion-normal` | 180 ms                       | Chuyển tab, đóng mở module     |
| `--motion-flash`  | 250 ms                       | Hiệu ứng Tick-Flash dữ liệu    |
| `--motion-dialog` | 220 ms                       | Mở/đóng modal dialog           |
| `--motion-easing` | `cubic-bezier(0.2, 0, 0, 1)` | Đường cong gia tốc chuyển động |

**Hiệu ứng đặc thù:**

- **Tick-Flash:** Chớp màu `--color-tick-up` (xanh) hoặc `--color-tick-down` (đỏ) trong 250 ms tại ô giá sổ lệnh và gần nhất khi có giao dịch khớp.
- **Live Telemetry Pulse:** Đèn tín hiệu xanh nhấp nháy chu kỳ 2s cạnh chỉ số Ping RPC trên Header.
- **Subtle Tech Grid:** Họa tiết lưới kỹ thuật mờ (kích thước ô 40px, opacity 3–5%) tại nền Hero landing page.
- **Tuân thủ accessibility:** Khi người dùng bật `prefers-reduced-motion: reduce`, tắt toàn bộ hiệu ứng flash, pulse và animation.

---

## 4. Kiến trúc điều hướng & Header

### 4.1. Điều hướng chính

| Tuyến đường        | Tên mục           | Vai trò chính                                        |
| ------------------ | ----------------- | ---------------------------------------------------- |
| `/`                | WhaleDEX          | Giới thiệu tính năng và lối vào ứng dụng             |
| `/markets`         | Thị trường        | Danh sách cặp giao dịch được hỗ trợ và tìm kiếm      |
| `/trade/[poolKey]` | Giao dịch         | Bàn giao dịch (Đổi token mặc định, chuyển sang Pro)  |
| `/portfolio`       | Tài sản           | Quản lý ví, tài khoản DeepBook, lệnh mở và lịch sử   |
| `/learn/testnet`   | Hướng dẫn Testnet | Hướng dẫn kết nối ví và nhận token thử nghiệm faucet |

### 4.2. Header & Telemetry Bar

- **Logo:** Chữ WhaleDEX gắn link về `/`.
- **Menu điều hướng:** Giao dịch, Thị trường, Tài sản, Hướng dẫn (mục active có gạch viền cyan laser).
- **Terminal Telemetry:** Hiển thị thời gian thực độ trễ mạng Sui (`● 24ms Sui Testnet`), Gas price và Epoch hiện tại.
- **Nút Kết nối ví:** Viền laser sắc nét, mở modal chọn ví Sui tương thích.
- **Banner Testnet:** Cố định trên cùng: _"Sui Testnet: token thử nghiệm không có giá trị thật."_

---

## 5. Đặc tả chi tiết các màn hình

### 5.1. Landing Page (Cyber-Fintech Hero)

1. **Hero Section:** Tiêu đề "Giao dịch rõ ràng, dễ bắt đầu", mô tả ngắn, CTA "Mở ứng dụng" (nút phẳng tương phản cao) và "Hướng dẫn Testnet". Minh họa radar/vector đại dương công nghệ, nền subtle tech grid.
2. **Hai chế độ giao dịch:** Phân biệt trực quan giữa Đổi token (Swap) tiện lợi và Bàn giao dịch Nâng cao (Pro Terminal).
3. **Quy trình 3 bước:** Kết nối ví Sui → Nhận token Faucet → Xem trước & Ký giao dịch.
4. **FAQ Accordion:** Giải đáp các câu hỏi về Testnet, quyền tự lưu ký, `BalanceManager` và phí gas SUI.

### 5.2. Thị trường (Markets)

- Bảng danh sách các pool được hỗ trợ: Cặp giao dịch, Giá gần nhất (`JetBrains Mono`), trạng thái cập nhật thời gian thực.
- Tìm kiếm theo ký hiệu (symbol) hoặc tên token; hiển thị trạng thái rỗng nếu không tìm thấy.
- Nhấp chọn cặp sẽ chuyển hướng trực tiếp đến `/trade/[poolKey]`.

### 5.3. Đổi token (Swap)

Khung form một cột (tối đa 480 px), gồm:

- Bộ chọn token và số lượng trả (kèm số dư khả dụng sau khi trừ gas reserve SUI).
- Nút đảo chiều giao dịch (tự động tính toán báo giá mới).
- Lượng nhận ước tính, lượng nhận tối thiểu, tỷ giá thực thi và tác động giá.
- Cài đặt trượt giá (mặc định **0,5%**, cảnh báo màu vàng từ **1%** trở lên).
- Nút CTA chính: Chưa kết nối hiển thị "Kết nối ví"; đủ điều kiện hiển thị "Xem lại giao dịch" (mở màn hình Review trước khi ký ví).

### 5.4. Bàn giao dịch Nâng cao (Pro Trading Terminal)

Bố cục dạng **Modular Grid Desk** với viền laser `1px solid var(--color-border)`:

- **Header thị trường:** Ticker cặp, Giá gần nhất, Spread giá, Telemetry mạng.
- **Sổ lệnh (Orderbook):** Tối thiểu 10 mức mua (`--color-positive`) và 10 mức bán (`--color-negative`), số liệu font Monospace căn phải, hỗ trợ hiệu ứng Tick-Flash.
- **Giao dịch gần nhất (Recent Trades):** Danh sách khớp lệnh thời gian thực kèm nhãn Mua/Bán và timestamp.
- **Form đặt lệnh:** Hỗ trợ lệnh Giới hạn (`LIMIT`) và Chỉ Maker (`POST_ONLY`). Tự động kiểm tra tick size, lot size và minimum size của DeepBookV3.
- **Quản lý lệnh phía dưới:** Bảng Lệnh mở, Lịch sử lệnh và Lịch sử khớp; nút hủy lệnh luôn yêu cầu xác nhận.

### 5.5. Quản lý tài sản (Portfolio & BalanceManager)

Giải thích rõ: _"Tài khoản giao dịch (BalanceManager) giữ tài sản đặt lệnh trên DeepBook. Bạn kiểm soát nạp/rút bằng ví cá nhân."_

| Cột số dư     | Định nghĩa                                                         |
| ------------- | ------------------------------------------------------------------ |
| Trong ví      | Số dư token đang nằm trong ví cá nhân đang kết nối                 |
| Khả dụng      | Tài sản trong `BalanceManager` sẵn sàng để đặt lệnh mới            |
| Đang khóa     | Tài sản đang được ký quỹ giữ cho các lệnh chờ khớp                 |
| Đã quyết toán | Phần đã settle xác nhận từ DeepBook, sẵn sàng để rút về ví cá nhân |

- **Thao tác Nạp:** Chọn token, số lượng (nút "Tối đa" khi nạp SUI luôn tự động trừ gas reserve), review chi tiết trước khi ký.
- **Thao tác Rút:** Chỉ cho phép rút số dư khả dụng/đã quyết toán, đích nhận là ví hiện tại.

---

## 6. Thư viện Component cốt lõi

| Component           | Quy chuẩn thiết kế                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Button**          | Primary CTA phẳng lì, viền sắc nét, tương phản cao; hỗ trợ trạng thái loading giữ nguyên kích thước để chống spam. |
| **Amount Input**    | Số tiền hiển thị font `JetBrains Mono` cỡ lớn, căn phải; nhãn trên, số dư góc phải, lỗi validation bên dưới.       |
| **Token Selector**  | Tìm kiếm token trong danh sách allowlist, hiển thị rõ symbol và coin type rút gọn.                                 |
| **Telemetry Badge** | Chỉ báo độ trễ ping ms, epoch với đèn Live Pulse nhấp nháy chu kỳ 2s.                                              |
| **Orderbook Table** | Bảng số liệu Monospace tabular-nums, phân màu mua/bán rõ nét, tích hợp hiệu ứng Tick-Flash 250ms.                  |
| **Tabs Control**    | Tab active có đường viền cyan laser; hỗ trợ điều hướng bàn phím (mũi tên, Home/End).                               |
| **Modal Dialog**    | Bo góc 10px, viền laser, shadow tối sâu; tự động trap focus và đóng bằng phím Escape.                              |
| **Inline Alert**    | Viền trái 3px màu semantic (vàng cảnh báo / đỏ lỗi), kèm giải thích nguyên nhân và nút hành động khắc phục.        |
| **Skeleton**        | Shimmer quét sáng nhẹ 1.5s, kích thước tương đương layout thật; không làm giật bảng dữ liệu khi refresh.           |

---

## 7. Quy chuẩn Nội dung, Microcopy & Dữ liệu (Chống text rác / text vô nghĩa)

### 7.1. Tiêu chuẩn Microcopy & Chống văn bản rác (Zero-Fluff Policy)

Mọi từ ngữ trên giao diện WhaleDEX phải phục vụ mục đích chức năng rõ ràng, tham khảo chuẩn mực từ các sàn giao dịch công nghệ hàng đầu (dYdX, Binance, Uniswap):

1. **Danh sách đen (Tuyệt đối CẤM xuất hiện trên UI):**
   - **Cấm Lorem Ipsum / Placeholder:** Không dùng bất kỳ chuỗi `Lorem ipsum`, văn bản giữ chỗ (`Nội dung ở đây...`, `Title text here`, `Chức năng đang phát triển`). Nếu dữ liệu chưa tải xong, dùng Skeleton loader; nếu không có dữ liệu, dùng Empty State có chỉ dẫn.
   - **Cấm khẩu hiệu quảng cáo sáo rỗng (Marketing Buzzwords):** Cấm các cụm từ sáo rỗng như: _"Nền tảng giao dịch số 1"_, _"Công nghệ đột phá đỉnh cao tương lai"_, _"Giao dịch không rủi ro"_, _"Lợi nhuận khủng"_.
   - **Cấm số liệu & Bằng chứng xã hội giả (No Fake Social Proof):** Không bịa đặt logo đối tác/nhà đầu tư, không tạo đánh giá (reviews) người dùng ảo, không hiển thị số liệu Volume / TVL / Người dùng giả tạo.

2. **Quy chuẩn Nhãn nút bấm & CTA (Action-Driven Labels):**
   - Nhãn nút bấm luôn là cụm **[Động từ] + [Đối tượng cụ thể]**, giúp người dùng hiểu ngay kết quả khi bấm:
     - _Đúng:_ `Kết nối ví Sui`, `Xem lại giao dịch`, `Xác nhận và ký`, `Đổi token`, `Đặt lệnh Mua`, `Đặt lệnh Bán`, `Hủy lệnh #123`, `Nạp vào tài khoản`, `Rút về ví`.
     - _Cấm:_ `Bấm vào đây`, `OK`, `Gửi`, `Tiếp tục` (khi thiếu ngữ cảnh), `Khám phá ngay`, `Tìm hiểu thêm` (trên bảng giao dịch).

3. **Quy chuẩn Trạng thái rỗng (Actionable Empty States):**
   - Không được để ô trống hoặc dùng câu chung chung như _"Không có gì ở đây"_, _"Trống"_.
   - Luôn tuân theo công thức: **[Trạng thái hiện tại] + [Lý do ngắn gọn] + [Hành động tiếp theo]**:
     - _Sổ lệnh chưa có thanh khoản:_ "Chưa có lệnh nào ở mức giá này. Đặt lệnh Maker đầu tiên ở form bên phải."
     - _Chưa có lệnh mở:_ "Bạn chưa có lệnh mở nào cho cặp này. Đặt lệnh Mua hoặc Bán để bắt đầu."
     - _Lịch sử giao dịch trống:_ "Chưa ghi nhận giao dịch nào từ ví kết nối trong phiên này."
     - _Không tìm thấy token:_ "Không tìm thấy token phù hợp với từ khóa '{query}'. Hãy kiểm tra lại ký hiệu hoặc dán địa chỉ Coin Type."

4. **Quy chuẩn Thông báo lỗi (Clear & Actionable Error Messages):**
   - Không hiển thị mã lỗi kỹ thuật thuần túy (`Error 500`, `Unknown exception`, `Transaction failed`).
   - Cấu trúc thông báo: **[Vấn đề xảy ra] + [Nguyên nhân dễ hiểu] + [Cách người dùng tự xử lý]**:
     - _Thiếu gas:_ "Không đủ SUI để trả phí gas mạng (~0.02 SUI). Vui lòng nhận thêm SUI từ Faucet để tiếp tục."
     - _Trượt giá quá cao:_ "Tác động giá dự kiến là 2,4% (vượt ngưỡng cảnh báo 1%). Hãy giảm số lượng hoặc điều chỉnh mức trượt giá trong cài đặt."
     - _Từ chối ký ví:_ "Bạn đã hủy yêu cầu ký trong ví. Lệnh chưa được gửi đi."

5. **Quy chuẩn Landing Page & Giới thiệu tính năng:**
   - Mọi câu chữ chỉ mô tả chính xác năng lực thực tế của sản phẩm:
     - _Tiêu đề chính (Headline):_ "Sàn giao dịch Spot phi tập trung trên Sui Testnet"
     - _Phụ đề (Sub-headline):_ "Giao dịch không lưu ký qua sổ lệnh DeepBookV3. Toàn quyền kiểm soát tài sản, khớp lệnh on-chain tốc độ cao với phí gas tối thiểu."
     - _FAQ:_ Chỉ giải đáp 4 vấn đề thiết thực: Cách nhận SUI Testnet từ Faucet, Bản chất `BalanceManager`, Cách tính phí mạng và Giá trị token thử nghiệm.

6. **Quy chuẩn Tooltip giải thích tham số:**
   - Giải thích ngắn gọn trong 1–2 câu súc tích:
     - _Trượt giá (Slippage):_ "Mức chênh lệch giá tối đa bạn chấp nhận giữa giá xem trước và giá thực thi trên blockchain."
     - _Chỉ Maker (Post-Only):_ "Lệnh đảm bảo đóng vai trò cung cấp thanh khoản; sẽ tự động hủy nếu có thể khớp ngay lập tức."
     - _Tác động giá (Price Impact):_ "Mức độ biến động giá thị trường do quy mô lệnh của bạn gây ra trên sổ lệnh DeepBook."

---

### 7.2. Định dạng Dữ liệu & Localization

- **Ngôn ngữ:** Giao diện tiếng Việt chuẩn mực; giữ nguyên các thuật ngữ kỹ thuật quốc tế: _WhaleDEX, Sui, DeepBookV3, Testnet, Symbol, Coin Type, Object ID, Digest_.
- **Định dạng số:** Hiển thị theo quy chuẩn Việt Nam: `1.234,56 SUI`, `0,5%`.
- **Nhập liệu (Input):** Chấp nhận cả dấu phẩy `,` và dấu chấm `.` làm dấu thập phân từ bàn phím crypto (ví dụ `1.23` tương đương `1,23`); không nhận dấu phân nhóm hàng nghìn trong ô nhập.
- **Rút gọn địa chỉ:** Hiển thị dạng `0x1234…abcd` bằng font Monospace; hỗ trợ nút sao chép toàn bộ một chạm.
- **Thời gian:** Hiển thị theo múi giờ thiết bị địa phương (`HH:mm:ss` hoặc `DD/MM/YYYY HH:mm`).

---

## 8. Quy trình Review & Trạng thái giao dịch

### 8.1. Màn hình Review trước khi ký

Mọi thao tác thay đổi trạng thái (Tạo tài khoản, Nạp, Rút, Đổi token, Đặt lệnh, Hủy lệnh) đều phải qua màn hình Review trước khi gọi ví ký:

- Hiển thị đầy đủ: Hành động & Mạng, Cặp tài sản, Địa chỉ ví & Manager ID, Số lượng & Giá, Lượng nhận tối thiểu, Phí giao dịch và Phí mạng (gas) ước tính.
- Cảnh báo trượt giá / tác động giá lớn (>1%) yêu cầu checkbox xác nhận bổ sung.

### 8.2. Vòng đời giao dịch (Transaction Lifecycle)

| Trạng thái           | Thông báo hiển thị           | Hành vi hệ thống                                               |
| -------------------- | ---------------------------- | -------------------------------------------------------------- |
| `awaiting_signature` | "Đang chờ bạn ký trong ví"   | Chặn gửi yêu cầu trùng lặp; người dùng có thể từ chối trong ví |
| `submitted`          | "Đã gửi, đang chờ xác nhận"  | Hiển thị Digest kèm link Sui Explorer, tiếp tục theo dõi ngầm  |
| `confirmed`          | "Giao dịch đã được xác nhận" | Cập nhật lại số dư và sổ lệnh; thông báo thành công ngắn gọn   |
| `failed`             | "Giao dịch không thành công" | Hiển thị lý do lỗi chuẩn hóa; cho phép xem lại và thử lại      |
| `unknown`            | "Chưa xác định được kết quả" | Giữ lại digest để tra cứu explorer; tuyệt đối không tự gửi lại |

---

## 9. Responsive & Tiêu chuẩn Accessibility (WCAG 2.1 AA)

### 9.1. Breakpoints

- **Mobile (375px):** 1 cột; Trade desk ưu tiên form đặt lệnh, sổ lệnh và lịch sử hiển thị theo Tabs; vùng chạm tối thiểu 44x44px.
- **Tablet (768px):** Form Swap giữ tối đa 480px; Bảng thị trường hiển thị đầy đủ các cột.
- **Desktop (1024px – 1440px):** Bố cục Modular Grid đa cột hoàn chỉnh: Sổ lệnh & Biểu đồ bên trái (1fr), Form đặt lệnh bên phải (340–360px), Bảng lệnh mở bên dưới.

### 9.2. Khả năng tiếp cận (Accessibility)

- Tương phản màu tối thiểu **4,5:1** cho văn bản thông thường và **3:1** cho control/tiêu đề lớn.
- Viền focus bàn phím rõ nét: 2px màu `--color-focus`, offset 2px.
- Hỗ trợ đầy đủ điều hướng bằng bàn phím (Tab, Enter, Escape, Arrow keys).

---

## 10. Checklist nghiệm thu UI

- [ ] Route, nhãn tiếng Việt và chế độ mặc định hiển thị chính xác theo tài liệu.
- [ ] Áp dụng chuẩn bảng màu Cyber, hệ thống font kép (Be Vietnam Pro + JetBrains Mono) và bo góc 4–8px sắc nét.
- [ ] Toàn bộ UI tuân thủ chính sách Zero-Fluff: không có text rác, placeholder, marketing sáo rỗng hay số liệu giả; mọi nút bấm, tooltip và empty state đều có hướng dẫn hành động cụ thể.
- [ ] Hiệu ứng công nghệ (Tick-Flash, Live Telemetry Pulse) mượt mà; tự động tắt khi bật `prefers-reduced-motion`.
- [ ] Số dư ví và `BalanceManager` tách biệt rõ ràng; các thao tác nạp/rút SUI luôn trừ gas reserve an toàn.
- [ ] Form Swap và Orderbook tuân thủ chặt chẽ quy tắc tick/lot size của DeepBookV3.
- [ ] Quy trình Review 2 bước hiển thị đầy đủ trước khi mở ví ký; xử lý trơn tru các trạng thái `submitted`, `confirmed`, `failed`.
- [ ] Giao diện co giãn chuẩn xác trên các mốc 375px, 768px, 1024px và 1440px.
