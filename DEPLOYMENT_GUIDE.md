# HƯỚNG DẪN QUẢN TRỊ NHÓM & TRIỂN KHAI WEBSITE

Tài liệu này hướng dẫn cách bạn có thể cộng tác với đồng nghiệp và tự triển khai (host) website SmartData trên máy chủ của mình.

---

## 1. PHÂN QUYỀN QUẢN TRỊ NHÓM (COLLABORATION)

Để một nhóm cùng làm việc mà vẫn đảm bảo quyền kiểm soát tối cao thuộc về bạn, chúng ta thực hiện theo cơ chế sau:

### A. Đối với Đồng nghiệp (Chỉ cập nhật nội dung):
Đồng nghiệp của bạn sẽ truy cập vào trang Quản trị thông qua đường dẫn `/admin`.
1. **Quyền hạn:** Họ có thể thêm/sửa/xóa gói cước, chỉnh sửa menu, cập nhật cấu hình hotline, liên hệ, điều khoản...
2. **Cách thực hiện:** Bạn cần thêm Email Google của đồng nghiệp vào danh sách `admins` trong Firebase.
   - Truy cập Firebase Console.
   - Vào Firestore Database -> Collection `admins`.
   - Tạo Document mới với ID là Email của đồng nghiệp (hoặc UID của họ).
3. **Lưu ý:** Họ không thể thay đổi mã nguồn, cấu hình hệ thống sâu hay yêu cầu AI thay đổi tính năng.

### B. Đối với Bạn (Quyền Chủ sở hữu):
Chỉ mình bạn giữ tài khoản truy cập vào **Google AI Studio**. 
- Chỉ bạn mới có quyền ra lệnh cho tôi (AI) để: Sửa cấu trúc trang web, thêm chức năng mới, thay đổi giao diện cốt lõi.
- Điều này đảm bảo tính nhất quán của hệ thống.

---

## 2. HƯỚNG DẪN TRIỂN KHAI LÊN HOSTING (SELF-HOSTING)

Vì đây là ứng dụng React (Vite) đi kèm Firebase, việc triển khai rất đơn giản.

### Bước 1: Xuất bản mã nguồn (Build)
Trong môi trường này, bạn có thể tải mã nguồn về máy bằng cách:
1. Nhìn lên góc trên cùng bên phải của giao diện AI Studio.
2. Tìm biểu tượng hộp có mũi tên trỏ ra ngoài (Nút **Export Project** / **Chia sẻ/Xuất**).
3. Chọn **Export as ZIP** (hoặc Download/Export mã nguồn) để tải toàn bộ mã nguồn về máy tính.

### Bước 2: Chuẩn bị máy chủ của bạn
Website của bạn sau khi build sẽ là một tập hợp các file tĩnh (HTML, JS, CSS). Bạn có thể host nó trên bất kỳ Hosting nào hỗ trợ web tĩnh (Nginx, Apache, Litespeed, Vercel, Netlify...).

### Bước 3: Cài đặt và Build tại máy cá nhân
1. Giải nén file ZIP.
2. Mở terminal tại thư mục đó.
3. Chạy lệnh: `npm install` để cài đặt thư viện.
4. Chạy lệnh: `npm run build`.
5. Sau khi chạy xong, một thư mục tên là **`dist`** sẽ xuất hiện. Đây chính là nội dung website của bạn.

### Bước 4: Upload lên Hosting
- Copy toàn bộ nội dung trong thư mục **`dist`** lên thư mục gốc (thường là `public_html`) trên server của bạn.
- **Lưu ý quan trọng (SPA Routing):** Vì đây là ứng dụng Single Page (React), bạn cần cấu hình server để mọi yêu cầu đều trỏ về `index.html`.
  - **Nếu dùng Nginx:** Thêm `try_files $uri $uri/ /index.html;` vào file config.
  - **Nếu dùng Hosting (Apache/.htaccess):** Tạo file `.htaccess` với nội dung:
    ```apache
    <IfModule mod_rewrite.c>
      RewriteEngine On
      RewriteBase /
      RewriteRule ^index\.html$ - [L]
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteRule . /index.html [L]
    </IfModule>
    ```

---

## 3. CÁC LƯU Ý VỀ BẢO MẬT
- **Firebase Config:** File `firebase-applet-config.json` chứa các khóa công khai để kết nối Database. Bạn không cần lo lắng vì chúng ta đã có **Firestore Security Rules** bảo vệ dữ liệu.
- **API Keys:** Nếu bạn sử dụng các dịch vụ bên thứ 3 khác, hãy đảm bảo các khóa đó được cấu hình trong file `.env`.

Chúc bạn và nhóm quản trị vận hành website SmartData hiệu quả!

---

## 4. HƯỚNG DẪN CHI TIẾT THÊM ĐỒNG NGHIỆP LÀM QUẢN TRỊ VIÊN

Để cho phép đồng nghiệp truy cập vào hệ thống Quản trị (`/admin`), bạn cần cấp quyền cho họ trong cơ sở dữ liệu Firebase:

### Bước 1: Lấy Email của đồng nghiệp
Bạn cần Email Google chính xác mà đồng nghiệp sẽ dùng để đăng nhập vào trang web.

### Bước 2: Truy cập Firebase Console
1. Mở [Firebase Console](https://console.firebase.google.com/).
2. Chọn dự án SmartData của bạn.

### Bước 3: Thêm vào Firestore
1. Ở menu bên trái, chọn **Firestore Database**.
2. Tìm collection (bảng) có tên là **`admins`**.
3. Bấm **Add document**.
4. Ở phần **Document ID**: 
   - Bạn hãy nhập **Email** của đồng nghiệp vào đây (Ví dụ: `dongnghiep@gmail.com`).
   - *Lưu ý: ID chính là Email.*
5. Ở phần các trường (Fields): 
   - Thêm một field tên là `email` (Type: `string`) -> Value: `dongnghiep@gmail.com`.
   - Bấm **Save**.

### Bước 4: Kiểm tra Authentication
- Đảm bảo Email đó đã từng đăng nhập vào website ít nhất một lần để Firebase ghi nhận User.
- Bạn có thể xem danh sách User tại menu **Authentication** của Firebase Console.

Sau khi hoàn thành, đồng nghiệp của bạn chỉ cần vào website, bấm Đăng nhập bằng Google, và họ sẽ có quyền vào mục Quản trị.
