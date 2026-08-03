package com.project.app.splitbill.service;

import com.project.app.splitbill.dto.request.CreateSplitBillRequest;
import com.project.app.splitbill.dto.request.PaySplitBillRequest;
import com.project.app.splitbill.dto.response.SplitBillResponse;
import com.project.app.user.entity.User;

import java.util.List;

public interface SplitBillService {

    SplitBillResponse createSplitBill(User currentUser, CreateSplitBillRequest request);

    List<SplitBillResponse> getMySplitBills(User currentUser);

    SplitBillResponse getSplitBillDetail(User currentUser, Long splitBillId);

    SplitBillResponse paySplitBill(User currentUser, Long splitBillId, PaySplitBillRequest request);

    void remindMember(User currentUser, Long splitBillId, Long memberUserId);

    void cancelSplitBill(User currentUser, Long splitBillId);
}
