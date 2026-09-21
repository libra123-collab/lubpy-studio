# LUBPY STUDIO — TÀI LIỆU RESTful API & KIẾN TRÚC ĐỒNG BỘ MOBILE & WEB

Tài liệu kỹ thuật cung cấp toàn bộ đặc tả RESTful API, Cơ sở dữ liệu PostgreSQL, Cơ chế xác thực JWT Bearer, Sự kiện Realtime Socket.IO và Module Push Notification (FCM) tương thích 100% với Mobile Apps (Android / Flutter / React Native / iOS) và Web Frontend (React/TypeScript).

---

## 1. TỔNG QUAN HỆ THỐNG & BASE URL

* **Development Base URL:** `http://localhost:3000/api/v1` (hoặc `http://localhost:3000/api`)
* **Production Base URL:** `https://your-domain.com/api/v1`
* **Realtime WebSocket Server:** `ws://localhost:3000` (Socket.IO v4)
* **Single Source of Truth:** PostgreSQL (qua Drizzle ORM)
* **Cổng mặc định:** `process.env.PORT || 3000`

### Định dạng Dữ liệu Chuẩn (Standard Response Format)

Tất cả các API endpoints đều tuân thủ cấu trúc JSON tiêu chuẩn:

#### Phản hồi Thành công (200 / 201)
```json
{
  "success": true,
  "data": { ... },
  "message": "Mô tả thao tác thành công"
}
```

#### Phản hồi Lỗi (4xx / 5xx)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_NAME",
    "message": "Chi tiết thông báo lỗi cho client"
  }
}
```

---

## 2. BẢNG MAPPING TRƯỜNG & ENUM TƯƠNG THÍCH MOBILE

### A. Project Status Enum
Hệ thống hỗ trợ cả trạng thái chuẩn và các alias thường dùng trên Mobile:
- `PENDING` / `PLANNING` / `CONSULTING`: Tiếp nhận & Đang tư vấn
- `APPROVED` / `ASSIGNED`: Đã phê duyệt & Phân công Lập trình viên
- `DEPOSIT_50`: Đã thanh toán cọc 50%
- `CODING` / `IN_PROGRESS`: Đang tiến hành lập trình
- `REVIEW`: Đã hoàn thiện code, sẵn sàng nghiệm thu
- `PAID_100`: Đã hoàn tất thanh toán 100%
- `DELIVERED` / `COMPLETED`: Đã bàn giao mã nguồn & nghiệm thu thành công
- `CANCELLED` / `REFUNDED`: Đã hủy / Hoàn tiền

### B. Parallel Field Mappings (Đồng bộ song song)
| Entity | Các trường trả về song song |
| :--- | :--- |
| **Project** | `id`, `projectCode`, `code` \| `title`, `name`, `projectName` \| `priceVnd`, `price`, `totalAmount` \| `depositAmount`, `deposited` \| `remainingAmount`, `remaining` \| `status`, `projectStatus` |
| **Transaction** | `transactionCode`, `referenceCode`, `code` \| `amountVnd`, `amount` \| `type`, `txType`, `transactionType` \| `status`, `txStatus` \| `note`, `description` |
| **Ticket** | `id`, `ticketCode`, `code` \| `subject`, `title` \| `description`, `content`, `body` \| `messages[].content`, `messages[].body`, `messages[].message` |
| **Notification** | `id`, `notifId` \| `title`, `subject` \| `content`, `body`, `message` \| `type`, `notifType` |

---

## 3. DANH SÁCH ENDPOINTS CHI TIẾT

### 3.1. Authentication & Profile (`/api/v1/auth`)

#### A. Đăng nhập (`POST /api/v1/auth/login`)
```json
// Request:
{
  "email": "client@gmail.com",
  "password": "yourpassword"
}

// Response (200 OK):
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "uid": "usr_client_01",
      "name": "Nguyễn Văn Hải",
      "email": "client@gmail.com",
      "role": "client",
      "rawRole": "CLIENT"
    }
  },
  "message": "Đăng nhập thành công."
}
```

#### B. Đăng ký tài khoản (`POST /api/v1/auth/register`)
Body: `{ "name": "...", "email": "...", "password": "...", "phone": "..." }`

#### C. Lấy thông tin cá nhân (`GET /api/v1/auth/me` hoặc `GET /api/v1/auth/profile`)
Header: `Authorization: Bearer <TOKEN>`

#### D. Cập nhật hồ sơ (`POST /api/v1/auth/profile` hoặc `PUT /api/v1/auth/profile`)
Body: `{ "name": "...", "phone": "...", "occupation": "...", "skills": "..." }`

---

### 3.2. Dự án Đồ Án (`/api/v1/projects`)

#### A. Danh sách dự án (`GET /api/v1/projects`)
Trả về danh sách dự án (khách hàng chỉ xem dự án của mình, Admin/Tech xem toàn bộ).

#### B. Chi tiết dự án (`GET /api/v1/projects/:id`)
Trả về chi tiết dự án theo mã ID (ví dụ: `PRJ-2401`).

#### C. Tạo dự án mới (`POST /api/v1/projects`)
```json
// Request:
{
  "title": "Hệ thống quản lý chuỗi cung ứng Blockchain",
  "projectType": "Đồ án tốt nghiệp",
  "deadline": "2026-12-30",
  "priceVnd": 15000000,
  "techStack": ["React", "Node.js", "Solidity"]
}
```

#### D. Cập nhật trạng thái & thông tin (`PUT /api/v1/projects/:id`)
Body: `{ "status": "IN_PROGRESS", "progress": 60 }`

#### E. Phân công nhân sự (`POST /api/v1/projects/:id/assignments`)
Body: `{ "userName": "Trần Hoàng Nam", "role": "DEVELOPER" }`

---

### 3.3. Ví & Nạp tiền (`/api/v1/wallet`)

#### A. Nạp tiền cọc / thanh toán (`POST /api/v1/wallet/deposit`)
```json
// Request:
{
  "amount": 5000000,
  "projectId": "PRJ-2401",
  "projectName": "Hệ thống quản lý chuỗi cung ứng",
  "note": "Nạp cọc 50% đồ án",
  "method": "VIETQR"
}

// Response (201 Created):
{
  "success": true,
  "data": {
    "id": 15,
    "transactionCode": "TX-W-883921",
    "amountVnd": 5000000,
    "status": "pending",
    "note": "Nạp cọc 50% đồ án (PTTT: VIETQR)"
  },
  "message": "Khởi tạo yêu cầu nạp tiền thành công. Vui lòng chuyển khoản theo thông tin VietQR."
}
```

---

### 3.4. Giao dịch Tài chính (`/api/v1/transactions`)

#### A. Danh sách giao dịch (`GET /api/v1/transactions`)
#### B. Tạo giao dịch (`POST /api/v1/transactions`)
#### C. Duyệt giao dịch (`PUT /api/v1/transactions/:id/confirm`)
#### D. Báo cáo tài chính (`GET /api/v1/transactions/summary`)

---

### 3.5. Ticket & Phản hồi CSKH (`/api/v1/tickets`)

#### A. Danh sách ticket (`GET /api/v1/tickets`)
#### B. Tạo ticket hỗ trợ (`POST /api/v1/tickets`)
Body: `{ "subject": "Cần sửa lỗi API", "description": "Lỗi 500 khi nộp bài", "priority": "HIGH" }`

#### C. Gửi tin nhắn phản hồi Ticket (`POST /api/v1/tickets/:id/reply` hoặc `POST /api/v1/tickets/:id/messages`)
```json
// Request:
{
  "content": "Tôi đã bổ sung file tài liệu theo yêu cầu của đội ngũ kỹ thuật."
}

// Response (200 OK):
{
  "success": true,
  "data": {
    "id": "TCK-1001",
    "subject": "Cần sửa lỗi API",
    "status": "OPEN",
    "messages": [ ... ]
  },
  "message": "Gửi tin nhắn phản hồi ticket thành công."
}
```

---

### 3.6. Trò chuyện Trực tuyến (`/api/v1/chat`)

#### A. Lấy tin nhắn (`GET /api/v1/chat/messages?sessionId=session_123`)
#### B. Gửi tin nhắn (`POST /api/v1/chat/messages` hoặc `POST /api/v1/chat/send`)
```json
// Request:
{
  "sessionId": "session_usr_client_01",
  "message": "Xin chào, tôi cần tư vấn báo giá đồ án AI."
}
```
#### C. Danh sách phiên chat (`GET /api/v1/chat/sessions`)

---

### 3.7. Push Notification & FCM Token (`/api/v1/users/fcm-token`)

#### A. Đăng ký thiết bị nhận Push Notification (`POST /api/v1/users/fcm-token`)
```json
// Request:
{
  "fcmToken": "eK3...fcm_device_token_from_firebase...",
  "platform": "android"
}

// Response (200 OK):
{
  "success": true,
  "data": {
    "userId": "usr_client_01",
    "fcmToken": "eK3...fcm_device_token_from_firebase...",
    "platform": "android",
    "registeredAt": "2026-08-20T10:00:00.000Z"
  },
  "message": "Lưu FCM Push Notification Token thành công."
}
```

---

## 4. REALTIME SOCKET.IO (v4)

Kết nối tới: `ws://localhost:3000` (hoặc `http://localhost:3000`)

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: { token: "Bearer <JWT_TOKEN>" },
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("Connected to LUBPY Realtime Engine:", socket.id);
  socket.emit("join_project", "PRJ-2401");
});

socket.on("project_updated", (project) => {
  console.log("Project updated in realtime:", project);
});

socket.on("new_chat_message", (message) => {
  console.log("New chat message:", message);
});
```

---

## 5. VÍ DỤ TÍCH HỢP FLUTTER / ANDROID DART SERVICE

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class LubpyApiService {
  static const String baseUrl = "http://10.0.2.2:3000/api/v1"; // 10.0.2.2 cho Android Emulator
  String? _authToken;

  void setToken(String token) => _authToken = token;

  Map<String, String> get _headers => {
    "Content-Type": "application/json",
    if (_authToken != null) "Authorization": "Bearer $_authToken",
  };

  // 1. Đăng nhập
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse("$baseUrl/auth/login"),
      headers: _headers,
      body: jsonEncode({"email": email, "password": password}),
    );
    final data = jsonDecode(response.body);
    if (data["success"] == true) {
      _authToken = data["data"]["token"] ?? data["token"];
    }
    return data;
  }

  // 2. Lấy danh sách dự án
  Future<List<dynamic>> getProjects() async {
    final response = await http.get(Uri.parse("$baseUrl/projects"), headers: _headers);
    final json = jsonDecode(response.body);
    return json["data"] ?? [];
  }

  // 3. Nạp tiền cọc
  Future<Map<String, dynamic>> depositWallet(int amount, String projectId, String note) async {
    final response = await http.post(
      Uri.parse("$baseUrl/wallet/deposit"),
      headers: _headers,
      body: jsonEncode({
        "amount": amount,
        "projectId": projectId,
        "note": note,
        "method": "VIETQR"
      }),
    );
    return jsonDecode(response.body);
  }

  // 4. Lưu FCM Token
  Future<bool> registerFcmToken(String fcmToken) async {
    final response = await http.post(
      Uri.parse("$baseUrl/users/fcm-token"),
      headers: _headers,
      body: jsonEncode({"fcmToken": fcmToken, "platform": "android"}),
    );
    final json = jsonDecode(response.body);
    return json["success"] == true;
  }
}
```
