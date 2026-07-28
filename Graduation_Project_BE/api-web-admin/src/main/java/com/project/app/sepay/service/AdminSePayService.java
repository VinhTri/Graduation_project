package com.project.app.sepay.service;

import com.project.app.sepay.dto.request.ManualCreditRequest;
import com.project.app.sepay.dto.response.ReconciliationReportResponse;
import com.project.app.sepay.dto.response.SePayTransactionResponse;

import java.util.List;

public interface AdminSePayService {
    List<SePayTransactionResponse> getSePayHistory();

    ReconciliationReportResponse runReconciliation(boolean persistUpdates);

    SePayTransactionResponse manualCredit(Long sepayRecordId, ManualCreditRequest request);
}
