# WHA-6 — Kiểm chứng Sui Testnet và nguồn token

## Chạy lại

Từ root, sau `pnpm install --frozen-lockfile`:

```powershell
# Không bắt buộc: địa chỉ công khai để kiểm tra số dư, không phải private key.
$env:SUI_TESTNET_ADDRESS = '<địa chỉ Sui Testnet của bạn>'
pnpm --filter @whaledex/web verify:testnet
Remove-Item Env:SUI_TESTNET_ADDRESS
```

Nếu chỉ kiểm tra hạ tầng, bỏ biến địa chỉ. Script không đọc `.env` tự động, không ký,
không gửi transaction, không yêu cầu faucet và không lưu khóa. Quote là simulation;
số lượng probe có thể lớn hơn số dư ví vì không phải lệnh giao dịch.

Script xác minh network, package storage ID/original ID, pool từ registry, object type
với đúng base/quote coin, decimals từ metadata; đọc book, lot/minimum size và quote
hai chiều của `SUI_DBUSDC` và `DEEP_SUI`. Amount/fee dùng BCS integer string;
book và params dùng số hiển thị từ SDK, không dùng để xây transaction.

Exit 0 chỉ chứng minh lượt đọc hoàn tất. Cần kiểm tra `funding` và từng `quotes[].status`:
`missing_tokens`, `no_liquidity`, `simulation_failed` không đủ điều kiện nghiệm thu swap.
Exit 1 khi provider không dùng được hoặc xác minh thất bại. Báo cáo không in URL provider
hay upstream error có thể chứa credential; số dư chỉ xuất khi operator truyền địa chỉ.

## Provider, timeout và fallback

- Mặc định: `https://fullnode.testnet.sui.io:443`, gRPC qua SDK Sui 2.34.0.
- Tùy chọn `SUI_VERIFY_URLS`: 1–3 URL HTTPS phân cách dấu phẩy, theo thứ tự ưu tiên.
  Đây là env chỉ cho CLI kiểm chứng, không phải `NEXT_PUBLIC_*`; không commit credential.
- Mỗi RPC timeout 10 giây, cả lượt kiểm chứng một provider tối đa 30 giây. Tối đa
  2 lần/provider, chờ 1 giây trước retry; hết số lần mới sang provider tiếp theo.
  Timeout hủy fetch đang chạy. Sai network/package/pool/decimals: dừng ngay, không
  dùng fallback để che lỗi cấu hình. Chạy tuần tự, không flood/probe giới hạn bằng tải lớn.
- Test outage mô phỏng primary lỗi → retry → fallback thành công; test hanging read
  → abort; test hết provider; test sai network không retry. Chạy bằng
  `node --test apps/web/scripts/read-providers.test.mjs` (cũng nằm trong `pnpm test`).
- Chưa có provider thứ hai được nhóm cấp/xác minh trên môi trường thật. Fallback mới
  được kiểm tra bằng fault injection, không tuyên bố dự phòng độc lập đã hoạt động.
- Không có quota/SLA gRPC được xác nhận trong tài liệu đã đọc. Không lấy quota JSON-RPC
  áp dụng cho gRPC. Public endpoint dùng development; khi gặp throttling dừng các lượt
  chạy thủ công lặp lại, chờ hoặc dùng provider có quota được cấp. Trước beta cần owner
  xác nhận quota, provider dự phòng và smoke test lại.
- CLI này không thay đổi retry/fallback của ứng dụng. Web/API hiện vẫn dùng một endpoint
  đã cấu hình; không tự retry thao tác ký/gửi. Chỉ mở rộng runtime sau review riêng.

## Bằng chứng chỉ đọc ngày 12/10/2026

Lượt đọc lúc **15:49:40 UTC (22:49:40 UTC+7)**; checkpoint đầu lượt `394128370`.
Các request không phải snapshot atomic của cùng checkpoint. Lượt đầu thành công trong
7311 ms; không benchmark SLA hoặc xác nhận dữ liệu vẫn còn mới.

| Kiểm tra                     | Kết quả                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| Network                      | `testnet`                                                                                |
| DeepBook package storage ID  | `0xd874d2417a55bfa6479bffa06ad950fea144ef93a94cc6c49f32b03e386bbb24`                     |
| Original package ID, version | `0xfb28c4cbc6865bd1c897d26aecbe1f8792d1509a20ffec692c800660cbec6982`, version 20         |
| Registry                     | `0x7c256edbda983a2cd6f946655f4bf3f00a41043993781f8674a7046e8c0e11d1`                     |
| SUI/DBUSDC pool              | `0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5`, registry/type khớp |
| DEEP/SUI pool                | `0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f`, registry/type khớp |
| Decimals on-chain            | SUI 9, DBUSDC 6, DEEP 6                                                                  |
| Ví do người dùng cung cấp    | 1 SUI, 0 DBUSDC, 0 DEEP; không đưa địa chỉ ví vào repo                                   |
| SUI/DBUSDC                   | Bid rỗng; best ask 1,496 DBUSDC/SUI; lot 0,1 SUI, minimum 1 SUI                          |
| Quote mua bằng 2 DBUSDC      | 1,3 SUI; remainder 0,0546 DBUSDC; fee 0,060028 DEEP                                      |
| Quote bán 2 SUI              | 0 DBUSDC; `no_liquidity`                                                                 |
| DEEP/SUI                     | Best bid 0,025; best ask 0,02582 SUI/DEEP; minimum 10 DEEP                               |
| Quote 2 SUI → DEEP           | 77 DEEP; remainder 0,01186 SUI; fee 0 DEEP; simulation, ví chưa đủ 2 SUI                 |
| Quote 20 DEEP → SUI          | 0,49487 SUI; simulation, ví chưa có DEEP                                                 |

Không có transaction được gửi. Package storage ID khác original ID là bình thường
khi package được nâng cấp; script đối chiếu pool type với original ID on-chain.

## Nhận token đúng loại

1. Mở [Sui faucet](https://faucet.sui.io/?network=testnet), chọn **Testnet** và địa chỉ
   ví của bạn. Kiểm tra số dư trước; ví đã có 1 SUI nên không cần yêu cầu lặp lại ngay.
2. Theo [hướng dẫn funding chính thức](https://www.docs.sui.io/onchain-finance/deepbook/deepbookv3/fees-and-funding),
   dùng [form DeepBook Testnet](https://tally.so/r/Xx102L) yêu cầu **DBUSDC và DEEP**.
   Chủ ví tự điền email, Telegram, mô tả WhaleDEX, địa chỉ công khai, lý do và kế hoạch
   hoàn trả phù hợp. Không đưa seed/private key vào form; không tự hứa thời điểm hoàn trả
   thay người nhận. Việc cấp token do đơn vị vận hành form xử lý, không tức thời.
3. Sau khi nhận, chạy lại CLI với địa chỉ ví. Đối chiếu đầy đủ type, không chỉ symbol:

| Coin   | Type                                                                                 |
| ------ | ------------------------------------------------------------------------------------ |
| SUI    | `0x2::sui::SUI`                                                                      |
| DBUSDC | `0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDC` |
| DEEP   | `0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP`     |

4. DEEP/SUI có thể là phương án lấy DEEP bằng SUI faucet khi còn thanh khoản, nhưng
   WhaleDEX hiện chỉ có UI swap SUI/DBUSDC. Không dùng quote probe 2 SUI như lệnh sẵn ký;
   cần flow bootstrap riêng, review amount/minOut/gas và chữ ký chủ ví. Form là đường
   onboarding mặc định; không cần mua token thật.
5. Sau số dư hợp lệ vẫn phải kiểm tra quote/fee/gas/liquidity mới và thực hiện WHA-10
   bằng ví thật. Token có số dư không chứng minh swap sẽ thành công.

## Trạng thái DEP-01..03

- DEP-01: public provider smoke đạt; bounded retry/timeout/fallback CLI có test.
  Còn quota/SLA và provider dự phòng thật trước beta.
- DEP-02: SDK 2.6.4, package/registry/types/decimals/pools đã đối chiếu; chưa có
  giao dịch ký nghiệm thu. SUI/DBUSDC thiếu bid nên chưa thể nghiệm thu hai chiều.
- DEP-03: xác minh nguồn và quy trình yêu cầu; **chưa nhận DBUSDC/DEEP** trong ví kiểm tra.

WHA-6 chưa đủ điều kiện Done cho toàn bộ acceptance. Theo dõi receipt token,
provider và liquidity blocker trên Linear; không thay pool/token bằng tài sản khác âm thầm.

Nguồn bổ sung: [gRPC client](https://sdk.mystenlabs.com/sui/clients/grpc),
[faucet usage](https://faucet.sui.io/how-to-use/). Nguồn funding xác nhận có form cấp
token và đường bootstrap tùy thanh khoản; kết quả số dư/quote ở trên là quan sát trực tiếp.
