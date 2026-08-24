# SmartSpend AI v2 — Kế hoạch triển khai

> Tài liệu này mô tả hướng đi sau khi dọn sạch AI v1 (BE + FE).  
> Cập nhật: 2026-08-20

---

## 1. Hiện trạng sau khi dọn (v1.5)

### Backend (`api-app-customer/ai`)
| Thành phần | Trạng thái |
|------------|------------|
| `POST /api/v1/ai/chat` | ✅ Giữ — endpoint chính |
| `AiOrchestrator` + `IntentRouter` | ✅ Giữ — routing deterministic + Gemini |
| 6 tools (wallet, spending, budget, goal, guide, create-tx) | ✅ Giữ |
| `DocumentLoader` + keyword RAG | ✅ Giữ — nguồn hướng dẫn app |
| `FallbackRouter` | ✅ Giữ — khi Gemini lỗi |
| pgvector / embedding / AdminRag | ❌ Đã xóa — không chạy trên MySQL |
| Debug log `AI DEBUG` | ❌ Đã xóa |

### Frontend (`AppCustomer`)
| Thành phần | Trạng thái |
|------------|------------|
| `AIChatButton` + `AIChatModal` | ✅ Giữ — UX chat chính |
| `aiChatService` → chỉ gọi BE | ✅ Đã đơn giản hóa |
| Client Gemini + key nhúng + canned responses | ❌ Đã xóa |
| `SmartSpendProposals` | ❌ Đã xóa — không dùng |
| `actionPrompt` UI chưa wire | ❌ Đã xóa |

---

## 2. Mục tiêu AI v2

1. **Một nguồn sự thật** — mọi logic AI chỉ chạy trên backend; app chỉ render.
2. **Trả lời dựa trên dữ liệu thật** — ví, sổ tay, quỹ, ngân sách, báo cáo của user đang đăng nhập.
3. **Hành động được phép** — không chỉ tư vấn, mà thực hiện được thao tác an toàn (ghi giao dịch, tạo ngân sách…) sau khi user xác nhận.
4. **Bảo mật** — bắt buộc JWT; không `permitAll` endpoint AI.
5. **Quan sát được** — log intent, tool, latency; dễ debug khi user báo “AI trả lời sai”.

---

## 3. Kiến trúc đề xuất

```
Mobile (AIChatModal)
    │  POST /api/v1/ai/chat  { conversationId, message }
    ▼
AiChatController (JWT required)
    ▼
GuardrailService
    ▼
AiOrchestrator
    ├── IntentRouter (regex + slot state)
    ├── Deterministic handlers (wallet, spending, goal, guide…)
    ├── Gemini function-calling (GENERAL / phức tạp)
    └── FallbackRouter
    ▼
Tools → domain services (wallet, report, fund, notebook, budget…)
    ▼
AiResponseBuilder → { text, moduleType, cards, actions? }
    ▼
ConversationMemoryService (Redis)
```

### RAG v2 (không pgvector ngay)
- **Phase 1:** Mở rộng `DocumentLoader` → file JSON/YAML trong repo (dễ cập nhật hướng dẫn).
- **Phase 2 (tuỳ chọn):** PostgreSQL + pgvector hoặc embedding store riêng nếu số lượng tài liệu lớn.

---

## 4. Lộ trình theo phase

### Phase A — Ổn định nền (1–2 tuần)
- [ ] Bắt buộc JWT cho `/api/v1/ai/**` (bỏ `permitAll`).
- [ ] Mobile gửi `conversationId` (AsyncStorage) để backend nhớ ngữ cảnh.
- [ ] Wire `CreateTransactionTool` vào intent CREATE_TRANSACTION (hiện chỉ prompt).
- [ ] Handler deterministic cho `APP_HELP` → gọi `AppGuideTool` trực tiếp.
- [ ] Test E2E: nạp/rút, ngân sách, mục tiêu tiết kiệm, quên PIN.

### Phase B — Dữ liệu & công cụ mới (2–3 tuần)
- [ ] Tool `get_finance_center_summary` — tổng quan ví + sổ tay + quỹ theo kỳ.
- [ ] Tool `get_fund_status` — số dư quỹ, nạp/rút gần đây.
- [ ] Tool `get_budget_status` — ngân sách đang vượt/chưa vượt.
- [ ] Cập nhật `TransactionTool` dùng `WalletTransaction` (đồng bộ với Finance Center).
- [ ] Cards FE: hiển thị thêm loại `FINANCE_SUMMARY`, `FUND_STATUS`.

### Phase C — Trải nghiệm (2 tuần)
- [ ] `AIRecommendationCard` trên Home: gọi API insight thay vì text cứng.
- [ ] Action buttons trong chat (điều hướng màn Nạp tiền, Ngân sách, Trung tâm tài chính).
- [ ] Streaming response (SSE) nếu Gemini latency cao.
- [ ] Quick suggestions động theo ngữ cảnh (có giao dịch / chưa có giao dịch).

### Phase D — Vận hành (liên tục)
- [ ] Redis bắt buộc trên staging/production.
- [ ] Rate limit theo user (tránh lạm dụng Gemini).
- [ ] Dashboard admin: số request, intent phổ biến, lỗi tool.
- [ ] Bộ test regression cho `IntentRouter` + parsers tiếng Việt.

---

## 5. API contract v2 (đề xuất)

### Request
```json
{
  "conversationId": "uuid-or-stable-id",
  "message": "Nạp rút tiền thế nào?"
}
```

### Response
```json
{
  "id": "msg-uuid",
  "text": "...",
  "moduleType": "APP_GUIDE | ANALYTICS | RECOMMENDATION | FINANCIAL_GOAL | GENERAL",
  "timestamp": "2026-08-20T10:00:00",
  "cards": [{ "type": "METRICS", "title": "...", "items": [] }],
  "actions": [{ "label": "Mở Ví", "route": "/wallet" }]
}
```

---

## 6. Cấu hình môi trường

| Biến | Mô tả |
|------|--------|
| `GEMINI_API_KEY` | API key Gemini (BE only) |
| `gemini.model` | Mặc định `gemini-2.5-flash` |
| `spring.data.redis.host` | Bộ nhớ hội thoại (khuyến nghị production) |

**Không** đặt Gemini key trên mobile.

---

## 7. Tiêu chí hoàn thành v2

- [ ] 100% chat đi qua backend khi có mạng + đăng nhập.
- [ ] ≥ 5 intent deterministic không cần Gemini (wallet, spending, guide, goal, budget).
- [ ] User hỏi “tổng nạp rút tháng này” → trả đúng số từ Finance Center API.
- [ ] Không còn code duplicate AI giữa FE và BE.
- [ ] Test tự động cho parsers + ít nhất 10 câu hỏi mẫu tiếng Việt.

---

## 8. Việc nên làm tiếp theo (ưu tiên)

1. **Phase A** — JWT + `conversationId` + wire CREATE_TRANSACTION + APP_HELP handler.  
2. Chạy manual test chat với tài khoản có dữ liệu thật.  
3. Mở PR riêng “AI cleanup” (commit hiện tại) trước khi bắt Phase A.
