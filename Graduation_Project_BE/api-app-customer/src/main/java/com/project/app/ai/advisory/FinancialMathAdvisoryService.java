package com.project.app.ai.advisory;

import com.project.app.ai.dto.response.AiActionDto;
import com.project.app.user.entity.User;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class FinancialMathAdvisoryService {

    private static final Pattern MONEY = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(trieu|tr|k|nghin|ngan|000|d|dong)?");
    private static final Pattern MONTHS = Pattern.compile("(\\d+)\\s*(thang|tháng)");
    private static final Pattern YEARS = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(nam|năm)");
    private static final Pattern DAYS = Pattern.compile("(\\d+)\\s*(ngay|ngày)");
    private static final Pattern WEEKS = Pattern.compile("(\\d+)\\s*(tuan|tuần)");
    private static final Pattern PERCENT = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*%");
    private static final Pattern FIFTY_THIRTY_TWENTY = Pattern.compile("\\b50\\s*/?\\s*30\\s*/?\\s*20\\b");
    private static final Pattern JAR_COUNT = Pattern.compile("(\\d{1,2})\\s*(?:chiec\\s*)?lo\\b");

    public record AdvisoryAnswer(String text, List<AiActionDto> actions) {
    }

    public Optional<AdvisoryAnswer> advise(User user, String message) {
        if (message == null || message.isBlank()) return Optional.empty();
        String n = normalize(message);
        List<BigDecimal> amounts = moneyValues(n);

        if (FIFTY_THIRTY_TWENTY.matcher(n).find() && !amounts.isEmpty())
            return Optional.of(fiftyThirtyTwenty(amounts.get(0)));
        if (has(n, "thu nhap", "luong", "tien luong")
                && has(n, "phan bo", "chia ngan sach", "chia chi tieu", "nen chia", "lap ngan sach")
                && !amounts.isEmpty())
            return Optional.of(fiftyThirtyTwenty(amounts.get(0)));
        if (has(n, "dang du", "tien du", "tien nhan roi", "co san trong vi", "con du trong vi")
                && has(n, "quan ly", "phan bo", "nen lam gi", "su dung", "goi y")
                && !amounts.isEmpty())
            return Optional.of(surplusPlan(amounts.get(0)));
        Optional<Integer> jarCount = parseJarCount(n);
        if (jarCount.isPresent()) {
            int count = jarCount.get();
            if (count == 6) return Optional.of(amounts.isEmpty() ? sixJarsExplanation() : sixJars(amounts.get(0)));
            return Optional.of(customJars(count, amounts.isEmpty() ? null : amounts.get(0)));
        }
        if (has(n, "sau chiec lo", "jars"))
            return Optional.of(amounts.isEmpty() ? sixJarsExplanation() : sixJars(amounts.get(0)));
        if (isSavingRequest(n) && !amounts.isEmpty()) {
            Optional<Integer> days = parseSavingDays(n);
            if (days.isPresent()) return Optional.of(savingPlanByDays(amounts.get(0), days.get()));
            Optional<Integer> months = parseDurationMonths(n);
            if (months.isPresent()) return Optional.of(savingPlan(amounts.get(0), months.get()));
        }
        if (has(n, "ngan sach", "han muc", "con lai", "chi con", "con ")
                && has(n, "nen tieu", "tieu xai", "chi tieu the nao", "tieu the nao", "dung the nao")
                && !amounts.isEmpty() && parseAllowanceDays(n).isPresent())
            return Optional.of(dailyAllowance(amounts.get(0), parseAllowanceDays(n).orElseThrow()));
        if (has(n, "moi ngay", "tieu xai", "chi tieu the nao") && !amounts.isEmpty()
                && parseInt(DAYS, n).isPresent())
            return Optional.of(dailyAllowance(amounts.get(0), parseInt(DAYS, n).orElseThrow()));
        if (has(n, "quy khan cap", "emergency fund") && !amounts.isEmpty())
            return Optional.of(emergencyFund(n, amounts));
        if ((has(n, "tren tong thu nhap", "tren thu nhap", "so voi thu nhap", "chiem bao nhieu", "ty le", "hop ly")
                || (has(n, "thu nhap") && has(n, "cao khong", "nhieu khong", "qua cao", "bao nhieu phan tram")))
                && amounts.size() >= 2)
            return Optional.of(categoryRatio(amounts.get(0), amounts.get(1)));
        if (has(n, "cat giam", "giam bot", "giam ") && parsePercent(n).isPresent() && !amounts.isEmpty())
            return Optional.of(reductionPlan(amounts.get(0), parsePercent(n).orElseThrow()));
        if (has(n, "tham hut", "thieu hut", "bo bu", "khac phuc") && !amounts.isEmpty())
            return Optional.of(deficitPlan(amounts.get(0)));
        if (has(n, "vua nhan", "thuong", "khoan tien bat ngo") && !amounts.isEmpty())
            return Optional.of(windfallPlan(amounts.get(0)));
        if (has(n, "chi tieu boc dong", "mua sam online", "mua sam boc dong"))
            return Optional.of(impulseSpendingAdvice());
        if (has(n, "nhieu khoan chi phat sinh", "dam cuoi", "sinh nhat") && has(n, "dieu chinh ngan sach", "ngan sach"))
            return Optional.of(dynamicBudgetAdvice());
        return Optional.empty();
    }

    private AdvisoryAnswer fiftyThirtyTwenty(BigDecimal income) {
        BigDecimal needs = percent(income, 50), wants = percent(income, 30), saving = income.subtract(needs).subtract(wants);
        return result("Với thu nhập " + money(income) + ": nhu cầu thiết yếu 50% = " + money(needs)
                + ", mong muốn 30% = " + money(wants) + ", tiết kiệm/trả nợ 20% = " + money(saving)
                + ". Đây là khung tham khảo; bạn có thể giảm phần mong muốn nếu chi phí thiết yếu cao.",
                action("create_budget", "Tạo ngân sách theo gợi ý", "/budget/create"));
    }

    private AdvisoryAnswer sixJars(BigDecimal income) {
        int[] ratios = {55, 10, 10, 10, 10, 5};
        String[] names = {"Thiết yếu", "Tự do tài chính", "Tiết kiệm dài hạn", "Giáo dục", "Hưởng thụ", "Cho đi"};
        StringJoiner joiner = new StringJoiner("; ", "Phân bổ 6 chiếc lọ cho " + money(income) + ": ", ".");
        for (int i = 0; i < ratios.length; i++) joiner.add(names[i] + " " + ratios[i] + "% = " + money(percent(income, ratios[i])));
        return result(joiner.toString(), action("apply_six_jars", "Áp dụng tỷ lệ 6 lọ", "/budget/create"));
    }

    private AdvisoryAnswer sixJarsExplanation() {
        return result("Quy tắc 6 chiếc lọ chia thu nhập thành: 55% nhu cầu thiết yếu; 10% tự do tài chính; "
                        + "10% tiết kiệm dài hạn; 10% giáo dục; 10% hưởng thụ; 5% cho đi. "
                        + "Đây là khung tham khảo: nếu chi phí thiết yếu hiện cao, bạn có thể điều chỉnh tỷ lệ nhưng nên giữ riêng phần tiết kiệm. "
                        + "Bạn có thể gửi mức thu nhập cụ thể để tôi tính số tiền cho từng lọ.",
                action("apply_six_jars", "Thiết lập phân bổ 6 lọ", "/budget/create"));
    }

    private AdvisoryAnswer customJars(int count, BigDecimal amount) {
        BigDecimal eachRate = BigDecimal.valueOf(45)
                .divide(BigDecimal.valueOf(count - 1L), 2, RoundingMode.HALF_UP);
        StringBuilder text = new StringBuilder("Không có quy tắc tài chính chuẩn mang tên \"")
                .append(count).append(" chiếc lọ\", nhưng bạn có thể tạo cấu hình tùy chỉnh: lọ Thiết yếu 55%; ")
                .append(count - 1).append(" lọ còn lại chia tổng cộng 45%, trung bình khoảng ")
                .append(eachRate.stripTrailingZeros().toPlainString())
                .append("%/lọ cho các mục tiêu như khẩn cấp, dài hạn, học tập, hưởng thụ hoặc cho đi. ")
                .append("Khi tỷ lệ không chia hết, lọ cuối nhận phần chênh lệch làm tròn để tổng luôn đúng 100%.");
        if (amount != null) {
            BigDecimal essential = percent(amount, 55);
            BigDecimal each = amount.subtract(essential)
                    .divide(BigDecimal.valueOf(count - 1L), 0, RoundingMode.HALF_UP);
            text.append(" Với ").append(money(amount)).append(": Thiết yếu = ").append(money(essential))
                    .append(", mỗi lọ còn lại khoảng ").append(money(each)).append(".");
        }
        text.append(" Bạn có thể đổi tên và tỷ lệ, miễn tổng bằng 100%.");
        // SmartSpend chua co man hinh cau hinh "N chiec lo" tuy chinh.
        // Khong tao nut dieu huong sang Ngan sach vi se khien nguoi dung hieu nham
        // rang app co the luu truc tiep mo hinh nay.
        return new AdvisoryAnswer(text.toString(), List.of());
    }

    private AdvisoryAnswer surplusPlan(BigDecimal amount) {
        BigDecimal safety = percent(amount, 50);
        BigDecimal goals = percent(amount, 30);
        BigDecimal flexible = amount.subtract(safety).subtract(goals);
        return result("Với " + money(amount) + " đang dư, phương án thận trọng là: 50% = " + money(safety)
                        + " cho quỹ khẩn cấp hoặc trả nợ; 30% = " + money(goals)
                        + " cho mục tiêu sắp tới; 20% = " + money(flexible)
                        + " giữ linh hoạt. Nếu quỹ khẩn cấp đã đủ 3–6 tháng chi phí thiết yếu, bạn có thể chuyển phần 50% sang mục tiêu dài hạn."
                        + " Đây là gợi ý tham khảo, không tự chuyển tiền trong Ví.",
                action("create_saving_fund", "Tạo quỹ tích lũy", "/funds/create"));
    }

    private AdvisoryAnswer savingPlan(BigDecimal target, int months) {
        BigDecimal monthly = target.divide(BigDecimal.valueOf(months), 0, RoundingMode.CEILING);
        BigDecimal weekly = target.divide(BigDecimal.valueOf(months).multiply(BigDecimal.valueOf(4.33)), 0, RoundingMode.CEILING);
        int firstMilestoneMonth = Math.max(1, months / 4);
        int halfMilestoneMonth = Math.max(1, months / 2);
        BigDecimal firstMilestone = monthly.multiply(BigDecimal.valueOf(firstMilestoneMonth)).min(target);
        BigDecimal halfMilestone = monthly.multiply(BigDecimal.valueOf(halfMilestoneMonth)).min(target);
        return result("Để đạt " + money(target) + " trong " + months + " tháng, bạn cần dành khoảng "
                + money(monthly) + "/tháng, tương đương khoảng " + money(weekly) + "/tuần. "
                + "Mốc theo dõi: hết tháng " + firstMilestoneMonth + " đạt khoảng " + money(firstMilestone)
                + ", hết tháng " + halfMilestoneMonth + " đạt khoảng " + money(halfMilestone)
                + " và hết tháng " + months + " đạt " + money(target) + ". "
                + "Nên tách khoản này ngay khi nhận thu nhập, kiểm tra tiến độ mỗi tháng và chừa một biên nhỏ cho biến động giá.",
                action("create_saving_goal", "Tạo mục tiêu tiết kiệm", "/funds/create"));
    }

    private AdvisoryAnswer savingPlanByDays(BigDecimal target, int days) {
        BigDecimal daily = target.divide(BigDecimal.valueOf(days), 0, RoundingMode.CEILING);
        BigDecimal weekly = daily.multiply(BigDecimal.valueOf(7));
        String note = days < 28
                ? " Vì thời hạn ngắn hơn một tháng, chia theo tháng không phù hợp; nên theo dõi theo ngày hoặc tuần."
                : "";
        return result("Để đạt " + money(target) + " trong " + days + " ngày, bạn cần dành khoảng "
                        + money(daily) + "/ngày, tương đương khoảng " + money(weekly) + "/tuần." + note,
                action("create_saving_goal", "Tạo mục tiêu tiết kiệm", "/funds/create"));
    }

    private AdvisoryAnswer dailyAllowance(BigDecimal remaining, int days) {
        BigDecimal daily = remaining.divide(BigDecimal.valueOf(days), 0, RoundingMode.DOWN);
        return result("Với " + money(remaining) + " cho " + days + " ngày, mức chi tối đa trung bình là "
                + money(daily) + "/ngày. Nên giữ lại 10% dự phòng; khi đó mức dùng an toàn khoảng "
                + money(percent(remaining, 90).divide(BigDecimal.valueOf(days), 0, RoundingMode.DOWN)) + "/ngày.",
                action("view_budget", "Xem chi tiết ngân sách", "/budget"));
    }

    private AdvisoryAnswer emergencyFund(String n, List<BigDecimal> amounts) {
        int months = parseInt(MONTHS, n).orElse(6);
        BigDecimal monthly = amounts.get(0);
        BigDecimal target = monthly.multiply(BigDecimal.valueOf(months));
        return result("Quỹ khẩn cấp nên bằng khoảng 3–6 tháng chi phí thiết yếu. Với mức " + money(monthly)
                + "/tháng và mục tiêu " + months + " tháng, số tiền cần có là " + money(target) + ".",
                action("create_emergency_fund", "Tạo quỹ khẩn cấp", "/funds/create"));
    }

    private AdvisoryAnswer categoryRatio(BigDecimal spending, BigDecimal income) {
        BigDecimal ratio = spending.multiply(BigDecimal.valueOf(100)).divide(income, 1, RoundingMode.HALF_UP);
        String assessment = ratio.compareTo(BigDecimal.valueOf(30)) > 0
                ? "Mức này khá cao; nên cân nhắc giảm hạn mức."
                : "Mức này chưa vượt mốc tham khảo 30% cho chi tiêu không thiết yếu.";
        return result("Khoản chi " + money(spending) + " chiếm " + ratio + "% thu nhập " + money(income) + ". " + assessment,
                action("adjust_budget", "Điều chỉnh hạn mức", "/budget"));
    }

    private AdvisoryAnswer reductionPlan(BigDecimal base, BigDecimal rate) {
        BigDecimal cut = base.multiply(rate).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        return result("Giảm " + rate.stripTrailingZeros().toPlainString() + "% từ " + money(base) + " tương đương cắt "
                + money(cut) + ", còn mục tiêu chi " + money(base.subtract(cut)) + ". Hãy ưu tiên giảm các khoản linh hoạt trước.",
                action("update_limits", "Cập nhật lại hạn mức", "/budget"));
    }

    private AdvisoryAnswer deficitPlan(BigDecimal deficit) {
        return result("Để bù thâm hụt " + money(deficit) + ", hãy tạm dừng chi không thiết yếu, chia số tiền cần bù theo các tuần còn lại, "
                + "và không dùng quỹ khẩn cấp trừ khi đây là nhu cầu bắt buộc.", action("optimize_budget", "Tối ưu hóa ngân sách", "/budget"));
    }

    private AdvisoryAnswer windfallPlan(BigDecimal amount) {
        return result("Với khoản tiền mới nhận " + money(amount) + ", một phương án thận trọng là: 50% tiết kiệm/trả nợ = "
                + money(percent(amount, 50)) + ", 30% cho mục tiêu gần = " + money(percent(amount, 30))
                + ", 20% chi tiêu linh hoạt = " + money(percent(amount, 20)) + ". Không cần chuyển vào Ví nếu bạn chỉ muốn theo dõi; có thể ghi ở Sổ tay.",
                action("top_up_now", "Nạp tiền vào ví ngay", "/wallet/top-up"));
    }

    private AdvisoryAnswer impulseSpendingAdvice() {
        return result("Hãy áp dụng quy tắc chờ 24 giờ, xóa thẻ đã lưu, tắt thông báo khuyến mãi và đặt hạn mức mua sắm theo tuần. "
                + "Ghi món muốn mua vào danh sách trước khi thanh toán để tách nhu cầu thật khỏi cảm xúc nhất thời.",
                action("shopping_limit", "Thiết lập hạn mức mua sắm", "/budget/create"));
    }

    private AdvisoryAnswer dynamicBudgetAdvice() {
        return result("Hãy lập trước một nhóm “Chi phí sự kiện”, chuyển bớt từ khoản mong muốn thay vì thiết yếu, và giữ 5–10% dự phòng. "
                + "Nếu phát sinh chỉ trong tháng này, chỉnh thời gian ngân sách trong tháng thay vì tăng hạn mức dài hạn.",
                action("adjust_month_budget", "Điều chỉnh ngân sách tháng", "/budget"));
    }

    private List<BigDecimal> moneyValues(String n) {
        List<BigDecimal> values = new ArrayList<>();
        Matcher matcher = MONEY.matcher(n);
        while (matcher.find()) {
            BigDecimal value = new BigDecimal(matcher.group(1).replace(',', '.'));
            String unit = matcher.group(2);
            if (unit != null && (unit.equals("trieu") || unit.equals("tr"))) value = value.multiply(BigDecimal.valueOf(1_000_000));
            else if (unit != null && (unit.equals("k") || unit.equals("nghin") || unit.equals("ngan"))) value = value.multiply(BigDecimal.valueOf(1_000));
            if (value.compareTo(BigDecimal.valueOf(1000)) >= 0) values.add(value);
        }
        return values;
    }

    private Optional<Integer> parseInt(Pattern pattern, String n) { Matcher m = pattern.matcher(n); return m.find() ? Optional.of(Integer.parseInt(m.group(1))) : Optional.empty(); }
    private Optional<Integer> parseDurationMonths(String n) {
        Optional<Integer> months = parseInt(MONTHS, n);
        if (months.isPresent()) return months;
        if (has(n, "nua nam", "nua năm")) return Optional.of(6);
        Matcher years = YEARS.matcher(n);
        if (!years.find()) return Optional.empty();
        BigDecimal value = new BigDecimal(years.group(1).replace(',', '.'));
        return Optional.of(value.multiply(BigDecimal.valueOf(12)).setScale(0, RoundingMode.HALF_UP).intValue());
    }
    private Optional<Integer> parseSavingDays(String n) {
        Optional<Integer> days = parseInt(DAYS, n);
        if (days.isPresent()) return days;
        Optional<Integer> weeks = parseInt(WEEKS, n);
        return weeks.map(value -> value * 7);
    }
    private Optional<Integer> parseAllowanceDays(String n) {
        Optional<Integer> days = parseSavingDays(n);
        if (days.isPresent()) return days;
        Optional<Integer> months = parseDurationMonths(n);
        return months.map(value -> value * 30);
    }
    private boolean isSavingRequest(String n) {
        return has(n, "tiet kiem", "de danh", "de mua", "muon mua", "muc tieu")
                && has(n, "bao nhieu", "moi thang", "hang thang", "moi ngay", "moi tuan", "can danh",
                "lap lo trinh", "lo trinh", "lap ke hoach", "ke hoach tiet kiem", "chi tiet");
    }
    private Optional<BigDecimal> parsePercent(String n) { Matcher m = PERCENT.matcher(n); return m.find() ? Optional.of(new BigDecimal(m.group(1).replace(',', '.'))) : Optional.empty(); }
    private Optional<Integer> parseJarCount(String n) {
        Matcher matcher = JAR_COUNT.matcher(n);
        if (!matcher.find()) return Optional.empty();
        int count = Integer.parseInt(matcher.group(1));
        return count >= 2 && count <= 20 ? Optional.of(count) : Optional.empty();
    }
    private BigDecimal percent(BigDecimal value, int rate) { return value.multiply(BigDecimal.valueOf(rate)).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP); }
    private String money(BigDecimal value) { return String.format("%,.0f ₫", value).replace(',', '.'); }
    private boolean has(String n, String... phrases) { return Arrays.stream(phrases).anyMatch(n::contains); }
    private String normalize(String value) { return Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT).replace('đ', 'd').replaceAll("[^a-z0-9%/.,]+", " ").replaceAll("\\s+", " ").trim(); }
    private AdvisoryAnswer result(String text, AiActionDto action) { return new AdvisoryAnswer(text, List.of(action)); }
    private AiActionDto action(String id, String label, String route) { return AiActionDto.builder().id(id).label(label).type("NAVIGATE").route(route).build(); }
}
