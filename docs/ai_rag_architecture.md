# Kiến Trúc Hợp Nhất Trợ Lý AI SmartSpend (Modules 1, 3, 4)

Tài liệu này mô tả chi tiết kiến trúc triển khai cho hệ thống **Trợ lý AI SmartSpend**, tích hợp 3 module phân tích và tư vấn thông minh dựa trên mô hình Gemini AI và RAG Vector Database.

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

```
[User Interface (React Native App)]
          │
          ▼  HTTP REST / WebSocket
[Spring Boot Backend / AI Gateway Service]
          │
  ┌───────┴─────────────────────────────────────────┐
  │                                                 │
  ▼                                                 ▼
[Module 1: RAG Engine]             [Module 3 & 4: Analytics & Advisor]
  │                                                 │
  ├─ 1. Vector Search (Qdrant / pgvector)           ├─ 1. Fetch User Data (GET /report)
  ├─ 2. Top-5 Context Retriever                     ├─ 2. Financial Metrics Math Engine
  └─ 3. Gemini Prompt Ingestion                     └─ 3. Gemini Function Calling / Advisory
  │                                                 │
  └───────────────────────┬─────────────────────────┘
                          │
                          ▼
             [Gemini 1.5 Pro / 2.0 Flash]
                          │
                          ▼
            [Structured Answer & Step Engine]
```

---

## 2. Chi Tiết Các Module

### Module 1 — Knowledge AI (RAG - Retrieval-Augmented Generation)
**Mục tiêu**: Trả lời chính xác mọi câu hỏi về ứng dụng mà không đoán mò (Hallucination-free).
- **Nguồn dữ liệu đầu vào**: FAQ, User Guide, Business Rules, API Docs, Database Description, Feature Description, Notification Rules, Validation Rules.
- **Quy trình xử lý (Flow)**:
  1. **Document Chunking**: Cắt tài liệu thành các đoạn 300-500 tokens (Overlap 50 tokens).
  2. **Embedding**: Tạo vector biểu diễn bằng Google `text-embedding-004` hoặc OpenAI `text-embedding-3-small`.
  3. **Vector DB Storage**: Lưu trữ vector vào Qdrant / PostgreSQL với tiện ích extension `pgvector`.
  4. **Similarity Search**: Truy vấn 5 đoạn văn bản có độ tương đồng cao nhất (Cosine Similarity threshold >= 0.75).
  5. **Gemini Prompting**: Đưa 5 đoạn context vào Gemini System Prompt kèm quy tắc bắt buộc:
     - Nếu có các bước thao tác, **bắt buộc đánh số thứ tự 1, 2, 3...**.
     - Viết trả lời ngắn gọn, trực diện, không lan man.

### Module 3 — Financial Analytics
**Mục tiêu**: Tự động phân tích dữ liệu thu chi thực tế của người dùng từ hệ thống.
- **Tích hợp API**: Backend tự động gọi các Endpoint báo cáo internal:
  - `GET /api/v1/reports/distribution` (Phân bổ chi tiêu theo danh mục).
  - `GET /api/v1/reports/trend` (Biến động chi tiêu 6 tháng).
- **Tính năng chính**:
  - Phát hiện danh mục chiếm % chi tiêu cao nhất (VD: 42% cho ăn uống).
  - So sánh tốc độ tăng trưởng chi tiêu MoM (VD: +18% so với tháng trước).
  - Đề xuất các khoản chi phí có thể cắt giảm dựa trên tần suất (VD: đi cà phê 28 lần/tháng -> cắt về 15 lần tiết kiệm ~1.2 triệu).

### Module 4 — Recommendation AI
**Mục tiêu**: Tư vấn kế hoạch tài chính cá nhân hóa.
- **Quy tắc phân bổ ngân sách**: Tự động áp dụng quy tắc 50/30/20 hoặc điều chỉnh theo chi phí cố định (VD: Thu nhập 12 triệu, tiền thuê nhà 3 triệu -> Phân bổ 25% Nhà ở, 29% Sinh hoạt, 21% Tiết kiệm, 25% Giải trí & Dự phòng).
- **Lập lộ trình tiết kiệm mục tiêu**:
  - Số tiền tiết kiệm hàng tháng = `Tổng tiền mục tiêu / Số tháng`.
  - VD: Laptop 25.000.000đ sau 8 tháng -> Cần tiết kiệm `3.125.000đ/tháng`.
- **Khắc phục vượt ngân sách**: Đưa ra 3 hành động cụ thể (Đánh số 1, 2, 3) để cắt giảm ngay lập tức.

---

## 3. Quy Tắc Định Dạng Phản Hồi (System Prompt Rules)

```markdown
SYSTEM PROMPT SPECIFICATION:
1. Bạn là Trợ lý AI SmartSpend chuyên nghiệp, thân thiện.
2. Quy tắc đánh số: Mọi câu trả lời chứa quy trình hoặc các bước thực hiện BẮT BUỘC phải đánh số 1., 2., 3. ở đầu dòng.
3. Độ dài: Ngắn gọn, súc tích, đi thẳng vào trọng tâm vấn đề, không dài dòng.
4. Độ chính xác: Đối với các câu hỏi hướng dẫn ứng dụng, CHỈ dùng thông tin từ Context được cung cấp. Không tự đoán.
```
