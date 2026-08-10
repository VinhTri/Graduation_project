package com.project.app.ai.rag;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AppKnowledgeServiceTest {

    private AppKnowledgeService appKnowledgeService;

    @BeforeEach
    void setUp() {
        DocumentLoader loader = new DocumentLoader();
        appKnowledgeService = new AppKnowledgeService(loader);
    }

    @Test
    void testDepositOnly() {
        List<DocumentChunk> chunks = appKnowledgeService.searchRelevantChunks("Nạp tiền thế nào?", "WALLET_DEPOSIT");
        assertEquals(1, chunks.size());
        assertEquals("WALLET_DEPOSIT", chunks.get(0).getTopic());
        assertTrue(chunks.get(0).getContent().contains("NẠP TIỀN VÀO VÍ"));
        assertFalse(chunks.get(0).getContent().contains("RÚT TIỀN"));
    }

    @Test
    void testWithdrawOnly() {
        List<DocumentChunk> chunks = appKnowledgeService.searchRelevantChunks("Rút tiền thế nào?", "WALLET_WITHDRAW");
        assertEquals(1, chunks.size());
        assertEquals("WALLET_WITHDRAW", chunks.get(0).getTopic());
        assertTrue(chunks.get(0).getContent().contains("RÚT TIỀN TỪ VÍ"));
        assertFalse(chunks.get(0).getContent().contains("NẠP TIỀN"));
    }

    @Test
    void testDepositAndWithdraw() {
        List<DocumentChunk> chunks = appKnowledgeService.searchRelevantChunks("Nạp rút tiền thế nào?", "WALLET_DEPOSIT_AND_WITHDRAW");
        assertEquals(2, chunks.size());
        assertTrue(chunks.stream().anyMatch(c -> "WALLET_DEPOSIT".equals(c.getTopic())));
        assertTrue(chunks.stream().anyMatch(c -> "WALLET_WITHDRAW".equals(c.getTopic())));
    }

    @Test
    void testBudgetCreateOnly() {
        List<DocumentChunk> chunks = appKnowledgeService.searchRelevantChunks("Cách tạo ngân sách", "BUDGET_CREATE");
        assertEquals(1, chunks.size());
        assertEquals("BUDGET_CREATE", chunks.get(0).getTopic());
        assertTrue(chunks.get(0).getContent().contains("TẠO VÀ QUẢN LÝ NGÂN SÁCH"));
    }

    @Test
    void testWalletCreateOnly() {
        List<DocumentChunk> chunks = appKnowledgeService.searchRelevantChunks("Làm sao tạo ví?", "WALLET_CREATE");
        assertEquals(1, chunks.size());
        assertEquals("WALLET_CREATE", chunks.get(0).getTopic());
        assertTrue(chunks.get(0).getContent().contains("TẠO VÍ CÁ NHÂN"));
    }

    @Test
    void testForgotPinOnly() {
        List<DocumentChunk> chunks = appKnowledgeService.searchRelevantChunks("Quên PIN phải làm sao?", "PIN_FORGOT");
        assertEquals(1, chunks.size());
        assertEquals("PIN_FORGOT", chunks.get(0).getTopic());
        assertTrue(chunks.get(0).getContent().contains("QUÊN MÃ PIN"));
    }

    @Test
    void testIrrelevantQueryFalsePositiveProtection() {
        List<DocumentChunk> chunks = appKnowledgeService.searchRelevantChunks("Tôi muốn mua nhà ở đâu?", "UNRELATED_TOPIC");
        assertTrue(chunks == null || chunks.isEmpty(), "Irrelevant domain query MUST return empty chunks to prevent hallucination");
    }
}
