package com.project.app.ai.finance;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

@Component
public class FinanceIntentRouter {

    private static final Pattern GUIDE = Pattern.compile(
            "(?i)(trung\\s*t[âa]m\\s*t[àa]i\\s*ch[íi]nh|finance\\s*center|b[áa]o\\s*c[áa]o\\s*t[àa]i\\s*ch[íi]nh)"
                    + ".*(l[àa]\\s*g[ìi]|lam\\s*gi|d[ùu]ng\\s*[đd]ể|dung\\s*de|nh[ưu]\\s*th[ếe]\\s*n[àa]o|nhu\\s*the\\s*nao|ở\\s*[đd]âu|o\\s*dau|h[ướu]ng\\s*d[ẫa]n|huong\\s*dan)"
                    + "|(?i)(trung\\s*t[âa]m\\s*t[àa]i\\s*ch[íi]nh|b[áa]o\\s*c[áa]o\\s*t[àa]i\\s*ch[íi]nh)\\s*(l[àa]\\s*g[ìi]|lam\\s*gi)?\\s*$"
                    + "|(?i)(xem|m[ở]\\s*|mo\\s*)?(t[ổo]ng\\s*quan\\s*t[àa]i\\s*ch[íi]nh|b[áa]o\\s*c[áa]o\\s*thu\\s*chi)\\s*(ở\\s*[đd]âu|o\\s*dau|l[àa]\\s*g[ìi]|lam\\s*gi)?"
                    + "|(?i)app\\s*c[óo]\\s*b[áa]o\\s*c[áa]o\\s*thu\\s*chi"
    );

    private static final Pattern SPENDING_BY_CATEGORY = Pattern.compile(
            "(?i)(danh\\s*m[ụu]c|danh\\s*muc|category|nh[óo]m\\s*chi)"
                    + ".*(chi\\s*nhi[ềe]u|ton\\s*tien|t[ốo]n\\s*ti[ềe]n|top|cao\\s*nh[ấa]t|cao\\s*nhat|nhi[ềe]u\\s*nh[ấa]t|nhieu\\s*nhat)"
                    + "|(?i)(chi\\s*nhi[ềe]u|ton\\s*tien|t[ốo]n\\s*ti[ềe]n|top).*(danh\\s*m[ụu]c|danh\\s*muc|lo[ạa]i\\s*chi)"
                    + "|(?i)(ph[âa]n\\s*b[ổo]|phan\\s*bo).*(danh\\s*m[ụu]c|chi\\s*ti[êe]u)"
                    + "|(?i)chi\\s*ti[êe]u\\s*theo\\s*danh\\s*m[ụu]c"
    );

    private static final Pattern BUDGET = Pattern.compile(
            "(?i)(ng[âa]n\\s*s[áa]ch|ngan\\s*sach|budget)"
                    + ".*(v[ượu]t|vuot|c[òn]n|con|tr[ạa]ng\\s*th[áa]i|trang\\s*thai|bao\\s*nhi[êe]u|bao\\s*nhieu)?"
                    + "|(?i)(v[ượu]t|vuot).*(ng[âa]n\\s*s[áa]ch|ngan\\s*sach)"
    );

    private static final Pattern FUND_BALANCE = Pattern.compile(
            "(?i)(s[ốo]\\s*d[ưu]|so\\s*du|balance).*(qu[ỹy]|quy|fund|ti[ếe]t\\s*ki[ệe]m|tiet\\s*kiem)"
                    + "|(?i)(qu[ỹy]|quy|fund).*(s[ốo]\\s*d[ưu]|so\\s*du|c[òn]n\\s*bao\\s*nhi[êe]u|con\\s*bao\\s*nhi[êe]u)"
    );

    private final FinancePeriodParser periodParser;

    public FinanceIntentRouter(FinancePeriodParser periodParser) {
        this.periodParser = periodParser;
    }

    public record FinanceRoute(FinanceIntent intent, ResolvedPeriod period) {
    }

    public FinanceRoute detect(String message) {
        if (message == null || message.isBlank()) {
            return new FinanceRoute(FinanceIntent.NONE, null);
        }

        String trimmed = message.trim();
        String normalized = normalize(trimmed);

        if (isCategoryOnlyQuestion(normalized)) {
            return new FinanceRoute(FinanceIntent.NONE, null);
        }

        if (GUIDE.matcher(trimmed).find() && isGuideRequest(normalized)) {
            return new FinanceRoute(FinanceIntent.GUIDE, null);
        }

        // Cac cau hoi kien thuc tai chinh (vi du "quy tac 50/30/20")
        // khong phai yeu cau truy van du lieu ca nhan. De Gemini giai dap thay vi
        // mac dinh bien moi tu khoa "quy"/"chi tieu" thanh bao cao thu chi.
        if (isEducationalQuestion(normalized)) {
            return new FinanceRoute(FinanceIntent.NONE, null);
        }

        boolean healthAssessment = containsAny(normalized, "suc khoe tai chinh", "danh gia tai chinh",
                "cham diem tai chinh", "phan tich tai chinh")
                || (normalized.contains("tai chinh") && containsAny(normalized,
                "co khoe", "khoe khong", "on khong", "tot khong", "lanh manh", "tinh trang"));
        if (healthAssessment
                && containsAny(normalized, "thu chi", "du lieu", "thang", "ky", "cua toi")) {
            return new FinanceRoute(FinanceIntent.FINANCIAL_HEALTH, periodParser.parse(trimmed));
        }

        boolean spendingConcern = containsAny(normalized, "lang phi", "chi bat thuong", "tieu bat thuong",
                "khoan nen cat", "khoan can cat", "ton tien vo ly", "chi qua tay")
                || (normalized.contains("khoan") && containsAny(normalized, "nen cat", "can cat", "cat bot", "giam bot"));
        if (spendingConcern
                && containsAny(normalized, "khoan", "danh muc", "chi tieu", "tieu tien", "vao dau")) {
            return new FinanceRoute(FinanceIntent.SPENDING_ANALYSIS, periodParser.parse(trimmed));
        }

        if (SPENDING_BY_CATEGORY.matcher(trimmed).find()) {
            ResolvedPeriod period = periodParser.parse(trimmed);
            boolean compare = containsAny(normalized, "so sanh", "so voi", "dau voi", "vs");
            FinanceIntent intent = compare
                    ? FinanceIntent.SPENDING_BY_CATEGORY_COMPARE
                    : FinanceIntent.SPENDING_BY_CATEGORY;
            return new FinanceRoute(intent, period);
        }

        if (BUDGET.matcher(trimmed).find()) {
            return new FinanceRoute(FinanceIntent.BUDGET_STATUS, periodParser.parse(trimmed));
        }

        if (FUND_BALANCE.matcher(trimmed).find()) {
            return new FinanceRoute(FinanceIntent.FUND_BALANCE, null);
        }

        if (!looksLikeFinanceQuestion(normalized)) {
            return new FinanceRoute(FinanceIntent.NONE, null);
        }

        ResolvedPeriod period = periodParser.parse(trimmed);
        FinanceIntent intent = classifyIntent(normalized, trimmed);
        return new FinanceRoute(intent, period);
    }

    private FinanceIntent classifyIntent(String normalized, String raw) {
        // Tong tai san la mot snapshot so du hien tai. Uu tien y dinh nay truoc
        // cac nhanh rieng le cho Vi/So tay, ke ca khi cau hoi neu ro ca hai nguon.
        if (containsAny(normalized, "tong tai san", "tong so du", "tong tien hien co", "toan bo tai san")) {
            return containsAny(normalized, "o dau", "ty le", "phan bo", "ti trong")
                    ? FinanceIntent.ASSETS_ALLOCATION
                    : FinanceIntent.ASSETS_OVERVIEW;
        }

        // Compare income and expense inside one period, not two different periods.
        if (containsAny(normalized, "thu hay chi", "thu va chi", "thu voi chi", "thu hay tieu")
                && containsAny(normalized, "nhieu hon", "cao hon", "chenh lech", "dong tien rong", "ben nao")) {
            return FinanceIntent.PERIOD_NET;
        }
        boolean compare = containsAny(normalized,
                "so sanh", "so voi", "dau voi", "vs", "hon", "tang", "giam", "cao hon", "thap hon");

        if (containsAny(normalized, "tien nam o dau", "nam o dau", "ty le", "phan bo", "phan tram", " hay ")
                && containsAny(normalized, "vi", "tien mat", "so tay", "tai san")) {
            return FinanceIntent.ASSETS_ALLOCATION;
        }

        if (containsAny(normalized, "quy", "fund", "tiet kiem")
                && !containsAny(normalized, "so du", "so du quy")
                && containsAny(normalized, "nap", "rut", "gui", "dong")) {
            return compare ? FinanceIntent.COMPARE_OVERVIEW : FinanceIntent.SOURCE_FUND;
        }

        if (containsAny(normalized, "vi smartspend", "nap vi", "rut vi", "giao dich vi")
                || (normalized.contains("vi") && !normalized.contains("danh muc")
                && containsAny(normalized, "nap", "rut", "thu", "chi"))) {
            if (compare) {
                return FinanceIntent.COMPARE_WALLET;
            }
            return FinanceIntent.SOURCE_WALLET;
        }

        if (containsAny(normalized, "so tay", "tien mat", "cash", "notebook")) {
            if (compare) {
                return FinanceIntent.COMPARE_CASH;
            }
            return FinanceIntent.SOURCE_CASH;
        }

        if (containsAny(normalized, "thay doi", "chenh lech", "tang giam", "bao nhieu %", "phan tram")
                && compare) {
            return FinanceIntent.DELTA_SUMMARY;
        }

        if (compare) {
            if (containsAny(normalized, "thu", "thu nhap", "nap")) {
                return FinanceIntent.COMPARE_INCOME;
            }
            if (containsAny(normalized, "chi", "chi tieu", "rut", "tieu")) {
                return FinanceIntent.COMPARE_EXPENSE;
            }
            if (containsAny(normalized, "rong", "loi", "lo", "duong", "am")) {
                return FinanceIntent.COMPARE_NET;
            }
            return FinanceIntent.COMPARE_OVERVIEW;
        }

        if (containsAny(normalized, "tong tai san", "so du", "co bao nhieu tien", "bao nhieu tien",
                "dang co nhung gi", "tien cua toi")) {
            if (containsAny(normalized, "o dau", "ty le", "phan bo")) {
                return FinanceIntent.ASSETS_ALLOCATION;
            }
            return FinanceIntent.ASSETS_OVERVIEW;
        }

        if (containsAny(normalized, "tien nam o dau", "vi va tien mat", "ti trong")) {
            return FinanceIntent.ASSETS_ALLOCATION;
        }

        if (normalized.contains("thu chi")) {
            return FinanceIntent.PERIOD_OVERVIEW;
        }

        if (containsAny(normalized, "thu nhap", "nap vi", "nap tien")
                && !containsAny(normalized, "chi tieu", "chi nhieu")) {
            return FinanceIntent.PERIOD_INCOME;
        }

        if (containsAny(normalized, "chi tieu", " chi ", "tieu het", "da tieu", "da chi")) {
            return FinanceIntent.PERIOD_EXPENSE;
        }

        if (containsAny(normalized, "dong tien rong", "rong", "loi hay lo", "con du", "chenh lech thu chi")) {
            return FinanceIntent.PERIOD_NET;
        }

        if (containsAny(normalized, "bao cao", "tong quan", "thu chi", "tinh hinh", "the nao")) {
            return FinanceIntent.PERIOD_OVERVIEW;
        }

        return FinanceIntent.PERIOD_OVERVIEW;
    }

    private boolean looksLikeFinanceQuestion(String normalized) {
        return containsAny(normalized,
                "trung tam tai chinh", "bao cao tai chinh", "finance center",
                "tong tai san", "so du", "bao nhieu tien", "tien cua toi",
                "thu chi", "thu nhap", "chi tieu", "dong tien", "rong",
                "vi ", " vi", "vi smartspend", "so tay", "tien mat",
                "quy", "fund", "tiet kiem", "nap vi", "rut vi",
                "thang nay", "tuan nay", "nam nay", "thang truoc", "tuan truoc",
                "so sanh", "bao cao", "tong quan tai chinh", "tai san");
    }

    private boolean isGuideRequest(String normalized) {
        boolean asksHowToUse = containsAny(normalized,
                "la gi", "dung de lam gi", "dung de", "huong dan", "o dau",
                "mo o dau", "vao dau", "truy cap", "nhu the nao", "co chuc nang gi");
        boolean requestsPeriodData = containsAny(normalized,
                "hom nay", "tuan nay", "tuan truoc", "thang nay", "thang truoc",
                "nam nay", "nam truoc", "ky nay", "ky truoc", "bao nhieu",
                "cho toi xem", "cua toi", "toi da", "toi thu", "toi chi");
        return asksHowToUse && !requestsPeriodData;
    }

    private boolean isCategoryOnlyQuestion(String normalized) {
        if (!normalized.contains("danh muc") && !normalized.contains("category")) {
            return false;
        }
        return !containsAny(normalized,
                "trung tam tai chinh", "bao cao", "thu chi", "tong tai san",
                "so du vi", "so du", "thang nay", "tuan nay",
                "lang phi", "chi bat thuong", "tieu bat thuong", "nen cat", "can cat", "cat bot", "giam bot");
    }

    private boolean isEducationalQuestion(String normalized) {
        return containsAny(normalized,
                "giai thich", "quy tac", "kien thuc", "khai niem",
                "la gi", "nghia la gi", "cach ap dung", "vi du ve");
    }

    private String normalize(String message) {
        String withoutMarks = Normalizer.normalize(message, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return withoutMarks.trim()
                .toLowerCase(Locale.ROOT)
                .replace('đ', 'd')
                .replaceAll("\\s+", " ");
    }

    private boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
