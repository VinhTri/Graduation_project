package com.project.app.report.service;

import com.project.app.report.dto.response.ReportDistributionResponse;
import com.project.app.report.dto.response.ReportTrendResponse;
import com.project.app.transaction.entity.TransactionType;
import com.project.app.user.entity.User;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {
    List<ReportDistributionResponse> getDistributionReport(User user, TransactionType type, String filter, LocalDate date);
    
    List<ReportTrendResponse> getTrendReport(User user, TransactionType type, String filter, LocalDate date);
}
