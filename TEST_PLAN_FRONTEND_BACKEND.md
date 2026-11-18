# Kế Hoạch Kiểm Thử (Test Plan) Tích Hợp Frontend & Backend

> **Dự án**: Hệ thống quản lý công việc Trello Work  
> **Phiên bản**: v1.0.0 (Giai đoạn tích hợp REST API)  
> **Mục tiêu**: Đảm bảo toàn bộ luồng nghiệp vụ từ giao diện người dùng (Next.js) gọi đến máy chủ dịch vụ (Spring Boot) và lưu trữ dữ liệu bền vững (Database) hoạt động chính xác, ổn định và không phát sinh lỗi dữ liệu.

---

## 1. Môi trường & Điều kiện tiên quyết (Prerequisites)

| Thành phần | Địa chỉ / Cấu hình | Yêu cầu chuẩn bị |
| :--- | :--- | :--- |
| **Backend API** | `http://localhost:8080` | Spring Boot chạy sẵn sàng (`./gradlew bootRun`), kết nối DB MySQL/PostgreSQL |
| **Frontend UI** | `http://localhost:3000` | Next.js chạy (`npm run dev`) với `NEXT_PUBLIC_API_URL=http://localhost:8080` |
| **Swagger UI** | `http://localhost:8080/swagger-ui/index.html` | Dùng để đối chiếu payload request/response |
| **Tài khoản test** | 02 tài khoản | `tester_admin@example.com` (Admin), `tester_member@example.com` (Member) |

---

## 2. Ma Trận Kịch Bản Kiểm Thử (Test Matrix)

### Giai đoạn 1: Xác thực & Không gian làm việc (Auth & Workspace)

| Mã Test | Chức năng kiểm thử | Các bước thực hiện (Test Steps) | Kết quả mong đợi (Expected Result) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Đăng ký tài khoản mới | 1. Vào `/register`<br>2. Nhập Email, Mật khẩu, Họ tên<br>3. Bấm "Đăng ký" | Tạo thành công user trong DB, lưu JWT Token và chuyển sang `/boards`. | `[ ] Chưa test` |
| **AUTH-02** | Đăng nhập tài khoản | 1. Vào `/login`<br>2. Nhập email/password hợp lệ<br>3. Bấm "Đăng nhập" | Trả về JWT token, lưu vào Cookie/LocalStorage (`trello_token`), chuyển vào `/boards`. | `[ ] Chưa test` |
| **AUTH-03** | Auto Create Default Workspace | 1. Đăng ký tài khoản mới tinh (chưa có workspace)<br>2. Tạo 1 bảng mới ngay lập tức | Backend tự sinh Workspace mặc định ("Không gian làm việc chính"), không bị lỗi `Workspace not found with id: '1'`. | `[ ] Chưa test` |

---

### Giai đoạn 2: Quản lý Bảng làm việc (Board Management)

| Mã Test | Chức năng kiểm thử | Các bước thực hiện (Test Steps) | Kết quả mong đợi (Expected Result) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **BRD-01** | Tạo bảng mới (Color/Image) | 1. Tại `/boards`, bấm "Tạo bảng mới"<br>2. Nhập tiêu đề, chọn màu nền gradient / ảnh nền<br>3. Bấm "Tạo mới" | API `POST /api/v1/boards` trả về 201. Bảng mới xuất hiện trên Dashboard và có thể click vào chi tiết `/boards/{id}`. | `[ ] Chưa test` |
| **BRD-02** | Tải chi tiết bảng (Load Board) | 1. Truy cập vào `/boards/{id}` vừa tạo | API `GET /api/v1/boards/{id}` trả về danh sách cột, thẻ, nhãn, thành viên thực từ Database. Không còn dữ liệu mock. | `[ ] Chưa test` |
| **BRD-03** | Gắn sao yêu thích (Toggle Star) | 1. Click vào icon ngôi sao ở Navbar trên bảng hoặc Dashboard | API `PATCH /api/v1/boards/{id}` gửi `{ starred: true/false }`. Giao diện cập nhật màu vàng ngay lập tức. | `[ ] Chưa test` |
| **BRD-04** | Mời thành viên vào bảng | 1. Mở modal "Chia sẻ" trên thanh header của Board<br>2. Nhập email `tester_member@example.com`, chọn role MEMBER<br>3. Bấm "Chia sẻ" | API `POST /api/v1/boards/{id}/members` được gọi. Thành viên xuất hiện trong danh sách với trạng thái PENDING/ACTIVE. | `[ ] Chưa test` |
| **BRD-05** | Đổi quyền / Xóa thành viên | 1. Chọn dropdown role của thành viên đổi sang OBSERVER<br>2. Thử xóa 1 thành viên khỏi bảng | `PATCH /api/v1/boards/{id}/members/{mId}` và `DELETE /api/v1/boards/{id}/members/{mId}` thành công. | `[ ] Chưa test` |

---

### Giai đoạn 3: Danh sách công việc / Cột (Lists Management)

| Mã Test | Chức năng kiểm thử | Các bước thực hiện (Test Steps) | Kết quả mong đợi (Expected Result) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **LST-01** | Thêm danh sách mới | 1. Bấm "+ Thêm danh sách khác"<br>2. Nhập tên: "Sprint Backlog"<br>3. Nhấn "Thêm danh sách" | API `POST /api/v1/boards/{id}/lists` được gọi. Cột mới hiển thị ngay lập tức với ID thực từ Backend. | `[ ] Chưa test` |
| **LST-02** | Kéo thả đổi vị trí cột (Reorder) | 1. Kéo cột thứ 1 sang vị trí thứ 3 | Optimistic UI đổi vị trí mượt mà. API `POST /api/v1/boards/{id}/lists/reorder` gửi đúng danh sách `[{listId, position}]`. F5 lại giữ nguyên vị trí. | `[ ] Chưa test` |
| **LST-03** | Lưu trữ cột (Archive List) | 1. Click menu 3 chấm trên cột -> "Lưu trữ danh sách này" | Cột biến mất khỏi màn hình chính. API `PATCH /api/v1/lists/{id}` gửi `{ isArchived: true }`. | `[ ] Chưa test` |
| **LST-04** | Sắp xếp thẻ trong cột | 1. Menu 3 chấm -> "Sắp xếp theo tiêu đề" | API `POST /api/v1/lists/{id}/sort` gọi với `sortType: TITLE_ASC`. Các thẻ trong cột xếp theo A-Z. | `[ ] Chưa test` |

---

### Giai đoạn 4: Thẻ công việc & Kéo thả (Cards & DND)

| Mã Test | Chức năng kiểm thử | Các bước thực hiện (Test Steps) | Kết quả mong đợi (Expected Result) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **CRD-01** | Tạo thẻ mới | 1. Bấm "+ Thêm thẻ" ở đáy cột<br>2. Nhập "Xây dựng tính năng API"<br>3. Bấm "Thêm thẻ" | API `POST /api/v1/lists/{listId}/cards` thực hiện. Thẻ xuất hiện ngay lập tức trên cột. | `[ ] Chưa test` |
| **CRD-02** | Kéo thả thẻ trong cùng cột | 1. Kéo thẻ từ vị trí 1 xuống dưới thẻ vị trí 2 | API `POST /api/v1/cards/{id}/move` gửi `{ targetListId, targetPosition: 2 }`. | `[ ] Chưa test` |
| **CRD-03** | Kéo thả thẻ sang cột khác | 1. Kéo thẻ từ cột "Cần làm" sang cột "Đang làm" | Thẻ di chuyển sang cột mới. API `moveCard` cập nhật `targetListId` mới. F5 trang thẻ vẫn nằm ở cột mới. | `[ ] Chưa test` |
| **CRD-04** | Mở Modal chi tiết thẻ | 1. Click chuột vào thẻ công việc | Modal chi tiết mở lên, tải đầy đủ: mô tả, nhãn, người thực hiện, checklist, bình luận, đính kèm. | `[ ] Chưa test` |
| **CRD-05** | Lưu trữ / Khôi phục thẻ | 1. Bấm "Lưu trữ" trong modal thẻ | `PATCH /api/v1/cards/{id}` gửi `{ isArchived: true }`. Thẻ ẩn khỏi cột và chuyển vào ngăn kéo lưu trữ. | `[ ] Chưa test` |
| **CRD-06** | Xóa vĩnh viễn thẻ | 1. Vào ngăn lưu trữ -> Bấm "Xóa"<br>2. Xác nhận tại Popup | API `DELETE /api/v1/cards/{id}` xóa hẳn thẻ khỏi Database. | `[ ] Chưa test` |

---

### Giai đoạn 5: Chi tiết nghiệp vụ thẻ (Card Details Features)

| Mã Test | Chức năng kiểm thử | Các bước thực hiện (Test Steps) | Kết quả mong đợi (Expected Result) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **DTL-01** | Cập nhật Mô tả thẻ (Description) | 1. Nhập mô tả mới<br>2. Bấm "Lưu" | API `PATCH /api/v1/cards/{id}` gửi `{ description }`. F5 lại mô tả vẫn hiển thị đúng. | `[ ] Chưa test` |
| **DTL-02** | Ngày hết hạn & Hoàn thành | 1. Chọn ngày hết hạn trong lịch<br>2. Tích chọn checkbox "Hoàn thành" | `PATCH /api/v1/cards/{id}` gửi `{ dueDate, isDueComplete: true }`. Huy hiệu ngày chuyển sang màu xanh lá. | `[ ] Chưa test` |
| **DTL-03** | Quản lý Checklist (Việc cần làm) | 1. Bấm "Việc cần làm" -> Nhập tên việc<br>2. Tích chọn hoàn thành mục<br>3. Xóa 1 mục | Gọi tương ứng: `POST /checklists/{id}/items`, `PATCH /checklist-items/{id}`, `DELETE /checklist-items/{id}`. Tiến độ (%) tăng giảm chính xác. | `[ ] Chưa test` |
| **DTL-04** | Bình luận (Comments) | 1. Nhập bình luận: "Đang tiến hành test"<br>2. Bấm "Lưu" | API `POST /api/v1/cards/{id}/comments` gọi thành công. Bình luận hiển thị kèm avatar và thời gian "Vừa xong". | `[ ] Chưa test` |
| **DTL-05** | Gán / Gỡ Nhãn (Labels) | 1. Bấm "Nhãn" -> Chọn nhãn "Frontend"<br>2. Bấm lại để gỡ | `POST /cards/{id}/labels/{lblId}` và `DELETE /cards/{id}/labels/{lblId}` chạy thành công. Nhãn xuất hiện trên mặt thẻ. | `[ ] Chưa test` |
| **DTL-06** | Tải lên tệp đính kèm | 1. Chọn "Đính kèm" -> Tải tệp PDF/ảnh từ máy tính | `POST /api/v1/cards/{id}/attachments` (Multipart FormData) lưu file vào thư mục upload backend và hiển thị link xem trong thẻ. | `[ ] Chưa test` |
| **DTL-07** | Đặt ảnh bìa / Màu bìa | 1. Chọn màu bìa hoặc tải ảnh bìa | `PATCH /api/v1/cards/{id}` cập nhật `{ coverColor }` hoặc `{ coverUrl }`. Thẻ trên Board đổi giao diện bìa. | `[ ] Chưa test` |

---

## 3. Nhật Ký Lỗi & Quy Trình Báo Cáo (Bug Logging Protocol)

Nếu trong quá trình tester thực hiện kịch bản gặp lỗi, ghi nhận theo mẫu chuẩn:

```markdown
- **Mã kịch bản**: [Ví dụ: CRD-03]
- **Mô tả lỗi**: Thẻ di chuyển sang cột mới nhưng khi F5 lại quay về cột cũ.
- **Console Log Frontend**: Lỗi HTTP 500 hoặc 403 ở API POST /api/v1/cards/12/move.
- **Backend Log**: Stack trace trong console Spring Boot (nếu có).
- **Mức độ nghiêm trọng**: Critical / Major / Minor.
```
