# WhaleDEX: Chuẩn thiết kế UI/UX

## 1. Mục đích và phạm vi

Tài liệu này là chuẩn thiết kế mục tiêu cho developer và AI khi xây dựng WhaleDEX. Các màn hình, component và hành vi bên dưới **chưa được triển khai** tại thời điểm soạn tài liệu; code hiện tại là nền tảng Next.js, React và Fastify với một trang mẫu.

Nguồn nghiệp vụ là [PRD WhaleDEX](docs/prd-whaledex.md), thứ tự triển khai nằm trong [lộ trình](docs/DOCS.md), và lựa chọn nền tảng được chốt tại [ADR-0001](docs/adr/0001-sui-deepbook.md). WhaleDEX là DEX spot không lưu ký trên **Sui Testnet**, sử dụng **DeepBookV3** và sổ lệnh. Trong ngữ cảnh này, pool là thị trường cho một cặp tài sản; cung cấp thanh khoản là đặt lệnh maker. MVP không có luồng EVM, allowance ERC-20, AMM, LP token hoặc farming.

Thiết kế bắt đầu mới hoàn toàn. Màu, font và bố cục của trang mẫu không phải ràng buộc. Phạm vi gồm landing page và ứng dụng web responsive, chỉ dark mode, nội dung tiếng Việt. Tài liệu không thay đổi API, schema, dependency hay lựa chọn giao thức trong PRD.

## 2. Nguyên tắc thiết kế

1. **Dễ bắt đầu:** người mới vào chế độ Đổi token; các công cụ đặt lệnh nằm trong chế độ Nâng cao.
2. **Rõ trước khi ký:** số lượng, phí, gas, giá dự kiến, giới hạn thực thi và mạng phải được hiểu trước khi mở ví.
3. **Dữ liệu có ngữ cảnh:** luôn phân biệt số dư ví và tài khoản giao dịch, dữ liệu mới và dữ liệu cũ, đã gửi và đã xác nhận.
4. **Ổn định khi thao tác:** cập nhật thị trường không làm mất focus, đổi cặp đang chọn, sửa nội dung nhập hoặc dịch chuyển nút xác nhận.
5. **Một ngôn ngữ thị giác:** nền than xanh, bề mặt phẳng phân lớp nhẹ, xanh biển cho hành động chính; màu mua/bán có ý nghĩa riêng.
6. **Trung thực:** không hiển thị dữ liệu giả như dữ liệu thật, không hứa lợi nhuận hoặc giá khớp chắc chắn, không tạo bằng chứng đối tác/chứng nhận chưa có.

Landing page dành cho người dùng crypto muốn hiểu và thử sản phẩm, với phong cách tối, tinh gọn và dễ tiếp cận. Bố cục có điểm nhấn nhưng chuyển động tiết chế. Ứng dụng dùng cùng nhận diện với mật độ dữ liệu tăng theo nhiệm vụ, không áp dụng bố cục quảng bá vào bảng giao dịch.

## 3. Hệ thống thị giác

### 3.1. Màu sắc

Dùng token ngữ nghĩa làm CSS custom properties khi triển khai. Component tham chiếu token, không tự thêm mã màu. Các giá trị dưới đây là chuẩn mới, không trích từ CSS mẫu.

| Token                    | Giá trị             | Vai trò                                   |
| ------------------------ | ------------------- | ----------------------------------------- |
| `--color-background`     | `#0B1220`           | Nền toàn trang                            |
| `--color-surface`        | `#121D2E`           | Form, bảng, vùng nội dung                 |
| `--color-surface-raised` | `#1B2A40`           | Dialog, popover, vùng nổi                 |
| `--color-surface-hover`  | `#243650`           | Hover của hàng và control phụ             |
| `--color-border`         | `#34465F`           | Đường phân nhóm và viền trang trí         |
| `--color-control-border` | `#71839B`           | Viền cần thiết để nhận biết input/control |
| `--color-text`           | `#F1F5FA`           | Nội dung chính                            |
| `--color-text-muted`     | `#A8B8CF`           | Chú thích, label phụ, placeholder         |
| `--color-primary`        | `#5BA7F7`           | Nút chính, liên kết, mục đang chọn        |
| `--color-primary-hover`  | `#80BCFA`           | Hover của nút chính                       |
| `--color-on-primary`     | `#0B1220`           | Chữ và icon trên nút xanh biển            |
| `--color-focus`          | `#9ACBFF`           | Vòng focus                                |
| `--color-positive`       | `#56D6A0`           | Mua, tăng giá, thành công, luôn kèm nhãn  |
| `--color-negative`       | `#FF8C98`           | Bán, giảm giá, lỗi, luôn kèm nhãn         |
| `--color-warning`        | `#F5C56A`           | Cảnh báo cần chú ý                        |
| `--color-testnet`        | `#C4B5FD`           | Nhận biết môi trường Testnet              |
| `--color-overlay`        | `rgb(3 8 16 / 72%)` | Lớp nền sau dialog                        |

- Nút chính dùng nền primary và chữ on-primary; không dùng chữ trắng trên xanh sáng.
- Màu semantic dùng cho chữ/icon trên surface. Nếu dùng làm nền đặc, chữ dùng on-primary và phải kiểm tra tương phản.
- Badge Testnet dùng chữ testnet trên surface-raised, không dùng làm CTA hay màu thương hiệu thứ hai.
- Border trang trí không thay thế control-border khi đường viền là dấu hiệu nhận biết control.
- Không dùng glow neon, gradient chữ, lớp kính mờ trên bảng số liệu hoặc bóng đổ lớn. Shadow chỉ dùng cho dialog/popover: `0 16px 48px rgb(3 8 16 / 32%)`.
- Disabled dùng nền surface-raised, chữ text-muted, kèm lý do ở gần. Không giảm opacity cả nhóm khiến thông tin cần đọc bị mờ.

### 3.2. Typography

Font chính là **Be Vietnam Pro**, fallback `system-ui, sans-serif`. Khi xây UI, tải bằng `next/font` hoặc tự host; dùng các weight 400, 500, 600, 700. Kiểm tra dấu tiếng Việt ở cả chữ hoa và chữ thường. Không thêm font chỉ để tạo vẻ công nghệ.

| Token              | Cỡ chữ / line-height           | Weight | Sử dụng                                  |
| ------------------ | ------------------------------ | ------ | ---------------------------------------- |
| `--type-display`   | `clamp(32px, 4vw, 56px)` / 1.2 | 700    | Tiêu đề landing; tối đa hai dòng desktop |
| `--type-heading-1` | 32px / 1.3                     | 700    | Tiêu đề trang                            |
| `--type-heading-2` | 24px / 1.35                    | 600    | Tiêu đề khu vực                          |
| `--type-heading-3` | 18px / 1.45                    | 600    | Tiêu đề panel/dialog                     |
| `--type-body`      | 16px / 1.5                     | 400    | Nội dung và input                        |
| `--type-label`     | 14px / 1.5                     | 500    | Label, nút, bảng desktop                 |
| `--type-caption`   | 12px / 1.5                     | 400    | Thời điểm và chú thích phụ               |
| `--type-amount`    | `clamp(24px, 3vw, 32px)` / 1.3 | 600    | Amount trong form Đổi token              |

Số tiền, giá và phần trăm dùng `font-variant-numeric: tabular-nums lining-nums`; cột số căn phải. Không ép địa chỉ dài vào font nhỏ hoặc để cắt dấu tiếng Việt. Nội dung đọc dài giới hạn khoảng 65 ký tự mỗi dòng. Trên mobile, input tối thiểu 16 px và bảng thẻ ưu tiên chữ 14-16 px.

### 3.3. Khoảng cách, hình dạng và lớp hiển thị

| Nhóm token                               | Giá trị                         | Quy tắc                                       |
| ---------------------------------------- | ------------------------------- | --------------------------------------------- |
| `--space-1` đến `--space-8`              | 4, 8, 12, 16, 24, 32, 48, 64 px | Theo đúng thứ tự; không tạo khoảng cách tùy ý |
| `--radius-control`                       | 8 px                            | Button, input, tab đang chọn                  |
| `--radius-panel`                         | 16 px                           | Form chính, dialog và panel                   |
| `--radius-badge`                         | 999 px                          | Chỉ badge nhãn ngắn                           |
| `--size-control`                         | 44 px                           | Chiều cao tối thiểu của control tương tác     |
| `--size-header`                          | 64 px                           | Thanh điều hướng, không gồm banner Testnet    |
| `--width-content`                        | 1200 px                         | Landing, Markets, Portfolio và hướng dẫn      |
| `--width-trade`                          | 1440 px                         | Chế độ Nâng cao                               |
| `--width-swap`                           | 480 px                          | Form Đổi token                                |
| `--z-base`, `--z-sticky`, `--z-popover`  | 0, 10, 20                       | Nội dung, header, menu                        |
| `--z-overlay`, `--z-dialog`, `--z-toast` | 30, 40, 50                      | Overlay, dialog, thông báo                    |

Panel padding 24 px desktop, 16 px mobile; khoảng cách label/input 8 px; giữa các field 16 px; giữa các nhóm form 24 px. Landing cách section 64 px desktop và 48 px mobile. Group dữ liệu bằng căn chỉnh và khoảng trắng; chỉ dùng panel khi có một nhiệm vụ riêng.

### 3.4. Chuyển động và icon

| Token             | Giá trị                      | Sử dụng                     |
| ----------------- | ---------------------------- | --------------------------- |
| `--motion-fast`   | 120 ms                       | Hover, active               |
| `--motion-normal` | 180 ms                       | Tab, menu                   |
| `--motion-dialog` | 220 ms                       | Mở/đóng dialog              |
| `--motion-easing` | `cubic-bezier(0.2, 0, 0, 1)` | Chuyển trạng thái giao diện |

Chỉ chuyển động nhẹ bằng opacity/transform; không animate amount, chiều rộng cột hay chiều cao hàng dữ liệu. Với `prefers-reduced-motion: reduce`, bỏ chuyển động và giữ phản hồi tức thời. Không dùng parallax, tự cuộn, marquee hoặc hiệu ứng lặp để thu hút chú ý trong ứng dụng.

Khi triển khai icon, dùng một họ **Phosphor** dạng outline, cỡ 20 px trong control, 16 px cạnh nội dung phụ; weight thống nhất regular. Icon-only button vẫn có vùng chạm 44 px và tên truy cập được. Không dùng emoji làm icon chức năng. Tài liệu này không cài thư viện icon hoặc tạo asset.

## 4. Kiến trúc thông tin và điều hướng

| Đường dẫn mục tiêu | Nhãn người dùng   | Nội dung chính                             |
| ------------------ | ----------------- | ------------------------------------------ |
| `/`                | WhaleDEX          | Giới thiệu sản phẩm và mở ứng dụng         |
| `/markets`         | Thị trường        | Chọn cặp trong danh sách được hỗ trợ       |
| `/trade/[poolKey]` | Giao dịch         | Đổi token mặc định, chuyển sang Nâng cao   |
| `/portfolio`       | Tài sản           | Ví, tài khoản giao dịch, lệnh và lịch sử   |
| `/learn/testnet`   | Hướng dẫn Testnet | Bắt đầu dùng sản phẩm với token thử nghiệm |

- Logo chữ WhaleDEX dẫn về `/`. Giữ wordmark chữ cho MVP; không coi dấu W của trang mẫu là logo đã chốt.
- Header ứng dụng có Giao dịch, Thị trường, Tài sản, Hướng dẫn và Kết nối ví. Mục hiện tại có màu, nền và trạng thái truy cập được, không chỉ đổi màu chữ.
- “Mở ứng dụng” và mục Giao dịch dẫn đến pool mặc định hợp lệ trong cấu hình. Nếu chưa có pool hợp lệ/được hỗ trợ, dẫn đến Markets với hướng dẫn chọn cặp; không hard-code pool ID trong UI.
- Vào `/trade/[poolKey]` mặc định mở Đổi token. Chuyển chế độ tại chỗ giữ cặp đã chọn; không tự chuyển input của Swap thành lệnh Limit.
- Pool không tồn tại hoặc ngoài allowlist hiển thị “Thị trường này chưa được hỗ trợ” và đường về Markets; không âm thầm chuyển sang cặp khác.
- Xem thị trường và hướng dẫn không cần kết nối ví. Các tác vụ cần ký chỉ yêu cầu kết nối tại thời điểm cần thiết.
- Banner luôn hiện trong khung nhìn: **“Sui Testnet: token thử nghiệm không có giá trị thật.”** Header/banner không che focus hoặc nội dung review.

## 5. Đặc tả từng màn hình

### 5.1. Landing page

Trình tự nội dung:

1. **Giới thiệu:** tiêu đề “Giao dịch rõ ràng, dễ bắt đầu”, mô tả “Đổi token và đặt lệnh trên Sui Testnet. Bạn giữ quyền kiểm soát tài sản.” CTA chính “Mở ứng dụng”, CTA phụ “Hướng dẫn Testnet”.
2. **Hai chế độ giao dịch:** trình bày Đổi token và Nâng cao với nhiệm vụ, thông tin người dùng nhận được và đường dẫn phù hợp. Dùng hai vùng có tỷ trọng khác nhau, không dàn thành các thẻ tính năng giống hệt nhau.
3. **Bắt đầu trên Testnet:** các bước có tên hành động: Kết nối ví, Lấy token thử nghiệm, Xem trước và ký. Dẫn đến hướng dẫn đầy đủ; giải thích tài khoản giao dịch trong phần hướng dẫn nâng cao.
4. **Câu hỏi thường gặp:** token thử nghiệm, quyền kiểm soát tài sản, khác biệt hai chế độ, tài khoản giao dịch và phí gas. Dùng accordion có thao tác bàn phím.
5. **Kết thúc:** CTA “Mở ứng dụng” nhất quán với đầu trang; footer có hướng dẫn và thông tin môi trường.

Hero desktop chia hai cột: nội dung căn trái, minh họa đại dương/cá voi tiết chế bên phải. Mobile xếp nội dung và CTA trước hình. Hình không chứa số liệu thị trường hoặc giả dạng ảnh chụp một chức năng đang hoạt động. Asset sẽ được tạo/chọn ở công việc triển khai UI; không cần asset để hoàn thành tài liệu này.

Toàn trang giữ nền tối; hình ảnh không làm giảm tương phản nội dung. Không thêm thống kê khối lượng, người dùng, lợi suất, logo đối tác, nhận xét hoặc chứng nhận khi chưa có bằng chứng. Trạng thái Testnet luôn rõ, kể cả trên trang giới thiệu.

### 5.2. Thị trường

- Tìm theo symbol hoặc tên token trong allowlist. Hàng hiển thị cặp, giá gần nhất và trạng thái cập nhật; không bắt buộc chỉ số 24 giờ khi nguồn chưa cung cấp.
- Chọn cặp dẫn đến URL chứa poolKey. Có nút/link mang tên cặp cho bàn phím, không chỉ gắn click lên cả hàng.
- Không có kết quả tìm kiếm: “Không tìm thấy cặp phù hợp” và nút xóa tìm kiếm. Chưa có pool: “Chưa có thị trường được hỗ trợ”. Upstream lỗi: hiển thị lỗi và Thử lại.
- Không dùng số 0 thay dữ liệu thiếu. Dữ liệu cũ vẫn có thể được xem với nhãn thời điểm; không cho gửi giao dịch khi stale.

### 5.3. Đổi token

Form một cột, tối đa 480 px, thứ tự: chọn chế độ, cặp token, số lượng trả, đảo chiều, lượng nhận dự kiến, chi tiết giá/phí, trượt giá, nút “Xem lại giao dịch”.

- Chỉ hỗ trợ exact input và chiều base/quote của pool được hỗ trợ. Đảo chiều cần tạo preview mới; không tái sử dụng lượng nhận cũ làm báo giá mới.
- Swap mặc định dùng coin trực tiếp trong ví và không yêu cầu `BalanceManager`. Chỉ chế độ Nâng cao với order mới dẫn người dùng qua bước tạo/tái sử dụng và nạp tài khoản giao dịch.
- Hiển thị số dư ví có thể dùng sau khi chừa gas reserve phù hợp; không mặc định coi toàn bộ SUI trong ví là khả dụng để swap.
- Chi tiết gồm lượng nhận dự kiến, lượng nhận tối thiểu lớn hơn 0, giá khớp trung bình, tác động giá, tài sản trả phí, phí giao dịch, gas ước tính và thời điểm báo giá. Không giấu lượng nhận tối thiểu hoặc tài sản trả phí sau tooltip.
- Trượt giá mặc định **0,5%**, cảnh báo từ **1%** theo PRD. Ngưỡng tác động giá lớn lấy từ cấu hình nghiệp vụ, không tự đặt ngưỡng mới trong component.
- Khi chưa kết nối, hành động chính là “Kết nối ví”. Sau khi kết nối và dữ liệu hợp lệ, dùng “Xem lại giao dịch”; hành động ký nằm ở màn hình review.
- Trong lúc cập nhật báo giá, giữ nội dung nhập; khóa bước review cho đến khi có preview hợp lệ tương ứng với input hiện tại.

### 5.4. Nâng cao

Desktop bố trí vùng dữ liệu thị trường bên trái và form đặt lệnh bên phải; lệnh mở và lịch sử nằm phía dưới. Vùng dữ liệu có sổ lệnh và giao dịch gần nhất; không bắt buộc biểu đồ nến khi chưa có dữ liệu lịch sử phù hợp trong phạm vi MVP.

- Sổ lệnh có tối thiểu 10 mức mua và 10 mức bán khi nguồn đủ dữ liệu, với giá, số lượng và tổng tích lũy; phần giữa hiển thị giá mua tốt nhất, giá bán tốt nhất, mid-price và spread tuyệt đối/phần trăm.
- Phía mua ghi “Mua” và màu positive, phía bán ghi “Bán” và màu negative. Thanh độ sâu chỉ làm nền phụ, không che số hoặc thay nhãn.
- Giao dịch gần nhất hiển thị giá, lượng, phía taker và thời gian. Không đọc mọi tick qua live region của screen reader.
- Form có Mua/Bán, loại lệnh Giới hạn (`LIMIT`) hoặc Chỉ maker (`POST_ONLY`), giá, số lượng, tổng dự kiến, tài sản sẽ bị khóa, phí và gas.
- Giải thích Chỉ maker: “Lệnh sẽ không được đặt nếu có thể khớp ngay.” Không dùng cụm này như cam kết lệnh chắc chắn được nhận.
- Giá và lượng tuân theo tick size, lot size và minimum size của pool. Nếu cần làm tròn, hiển thị giá trị điều chỉnh và cho người dùng xem lại trước khi ký; không sửa âm thầm.
- Chặn tự khớp theo cấu hình an toàn trong PRD; không đưa tùy chọn vô hiệu hóa bảo vệ này vào MVP.
- Lệnh khớp một phần hiển thị lượng ban đầu, đã khớp và còn lại. Hủy từng lệnh cần review; sau khi gửi, hiển thị “Đang hủy” cho đến khi xác nhận.

### 5.5. Tài sản và tài khoản giao dịch

Lần đầu giới thiệu: **“Tài khoản giao dịch (BalanceManager) giữ tài sản bạn dùng để đặt lệnh trên DeepBook. Bạn ký thao tác nạp và rút bằng ví.”** Sau đó dùng nhãn ngắn “Tài khoản giao dịch”, với object ID có thể sao chép.

| Nhãn          | Ý nghĩa trình bày                                                        |
| ------------- | ------------------------------------------------------------------------ |
| Trong ví      | Tài sản thuộc ví hiện kết nối                                            |
| Khả dụng      | Phần trong tài khoản giao dịch có thể sử dụng theo dữ liệu hiện tại      |
| Đang khóa     | Phần đang được giữ cho lệnh mở                                           |
| Đã quyết toán | Phần được nguồn dữ liệu xác nhận đã settle; điều kiện rút theo giao thức |

Các trạng thái số dư có thể phản ánh những góc nhìn liên quan của cùng tài sản; không cộng mọi cột thành tổng nếu adapter không xác nhận chúng loại trừ nhau. Không coi dữ liệu chưa đồng bộ là số dư 0.

- Tìm tài khoản hiện có trước khi đề nghị tạo mới. Khi indexer chậm, dùng ID đã biết theo network/owner và hiển thị đang đồng bộ; không tự tạo tài khoản thứ hai.
- Nạp: chọn token hợp lệ, lượng, nguồn ví và tài khoản nhận; review có network, amount, manager ID và gas.
- Rút: chỉ cho chọn phần có thể rút đã được xác thực; phần đang khóa có giải thích và đường đến lệnh mở. Địa chỉ nhận là ví đang kết nối, xuất hiện rõ trong review.
- “Tối đa” khi nạp SUI phải trừ gas reserve cấu hình. Không hiển thị nút Tối đa như cam kết rút/nạp được toàn bộ trong khi chưa tải đủ dữ liệu.
- Tabs gồm Lệnh mở, Lịch sử lệnh và Lịch sử khớp. Giao dịch đã gửi nhưng chưa rõ kết quả có vùng theo dõi riêng; lệnh chưa đồng bộ không bị diễn giải là đã biến mất.

### 5.6. Hướng dẫn Testnet

Checklist gồm kết nối ví, đúng Sui Testnet, có SUI cho gas và có token giao dịch. Tạo/tái sử dụng tài khoản giao dịch chỉ xuất hiện trong hướng dẫn Nâng cao; không bắt người chỉ xem thị trường hoặc swap trực tiếp hoàn thành bước này.

SUI dùng cho gas lấy từ faucet chính thức. DEEP và quote asset ưu tiên token-request form được tài liệu DeepBook chỉ dẫn; swap SUI → DEEP trên `DEEP_SUI` chỉ là phương án phụ khi quote đủ minimum và book có thanh khoản. Liên kết phải được xác minh lúc triển khai. Khi faucet/form giới hạn yêu cầu, thông báo rõ và cho mở hướng dẫn; không hứa nhận token thành công, không tự gửi lại, và không yêu cầu khóa bí mật, seed phrase hay mật khẩu.

## 6. Component dùng chung

| Component      | Quy định                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button         | Một hành động chính mỗi nhóm tác vụ; nhãn động từ cụ thể. Có default, hover, focus, active, disabled và loading; loading giữ kích thước và chặn gửi lặp |
| Amount input   | Label phía trên, token/số dư gần field, lỗi phía dưới. Cho gõ trạng thái trung gian, validate trước review; không làm tròn mỗi lần gõ                   |
| Token selector | Chỉ token/pool được hỗ trợ; tìm kiếm, symbol, tên và coin type đầy đủ khi mở chi tiết để phân biệt token trùng tên                                      |
| Tabs           | Active có nền/đường chỉ báo và nhãn; hỗ trợ phím mũi tên, Home/End, focus. Đổi tab không làm mất form đang nhập                                         |
| Table          | Header rõ đơn vị, số căn phải, hàng ổn định khi refresh. Trên mobile đổi sang thẻ hoặc tab thay vì thu nhỏ chữ                                          |
| Dialog         | Có tiêu đề, mô tả, nút đóng và thứ tự nội dung ổn định; trap focus và trả focus về nút mở khi đóng                                                      |
| Tooltip        | Chỉ bổ sung thuật ngữ; mở được bằng focus/chạm. Thông tin quan trọng phải hiện trực tiếp                                                                |
| Toast          | Phản hồi ngắn như “Đã sao chép”; không là nơi duy nhất chứa lỗi giao dịch hoặc digest                                                                   |
| Inline alert   | Lỗi/cảnh báo gắn với field, panel hoặc giao dịch; gồm nguyên nhân dễ hiểu và hành động xử lý                                                            |
| Skeleton       | Chỉ dùng khi chưa có dữ liệu; kích thước gần bố cục thật. Refresh giữ dữ liệu cũ có nhãn thay vì làm cả bảng nhấp nháy                                  |
| Empty state    | Phân biệt chưa kết nối, chưa có dữ liệu, không có kết quả và lỗi nguồn; mỗi loại có hành động phù hợp                                                   |

## 7. Ngôn ngữ, số liệu và thời gian

- Ngôn ngữ UI là tiếng Việt; khi triển khai đặt ngôn ngữ tài liệu HTML là `vi`. Giữ WhaleDEX, Sui, DeepBookV3, Testnet, symbol, coin type, ID và digest nguyên dạng.
- Dùng “Đổi token”, “Thị trường”, “Tài sản”, “Lệnh giới hạn”, “Trượt giá tối đa”, “Phí mạng ước tính”. Giải thích gas trong lần đầu: “Phí mạng (gas) được trả bằng SUI.”
- Số hiển thị theo quy ước Việt Nam: `1.234,56 SUI`, `0,5%`. Luôn kèm đơn vị ở giá trị hoặc header cột; không tự quy đổi sang VND/USD nếu không có nguồn giá đáng tin cậy.
- Amount input không chèn phân nhóm khi gõ. Dùng dấu phẩy thập phân theo UI; chấp nhận dấu chấm đơn như dấu thập phân từ bàn phím crypto, nhưng không nhận dấu phân nhóm trong input. Chuỗi có cả hai dấu hoặc nhiều dấu phải báo lỗi rõ, không đoán giá trị. Ví dụ nhập `1.234` nghĩa là `1,234`, không phải một nghìn hai trăm ba mươi tư.
- Danh sách có thể rút gọn đến 6 chữ số thập phân. Giá theo độ chính xác tick của pool; review và chi tiết cho xem đủ độ chính xác token. Số dương quá nhỏ phải hiển thị dạng `< 0,000001` kèm cách xem giá trị đầy đủ, không đổi thành 0. Không dùng ký pháp khoa học trong amount/review.
- Giá trị rút gọn chỉ phục vụ hiển thị. Không dùng chuỗi đã làm tròn để tạo giao dịch hoặc tính số dư; không chuyển số nguyên on-chain lớn qua JavaScript `number`.
- Giá trị ước tính có chữ “Dự kiến” hoặc “Ước tính”; phí giao dịch và gas tách riêng, kèm tài sản trả phí. Dữ liệu thiếu hiển thị “Chưa có dữ liệu”, không dùng 0.
- Địa chỉ/digest ở danh sách rút gọn phần đầu và cuối, ví dụ `0x1234…abcd`; thao tác sao chép lấy toàn bộ. Review cho mở/xem đầy đủ địa chỉ và manager ID; explorer link dùng đúng Testnet.
- Thời gian lịch sử theo múi giờ thiết bị, có ngày và giờ, kèm tên múi giờ ở tiêu đề hoặc chi tiết. Dữ liệu thị trường hiển thị “Cập nhật cách đây …” và thời điểm tuyệt đối trong chi tiết.
- Stale phụ thuộc ngưỡng cấu hình và timestamp nguồn; không giả là mới chỉ vì trình duyệt vừa nhận response.

## 8. Review, trạng thái giao dịch và lỗi

### 8.1. Review trước mọi thao tác ghi

Tạo tài khoản, nạp, rút, đổi token, đặt lệnh và hủy lệnh đều có màn hình review trước khi gọi ví ký. Chỉ hiển thị trường áp dụng cho thao tác đó, theo thứ tự: hành động và mạng, cặp/tài sản, nguồn và đích, lượng/giá, tổng hoặc lượng nhận tối thiểu, phí và gas, cảnh báo, nút **“Xác nhận và ký”**.

Cảnh báo tác động giá lớn theo cấu hình yêu cầu một xác nhận bổ sung chưa chọn sẵn. Preview phải còn hợp lệ tại thời điểm xác nhận. Đổi account, network hoặc pool đóng review và yêu cầu tạo preview mới. Dữ liệu thay đổi ảnh hưởng kết quả không được âm thầm giữ nút ký ở trạng thái khả dụng.

### 8.2. Vòng đời giao dịch

| Trạng thái           | Nội dung UI                  | Hành vi                                                                         |
| -------------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| `awaiting_signature` | “Đang chờ bạn ký trong ví”   | Giữ tác vụ hiện tại, chặn yêu cầu ký trùng; người dùng có thể từ chối trong ví  |
| `submitted`          | “Đã gửi, đang chờ xác nhận”  | Hiển thị digest/explorer; khóa submit tương ứng, tiếp tục theo dõi              |
| `confirmed`          | “Giao dịch đã được xác nhận” | Refresh số dư/lệnh; nếu indexer chưa kịp, hiển thị “Đang đồng bộ dữ liệu” riêng |
| `failed`             | “Giao dịch không thành công” | Hiển thị lý do chuẩn hóa; chỉ thử lại qua kiểm tra và review mới                |
| `unknown`            | “Chưa xác định được kết quả” | Giữ digest nếu có, cho kiểm tra trạng thái; không tự gửi lại                    |

Reload phải tiếp tục theo dõi giao dịch đã submitted gần nhất theo browser/network/account. Đóng dialog không hủy giao dịch đã gửi. Dismiss trạng thái unknown không đồng nghĩa giao dịch thất bại; giải thích cần kiểm tra kết quả cũ trước khi chủ động tạo giao dịch mới. Không dùng thông báo thành công cho thao tác chỉ vừa mở ví hoặc nhận digest.

### 8.3. Lỗi và cách phục hồi

| Trường hợp                         | Thông báo mẫu                                  | Hành động                                                 |
| ---------------------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| Ví chưa kết nối/chưa có ví phù hợp | “Kết nối ví Sui để tiếp tục”                   | Mở danh sách ví tương thích và hướng dẫn                  |
| Sai mạng                           | “Chuyển ví sang Sui Testnet để giao dịch”      | Hướng dẫn chuyển mạng; chặn ký                            |
| Thiếu tài sản                      | “Số lượng vượt quá số dư khả dụng”             | Sửa lượng hoặc nạp đúng nguồn                             |
| Thiếu gas                          | “Bạn cần thêm SUI để trả phí mạng”             | Mở hướng dẫn faucet; chặn ký                              |
| Lượng dưới tối thiểu/sai bước giá  | “Lượng tối thiểu là …” / “Giá cần theo bước …” | Hiển thị quy tắc pool và giá trị sửa đề xuất              |
| Sổ lệnh rỗng                       | “Chưa có thanh khoản cho giao dịch này”        | Cho xem thị trường khác; không tạo preview giả            |
| Báo giá cũ                         | “Dữ liệu đã cũ. Cập nhật trước khi tiếp tục”   | Tải preview mới, chặn ký                                  |
| Từ chối ký                         | “Bạn đã từ chối ký giao dịch”                  | Giữ form và cho xem lại; không trình bày như lỗi hệ thống |
| Đọc dữ liệu timeout                | “Chưa thể tải dữ liệu thị trường”              | Thử lại có giới hạn; giữ nhãn dữ liệu cũ nếu có           |
| Indexer trễ                        | “Giao dịch đã xác nhận, dữ liệu đang đồng bộ”  | Tiếp tục đọc và giữ bằng chứng on-chain                   |
| On-chain abort                     | “Giao dịch không thành công: …”                | Lý do dễ hiểu, digest và review mới nếu thử lại           |
| Không rõ kết quả gửi               | “Chưa xác định được kết quả giao dịch”         | Kiểm tra trạng thái/explorer, không tự gửi lại            |

Lỗi không hiển thị stack trace, raw payload hay khóa bí mật. Lỗi field hiện gần field và được liên kết bằng mô tả truy cập; lỗi tác vụ ở panel giữ nguyên cho đến khi được xử lý.

## 9. Responsive và khả năng truy cập

### 9.1. Bố cục theo chiều rộng

| Mốc kiểm tra | Bố cục                                                                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 375 px       | Padding ngang 16 px; một cột. Header logo, ví và menu gọn. Hero đặt CTA trước hình. Trade ưu tiên form; Sổ lệnh, Giao dịch gần nhất, Lệnh mở và Lịch sử dùng tab riêng. Dialog rộng theo viewport, nội dung cuộn trong vùng khả dụng |
| 768 px       | Padding 24 px; Swap vẫn tối đa 480 px. Markets/Portfolio dùng bảng khi cột đủ chỗ; Trade vẫn giữ form và vùng dữ liệu xếp dọc. Menu gọn nếu nhãn tiếng Việt không vừa                                                                |
| 1024 px      | Padding 32 px; header một dòng. Trade dùng lưới `minmax(0, 1fr) 340px`: dữ liệu bên trái, form bên phải, lệnh bên dưới. Landing hero hai cột                                                                                         |
| 1440 px      | Nội dung thường tối đa 1200 px; Trade tối đa 1440 px gồm padding, form 360 px, vùng còn lại cho sổ lệnh/giao dịch gần nhất. Không kéo giãn form Swap                                                                                 |

Giữa các mốc, bố cục co giãn bằng Grid/Flex. Nếu header không đủ chỗ, dùng menu thay vì xuống hai dòng. Không tạo cuộn ngang toàn trang. Trên mobile, lệnh/lịch sử dùng thẻ có nhãn và chi tiết mở rộng; đặt lệnh, hủy, nạp và rút vẫn dùng được. Vùng review và nút xác nhận phải truy cập được khi bàn phím ảo mở; không để sticky CTA che lỗi hoặc trường nhập.

### 9.2. Tiêu chí truy cập

- Tương phản chữ thường tối thiểu 4,5:1; chữ lớn tối thiểu 3:1; dấu nhận biết control và focus tối thiểu 3:1 với nền liền kề. Đo theo cặp màu thực tế, không suy từ tên token.
- Focus dùng vòng 2 px màu focus, offset 2 px. Không bỏ outline nếu chưa có cách thay thế; header và overlay không che phần tử đang focus.
- Vùng chạm ít nhất 44 × 44 px, cách control liền kề ít nhất 8 px khi có thể. Input có label thật; icon-only button có tên rõ.
- Dialog đưa focus vào tiêu đề/nội dung đầu phù hợp, trap focus và hỗ trợ Escape. Đóng dialog không dừng theo dõi giao dịch; khôi phục focus hợp lý khi nút mở không còn tồn tại.
- Status quan trọng dùng thông báo truy cập phù hợp; lỗi chặn tác vụ được thông báo một lần. Không đọc liên tục mọi thay đổi giá/sổ lệnh.
- Trạng thái mua/bán, tăng/giảm, warning/error có nhãn hoặc dấu kèm màu. Hình trang trí có alt rỗng; hình mang thông tin có mô tả tiếng Việt.
- Thử bàn phím, zoom 200%, dấu tiếng Việt, số rất dài, token trùng symbol và giảm chuyển động. Nội dung quan trọng không chỉ có ở hover.

## 10. Checklist áp dụng và nghiệm thu UI

Các mục sau dùng khi triển khai giao diện, không phải tuyên bố đã kiểm thử một UI hiện có.

- [ ] Route, nhãn và chế độ mặc định đúng tài liệu; CTA mở pool cấu hình hoặc Markets khi không có pool.
- [ ] Token màu, font, spacing, radius và icon thống nhất; đo tương phản trên cả trạng thái hover/focus/disabled.
- [ ] Landing có nội dung tiếng Việt, CTA rõ và banner Testnet; không có số liệu hoặc bằng chứng xã hội giả.
- [ ] Đổi token và Nâng cao thể hiện rõ nguồn tài sản, phí/gas, thời điểm dữ liệu và giới hạn giao dịch.
- [ ] Kiểm thử chưa có ví, sai mạng, đổi account/pool trong review, thiếu gas/tài sản, sổ lệnh rỗng, stale và indexer trễ.
- [ ] Kiểm thử từ chối ký, gửi thành công nhưng chưa xác nhận, confirmed, failed, unknown, reload và tránh gửi trùng.
- [ ] Lệnh khớp một phần/hủy và số dư ví/khả dụng/khóa/settled không bị diễn giải nhầm; không cộng đúp số dư.
- [ ] Parse/format số theo quy tắc Việt Nam, số rất nhỏ, số lớn và rounding của pool không làm sai amount được ký.
- [ ] Các chức năng cốt lõi hoạt động ở 375, 768, 1024 và 1440 px; kiểm tra bàn phím ảo, zoom, keyboard và reduced motion.
- [ ] Khi thêm UI thật, chạy các kiểm tra liên quan của repository và kiểm tra trong browser; ghi rõ phần chưa kiểm chứng.

## 11. Quy tắc duy trì tài liệu

PRD quyết định nghiệp vụ, code/schema phản ánh trạng thái triển khai, DESIGN.md quyết định cách trình bày và tương tác trong phạm vi đã chốt. Nếu phát hiện xung đột nghiệp vụ, nêu rõ và chốt trước khi đổi hành vi; không dùng ví dụ UI để tự thay đổi giao thức hoặc ngưỡng bảo vệ.

Khi bổ sung component, ưu tiên mở rộng mẫu hiện có và cập nhật token/quy tắc tại đây nếu có thay đổi dùng chung. Tính năng chỉ dự kiến phải được ghi rõ; không gắn nhãn hoàn thành từ một bản mockup. Light mode, đa ngôn ngữ, mainnet và các sản phẩm ngoài spot cần yêu cầu riêng.
