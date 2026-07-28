package com.project.app.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.app.ai.cache.ConversationCacheService;
import com.project.app.ai.dto.gemini.GeminiRequest;
import com.project.app.ai.dto.gemini.GeminiResponse;
import com.project.app.ai.dto.request.AiChatRequest;
import com.project.app.ai.dto.request.FeedbackRequest;
import com.project.app.ai.dto.request.IngestDocumentRequest;
import com.project.app.ai.dto.response.AiChatResponse;
import com.project.app.ai.dto.response.CitationDto;
import com.project.app.ai.dto.response.HistoryResponse;
import com.project.app.ai.entity.AiConversation;
import com.project.app.ai.entity.AiFeedback;
import com.project.app.ai.entity.AiMessage;
import com.project.app.ai.entity.AiMessageCitation;
import com.project.app.ai.prompt.PromptBuilder;
import com.project.app.ai.rag.VectorStoreService;
import com.project.app.ai.repository.AiConversationRepository;
import com.project.app.ai.repository.AiFeedbackRepository;
import com.project.app.ai.repository.AiMessageRepository;
import com.project.app.user.entity.User;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.wallet.enums.WalletType;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.budget.entity.Budget;
import com.project.app.budget.entity.BudgetPeriod;
import com.project.app.budget.repository.BudgetRepository;
import com.project.app.budget.repository.BudgetPeriodRepository;
import com.project.app.budget.enums.BudgetCycle;
import com.project.app.category.entity.CategoryItem;
import com.project.app.category.repository.CategoryItemRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiServiceImpl implements AiService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiFeedbackRepository feedbackRepository;
    private final PromptBuilder promptBuilder;
    private final GeminiClient geminiClient;
    private final FunctionCallingService functionCallingService;
    private final VectorStoreService vectorStoreService;
    private final ConversationCacheService cacheService;
    private final ObjectMapper objectMapper;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final BudgetPeriodRepository budgetPeriodRepository;
    private final CategoryItemRepository categoryItemRepository;

    @Override
    @Transactional
    public AiChatResponse chat(User user, AiChatRequest request) {
        long startTime = System.currentTimeMillis();

        // 1. Fetch or initialize conversation thread
        AiConversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findByIdAndUser(request.getConversationId(), user)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        } else {
            conversation = AiConversation.builder()
                    .user(user)
                    .title(request.getMessage().length() > 30 
                            ? request.getMessage().substring(0, 27) + "..." 
                            : request.getMessage())
                    .build();
            conversation = conversationRepository.save(conversation);
        }

        // 2. Persist user's query
        AiMessage userMessage = AiMessage.builder()
                .conversation(conversation)
                .sender("USER")
                .content(request.getMessage())
                .build();
        messageRepository.save(userMessage);

        // Update conversation metadata
        conversation.getMessages().add(userMessage);
        conversationRepository.save(conversation);

        // 3. Determine dynamic context / mode & Perform RAG if necessary
        String mode = request.getMode();
        if ("AUTO".equalsIgnoreCase(mode)) {
            mode = detectMode(request.getMessage());
        }

        String injectedContext = "";
        List<CitationDto> citations = new ArrayList<>();
        if ("SUPPORT".equalsIgnoreCase(mode)) {
            // Retrieve relevant chunks from Qdrant vector index
            citations = vectorStoreService.hybridSearch(request.getMessage(), 3);
            injectedContext = citations.stream()
                    .map(CitationDto::getSnippet)
                    .collect(Collectors.joining("\n---\n"));
        }

        // 4. Compile initial Gemini API Request
        GeminiRequest geminiRequest = promptBuilder.buildChatRequest(
                conversation, request.getMessage(), mode, injectedContext
        );

        // 5. Call Gemini API & handle Function Call loop
        GeminiResponse geminiResponse = geminiClient.generate(geminiRequest);
        
        // Execute tool loop (Function Calling) if requested by the LLM
        int maxFunctionLoop = 10; // Prevent infinite tool execution loops
        int loopCount = 0;

        while (hasFunctionCall(geminiResponse) && loopCount < maxFunctionLoop) {
            GeminiResponse.Part part = getFirstPart(geminiResponse);
            GeminiResponse.FunctionCall call = part.getFunctionCall();
            
            // Invoke the local service bean method
            Object toolResult = functionCallingService.executeFunction(call.getName(), call.getArgs(), user);
            
            // Build tool result response payload to feed back to Gemini
            GeminiRequest.Part modelResponsePart = GeminiRequest.Part.builder()
                    .functionCall(GeminiRequest.FunctionCall.builder()
                            .name(call.getName())
                            .args(call.getArgs())
                            .build())
                    .thoughtSignature(part.getThoughtSignature())
                    .build();

            GeminiRequest.Part toolResponsePart = GeminiRequest.Part.builder()
                    .functionResponse(GeminiRequest.FunctionResponse.builder()
                            .name(call.getName())
                            .response(Map.of("result", toolResult))
                            .build())
                    .thoughtSignature(part.getThoughtSignature())
                    .build();

            // Append model statement and tool values to contents
            geminiRequest.getContents().add(GeminiRequest.Content.builder()
                    .role("model")
                    .parts(List.of(modelResponsePart))
                    .build());

            geminiRequest.getContents().add(GeminiRequest.Content.builder()
                    .role("user")
                    .parts(List.of(toolResponsePart))
                    .build());

            // Re-invoke Gemini
            geminiResponse = geminiClient.generate(geminiRequest);
            loopCount++;
        }

        // 6. Decode output
        try {
            log.info("Gemini raw response object: {}", objectMapper.writeValueAsString(geminiResponse));
        } catch (Exception e) {
            log.warn("Failed to serialize geminiResponse", e);
        }
        String responseText = getResponseText(geminiResponse);
        log.info("Gemini raw response text: \n{}", responseText);
        String cleanedJson = stripCodeFences(responseText);

        // 7. Parse structured response
        String mainText = responseText;
        AiChatResponse.StructuredData structuredData = null;

        try {
            JsonNode root = objectMapper.readTree(cleanedJson);
            if (root.has("textResponse")) {
                mainText = root.get("textResponse").asText();
            }
            if (root.has("structuredData")) {
                structuredData = objectMapper.treeToValue(root.get("structuredData"), AiChatResponse.StructuredData.class);
            }
        } catch (Exception e) {
            log.warn("Failed to parse response JSON schema: {}. Returning raw text.", cleanedJson, e);
            // Fallback: Populate textual message as is, empty structures
            mainText = responseText;
        }

        long latency = System.currentTimeMillis() - startTime;
        int promptTokens = geminiResponse.getUsageMetadata() != null ? geminiResponse.getUsageMetadata().getPromptTokenCount() : 0;
        int completionTokens = geminiResponse.getUsageMetadata() != null ? geminiResponse.getUsageMetadata().getCandidatesTokenCount() : 0;

        // 8. Persist assistant reply
        AiMessage aiMessage = AiMessage.builder()
                .conversation(conversation)
                .sender("AI")
                .content(mainText)
                .structuredJson(structuredData != null ? cleanedJson : null)
                .promptTokens(promptTokens)
                .completionTokens(completionTokens)
                .latencyMs(latency)
                .build();

        // Map RAG citations to database
        if (!citations.isEmpty()) {
            List<AiMessageCitation> dbCitations = new ArrayList<>();
            for (CitationDto dto : citations) {
                dbCitations.add(AiMessageCitation.builder()
                        .message(aiMessage)
                        .sourceName(dto.getSourceName())
                        .sourceUrl(dto.getSourceUrl())
                        .contentSnippet(dto.getSnippet())
                        .similarityScore(dto.getSimilarityScore())
                        .build());
            }
            aiMessage.setCitations(dbCitations);
        }

        messageRepository.save(aiMessage);

        // 9. Cache conversational states for immediate future turns
        conversation.getMessages().add(aiMessage);
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        
        cacheService.cacheHistory(user.getId(), conversation.getId(), conversation.getMessages());

        // 10. Assemble and return final API response object
        return AiChatResponse.builder()
                .conversationId(conversation.getId())
                .messageId(aiMessage.getId())
                .sender("AI")
                .content(mainText)
                .structuredData(structuredData)
                .citations(citations)
                .build();
    }

    private AiChatResponse injectMockData(User user, AiChatRequest request) {
        // 1. Get or create user's default wallet
        com.project.app.wallet.entity.Wallet wallet = walletRepository.findByUserIdAndIsDefaultTrue(user.getId())
                .orElseGet(() -> {
                    List<com.project.app.wallet.entity.Wallet> wallets = walletRepository.findByUserId(user.getId());
                    if (!wallets.isEmpty()) {
                        return wallets.get(0);
                    }
                    com.project.app.wallet.entity.Wallet newWallet = new com.project.app.wallet.entity.Wallet();
                    newWallet.setUser(user);
                    newWallet.setName("Ví mặc định");
                    newWallet.setBalance(new BigDecimal("15000000"));
                    newWallet.setAccountNumber("999" + user.getId() + "888");
                    newWallet.setDefault(true);
                    newWallet.setLimitEnabled(false);
                    newWallet.setWalletType(com.project.app.wallet.enums.WalletType.MAIN);
                    return walletRepository.save(newWallet);
                });

        wallet.setBalance(new BigDecimal("15000000"));
        walletRepository.save(wallet);

        // 2. Delete all existing transactions for this user
        List<com.project.app.transaction.entity.Transaction> existingTx = transactionRepository.findByUserIdAndWallet_IsDefaultTrueOrderByCreatedAtDesc(user.getId());
        transactionRepository.deleteAll(existingTx);

        // 3. Find or create default categories for seeding
        com.project.app.category.entity.CategoryItem catAnUong = categoryItemRepository.findFirstByLabelAndUserIsNullAndIsDeletedFalse("Ăn uống")
                .orElseGet(() -> categoryItemRepository.findAll().stream().filter(c -> c.getLabel().contains("Ăn")).findFirst().orElse(null));
        com.project.app.category.entity.CategoryItem catDiChuyen = categoryItemRepository.findFirstByLabelAndUserIsNullAndIsDeletedFalse("Di chuyển")
                .orElseGet(() -> categoryItemRepository.findAll().stream().filter(c -> c.getLabel().contains("Di")).findFirst().orElse(null));
        com.project.app.category.entity.CategoryItem catMuaSam = categoryItemRepository.findFirstByLabelAndUserIsNullAndIsDeletedFalse("Mua sắm")
                .orElseGet(() -> categoryItemRepository.findAll().stream().filter(c -> c.getLabel().contains("Mua")).findFirst().orElse(null));
        com.project.app.category.entity.CategoryItem catLuong = categoryItemRepository.findFirstByLabelAndUserIsNullAndIsDeletedFalse("Lương")
                .orElseGet(() -> categoryItemRepository.findAll().stream().filter(c -> c.getLabel().contains("Lương")).findFirst().orElse(null));

        if (catAnUong == null) {
            catAnUong = categoryItemRepository.findAll().stream().findFirst().orElse(null);
        }
        if (catDiChuyen == null) catDiChuyen = catAnUong;
        if (catMuaSam == null) catMuaSam = catAnUong;
        if (catLuong == null) catLuong = catAnUong;

        java.time.LocalDate today = java.time.LocalDate.now();
        int year = today.getYear();
        int month = today.getMonthValue();

        // 4. Insert mock transactions
        createMockTransaction(user, wallet, new BigDecimal("25000000"), com.project.app.transaction.enums.TransactionType.INCOME, "Lương tháng này", catLuong != null ? catLuong.getId() : null, java.time.LocalDateTime.of(year, month, 5, 10, 0));
        createMockTransaction(user, wallet, new BigDecimal("5500000"), com.project.app.transaction.enums.TransactionType.EXPENSE, "Tiền nhà & dịch vụ", catMuaSam != null ? catMuaSam.getId() : null, java.time.LocalDateTime.of(year, month, 6, 12, 0));
        createMockTransaction(user, wallet, new BigDecimal("1200000"), com.project.app.transaction.enums.TransactionType.EXPENSE, "Ăn uống siêu thị", catAnUong != null ? catAnUong.getId() : null, java.time.LocalDateTime.of(year, month, 10, 18, 0));
        createMockTransaction(user, wallet, new BigDecimal("450000"), com.project.app.transaction.enums.TransactionType.EXPENSE, "Ăn trưa văn phòng", catAnUong != null ? catAnUong.getId() : null, java.time.LocalDateTime.of(year, month, 12, 12, 30));
        createMockTransaction(user, wallet, new BigDecimal("300000"), com.project.app.transaction.enums.TransactionType.EXPENSE, "Đi lại xăng xe", catDiChuyen != null ? catDiChuyen.getId() : null, java.time.LocalDateTime.of(year, month, 15, 8, 0));
        createMockTransaction(user, wallet, new BigDecimal("900000"), com.project.app.transaction.enums.TransactionType.EXPENSE, "Mua sắm quần áo", catMuaSam != null ? catMuaSam.getId() : null, java.time.LocalDateTime.of(year, month, 18, 14, 0));
        createMockTransaction(user, wallet, new BigDecimal("250000"), com.project.app.transaction.enums.TransactionType.EXPENSE, "Cà phê, ăn vặt", catAnUong != null ? catAnUong.getId() : null, java.time.LocalDateTime.of(year, month, 20, 15, 0));
        createMockTransaction(user, wallet, new BigDecimal("850000"), com.project.app.transaction.enums.TransactionType.EXPENSE, "Ăn uống nhà hàng", catAnUong != null ? catAnUong.getId() : null, java.time.LocalDateTime.of(year, month, 22, 19, 30));
        createMockTransaction(user, wallet, new BigDecimal("150000"), com.project.app.transaction.enums.TransactionType.EXPENSE, "Di chuyển Grab", catDiChuyen != null ? catDiChuyen.getId() : null, java.time.LocalDateTime.of(year, month, 25, 21, 0));

        // 5. Delete and Create a new Budget for the user
        List<com.project.app.budget.entity.Budget> existingBudgets = budgetRepository.findByUserIdAndIsDeletedFalse(user.getId());
        for (com.project.app.budget.entity.Budget b : existingBudgets) {
            b.setDeleted(true);
            budgetRepository.save(b);
        }

        if (catAnUong != null) {
            com.project.app.budget.entity.Budget budget = com.project.app.budget.entity.Budget.builder()
                    .name("Ngân sách Ăn uống tháng này")
                    .user(user)
                    .category(catAnUong)
                    .wallet(wallet)
                    .amount(new BigDecimal("3000000"))
                    .cycle(com.project.app.budget.enums.BudgetCycle.CUSTOM)
                    .startDate(today.withDayOfMonth(1))
                    .endDate(today.with(java.time.temporal.TemporalAdjusters.lastDayOfMonth()))
                    .isDeleted(false)
                    .build();
            budget = budgetRepository.save(budget);

            com.project.app.budget.entity.BudgetPeriod period = com.project.app.budget.entity.BudgetPeriod.builder()
                    .budget(budget)
                    .startDate(budget.getStartDate())
                    .endDate(budget.getEndDate())
                    .spentAmount(new BigDecimal("2750000"))
                    .isNotified80(true)
                    .isNotified100(false)
                    .build();
            budgetPeriodRepository.save(period);
        }

        String textResponse = "📊 **ĐÃ NẠP DỮ LIỆU MẪU THÀNH CÔNG!**\n\n"
                + "- **Tài sản**: Số dư ví mặc định của bạn đã được cập nhật thành **15.000.000 VND**.\n"
                + "- **Giao dịch**: Đã tự động tạo **9 giao dịch mẫu** trong tháng này (gồm 1 khoản lương, 8 khoản chi tiêu ăn uống, di chuyển, mua sắm và tiền nhà).\n"
                + "- **Ngân sách**: Đã thiết lập ngân sách **3.000.000 VND** cho danh mục 'Ăn uống', trong đó bạn đã chi tiêu **2.750.000 VND** (đạt **91.6%** hạn mức).\n\n"
                + "Bạn đã sẵn sàng để kiểm tra tính năng phân tích tài chính và dự báo chi tiêu của AI chưa?";

        AiChatResponse.Overview overview = new AiChatResponse.Overview();
        overview.setStatus("WARNING");
        overview.setCurrentSpent(2750000.0);
        overview.setIncome(25000000.0);
        overview.setDaysRemaining((int) java.time.temporal.ChronoUnit.DAYS.between(today, today.with(java.time.temporal.TemporalAdjusters.lastDayOfMonth())));
        overview.setPredictedTotal(3100000.0);

        List<String> analysis = List.of(
                "Chi tiêu cho ăn uống hiện tại là 2.750.000đ, chiếm 91.6% ngân sách.",
                "Tốc độ chi tiêu ăn uống trung bình là 110.000đ/ngày.",
                "Chi tiêu mua sắm chiếm tỷ trọng lớn thứ hai sau tiền nhà."
        );

        List<String> warnings = List.of(
                "Bạn sắp vượt hạn mức ngân sách ăn uống (đã tiêu 91.6% hạn mức 3.000.000đ)."
        );

        List<String> suggestions = List.of(
                "Nên cắt giảm ăn uống bên ngoài trong những ngày cuối tháng.",
                "Hạn chế mua sắm không thiết yếu để duy trì số dư ví an toàn."
        );

        List<String> nextActions = List.of(
                "Đặt giới hạn chi tiêu ăn uống hằng ngày dưới 50.000đ."
        );

        AiChatResponse.StructuredData sd = new AiChatResponse.StructuredData();
        sd.setOverview(overview);
        sd.setAnalysis(analysis);
        sd.setWarnings(warnings);
        sd.setSuggestions(suggestions);
        sd.setNextActions(nextActions);

        AiConversation conversation = AiConversation.builder()
                .user(user)
                .title("Nạp dữ liệu test AI")
                .build();
        conversation = conversationRepository.save(conversation);

        AiMessage modelMessage = AiMessage.builder()
                .conversation(conversation)
                .sender("AI")
                .content(textResponse)
                .promptTokens(0)
                .completionTokens(0)
                .latencyMs(0L)
                .build();
        messageRepository.save(modelMessage);

        return AiChatResponse.builder()
                .conversationId(conversation.getId())
                .messageId(modelMessage.getId())
                .sender("AI")
                .content(textResponse)
                .structuredData(sd)
                .build();
    }

    private void createMockTransaction(User user, com.project.app.wallet.entity.Wallet wallet, BigDecimal amount, 
                                        com.project.app.transaction.enums.TransactionType type, String note, 
                                        Long categoryId, java.time.LocalDateTime createdAt) {
        com.project.app.transaction.entity.Transaction tx = new com.project.app.transaction.entity.Transaction();
        tx.setUser(user);
        tx.setWallet(wallet);
        tx.setAmount(amount);
        tx.setType(type);
        tx.setStatus(com.project.app.transaction.enums.TransactionStatus.SUCCESS);
        tx.setNote(note);
        tx.setCategoryId(categoryId);
        tx.setTransactionCode("MOCK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        try {
            java.lang.reflect.Field field = com.project.app.transaction.entity.Transaction.class.getDeclaredField("createdAt");
            field.setAccessible(true);
            field.set(tx, createdAt);
            
            java.lang.reflect.Field updatedField = com.project.app.transaction.entity.Transaction.class.getDeclaredField("updatedAt");
            updatedField.setAccessible(true);
            updatedField.set(tx, createdAt);
        } catch (Exception e) {
            log.error("Failed to set reflection createdAt", e);
        }
        transactionRepository.save(tx);
    }

    private AiChatResponse revertMockData(User user, AiChatRequest request) {
        // 1. Revert wallet balance to 0
        com.project.app.wallet.entity.Wallet wallet = walletRepository.findByUserIdAndIsDefaultTrue(user.getId())
                .orElse(null);
        if (wallet != null) {
            wallet.setBalance(BigDecimal.ZERO);
            walletRepository.save(wallet);
        }

        // 2. Delete all transactions
        List<com.project.app.transaction.entity.Transaction> existingTx = transactionRepository.findByUserIdAndWallet_IsDefaultTrueOrderByCreatedAtDesc(user.getId());
        transactionRepository.deleteAll(existingTx);

        // 3. Mark budgets as deleted
        List<com.project.app.budget.entity.Budget> existingBudgets = budgetRepository.findByUserIdAndIsDeletedFalse(user.getId());
        for (com.project.app.budget.entity.Budget b : existingBudgets) {
            b.setDeleted(true);
            budgetRepository.save(b);
        }

        String textResponse = "🧹 **ĐÃ DỌN DẸP DỮ LIỆU THỬ NGHIỆM THÀNH CÔNG!**\n\n"
                + "- **Tài sản**: Số dư ví mặc định đã được khôi phục về **0 VND**.\n"
                + "- **Giao dịch**: Toàn bộ các giao dịch mẫu đã được xóa bỏ hoàn toàn khỏi hệ thống.\n"
                + "- **Ngân sách**: Các ngân sách mẫu đã được xóa bỏ.\n\n"
                + "Tài khoản của bạn đã quay trở về trạng thái trống ban đầu.";

        AiConversation conversation = AiConversation.builder()
                .user(user)
                .title("Dọn dẹp dữ liệu test")
                .build();
        conversation = conversationRepository.save(conversation);

        AiMessage modelMessage = AiMessage.builder()
                .conversation(conversation)
                .sender("AI")
                .content(textResponse)
                .promptTokens(0)
                .completionTokens(0)
                .latencyMs(0L)
                .build();
        messageRepository.save(modelMessage);

        return AiChatResponse.builder()
                .conversationId(conversation.getId())
                .messageId(modelMessage.getId())
                .sender("AI")
                .content(textResponse)
                .build();
    }

    @Override
    public List<HistoryResponse> getConversationHistory(User user) {
        return conversationRepository.findByUserOrderByUpdatedAtDesc(user).stream()
                .map(c -> HistoryResponse.builder()
                        .id(c.getId())
                        .title(c.getTitle())
                        .updatedAt(c.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<AiChatResponse> getConversationMessages(User user, Long conversationId) {
        AiConversation conversation = conversationRepository.findByIdAndUser(conversationId, user)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        return messageRepository.findByConversationOrderByCreatedAtAsc(conversation).stream()
                .map(m -> {
                    AiChatResponse.StructuredData struct = null;
                    if (m.getStructuredJson() != null) {
                        try {
                            JsonNode root = objectMapper.readTree(m.getStructuredJson());
                            if (root.has("structuredData")) {
                                struct = objectMapper.treeToValue(root.get("structuredData"), AiChatResponse.StructuredData.class);
                            }
                        } catch (Exception e) {
                            log.error("Failed to parse cached message structured metadata", e);
                        }
                    }

                    List<CitationDto> citations = m.getCitations().stream()
                            .map(c -> CitationDto.builder()
                                    .sourceName(c.getSourceName())
                                    .sourceUrl(c.getSourceUrl())
                                    .snippet(c.getContentSnippet())
                                    .similarityScore(c.getSimilarityScore())
                                    .build())
                            .collect(Collectors.toList());

                    return AiChatResponse.builder()
                            .conversationId(conversation.getId())
                            .messageId(m.getId())
                            .sender(m.getSender())
                            .content(m.getContent())
                            .structuredData(struct)
                            .citations(citations)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteConversation(User user, Long conversationId) {
        AiConversation conversation = conversationRepository.findByIdAndUser(conversationId, user)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        
        conversationRepository.delete(conversation);
        cacheService.invalidate(user.getId(), conversationId);
    }

    @Override
    @Transactional
    public void submitFeedback(User user, FeedbackRequest request) {
        AiMessage message = messageRepository.findById(request.getMessageId())
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        if (!message.getConversation().getUser().getId().equals(user.getId())) {
            throw new SecurityException("Cannot submit feedback for another user's session");
        }

        AiFeedback feedback = AiFeedback.builder()
                .message(message)
                .rating(request.getRating().toUpperCase())
                .comment(request.getComment())
                .build();

        feedbackRepository.save(feedback);
    }

    @Override
    public void ingestDocument(IngestDocumentRequest request) {
        vectorStoreService.upsertDocument(
                request.getDocId(),
                request.getTitle(),
                request.getSnippet(),
                request.getUrl()
        );
    }

    private String detectMode(String message) {
        String msg = message.toLowerCase();
        // Support terms
        if (msg.contains("làm sao") || msg.contains("tính năng") || msg.contains("đổi mật khẩu") 
                || msg.contains("tạo ví") || msg.contains("excel") || msg.contains("lỗi") || msg.contains("hướng dẫn")) {
            return "SUPPORT";
        }
        // Prediction terms
        if (msg.contains("dự báo") || msg.contains("dự đoán") || msg.contains("cuối tháng") 
                || msg.contains("xu hướng") || msg.contains("sẽ tiêu")) {
            return "PREDICT";
        }
        // Advice / Analysis terms
        if (msg.contains("khuyên") || msg.contains("tư vấn") || msg.contains("phân tích") 
                || msg.contains("đánh giá") || msg.contains("nhận xét") || msg.contains("tình hình") 
                || msg.contains("báo cáo") || msg.contains("thu chi") || msg.contains("chi tiêu") 
                || msg.contains("tiết kiệm") || msg.contains("ngân sách")) {
            return "ADVICE";
        }
        // Default to general conversation
        return "CHAT";
    }

    private boolean hasFunctionCall(GeminiResponse response) {
        GeminiResponse.Part part = getFirstPart(response);
        return part != null && part.getFunctionCall() != null;
    }

    private GeminiResponse.Part getFirstPart(GeminiResponse response) {
        if (response != null && response.getCandidates() != null && !response.getCandidates().isEmpty()) {
            GeminiResponse.Candidate cand = response.getCandidates().get(0);
            if (cand.getContent() != null && cand.getContent().getParts() != null && !cand.getContent().getParts().isEmpty()) {
                return cand.getContent().getParts().get(0);
            }
        }
        return null;
    }

    private String getResponseText(GeminiResponse response) {
        GeminiResponse.Part part = getFirstPart(response);
        return part != null && part.getText() != null ? part.getText() : "";
    }

    private String stripCodeFences(String raw) {
        if (raw == null) return "";
        String clean = raw.trim();
        if (clean.startsWith("```json")) {
            clean = clean.substring(7);
        } else if (clean.startsWith("```")) {
            clean = clean.substring(3);
        }
        if (clean.endsWith("```")) {
            clean = clean.substring(0, clean.length() - 3);
        }
        return clean.trim();
    }
}
