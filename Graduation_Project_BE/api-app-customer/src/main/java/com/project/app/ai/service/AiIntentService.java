package com.project.app.ai.service;

import com.project.app.ai.dto.request.ChatMessageHistoryDto;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class AiIntentService {

    public String classifyIntent(String norm, List<ChatMessageHistoryDto> history) {
        if (norm == null) return "RAG";
        String cleanNorm = norm.trim().toLowerCase();

        // 1. Primary check for Analytics & App Guide
        if (isAnalyticsQueryPrompt(cleanNorm)) {
            return "ANALYTICS";
        }

        if (isAppGuideQueryPrompt(cleanNorm)) {
            return "APP_GUIDE";
        }

        // 2. Prioritize Follow-Up if history exists
        if (history != null && !history.isEmpty() && isFollowUpQueryPrompt(cleanNorm)) {
            return "FINANCIAL_GOAL";
        }

        // 3. Recommendation & New Financial Goal
        if (isRecommendationQueryPrompt(cleanNorm)) {
            return "RECOMMENDATION";
        }

        if (isGoalQueryPrompt(cleanNorm)) {
            return "FINANCIAL_GOAL";
        }

        return "RAG";
    }

    public boolean isAnalyticsQueryPrompt(String norm) {
        if (norm == null || norm.isEmpty()) return false;
        String[] keywords = {
            "thang nay toi da chi bao nhieu", "thang nay da chi bao nhieu", "thang nay toi tieu bao nhieu",
            "thang nay tieu bao nhieu", "da chi bao nhieu", "chi bao nhieu", "tieu bao nhieu", "tieu het bao nhieu",
            "tieu nhieu o dau", "tieu o dau", "chi vao dau", "bao cao chi tieu", "phan tich chi tieu",
            "phan tich thu chi", "xu huong chi tieu", "cat giam", "khoan chi", "chi tieu", "tong chi", "tong tien chi"
        };
        return Arrays.stream(keywords).anyMatch(norm::contains);
    }

    public boolean isAppGuideQueryPrompt(String norm) {
        if (norm == null || norm.isEmpty()) return false;
        String[] keywords = {
            "tao vi", "them vi", "sua vi", "xoa vi", "quan ly vi",
            "tao danh muc", "them danh muc", "sua danh muc", "xoa danh muc",
            "tao ngan sach", "them ngan sach", "lap ngan sach", "cach tao ngan sach",
            "them giao dich", "tao giao dich", "nhap giao dich", "ghi chep",
            "nap tien", "rut tien", "chuyen tien", "nap rut",
            "doi pin", "quen pin", "ma pin", "mat khau"
        };
        return Arrays.stream(keywords).anyMatch(norm::contains);
    }

    public boolean isRecommendationQueryPrompt(String norm) {
        if (norm == null || norm.isEmpty()) return false;
        String[] keywords = {
            "tu van", "recommend", "advisor", "ngan sach", "phan bo", "quy tac 50/30/20", "han muc",
            "luong", "thu nhap", "tien thue", "thue nha", "chia ngan sach", "nen chia", "chia the nao"
        };
        return Arrays.stream(keywords).anyMatch(norm::contains);
    }

    public boolean isGoalQueryPrompt(String norm) {
        if (norm == null || norm.isEmpty()) return false;
        String[] keywords = {"muc tieu", "mua", "iphone", "laptop", "xe", "sam", "oto", "o to", "nha", "tiet kiem", "tich luy", "muon co", "can co"};
        return Arrays.stream(keywords).anyMatch(norm::contains);
    }

    public boolean isFollowUpQueryPrompt(String norm) {
        if (norm == null || norm.isEmpty()) return false;

        boolean hasFollowUpPrefix = norm.contains("vay thi") || norm.contains("vay la") || norm.contains("the la") 
                || norm.contains("moi thang") || norm.contains("neu toi") || norm.contains("neu chi tiet kiem") 
                || norm.contains("neu co them") || norm.contains("co them") || norm.contains("quach lai") 
                || norm.contains("quay lai") || norm.contains("the con") || norm.contains("con neu") 
                || norm.contains("khong dung") || norm.contains("giu nguyen") || norm.contains("so sanh")
                || norm.contains("neu trong") || norm.contains("neu nhu") || norm.contains("doi thanh") || norm.contains("thi sao")
                || norm.contains("hien tai toi co") || norm.contains("hien toi co") || norm.contains("toi co")
                || norm.contains("dang co") || norm.contains("giu lai") || norm.contains("quy du phong");

        boolean hasDurationPattern = Pattern.compile("\\d+\\s*(nam|thang)", Pattern.CASE_INSENSITIVE).matcher(norm).find();
        boolean startsWithNeuOrVay = norm.startsWith("neu ") || norm.startsWith("vay ") || norm.startsWith("con ");

        return hasFollowUpPrefix || (startsWithNeuOrVay && hasDurationPattern);
    }
}
