# SmartSpend — Quản lý chi tiêu cá nhân

## Giới thiệu

SmartSpend là dự án tốt nghiệp được tiếp tục phát triển từ dự án CMC Global phiên bản web. Trên nền tảng đó, nhóm nâng cấp và mở rộng hệ thống quản lý chi tiêu cá nhân, gồm ứng dụng khách hàng, website quản trị và backend API dùng chung.

Hệ thống hỗ trợ quản lý thu chi, ví, ngân sách, quỹ, giao dịch và các chức năng quản trị.

## Thành viên dự án

| Họ và tên | Vai trò |
| --- | --- |
| Trần Vinh Trí | Trưởng nhóm |
| Lê Trung Hoàng | Thành viên |
| Nguyễn Trường Giang | Thành viên |
| Nguyễn Nhật Quang | Thành viên |
| Nguyễn Minh Hiếu | Thành viên |

## Cấu trúc thư mục

```text
Graduation_project/
├── Graduation_Project_BE/           # Backend Java 17, Spring Boot, Maven
│   ├── core/                       # Entity, repository, xác thực và cấu hình chung
│   ├── api-app-customer/           # API khách hàng, cổng 9090
│   ├── api-web-admin/              # API quản trị, cổng 8082
│   ├── uploads/                    # Tệp tải lên
│   └── pom.xml                     # Cấu hình Maven đa module
├── Graduation_Project_AppCustomer/ # Ứng dụng Expo, React Native, TypeScript
│   ├── app/                        # Màn hình và định tuyến Expo Router
│   ├── features/                   # Chức năng theo nghiệp vụ
│   ├── shared/                     # API, thành phần và tiện ích dùng chung
│   ├── assets/                     # Tài nguyên ứng dụng
│   └── package.json
├── Graduation_Project_WebAdmin/    # Website quản trị React, Vite, Ant Design
│   ├── src/
│   │   ├── pages/                  # Các trang quản trị
│   │   ├── components/             # Thành phần giao diện
│   │   ├── layouts/                # Bố cục trang
│   │   └── services/               # Kết nối API
│   ├── public/                     # Tài nguyên tĩnh
│   ├── vite.config.ts              # Cấu hình Vite và proxy API
│   └── package.json
└── README.md
```

## Cách chạy

### 1. Chuẩn bị môi trường

- JDK 17 và Maven.
- Node.js 22.13 trở lên trong nhánh 22.x, kèm npm (phù hợp yêu cầu trong các lockfile).
- MySQL đang chạy tại `localhost:3306`.
- Điện thoại hoặc trình giả lập nếu chạy ứng dụng khách trên Android/iOS.

Các lệnh dưới đây bắt đầu từ thư mục gốc dự án. Mỗi dịch vụ chạy trong một terminal riêng.

### 2. Cấu hình backend

Hai API cùng sử dụng database `graduation_project_db`. Cấu hình hiện tại có `createDatabaseIfNotExist=true` và `ddl-auto=update`; tài khoản MySQL cần quyền tạo database và cập nhật bảng, hoặc bạn tạo database trước:

```sql
CREATE DATABASE IF NOT EXISTS graduation_project_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Trong **mỗi terminal chạy backend**, đặt cấu hình kết nối và khóa JWT:

```bash
export SPRING_DATASOURCE_USERNAME='your_mysql_user'
export SPRING_DATASOURCE_PASSWORD='your_mysql_password'
export JWT_SECRET='your_base64_encoded_secret'
export APP_JWT_SECRET="$JWT_SECRET"
```

Thay các giá trị mẫu bằng cấu hình của bạn. Khóa JWT phải là chuỗi Base64 giải mã được ít nhất 32 byte; có thể tạo bằng `openssl rand -base64 32`, rồi dùng cùng một giá trị cho hai API.

Nếu MySQL ở địa chỉ khác, đặt thêm `SPRING_DATASOURCE_URL` với URL JDBC tương ứng. Cấu hình gốc nằm trong `src/main/resources/application.properties` của từng module API.

Để sử dụng các tính năng tích hợp, cấu hình thêm theo dịch vụ:

- Email/OTP: `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD`.
- Thanh toán payOS: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`.
- SePay: `SEPAY_ACCOUNT_NO`, `SEPAY_BANK_ID`, `SEPAY_ACCOUNT_NAME`, `SEPAY_API_KEY`.
- Trợ lý AI: `GEMINI_API_KEY`.

Các chức năng này cần thông tin dịch vụ hợp lệ để hoạt động đầy đủ.

### 3. Chạy backend

Build và cài các module vào kho Maven cục bộ:

```bash
cd Graduation_Project_BE
mvn clean install -DskipTests
```

Chạy API khách hàng trong terminal đã cấu hình ở bước 2:

```bash
cd Graduation_Project_BE
mvn -pl api-app-customer spring-boot:run
```

Chạy API quản trị trong terminal khác, cũng đã cấu hình ở bước 2:

```bash
cd Graduation_Project_BE
mvn -pl api-web-admin spring-boot:run
```

Địa chỉ dịch vụ:

| Dịch vụ | Địa chỉ |
| --- | --- |
| API khách hàng | `http://localhost:9090` |
| API quản trị | `http://localhost:8082` |

### 4. Chạy website quản trị

```bash
cd Graduation_Project_WebAdmin
npm ci
npm run dev
```

Mở URL Vite hiển thị trong terminal, thường là `http://localhost:5173`.

Vite chuyển tiếp API quản trị tới cổng `8082`, các yêu cầu upload và `/uploads` tới cổng `9090`, nên cần chạy cả hai backend. Khi chạy cục bộ, để `VITE_API_URL` không được thiết lập để sử dụng proxy này.

### 5. Chạy ứng dụng khách hàng

```bash
cd Graduation_Project_AppCustomer
npm ci
cp .env.example .env
```

Sửa `.env` để trỏ đến API khách hàng (cổng **9090**, thay cho cổng 8080 trong tệp mẫu):

```dotenv
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:9090
```

Khởi động Expo:

```bash
npm run start:online
```

Chọn thiết bị theo hướng dẫn trong terminal. Có thể dùng `npm run android`, `npm run ios` hoặc `npm run web` để mở nền tảng tương ứng; Android/iOS cần thiết bị hoặc trình giả lập và bản chạy tương thích với SDK Expo của dự án.

Trong chế độ phát triển, ứng dụng ưu tiên lấy IP máy chạy Expo rồi nối cổng `9090`; biến `EXPO_PUBLIC_API_URL` được dùng khi không có địa chỉ Expo phù hợp. Điện thoại thật cần truy cập được máy chạy backend, thông thường bằng cách kết nối cùng mạng Wi-Fi.

Lệnh `npm start` mặc định chạy Expo ở chế độ offline.
