package com.project.app.fund.service;

import com.project.app.fund.dto.request.CreateFundRequest;
import com.project.app.fund.dto.request.FundAmountRequest;
import com.project.app.fund.dto.request.InviteFundRequest;
import com.project.app.fund.dto.request.UpdateFundNoteRequest;
import com.project.app.fund.dto.response.FundDetailResponse;
import com.project.app.fund.dto.response.FundInvitationResponse;
import com.project.app.fund.dto.response.FundSummaryResponse;
import com.project.app.fund.dto.response.FundTransactionResponse;
import com.project.app.user.entity.User;

import java.util.List;

public interface FundService {

    List<FundSummaryResponse> listMyFunds(User user);

    List<FundInvitationResponse> listPendingInvitations(User user);

    FundDetailResponse getFundDetail(User user, Long fundId);

    FundDetailResponse createFund(User user, CreateFundRequest request);

    void deleteFund(User user, Long fundId);

    void leaveFund(User user, Long fundId);

    FundDetailResponse deposit(User user, Long fundId, FundAmountRequest request);

    FundDetailResponse withdraw(User user, Long fundId, FundAmountRequest request);

    FundTransactionResponse updateTransactionNote(User user, Long fundId, Long txId, UpdateFundNoteRequest request);

    FundDetailResponse inviteMember(User user, Long fundId, InviteFundRequest request);

    FundDetailResponse acceptInvite(User user, Long fundId);

    void rejectInvite(User user, Long fundId);
}
