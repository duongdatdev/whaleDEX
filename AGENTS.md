# Quy tắc làm việc dành cho AI agent

File này áp dụng cho toàn bộ repository. Nếu một thư mục con có `AGENTS.md` riêng, agent phải tuân thủ cả file này và các quy tắc cụ thể hơn trong thư mục đó. Chỉ thị của hệ thống và yêu cầu trực tiếp của người dùng luôn có độ ưu tiên cao hơn.

## 1. Quy trình bắt buộc trước khi thực hiện

1. Xác định chính xác phạm vi yêu cầu và kiểm tra trạng thái working tree trước khi sửa.
2. Tìm và đọc đầy đủ các `AGENTS.md` áp dụng cho file sẽ thay đổi.
3. Tuân thủ nguyên tắc "Code & Schema First": ưu tiên đọc source code, schema, cấu hình và test liên quan trực tiếp; không duyệt tràn lan repository để tránh lãng phí context/token.
4. Kiểm tra danh sách skill đang khả dụng. Bắt buộc sử dụng mọi skill phù hợp trực tiếp với công việc và đọc đầy đủ hướng dẫn của skill trước khi hành động. Chỉ dùng bộ skill tối thiểu đủ để hoàn thành yêu cầu; nếu skill cần thiết không khả dụng, nêu rõ và dùng phương án thay thế tốt nhất.
5. Nêu rõ giả định quan trọng. Chỉ hỏi người dùng khi không thể tìm câu trả lời trong repository và việc tự giả định có thể làm thay đổi đáng kể phạm vi hoặc hành vi sản phẩm.

## 2. Code & Schema First và tiết kiệm context

- **Dữ liệu**: Đọc trực tiếp `apps/api/prisma/schema.prisma`, migration và seed liên quan khi cần hiểu bảng, trường hoặc quan hệ.
- **API**: Đọc controller, DTO, service, guard và hợp đồng OpenAPI được sinh từ code liên quan trực tiếp.
- **Logic & UI**: Đọc component, hook, service, state và test gần nhất với hành vi cần thay đổi.
- **Cấu hình**: Đọc đúng `package.json`, `tsconfig`, file môi trường mẫu hoặc cấu hình của workspace chịu ảnh hưởng; không mở file lock nếu không xử lý dependency.
- **Tra cứu có mục tiêu**: Dùng `rg`/`rg --files` để định vị trước, sau đó chỉ đọc đoạn hoặc file cần thiết. Không duyệt toàn bộ thư mục lớn khi chưa có lý do cụ thể.
- **Không đọc mặc định**: Bỏ qua `node_modules/`, `dist/`, artifact build, file tạm, file log và file lock, trừ khi chúng liên quan trực tiếp đến yêu cầu.
- Xem code, schema, test và hành vi đang chạy là nguồn sự thật chính. Nếu chúng mâu thuẫn nhau, nêu rõ bằng chứng và chọn thay đổi nhỏ nhất giữ đúng ý định sản phẩm.
- Không tự tạo tài liệu quản trị, PRD, BRD, sơ đồ hoặc ADR trừ khi người dùng yêu cầu hoặc thay đổi kỹ thuật thực sự cần ghi lại quyết định quan trọng.

## 3. Thực hiện và kiểm chứng

- Ưu tiên thay đổi nhỏ nhất nhưng hoàn chỉnh, đúng kiến trúc và không sửa ngoài phạm vi.
- Bảo toàn thay đổi có sẵn của người dùng; không ghi đè, hoàn tác hoặc đưa thay đổi không liên quan vào commit.
- Thêm hoặc cập nhật test phù hợp với mức rủi ro. Chạy các bước kiểm tra liên quan như format, lint, typecheck, unit/integration test và build trước khi xem công việc là hoàn thành; ưu tiên lệnh phạm vi hẹp trước rồi mới chạy toàn repository khi cần.
- Nếu không thể chạy một bước kiểm tra, phải ghi rõ bước nào chưa chạy, lý do và rủi ro còn lại.
- Không commit secret, credential, dữ liệu nhạy cảm, file tạm hoặc artifact sinh ra ngoài chủ đích.

## 4. Commit bắt buộc cho từng đơn vị công việc

Mặc định, nếu người dùng không đưa ra chỉ dẫn nào về việc commit, agent phải tuân thủ toàn bộ quy tắc commit trong mục này. Nếu người dùng yêu cầu rõ ràng không commit, agent không tạo commit cho công việc đó; thay đổi có thể được bàn giao ở trạng thái chưa commit và phải nêu rõ trạng thái này khi bàn giao.

Mỗi đơn vị công việc độc lập chỉ được coi là hoàn thành sau khi đã kiểm chứng và tạo commit Git riêng, trừ trường hợp người dùng đã yêu cầu không commit. Không bắt đầu đơn vị công việc độc lập tiếp theo khi phần vừa hoàn thành vẫn chưa được commit, trừ trường hợp ngoại lệ này.

Work package, epic hoặc feature lớn không phải là đơn vị commit mặc định. Ngay khi hoàn thành một lát cắt độc lập, có thể kiểm chứng và repository đang ở trạng thái hoạt động, agent phải commit lát cắt đó trước khi chuyển sang lát cắt tiếp theo. Không chờ hoàn thành toàn bộ work package mới commit; một work package lớn có thể và thường phải gồm nhiều commit nguyên tử. Không tạo commit cho trạng thái dở dang hoặc đã biết là lỗi chỉ để đánh dấu tiến độ.

Trước mỗi commit:

1. Chạy `git status` và xem lại diff.
2. Chỉ stage các file thuộc đúng đơn vị công việc; code, test, schema, migration và cấu hình liên quan phải nằm trong cùng commit nguyên tử.
3. Chạy các kiểm tra phù hợp và không commit trạng thái đã biết là lỗi.
4. Tạo commit theo Conventional Commits.

Định dạng:

```text
<type>(<scope tùy chọn>): <mô tả ngắn ở thể mệnh lệnh>
```

Các `type` chuẩn:

- `feat`: thêm hoặc thay đổi chức năng người dùng.
- `fix`: sửa lỗi.
- `docs`: chỉ thay đổi tài liệu.
- `test`: chỉ thêm hoặc sửa kiểm thử.
- `refactor`: tái cấu trúc không đổi hành vi.
- `perf`: cải thiện hiệu năng.
- `style`: thay đổi định dạng không ảnh hưởng logic.
- `build`: thay đổi hệ thống build hoặc dependency.
- `ci`: thay đổi pipeline CI/CD.
- `chore`: công việc bảo trì không thuộc các loại trên.

Ví dụ hợp lệ:

```text
feat(auth): add Google sign-in callback
fix(progress): prevent duplicate daily completion
docs: add agent workflow rules
```

Mô tả commit phải cụ thể, ngắn gọn, không kết thúc bằng dấu chấm; thêm body giải thích lý do khi thay đổi không hiển nhiên. Dùng `!` và footer `BREAKING CHANGE:` cho thay đổi phá vỡ tương thích.

Không amend, rebase, force-push hay sửa lịch sử commit có sẵn nếu người dùng chưa yêu cầu rõ. Nếu chưa có Git repository và root dự án đã được xác định chắc chắn, khởi tạo Git tại root trước khi làm việc. Nếu không thể commit vì hook, xung đột, quyền truy cập hoặc cấu hình Git, không được tuyên bố công việc đã hoàn thành; phải báo chính xác blocker và trạng thái file.

Khi bàn giao một công việc có commit, luôn cung cấp mã commit và tiêu đề commit vừa tạo, cùng kết quả kiểm chứng. Khi người dùng đã yêu cầu không commit, phải nói rõ rằng thay đổi chưa được commit.
