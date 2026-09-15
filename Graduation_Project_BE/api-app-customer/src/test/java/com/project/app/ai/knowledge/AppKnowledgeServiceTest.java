package com.project.app.ai.knowledge;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AppKnowledgeServiceTest {

    private final AppKnowledgeService service = new AppKnowledgeService();

    @Test
    void recognizesAllAcceptanceTestCases() {
        List<Case> cases = List.of(
                c("APP_OVERVIEW", "Ứng dụng SmartSpend có những chức năng chính nào?"),
                c("BANK_LINK", "Làm thế nào để tôi liên kết thẻ ngân hàng vào ví?"),
                c("WALLET_TOP_UP", "Nạp tiền vào ví bằng mã VietQR như thế nào?"),
                c("WALLET_WITHDRAW", "Quy trình rút tiền từ ví về tài khoản ngân hàng mất bao lâu?"),
                c("BUDGET_CREATE", "Làm sao để tôi tạo một ngân sách chi tiêu hàng tháng?"),
                c("FUND_DEFINITION", "Quỹ nhóm (Group Fund) là gì?"),
                c("FUND_INVITE", "Tôi muốn mời bạn bè tham gia quỹ nhóm thì làm bằng cách nào?"),
                c("SPLIT_BILL", "Tính năng chia tiền (Split Bill) hoạt động ra sao?"),
                c("PIN_LOCKOUT", "Tôi nhập sai mã PIN 5 lần thì tài khoản có bị khóa không?"),
                c("RESET_PASSWORD", "Làm sao để khôi phục mật khẩu khi bị quên?"),
                c("INVOICE_REMINDER", "Hóa đơn nhắc hạn là gì? Nó có tự động trừ tiền không?"),
                c("CUSTOM_CATEGORY", "Tôi có thể tạo thêm các danh mục chi tiêu tự chọn không?"),
                c("NOTEBOOK_VS_WALLET", "Sổ tay giao dịch khác gì với Ví SmartSpend?"),
                c("BUDGET_LOCATION", "Tính năng theo dõi phân bổ ngân sách hiển thị ở đâu?"),
                c("SUPPORT_TICKET", "Làm sao để gửi yêu cầu hỗ trợ (Ticket) đến Ban quản trị?"),
                c("DELETE_NOTEBOOK_TRANSACTION", "Làm thế nào để xóa một giao dịch thu chi sổ tay đã nhập sai?"),
                c("NOTEBOOK_BALANCE", "Tiền trong sổ tay có được tự động cộng vào số dư ví SmartSpend không?"),
                c("BUDGET_EDIT", "Tôi muốn thay đổi hạn mức ngân sách của tháng này thì làm thế nào?"),
                c("CREDENTIAL_PRIVACY", "Quản trị viên có quyền xem mật khẩu hoặc mã PIN của tôi không?"),
                c("INVOICE_PAID", "Làm sao để đánh dấu một hóa đơn là đã thanh toán?")
        );

        cases.forEach(testCase -> assertThat(service.findAnswer(testCase.prompt()))
                .as(testCase.prompt())
                .hasValueSatisfying(answer -> assertThat(answer.id()).isEqualTo(testCase.expectedId())));
    }

    @Test
    void recognizesFlexibleParaphrasesWithAndWithoutVietnameseAccents() {
        List<Case> cases = List.of(
                c("WALLET_TOP_UP", "Chỉ mình cách quét QR để nạp ví với SePay"),
                c("BANK_LINK", "Hướng dẫn kết nối tài khoản bank"),
                c("BUDGET_CREATE", "Muốn thiết lập hạn mức mới thì làm sao?"),
                c("FUND_INVITE", "Cách thêm thành viên vào fund?"),
                c("SPLIT_BILL", "Chia hoa don tuy chinh tung nguoi lam sao?"),
                c("RESET_PASSWORD", "Cach reset password khi quen"),
                c("SUPPORT_TICKET", "Tôi muốn tạo ticket liên hệ hỗ trợ như thế nào?"),
                c("INVOICE_PAID", "Cách chuyển trạng thái hóa đơn sang đã trả?")
        );

        cases.forEach(testCase -> assertThat(service.findAnswer(testCase.prompt()))
                .as(testCase.prompt())
                .hasValueSatisfying(answer -> assertThat(answer.id()).isEqualTo(testCase.expectedId())));
    }

    @Test
    void doesNotInterceptCommandsOrUnrelatedOpenEndedQuestions() {
        assertThat(service.findAnswer("Tạo ngân sách Ăn uống 2 triệu tháng này")).isEmpty();
        assertThat(service.findAnswer("Tháng này tôi đã chi bao nhiêu?")).isEmpty();
        assertThat(service.findAnswer("Quy tắc 50/30/20 là gì?")).isEmpty();
    }

    @Test
    void adaptsPinLockoutAnswerToAttemptCount() {
        AppKnowledgeService.KnowledgeAnswer four = service.findAnswer(
                "Tôi nhập sai mã PIN 4 lần thì có bị khóa không?").orElseThrow();
        AppKnowledgeService.KnowledgeAnswer five = service.findAnswer(
                "Nếu sai PIN 5 lần tài khoản có khóa không?").orElseThrow();
        AppKnowledgeService.KnowledgeAnswer seven = service.findAnswer(
                "Nhập PIN sai 7 lần có sao không?").orElseThrow();

        assertThat(four.text()).contains("Chưa", "còn 1 lần", "lần sai thứ 5");
        assertThat(five.text()).contains("Có", "chạm hoặc vượt ngưỡng");
        assertThat(seven.text()).contains("Có", "7 lần", "vượt ngưỡng");
        assertThat(four.text()).isNotEqualTo(five.text());
    }

    private static Case c(String id, String prompt) {
        return new Case(id, prompt);
    }

    private record Case(String expectedId, String prompt) {
    }
}
