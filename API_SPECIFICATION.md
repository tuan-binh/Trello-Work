# TÀI LIỆU ĐẶC TẢ API - TRELLO WORK (API SPECIFICATION)

> **Dự án**: Trello Work Management System  
> **Phiên bản**: 1.0.0  
> **Môi trường Base URL**: `https://api.binh.cloud/api/v1` (hoặc `http://localhost:8080/api/v1`)  
> **Cơ chế xác thực**: JWT Bearer Token (`Authorization: Bearer <accessToken>`)  
> **Định dạng dữ liệu**: `application/json` (trừ upload file dùng `multipart/form-data`)

---

## MỤC LỤC
1. [Quy chuẩn chung & Mã lỗi](#1-quy-chuẩn-chung--mã-lỗi)
2. [Nhóm API Xác thực & Người dùng (Auth & Users)](#2-xác-thực--người-dùng-auth--users)
3. [Nhóm API Không gian làm việc (Workspaces)](#3-không-gian-làm-việc-workspaces)
4. [Nhóm API Bảng làm việc (Boards)](#4-bảng-làm-việc-boards)
5. [Nhóm API Danh sách / Cột (Lists)](#5-danh-sách--cột-lists)
6. [Nhóm API Thẻ việc (Cards)](#6-thẻ-việc-cards)
7. [Nhóm API Danh sách kiểm tra (Checklists)](#7-danh-sách-kiểm-tra-checklists)
8. [Nhóm API Nhãn (Labels)](#8-nhãn-labels)
9. [Nhóm API Tệp đính kèm (Attachments)](#9-tệp-đính-kèm-attachments)
10. [Nhóm API Bình luận & Hoạt động (Comments & Activities)](#10-bình-luận--hoạt-động-comments--activities)

---

## 1. Quy chuẩn chung & Mã lỗi

### 1.1 Header yêu cầu
Đối với các endpoint yêu cầu xác thực:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: application/json
```

### 1.2 Định dạng phản hồi lỗi (Error Response)
Được chuẩn hóa theo `ErrorResponse` của Backend:
```json
{
  "timestamp": "2026-11-18T09:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Thông điệp lỗi chi tiết",
  "path": "/api/v1/cards/1"
}
```

### 1.3 Mã trạng thái HTTP thường gặp
- `200 OK`: Xử lý thành công và có dữ liệu trả về.
- `201 Created`: Tạo mới tài nguyên thành công.
- `204 No Content`: Xử lý thành công (thường là lệnh xóa) không cần trả về body.
- `400 Bad Request`: Dữ liệu gửi lên sai định dạng hoặc vi phạm validate.
- `401 Unauthorized`: Chưa đăng nhập hoặc Access Token không hợp lệ / đã hết hạn.
- `403 Forbidden`: Người dùng không có quyền truy cập hoặc thao tác trên tài nguyên này.
- `404 Not Found`: Không tìm thấy tài nguyên tương ứng.
- `409 Conflict`: Xung đột dữ liệu (ví dụ: email đã được đăng ký trước đó).

---

## 2. Xác thực & Người dùng (Auth & Users)

### 2.1 Đăng ký tài khoản
- **Method**: `POST`
- **Path**: `/api/v1/auth/register`
- **Auth**: Public
- **Request Body**:
```json
{
  "fullName": "Nguyễn Văn Bình",
  "email": "binh@example.com",
  "password": "Password123@",
  "avatarUrl": "https://example.com/avatar.jpg" // Không bắt buộc
}
```
- **Response**: `201 Created`
```json
{
  "message": "User registered successfully"
}
```

### 2.2 Đăng nhập
- **Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Auth**: Public
- **Request Body**:
```json
{
  "email": "binh@example.com",
  "password": "Password123@"
}
```
- **Response**: `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "tokenType": "Bearer",
  "id": 1,
  "email": "binh@example.com",
  "fullName": "Nguyễn Văn Bình",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

### 2.3 Lấy thông tin tài khoản hiện tại
- **Method**: `GET`
- **Path**: `/api/v1/users/me`
- **Auth**: Bearer Token
- **Response**: `200 OK`
```json
{
  "id": 1,
  "fullName": "Nguyễn Văn Bình",
  "email": "binh@example.com",
  "avatarUrl": "https://example.com/avatar.jpg",
  "status": "ACTIVE"
}
```

---

## 3. Không gian làm việc (Workspaces)

### 3.1 Lấy danh sách Không gian làm việc của người dùng
- **Method**: `GET`
- **Path**: `/api/v1/workspaces`
- **Auth**: Bearer Token
- **Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Không gian làm việc chính",
    "description": "Không gian quản lý dự án mặc định",
    "currentUserRole": "ADMIN"
  }
]
```

### 3.2 Tạo Không gian làm việc mới
- **Method**: `POST`
- **Path**: `/api/v1/workspaces`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "name": "Đội ngũ Design",
  "description": "Quản lý thiết kế và UI/UX"
}
```
- **Response**: `201 Created`

---

## 4. Bảng làm việc (Boards)

### 4.1 Lấy danh sách Bảng làm việc
- **Method**: `GET`
- **Path**: `/api/v1/boards`
- **Auth**: Bearer Token
- **Query Params**:
  - `workspaceId` (Long, tùy chọn): Lọc theo Không gian làm việc.
  - `search` (String, tùy chọn): Tìm theo tiêu đề bảng.
  - `starred` (Boolean, tùy chọn): `true` để lấy danh sách bảng được gắn sao.
- **Response**: `200 OK`
```json
[
  {
    "id": 1,
    "title": "Dự Án Phát Triển Trello Work 🚀",
    "workspaceId": 1,
    "workspaceName": "Không gian làm việc chính",
    "bgGradient": "from-blue-600 to-indigo-700",
    "bgImage": "https://images.unsplash.com/...",
    "starred": true,
    "visibility": "WORKSPACE", // PRIVATE | WORKSPACE | PUBLIC
    "recentViewed": "Vừa xong"
  }
]
```

### 4.2 Tạo Bảng mới
- **Method**: `POST`
- **Path**: `/api/v1/boards`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "workspaceId": 1,
  "title": "Sprint Planning Q4",
  "bgGradient": "from-emerald-500 to-teal-700", // Không bắt buộc
  "bgImage": "https://images.unsplash.com/...", // Không bắt buộc
  "visibility": "WORKSPACE" // PRIVATE | WORKSPACE | PUBLIC
}
```
- **Response**: `201 Created`

### 4.3 Lấy chi tiết toàn bộ Bảng (Full Board Canvas View)
- **Method**: `GET`
- **Path**: `/api/v1/boards/{boardId}`
- **Auth**: Bearer Token
- **Response**: `200 OK`
```json
{
  "id": 1,
  "title": "Dự Án Phát Triển Trello Work 🚀",
  "workspace": "Không gian làm việc chính",
  "workspaceId": 1,
  "bgGradient": "from-blue-600 to-indigo-700",
  "bgImage": null,
  "starred": true,
  "visibility": "WORKSPACE",
  "members": [
    {
      "id": "1",
      "name": "Nguyễn Văn Bình",
      "email": "binh@example.com",
      "initials": "B",
      "avatarBg": "bg-blue-600",
      "role": "ADMIN", // ADMIN | MEMBER | OBSERVER
      "status": "ACTIVE"
    }
  ],
  "labels": [
    { "id": "1", "name": "Backend", "color": "bg-blue-500 text-white" },
    { "id": "2", "name": "Frontend", "color": "bg-emerald-500 text-white" }
  ],
  "lists": [
    {
      "id": "1",
      "title": "Cần làm (To Do)",
      "position": 65535,
      "isArchived": false,
      "cards": [
        {
          "id": "1",
          "title": "Tích hợp Spring Security với JWT Authentication",
          "description": "Bảo vệ các endpoint với filter JWT và cấp access token.",
          "position": 65535,
          "labels": [
            { "id": "1", "name": "Backend", "color": "bg-blue-500 text-white" }
          ],
          "checklistTotal": 4,
          "checklistDone": 2,
          "commentsCount": 3,
          "dueDate": "2026-11-10T23:59:59",
          "isDueComplete": false,
          "members": ["B", "N"],
          "coverUrl": null,
          "coverColor": null,
          "isArchived": false
        }
      ]
    }
  ]
}
```

### 4.4 Cập nhật thông tin Bảng
- **Method**: `PATCH`
- **Path**: `/api/v1/boards/{boardId}`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "title": "Tên bảng cập nhật",
  "starred": true,
  "bgGradient": "from-purple-600 to-pink-600",
  "bgImage": null,
  "visibility": "PRIVATE"
}
```
- **Response**: `200 OK`

### 4.5 Mời thành viên vào Bảng
- **Method**: `POST`
- **Path**: `/api/v1/boards/{boardId}/members/invite`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "email": "colleague@example.com",
  "role": "MEMBER" // ADMIN | MEMBER | OBSERVER
}
```
- **Response**: `200 OK`

### 4.6 Thay đổi vai trò (Role) của thành viên trong Bảng
- **Method**: `PATCH`
- **Path**: `/api/v1/boards/{boardId}/members/{memberId}`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "role": "ADMIN" // ADMIN | MEMBER | OBSERVER
}
```

### 4.7 Xóa thành viên khỏi Bảng
- **Method**: `DELETE`
- **Path**: `/api/v1/boards/{boardId}/members/{memberId}`
- **Auth**: Bearer Token
- **Response**: `204 No Content`

---

## 5. Danh sách / Cột (Lists)

### 5.1 Tạo Cột mới trong Bảng
- **Method**: `POST`
- **Path**: `/api/v1/boards/{boardId}/lists`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "title": "Kiểm thử (QA / Review)",
  "position": 131070
}
```
- **Response**: `201 Created`

### 5.2 Cập nhật tiêu đề / Lưu trữ Cột (Archive)
- **Method**: `PATCH`
- **Path**: `/api/v1/lists/{listId}`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "title": "Tiêu đề mới", // Không bắt buộc
  "isArchived": true // Không bắt buộc (true = archive, false = restore)
}
```
- **Response**: `200 OK`

### 5.3 Thay đổi vị trí / Kéo thả Cột (Reorder Lists)
- **Method**: `PATCH`
- **Path**: `/api/v1/boards/{boardId}/lists/reorder`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "listOrders": [
    { "listId": 1, "position": 65535 },
    { "listId": 2, "position": 131070 },
    { "listId": 3, "position": 196605 }
  ]
}
```
- **Response**: `200 OK`

### 5.4 Sắp xếp tự động các thẻ trong Cột
- **Method**: `POST`
- **Path**: `/api/v1/lists/{listId}/sort`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "sortBy": "TITLE_ASC" // "TITLE_ASC" (A-Z) hoặc "DUE_DATE_ASC" (Theo deadline)
}
```
- **Response**: `200 OK`

---

## 6. Thẻ việc (Cards)

### 6.1 Tạo Thẻ mới trong Cột
- **Method**: `POST`
- **Path**: `/api/v1/lists/{listId}/cards`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "title": "Thiết kế giao diện Trello Board View",
  "position": 65535
}
```
- **Response**: `201 Created`

### 6.2 Lấy chi tiết Thẻ (Card Modal View)
- **Method**: `GET`
- **Path**: `/api/v1/cards/{cardId}`
- **Auth**: Bearer Token
- **Response**: `200 OK`
```json
{
  "id": 1,
  "listId": 1,
  "listTitle": "Cần làm (To Do)",
  "title": "Tích hợp Spring Security với JWT Authentication",
  "description": "Bảo vệ các endpoint với filter JWT và cấp access token.",
  "position": 65535,
  "dueDate": "2026-11-10T23:59:59",
  "isDueComplete": false,
  "coverUrl": null,
  "coverColor": "bg-blue-600",
  "isArchived": false,
  "labels": [
    { "id": "1", "name": "Backend", "color": "bg-blue-500 text-white" }
  ],
  "members": [
    { "id": "1", "name": "Nguyễn Văn Bình", "initials": "B", "avatarBg": "bg-blue-600" }
  ],
  "checklists": [
    {
      "id": "1",
      "title": "Checklist công việc",
      "items": [
        { "id": "1", "text": "Viết JwtAuthFilter", "done": true },
        { "id": "2", "text": "Cấu hình SecurityConfig", "done": false }
      ]
    }
  ],
  "attachments": [
    {
      "id": "1",
      "name": "architecture.png",
      "url": "https://api.binh.cloud/uploads/architecture.png",
      "size": "1.2 MB",
      "createdAt": "2026-11-17T14:30:00",
      "isCover": true
    }
  ],
  "comments": [
    {
      "id": "1",
      "author": "Nguyễn Văn Bình",
      "initials": "B",
      "avatarBg": "bg-blue-600",
      "text": "Đã hoàn thành cấu hình cơ bản.",
      "createdAt": "2026-11-17T16:00:00"
    }
  ],
  "activities": [
    {
      "id": "1",
      "author": "Nguyễn Văn Bình",
      "actionText": "đã thêm thẻ này vào Cần làm (To Do)",
      "targetText": null,
      "createdAt": "2026-11-16T10:00:00"
    }
  ]
}
```

### 6.3 Cập nhật thông tin Thẻ (Title, Description, Due Date, Cover, Archive)
- **Method**: `PATCH`
- **Path**: `/api/v1/cards/{cardId}`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "title": "Tiêu đề thẻ mới",
  "description": "Nội dung mô tả Markdown chi tiết...",
  "dueDate": "2026-11-15T18:00:00", // null nếu xóa deadline
  "isDueComplete": true,
  "coverUrl": "https://images.unsplash.com/...", // null nếu xóa ảnh bìa
  "coverColor": "bg-emerald-600", // null nếu xóa màu bìa
  "isArchived": false
}
```
- **Response**: `200 OK`

### 6.4 Di chuyển / Kéo thả Thẻ (Drag-and-Drop)
- **Method**: `POST`
- **Path**: `/api/v1/cards/{cardId}/move`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "targetListId": 2,
  "targetPosition": 98302.5
}
```
- **Response**: `200 OK`

### 6.5 Xóa Thẻ vĩnh viễn
- **Method**: `DELETE`
- **Path**: `/api/v1/cards/{cardId}`
- **Auth**: Bearer Token
- **Response**: `204 No Content`

### 6.6 Gán hoặc Bỏ Thành viên vào Thẻ
- **Gán thành viên**: `POST /api/v1/cards/{cardId}/members/{userId}`
- **Bỏ thành viên**: `DELETE /api/v1/cards/{cardId}/members/{userId}`

### 6.7 Gán hoặc Bỏ Nhãn vào Thẻ
- **Gán nhãn**: `POST /api/v1/cards/{cardId}/labels/{labelId}`
- **Bỏ nhãn**: `DELETE /api/v1/cards/{cardId}/labels/{labelId}`

---

## 7. Danh sách kiểm tra (Checklists)

### 7.1 Tạo Checklist trong Thẻ
- **Method**: `POST`
- **Path**: `/api/v1/cards/{cardId}/checklists`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "title": "Các bước thực hiện"
}
```
- **Response**: `201 Created`

### 7.2 Thêm mục (Item) vào Checklist
- **Method**: `POST`
- **Path**: `/api/v1/checklists/{checklistId}/items`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "text": "Kiểm thử API login bằng Postman"
}
```
- **Response**: `201 Created`

### 7.3 Cập nhật trạng thái / Nội dung mục Checklist
- **Method**: `PATCH`
- **Path**: `/api/v1/checklist-items/{itemId}`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "text": "Kiểm thử API login bằng Postman (Đã pass)", // Không bắt buộc
  "done": true // true / false
}
```
- **Response**: `200 OK`

### 7.4 Xóa mục Checklist
- **Method**: `DELETE`
- **Path**: `/api/v1/checklist-items/{itemId}`
- **Auth**: Bearer Token
- **Response**: `204 No Content`

### 7.5 Xóa toàn bộ Checklist
- **Method**: `DELETE`
- **Path**: `/api/v1/checklists/{checklistId}`
- **Auth**: Bearer Token
- **Response**: `204 No Content`

---

## 8. Nhãn (Labels)

### 8.1 Lấy danh sách Nhãn của Bảng
- **Method**: `GET`
- **Path**: `/api/v1/boards/{boardId}/labels`
- **Auth**: Bearer Token
- **Response**: `200 OK`
```json
[
  { "id": 1, "name": "Backend", "color": "bg-blue-500 text-white" },
  { "id": 2, "name": "Frontend", "color": "bg-emerald-500 text-white" },
  { "id": 3, "name": "High Priority", "color": "bg-red-500 text-white" }
]
```

### 8.2 Tạo Nhãn mới cho Bảng
- **Method**: `POST`
- **Path**: `/api/v1/boards/{boardId}/labels`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "name": "DevOps",
  "color": "bg-slate-700 text-white"
}
```
- **Response**: `201 Created`

---

## 9. Tệp đính kèm (Attachments)

### 9.1 Tải lên tệp đính kèm vào Thẻ
- **Method**: `POST`
- **Path**: `/api/v1/cards/{cardId}/attachments`
- **Auth**: Bearer Token
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: Tệp tin đính kèm (Hình ảnh, tài liệu...)
  - `isCover`: `true` hoặc `false` (Không bắt buộc)
- **Response**: `201 Created`
```json
{
  "id": 1,
  "name": "design_mockup.png",
  "url": "https://api.binh.cloud/uploads/design_mockup.png",
  "size": "2.1 MB",
  "isCover": true,
  "createdAt": "2026-11-18T09:30:00"
}
```

### 9.2 Đặt / Hủy tệp đính kèm làm Ảnh bìa (Cover)
- **Method**: `PATCH`
- **Path**: `/api/v1/attachments/{attachmentId}/cover`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "isCover": true // true = đặt làm cover, false = hủy cover
}
```
- **Response**: `200 OK`

### 9.3 Xóa tệp đính kèm
- **Method**: `DELETE`
- **Path**: `/api/v1/attachments/{attachmentId}`
- **Auth**: Bearer Token
- **Response**: `204 No Content`

---

## 10. Bình luận & Hoạt động (Comments & Activities)

### 10.1 Thêm bình luận vào Thẻ
- **Method**: `POST`
- **Path**: `/api/v1/cards/{cardId}/comments`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "text": "Đã kiểm tra luồng kéo thả hoạt động ổn định trên Chrome và Firefox."
}
```
- **Response**: `201 Created`
```json
{
  "id": 12,
  "author": "Nguyễn Văn Bình",
  "initials": "B",
  "avatarBg": "bg-blue-600",
  "text": "Đã kiểm tra luồng kéo thả hoạt động ổn định trên Chrome và Firefox.",
  "createdAt": "2026-11-18T09:35:00"
}
```

### 10.2 Lấy danh sách bình luận & dòng hoạt động của Thẻ
- **Method**: `GET`
- **Path**: `/api/v1/cards/{cardId}/activities`
- **Auth**: Bearer Token
- **Response**: `200 OK`
```json
{
  "comments": [
    {
      "id": 12,
      "author": "Nguyễn Văn Bình",
      "initials": "B",
      "avatarBg": "bg-blue-600",
      "text": "Đã kiểm tra luồng kéo thả hoạt động ổn định trên Chrome và Firefox.",
      "createdAt": "2026-11-18T09:35:00"
    }
  ],
  "activities": [
    {
      "id": 105,
      "author": "Nguyễn Văn Bình",
      "actionText": "đã hoàn thành việc cần làm",
      "targetText": "Viết JwtAuthFilter",
      "createdAt": "2026-11-18T09:20:00"
    }
  ]
}
```
