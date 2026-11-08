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

## Kiểm tra lại chỉ đọc ngày 03/11/2026

Chạy `pnpm --filter @whaledex/web verify:testnet` không truyền địa chỉ ví lúc
**08:12:50 UTC+7**. Provider đầu tiên trả kết quả thành công trong 2341 ms;
checkpoint đầu lượt `402206454`. Các lần đọc không phải một snapshot atomic.

- Network, package storage/original ID (version 20), registry, pool type và decimals
  vẫn khớp bảng lịch sử ở trên.
- SUI/DBUSDC có bid và ask; probe bán 2 SUI trả quote 1,998 DBUSDC,
  probe mua bằng 2 DBUSDC trả quote 1,9 SUI và dư 0,0981 DBUSDC.
- DEEP/SUI trả quote cả hai chiều: 20 DEEP → 0,4934 SUI;
  2 SUI → 76 DEEP và dư 0,01336 SUI.
- Tất cả là quote simulation; không ký, không gửi giao dịch và không xác minh số dư
  hay việc nhận token của bất kỳ ví nào (`funding: wallet_not_supplied`).

Quan sát này chỉ xác nhận có thanh khoản cho các probe tại thời điểm kiểm tra;
không đóng các điều kiện nghiệm thu ví thật, funding hoặc provider dự phòng.

## Kiểm tra lại chỉ đọc ngày 08/11/2026

Chạy `pnpm --filter @whaledex/web verify:testnet` lúc **13:54:18 UTC**; checkpoint đầu
lượt `404219133`. Provider mặc định thành công ngay lần thử đầu sau 2243 ms. Các lần đọc
không phải snapshot atomic.

- Network `testnet`; DeepBook package version 20, storage/original ID và registry khớp.
- On-chain metadata: SUI 9 decimals, DBUSDC 6, DEEP 6.
- SUI/DBUSDC: registry và object type khớp; best bid 0,999 (20,8 SUI), best ask
  1,001 (13,9 SUI). Simulation bán 2 SUI trả 1,998 DBUSDC, phí 0,061651 DEEP;
  mua bằng 2 DBUSDC trả 1,9 SUI, dư 0,0981 DBUSDC, phí 0,058686 DEEP.
- DEEP/SUI: registry và object type khớp; best bid 0,02467, best ask 0,02614
  SUI/DEEP. Simulation bán 20 DEEP trả 0,4934 SUI; mua bằng 2 SUI trả 76 DEEP,
  dư 0,01024 SUI; phí DEEP bằng 0 ở hai probe.
- `funding: wallet_not_supplied`: không có địa chỉ ví trong môi trường kiểm tra, nên
  lượt này không đọc số dư ví. Không ký hoặc gửi giao dịch và không có digest.

Đây là bằng chứng đọc metadata, pool và quote simulation tại checkpoint nêu trên;
không thay thế kiểm tra kết nối ví, số dư của ví thật, ký/xác nhận giao dịch hoặc peer review.

## WHA-10 — kiểm thử swap đã ký bằng ví thật

Trạng thái: **In Progress**. Các test tự động của web dùng fixture/mock, còn lệnh
`verify:testnet` chỉ đọc và mô phỏng quote; cả hai không chứng minh wallet signature hay
transaction đã xác nhận. Lượt kiểm tra hiện tại không có `SUI_TESTNET_ADDRESS` và không
có phiên ví Testnet đang mở để chạy demo. Chưa có digest, ảnh chụp balance trước/sau hoặc
peer review nên chưa đủ điều kiện Done.

Lượt đọc bổ sung lúc **15:31:27 UTC ngày 08/11/2026**, checkpoint `404242843`: SUI/DBUSDC
có bid `0,999` và ask `1,001`; probe bán 2 SUI quote 1,998 DBUSDC, probe mua 2 DBUSDC
quote 1,9 SUI. Cả hai đều là simulation (`quoted`), còn `funding` là
`wallet_not_supplied`; lượt này không đọc balance, ký hoặc gửi transaction.

Để hoàn tất WHA-10, chạy production build và ghi bằng chứng riêng cho tối thiểu hai ví Sui
Testnet, trên trình duyệt và phiên bản wallet đã ghi nhận:

| Kịch bản                                               | Ví A      | Ví B      | Bằng chứng cần lưu                                                    |
| ------------------------------------------------------ | --------- | --------- | --------------------------------------------------------------------- |
| Connect, kiểm tra network/coin type và số dư trước     | Chưa chạy | Chưa chạy | Tên wallet, browser/version, thời gian và số dư SUI/DBUSDC/DEEP       |
| Buy DBUSDC → SUI, ký và đợi xác nhận                   | Chưa chạy | Chưa chạy | Ảnh review, digest/Explorer, số dư sau                                |
| Sell SUI → DBUSDC, ký và đợi xác nhận khi có liquidity | Chưa chạy | Chưa chạy | Ảnh review, digest/Explorer, số dư sau                                |
| Từ chối ký; thiếu gas, input hoặc DEEP                 | Chưa chạy | Chưa chạy | Kết quả UI, xác nhận không phát sinh digest mới                       |
| RPC outage và reload trạng thái unknown                | Chưa chạy | Chưa chạy | Digest được giữ lại, app không tự gửi lại, trạng thái sau khi tra cứu |

Không lưu seed phrase, private key, session token hoặc thông tin đăng nhập. Không coi quote
simulation hay test mock là giao dịch thật. Nếu pool thiếu thanh khoản hoặc ví thiếu token,
ghi rõ blocker và giữ task In Progress; không đổi coin/pool để tạo bằng chứng thay thế.

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
  giao dịch ký nghiệm thu. SUI/DBUSDC thiếu bid trong lượt 12/10; lượt 03/11 có
  quote hai chiều, nhưng vẫn chưa có giao dịch được ký để nghiệm thu.
- DEP-03: xác minh nguồn và quy trình yêu cầu; **chưa nhận DBUSDC/DEEP** trong ví kiểm tra.

WHA-6 chưa đủ điều kiện Done cho toàn bộ acceptance. Theo dõi receipt token,
provider và liquidity blocker trên Linear; không thay pool/token bằng tài sản khác âm thầm.

Nguồn bổ sung: [gRPC client](https://sdk.mystenlabs.com/sui/clients/grpc),
[faucet usage](https://faucet.sui.io/how-to-use/). Nguồn funding xác nhận có form cấp
token và đường bootstrap tùy thanh khoản; kết quả số dư/quote ở trên là quan sát trực tiếp.
