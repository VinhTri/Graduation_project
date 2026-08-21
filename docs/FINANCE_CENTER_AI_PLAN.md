# Kế hoạch AI Agent — Trung tâm tài chính (Finance Center)

> Phiên bản: 1.0 · Ngày: 2026-08-20  
> Phạm vi: mọi trường hợp hỏi đáp liên quan Trung tâm tài chính, không bỏ sót intent.

---

## 1. Mục tiêu

| Mục tiêu | Mô tả |
|----------|--------|
| **Đồng bộ dữ liệu** | AI trả lời từ cùng API `GET /api/v1/reports/finance-center` mà màn hình Trung tâm tài chính dùng — không tự tính, không hallucinate số liệu. |
| **Giá trị AI** | Diễn giải tự nhiên, tổng hợp đa nguồn (ví + sổ tay + quỹ), so sánh kỳ, insight ngắn — thay vì chỉ hiển thị bảng số. |
| **Phù hợp luận văn** | AI **bổ trợ** màn hình báo cáo; không thay thế UI. Demo: câu hỏi phức hợp mà user khó tự đọc từ nhiều tab. |

---

## 2. Nguồn dữ liệu & định nghĩa thuật ngữ

### 2.1 API lõi

```
GET /api/v1/reports/finance-center
  ?period=WEEK|MONTH|YEAR
  &date=YYYY-MM-DD          // neo kỳ hiện tại
  &compareDate=YYYY-MM-DD   // tùy chọn; mặc định = kỳ trước cùng loại
```

**Backend:** `ReportServiceImpl.getFinanceCenter()` → `FinanceCenterResponse`.

### 2.2 Cấu trúc response (bắt buộc hiểu đúng khi trả lời)

| Trường | Ý nghĩa | Ghi chú quan trọng |
|--------|---------|-------------------|
| `walletBalance`, `cashBalance`, `totalAssets` | **Số dư tại thời điểm** (point-in-time) | `totalAssets = wallet + cash`. **Không** gồm số dư quỹ tiết kiệm. |
| `walletBalancePercent`, `cashBalancePercent` | Tỷ trọng ví vs sổ tay trong tổng tài sản | Dùng cho câu “tiền nằm ở đâu”. |
| `current` / `compare` | Snapshot **dòng tiền theo kỳ** | Mỗi snapshot gồm `wallet`, `cash`, `fund`, `totalIncome`, `totalExpense`, `net`. |
| `current.wallet` | Nạp ví (`income`) / rút ví (`expense`) | Bao gồm giao dịch orphan trên ví mặc định. |
| `current.cash` | Thu / chi **sổ tay tiền mặt** | Notebook book type CASH. |
| `current.fund` | Nạp quỹ (`income`) / rút quỹ (`expense`) | **Không** cộng vào `totalIncome`/`totalExpense`/`net` của snapshot. |
| `delta` | Chênh lệch current vs compare | Có: wallet, cash, totalIncome, totalExpense, net. **Không có delta quỹ** (hạn chế API hiện tại — Phase 1 ghi rõ trong câu trả lời nếu user hỏi delta quỹ). |

### 2.3 Thuật ngữ UI ↔ AI (tiếng Việt)

| Trong app | Alias user có thể nói |
|-----------|------------------------|
| Trung tâm tài chính | báo cáo tài chính, tổng quan tài chính, finance center |
| Ví SmartSpend | ví, ví điện tử, wallet |
| Sổ tay tiền mặt | sổ tay, tiền mặt, cash, notebook |
| Quỹ tiết kiệm | quỹ, fund, tiết kiệm |
| Kỳ | tuần / tháng / năm |
| Thu / Chi / Ròng | thu nhập, chi tiêu, dòng tiền ròng, lãi lỗ kỳ |

### 2.4 API liên quan (Phase 2 — tab So sánh danh mục)

Tab **So sánh** trên FE còn gọi `GET /reports/distribution?type=EXPENSE&filter=...&date=...` cho **xếp hạng danh mục** giữa hai kỳ. **Không** thuộc `FinanceCenterResponse`; tool riêng `get_spending_by_category` (kế hoạch sau). Finance Center Agent Phase 1 **không** trả lời “top danh mục chi” trừ khi chuyển domain (xem §8).

---

## 3. Kiến trúc Agent

```
User message
    │
    ▼
AiOrchestrator
    ├─ CategoryCreateService (đã có)
    ├─ CategoryIntentRouter (đã có)
    ├─ FinanceIntentRouter (MỚI) ──► deterministic, không gọi Gemini
    ├─ GetFinanceCenterSummaryTool (MỚI) ──► ReportService.getFinanceCenter()
    └─ GeminiClient.chatWithTools (fallback / câu phức hợp)
           │
           ▼
    AiResponseBuilderService
        text + cards (FINANCE_SUMMARY) + actions (NAVIGATE → Finance Center)
```

### 3.1 FinanceIntentRouter

Router **keyword + pattern** (giống `CategoryIntentRouter`), trả về:

```java
enum FinanceIntent {
    GUIDE,              // trung tâm tài chính là gì / dùng để làm gì
    ASSETS_OVERVIEW,    // tổng tài sản, số dư ví/tiền mặt
    ASSETS_ALLOCATION,  // % ví vs tiền mặt
    PERIOD_OVERVIEW,    // thu/chi/ròng kỳ hiện tại (tổng)
    PERIOD_INCOME,      // chỉ thu
    PERIOD_EXPENSE,     // chỉ chi
    PERIOD_NET,         // chỉ ròng
    SOURCE_WALLET,      // dòng tiền ví kỳ
    SOURCE_CASH,        // dòng tiền sổ tay kỳ
    SOURCE_FUND,        // nạp/rút quỹ kỳ
    COMPARE_OVERVIEW,   // so sánh hai kỳ (tổng)
    COMPARE_INCOME,
    COMPARE_EXPENSE,
    COMPARE_NET,
    COMPARE_WALLET,
    COMPARE_CASH,
    DELTA_SUMMARY,      // chênh lệch vs kỳ trước (insight)
    PERIOD_EXPLICIT,    // “tháng 3”, “tuần trước” — cần resolve date
    NONE                // không phải finance → orchestrator tiếp
}
```

Kèm `ResolvedPeriod`:

```java
record ResolvedPeriod(
    String period,           // WEEK | MONTH | YEAR
    LocalDate anchorDate,    // neo kỳ current
    LocalDate compareDate    // null = default previous period
) {}
```

### 3.2 Tool: `get_finance_center_summary`

**Schema Gemini / AiTool:**

| Param | Type | Required | Mô tả |
|-------|------|----------|--------|
| `period` | enum | no (default MONTH) | WEEK, MONTH, YEAR |
| `date` | string (ISO date) | no (default today) | Ngày neo kỳ hiện tại |
| `compareDate` | string | no | Kỳ so sánh; bỏ trống = kỳ trước |

**Output:** JSON rút gọn từ `FinanceCenterResponse` (đủ cho LLM diễn giải, tránh token thừa).

### 3.3 Card FE: `FINANCE_SUMMARY`

```typescript
type AiFinanceSummaryCard = {
  type: 'FINANCE_SUMMARY'
  title: string
  periodLabel: string
  compareLabel?: string
  items: { label: string; value: string; hint?: string }[]
}
```

**Action mặc định:** `NAVIGATE` → route Trung tâm tài chính (deep link `period`, `date` nếu FE hỗ trợ).

### 3.4 Luồng quyết định: Router vs Gemini

| Tình huống | Xử lý |
|------------|--------|
| Câu khớp 1 intent rõ (§4) | Router → gọi tool trực tiếp → template + card (không Gemini) |
| Câu hỏi kết hợp (“tháng này chi nhiều hơn tháng trước không và tiền nằm ở đâu”) | Gemini + `get_finance_center_summary` |
| Câu mơ hồ thiếu kỳ | Mặc định MONTH + hôm nay; text nói rõ giả định |
| Không liên quan finance | `NONE` → category router / Gemini chung |

---

## 4. Ma trận intent — TOÀN BỘ trường hợp hỏi đáp

Mỗi intent gồm: **mục đích**, **câu mẫu**, **tham số mặc định**, **dữ liệu đọc**, **mẫu trả lời**, **card items**, **edge cases**.

---

### 4.1 GUIDE — Giới thiệu / hướng dẫn

**Mục đích:** User chưa biết Trung tâm tài chính là gì.

**Câu mẫu (VI):**
- Trung tâm tài chính là gì?
- Báo cáo tài chính dùng để làm gì?
- Finance center là gì?
- Xem tổng quan tài chính ở đâu?
- App có báo cáo thu chi không?

**Không gọi API.** Trả lời cố định + action NAVIGATE.

**Mẫu trả lời:**
> Trung tâm tài chính giúp bạn xem **số dư** (ví + sổ tay), **dòng tiền thu/chi/ròng** theo tuần/tháng/năm và **so sánh với kỳ trước**. Bạn có thể hỏi tôi ví dụ: “Tháng này thu chi thế nào?” hoặc “Tiền đang nằm ở ví hay tiền mặt?”.

**Action:** `NAVIGATE` → Finance Center.

---

### 4.2 ASSETS_OVERVIEW — Tổng tài sản & số dư

**Câu mẫu:**
- Tôi có bao nhiêu tiền?
- Tổng tài sản của tôi?
- Số dư ví bao nhiêu?
- Số dư sổ tay / tiền mặt?
- Hiện tại tôi đang có những gì?
- Còn bao nhiêu trong ví SmartSpend?

**Params:** `period=MONTH`, `date=today` (số dư không phụ thuộc kỳ nhưng vẫn gọi API một lần cho nhất quán).

**Dữ liệu:** `totalAssets`, `walletBalance`, `cashBalance`.

**Mẫu trả lời (có số):**
> Tổng tài sản (ví + sổ tay): **{totalAssets}**. Trong đó ví: **{walletBalance}**, sổ tay tiền mặt: **{cashBalance}**.

**Card items:** Tổng tài sản | Ví | Sổ tay.

**Edge cases:**

| Case | Trả lời |
|------|---------|
| `totalAssets = 0` | Chưa có số dư ví hoặc sổ tay. Gợi ý nạp ví hoặc ghi thu sổ tay. |
| Chỉ hỏi ví | Chỉ nêu `walletBalance`, không nhắc cash trừ khi liên quan. |
| User hỏi “bao gồm quỹ không?” | **Không.** Giải thích: tổng tài sản = ví + sổ tay; quỹ là kênh tiết kiệm riêng, xem mục 4.7. |

---

### 4.3 ASSETS_ALLOCATION — Phân bổ tài sản

**Câu mẫu:**
- Tiền của tôi nằm ở đâu?
- Ví và tiền mặt tỷ lệ thế nào?
- % tiền trong ví?
- Nên để tiền ví hay tiền mặt? *(chỉ mô tả hiện trạng + insight nhẹ, không tư vấn đầu tư)*

**Dữ liệu:** `walletBalancePercent`, `cashBalancePercent`, balances.

**Mẫu trả lời:**
> Tài sản đang nằm **{walletPct}%** ở ví và **{cashPct}%** ở sổ tay tiền mặt ({walletBalance} / {cashBalance}).

**Insight (reuse `buildInsights` logic FE):** Nếu chênh > 0 và một bên = 100%, nói “gần như toàn bộ ở …”.

**Edge:** `totalAssets = 0` → không tính %; báo chưa có tài sản.

---

### 4.4 PERIOD_OVERVIEW — Tổng quan thu/chi kỳ hiện tại

**Câu mẫu:**
- Tháng này thu chi thế nào?
- Tuần này tôi thu chi bao nhiêu?
- Tổng quan tài chính tháng này
- Báo cáo tháng {n}
- Năm nay thu chi ra sao?
- Kỳ này tình hình thế nào?

**Params resolve:**

| Cụm từ | period | anchorDate |
|--------|--------|------------|
| tuần này, tuần hiện tại | WEEK | today |
| tuần trước | WEEK | previous week Monday/Sunday theo BE |
| tháng này | MONTH | today |
| tháng trước | MONTH | first day prev month |
| năm nay | YEAR | today |
| năm ngoái | YEAR | prev year |
| “tháng 3”, “tháng 3/2025” | MONTH | parsed |
| (không nói kỳ) | MONTH | today |

**Dữ liệu:** `current.totalIncome`, `current.totalExpense`, `current.net`, `currentLabel`.

**Lưu ý:** Tổng thu/chi = **ví + sổ tay**, không gồm quỹ.

**Mẫu trả lời:**
> **{currentLabel}:** Thu **{income}**, chi **{expense}**, ròng **{net}** (ví + sổ tay).

**Card:** Thu | Chi | Ròng | Kỳ.

**Edge:**

| Case | Trả lời |
|------|---------|
| income=expense=0 | Kỳ này chưa ghi nhận thu/chi trên ví hoặc sổ tay. |
| net > 0 | “Kỳ này dương — thu nhiều hơn chi.” |
| net < 0 | “Kỳ này âm — chi nhiều hơn thu.” |

---

### 4.5 PERIOD_INCOME — Chỉ thu

**Câu mẫu:**
- Tháng này thu bao nhiêu?
- Thu nhập tuần này?
- Tôi nạp ví bao nhiêu tháng này? → *router phân nhánh SOURCE_WALLET nếu có “nạp ví”*
- Tổng thu kỳ này

**Dữ liệu:** `current.totalIncome` (+ breakdown nếu câu hỏi “thu từ đâu”: wallet.income + cash.income).

---

### 4.6 PERIOD_EXPENSE — Chỉ chi

**Câu mẫu:**
- Tháng này chi bao nhiêu?
- Tuần này tiêu hết bao nhiêu?
- Tổng chi tiêu tháng này
- Tôi đã tiêu bao nhiêu?

**Dữ liệu:** `current.totalExpense`.

**Phân biệt:** “Chi tiêu theo danh mục” → **out of scope Phase 1** (§8.1).

---

### 4.7 PERIOD_NET — Dòng tiền ròng

**Câu mẫu:**
- Tháng này lời hay lỗ?
- Dòng tiền ròng tháng này?
- Thu chi chênh lệch bao nhiêu?
- Tháng này còn dư bao nhiêu?

**Dữ liệu:** `current.net`.

---

### 4.8 SOURCE_WALLET — Dòng tiền ví

**Câu mẫu:**
- Ví tháng này nạp/rút thế nào?
- Giao dịch ví tuần này
- Nạp ví bao nhiêu tháng này?
- Rút ví bao nhiêu?

**Dữ liệu:** `current.wallet.income`, `current.wallet.expense`, `current.wallet.net`.

**Thuật ngữ:** income = nạp (TOP_UP), expense = rút (WITHDRAW).

---

### 4.9 SOURCE_CASH — Sổ tay tiền mặt

**Câu mẫu:**
- Sổ tay tháng này thu chi thế nào?
- Tiền mặt thu bao nhiêu?
- Chi tiêu tiền mặt tháng này

**Dữ liệu:** `current.cash.*`

---

### 4.10 SOURCE_FUND — Quỹ tiết kiệm (dòng kỳ)

**Câu mẫu:**
- Quỹ tháng này nạp/rút thế nào?
- Tôi gửi quỹ bao nhiêu tháng này?
- Hoạt động quỹ tuần này

**Dữ liệu:** `current.fund.income` (nạp), `current.fund.expense` (rút), `current.fund.net`.

**Edge:** User hỏi “số dư quỹ” → **không có trong Finance Center API** → trả lời: “Trung tâm tài chính chỉ hiển thị **nạp/rút quỹ trong kỳ**, không phải số dư quỹ. Bạn xem số dư tại màn Quỹ.” + action NAVIGATE Funds (Phase 1 optional).

---

### 4.11 COMPARE_OVERVIEW — So sánh hai kỳ (tổng)

**Câu mẫu:**
- So sánh tháng này với tháng trước
- Tháng này vs tháng trước thu chi thế nào?
- Tuần này so với tuần trước
- Kỳ này có tốt hơn kỳ trước không?

**Dữ liệu:** `current.*`, `compare.*`, `currentLabel`, `compareLabel`.

**Mẫu trả lời:**
> **{currentLabel}:** thu {ci}, chi {ce}, ròng {cn}.  
> **{compareLabel}:** thu {pi}, chi {pe}, ròng {pn}.

---

### 4.12 COMPARE_INCOME / COMPARE_EXPENSE / COMPARE_NET

**Câu mẫu:**
- Tháng này thu có cao hơn tháng trước không?
- Chi tháng này tăng hay giảm?
- Ròng tháng này so tháng trước?

**Dữ liệu:** current vs compare field tương ứng + `delta.totalIncome|totalExpense|net`.

---

### 4.13 COMPARE_WALLET / COMPARE_CASH

**Câu mẫu:**
- Ví tháng này so tháng trước?
- Chi ví tăng bao nhiêu so với tháng trước?
- Sổ tay so sánh hai tháng

**Dữ liệu:** `delta.wallet.*`, `delta.cash.*` + snapshot compare.

---

### 4.14 DELTA_SUMMARY — Insight chênh lệch

**Câu mẫu:**
- Thay đổi so với kỳ trước?
- Tăng giảm bao nhiêu %?
- Xu hướng thu chi gần đây?
- Có tiến bộ không?

**Dữ liệu:** toàn bộ `delta`; format % qua `AmountDelta.percent` (null nếu mẫu = 0).

**Mẫu (reuse insight FE):**
> Dòng tiền ròng **{tăng/giảm} {amount}** ({percent}%) so với {compareLabel}.  
> Thu **{...}**, chi **{...}**.

**Edge:**

| Case | Trả lời |
|------|---------|
| compare period = 0 | “Kỳ trước chưa có dữ liệu nên không tính %.” |
| percent = null | Chỉ nêu số tiền tuyệt đối. |
| User hỏi delta quỹ | API không có `delta.fund` → nêu nạp/rút từng kỳ thủ công từ `current.fund` vs `compare.fund`. |

---

### 4.15 PERIOD_EXPLICIT — Kỳ / ngày tùy chỉnh

**Câu mẫu:**
- Báo cáo tuần 12/5 đến 18/5 *(nếu không parse được → MONTH chứa ngày đó)*
- Tháng 2 năm 2024 thu chi thế nào?
- Quý 1 *(Phase 1: không hỗ trợ QUARTER — trả lời hướng dẫn chọn tháng 1–3 hoặc YEAR)*
- Hôm nay / hôm qua *(point events — Finance Center là kỳ; giải thích “hôm nay” = tuần/tháng chứa hôm nay)*

**Parser Phase 1 (deterministic):**

| Pattern | Kết quả |
|---------|---------|
| `tháng (\d{1,2})` (+ optional năm) | MONTH, ngày 15 tháng đó |
| `năm (\d{4})` | YEAR, 30/6 năm đó |
| `tuần này/trước`, `tháng này/trước`, `năm nay/ngoái` | như bảng 4.4 |
| `(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})` | anchorDate parsed, period=MONTH unless “tuần” in text |

**Edge:** Ngày tương lai → clamp `today` (giống FE).

---

### 4.16 Câu hỏi kết hợp (multi-intent)

**Câu mẫu:**
- Tháng này chi bao nhiêu và so với tháng trước?
- Tôi có bao nhiêu tiền và tháng này thu chi thế nào?
- Tiền nằm ở ví nhiều hay chi ví nhiều hơn sổ tay?

**Xử lý:** Gemini + một lần gọi tool; prompt yêu cầu trả lời đủ ý; card gom metrics chính.

---

### 4.17 NONE / không thuộc Finance Center

Router trả `NONE` khi không khớp — chuyển Category / Gemini.

---

## 5. Trường hợp đặc biệt & fallback (bắt buộc)

| # | Tình huống | Hành vi |
|---|------------|---------|
| E1 | User mới, mọi số = 0 | Thông báo thân thiện + gợi ý nạp ví / ghi giao dịch |
| E2 | Chỉ có ví, sổ tay = 0 | Trả lời đúng partial; allocation 100% ví |
| E3 | API lỗi / timeout | “Không lấy được báo cáo, thử lại sau.” Không bịa số |
| E4 | JWT hết hạn | 401 từ controller — FE xử lý login |
| E5 | `period` invalid | Fallback MONTH |
| E6 | Câu tiếng Anh | Cùng logic; text EN nếu detect `language=en` (optional Phase 1: VI only) |
| E7 | Câu quá ngắn: “Báo cáo?” | Hỏi lại hoặc PERIOD_OVERVIEW mặc định tháng này |
| E8 | Nhầm với ngân sách (budget) | “Câu này thuộc **Ngân sách**…” → Phase 2 tool |
| E9 | Nhầm với chi theo danh mục | Chuyển §8.1 |
| E10 | Yêu cầu tư vấn đầu tư | Guardrail: chỉ mô tả dữ liệu app, không khuyên đầu tư |
| E11 | Export / chia sẻ báo cáo | “Bạn có thể xuất từ nút Chia sẻ trên Trung tâm tài chính.” + NAVIGATE |
| E12 | Tab so sánh danh mục trên app | Phase 2 distribution tool |
| E13 | Hỏi số dư quỹ tổng | Màn Quỹ, không phải Finance Center |
| E14 | Hỏi lịch sử giao dịch chi tiết | Màn Lịch sử / Phase 3 search tool |
| E15 | So sánh tùy ý hai tháng không liên tiếp | `compareDate` explicit nếu parse được “so với tháng 2”; không thì default kỳ trước |

---

## 6. Out of scope & chuyển domain (§8 chi tiết)

### 8.1 Chi tiêu theo danh mục / top category

**Câu:** “Tháng này chi nhiều nhất ở đâu?”, “Danh mục nào tốn tiền nhất?”

**Phase 1:** Trả lời: “Câu này cần **phân bổ chi tiêu theo danh mục** — tôi sẽ hỗ trợ ở bản cập nhật tiếp theo. Hiện bạn xem tab So sánh trong Trung tâm tài chính.”  
**Phase 2:** Tool `get_spending_by_category`.

### 8.2 Ngân sách

**Câu:** “Tôi có vượt ngân sách không?” → Tool `get_budget_status` (Phase 2).

### 8.3 Ghi giao dịch / chuyển tiền

**Không** thực hiện write — chỉ đọc báo cáo.

### 8.4 Danh mục (đã có agent riêng)

“Danh mục của tôi” → `CategoryIntentRouter`.

---

## 7. Response template & Card mapping

### 7.1 Template theo intent (deterministic)

| Intent | Card title | Items (label → field) |
|--------|------------|------------------------|
| ASSETS_OVERVIEW | Tài sản hiện tại | Tổng → totalAssets; Ví → walletBalance; Sổ tay → cashBalance |
| ASSETS_ALLOCATION | Phân bổ tài sản | Ví % → walletBalancePercent; Sổ tay % → cashBalancePercent |
| PERIOD_* | {currentLabel} | Thu → totalIncome; Chi → totalExpense; Ròng → net |
| SOURCE_WALLET | Ví · {currentLabel} | Nạp → wallet.income; Rút → wallet.expense; Ròng → wallet.net |
| SOURCE_CASH | Sổ tay · {currentLabel} | Thu → cash.income; Chi → cash.expense; Ròng → cash.net |
| SOURCE_FUND | Quỹ · {currentLabel} | Nạp → fund.income; Rút → fund.expense; Ròng → fund.net |
| COMPARE_* | So sánh kỳ | 2 cột text trong body; card highlight delta.net |
| DELTA_SUMMARY | Thay đổi vs {compareLabel} | Δ Thu, Δ Chi, Δ Ròng |

Format tiền: backend format VND (`#,### đ`) hoặc trả raw number để FE `formatMoney`.

### 7.2 Actions

| Action | Khi nào |
|--------|---------|
| `NAVIGATE` /finance-center | Hầu hết intent finance |
| `NAVIGATE` /funds | E13 số dư quỹ |
| Không action | GUIDE đã có nút mở màn hình |

---

## 8. Cập nhật SystemPrompt (Gemini)

Thêm vào `SystemPrompt`:

- Có tool `get_finance_center_summary(period, date, compareDate?)`.
- Định nghĩa thuật ngữ ví / sổ tay / quỹ / totalAssets (§2).
- **Cấm** invent số; bắt buộc gọi tool trước khi nêu số liệu finance.
- Câu ngoài phạm vi → nói rõ và không gọi tool sai.

---

## 9. Frontend (tối thiểu Phase 1)

| File | Thay đổi |
|------|----------|
| `shared/services/aiChatService.ts` | Thêm card type `FINANCE_SUMMARY` |
| `AIChatModal.tsx` | Render card 3–6 dòng metric |
| (Optional) deep link | Finance Center nhận query `period`, `date` từ action payload |

---

## 10. Lộ trình triển khai

### Phase 1 — Finance Center core (ưu tiên)

1. `FinancePeriodParser` — resolve WEEK/MONTH/YEAR + anchor/compare dates  
2. `FinanceIntentRouter` — full enum §3.1  
3. `GetFinanceCenterSummaryTool` — wrap `ReportService`  
4. `FinanceResponseBuilder` — text + card + format tiền  
5. Wire `AiOrchestrator` (order: create category → category → **finance** → gemini)  
6. `SystemPrompt` update  
7. FE card `FINANCE_SUMMARY`  
8. Manual test checklist §11  

### Phase 2 — Chi tiêu theo danh mục + Ngân sách ✅

- [x] `GetSpendingByCategoryTool` (distribution API, top 6, compare 2 kỳ)
- [x] `GetBudgetStatusTool` (ngân sách ACTIVE, vượt hạn mức)
- [x] Intent `SPENDING_BY_CATEGORY`, `SPENDING_BY_CATEGORY_COMPARE`, `BUDGET_STATUS`
- [x] Card FE: `SPENDING_RANK`, `BUDGET_STATUS`

### Phase 3 — Insight card Home ✅

- [x] `FinanceInsightService` — tổng hợp insight từ finance center + top danh mục + ngân sách
- [x] `GET /api/v1/ai/home-insight`
- [x] `AIRecommendationCard` gọi API thật, refresh khi vào Home

- Wire `AIRecommendationCard` → API insight từ finance summary  

---

## 11. Checklist test — 100% intent coverage

Mỗi dòng: gửi chat → kỳ vọng intent → số khớp API (nếu có).

### Guide
- [ ] Trung tâm tài chính là gì → GUIDE, no numbers

### Assets
- [ ] Tôi có bao nhiêu tiền → ASSETS_OVERVIEW
- [ ] Số dư ví → ASSETS (partial)
- [ ] Tiền nằm ở đâu → ASSETS_ALLOCATION
- [ ] totalAssets=0 user → E1 message

### Period current
- [ ] Tháng này thu chi → PERIOD_OVERVIEW
- [ ] Thu tháng này → PERIOD_INCOME
- [ ] Chi tuần này → PERIOD_EXPENSE + WEEK
- [ ] Dòng tiền ròng → PERIOD_NET
- [ ] Tháng 3/2025 → PERIOD_EXPLICIT

### By source
- [ ] Nạp ví tháng này → SOURCE_WALLET
- [ ] Sổ tay thu chi → SOURCE_CASH
- [ ] Quỹ nạp rút → SOURCE_FUND
- [ ] Số dư quỹ → E13 redirect

### Compare
- [ ] So sánh tháng này và tháng trước → COMPARE_OVERVIEW
- [ ] Chi có tăng không → COMPARE_EXPENSE + delta
- [ ] Ví so tháng trước → COMPARE_WALLET

### Delta / insight
- [ ] Thay đổi bao nhiêu % → DELTA_SUMMARY
- [ ] Kỳ trước không data → E compare zero

### Combined / Gemini
- [ ] Tháng này chi và tiền ở đâu → multi field
- [ ] Báo cáo? → default month overview

### Out of scope
- [ ] Top danh mục chi → 8.1 message
- [ ] Vượt ngân sách → 8.2 message
- [ ] Danh mục của tôi → category router

### Errors
- [ ] Simulate API fail → E3

---

## 12. File BE dự kiến (Phase 1)

```
ai/
  finance/
    FinanceIntent.java
    FinanceIntentRouter.java
    FinancePeriodParser.java
    FinanceResponseBuilder.java
  tool/
    GetFinanceCenterSummaryTool.java
  orchestration/
    AiOrchestrator.java          (modify)
  prompt/
    SystemPrompt.java            (modify)
  dto/response/
    AiCardDto.java               (FINANCE_SUMMARY nếu cần enum)
```

---

## 13. Tiêu chí hoàn thành Phase 1

- [ ] Mọi intent §4 có test pass §11  
- [ ] Số liệu khớp màn Finance Center cùng `period` + `date`  
- [ ] Không trả lời sai định nghĩa quỹ vs totalAssets  
- [ ] Card + navigate hoạt động trên app  
- [ ] Giáo viên demo được ≥3 câu “AI có giá trị”: so sánh kỳ + phân bổ tài sản + câu kết hợp  

---

*Tài liệu này là spec triển khai; cập nhật khi thêm Phase 2/3.*
