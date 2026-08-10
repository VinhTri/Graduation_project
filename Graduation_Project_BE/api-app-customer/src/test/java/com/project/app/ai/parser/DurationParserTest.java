package com.project.app.ai.parser;

import com.project.app.ai.dto.internal.DurationInfo;
import com.project.app.ai.dto.internal.ParsedDuration;
import com.project.app.ai.service.DateResolverService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

public class DurationParserTest {

    private DurationParser durationParser;
    private DateResolverService dateResolverService;

    @BeforeEach
    public void setUp() {
        durationParser = new DurationParser();
        dateResolverService = new DateResolverService(durationParser);
    }

    @Test
    public void testTwoYears() {
        String prompt = "Tôi muốn mua ô tô 300 triệu trong 2 năm.";
        ParsedDuration pd = durationParser.parseDuration(prompt, null);

        assertNotNull(pd);
        assertEquals("2 năm", pd.getOriginalTimeText());
        assertEquals(24, pd.getDurationMonths());
        assertFalse(pd.isDays());
    }

    @Test
    public void testOneYear() {
        String prompt = "Tôi muốn mua ô tô 300 triệu trong 1 năm.";
        ParsedDuration pd = durationParser.parseDuration(prompt, null);

        assertNotNull(pd);
        assertEquals("1 năm", pd.getOriginalTimeText());
        assertEquals(12, pd.getDurationMonths());
        assertFalse(pd.isDays());
    }

    @Test
    public void testFortyFiveDays() {
        String prompt = "Tôi muốn mua laptop 30 triệu trong 45 ngày.";
        ParsedDuration pd = durationParser.parseDuration(prompt, null);

        assertNotNull(pd);
        assertEquals("45 ngày", pd.getOriginalTimeText());
        assertEquals(45, pd.getDurationDays());
        assertTrue(pd.isDays());
    }

    @Test
    public void testNinetyDays() {
        String prompt = "Tôi muốn mua điện thoại 20 triệu trong 90 ngày.";
        ParsedDuration pd = durationParser.parseDuration(prompt, null);

        assertNotNull(pd);
        assertEquals("90 ngày", pd.getOriginalTimeText());
        assertEquals(90, pd.getDurationDays());
        assertTrue(pd.isDays());
    }

    @Test
    public void testOneYearSixMonths() {
        String prompt = "Tôi muốn mua xe máy 50 triệu trong 1 năm 6 tháng.";
        ParsedDuration pd = durationParser.parseDuration(prompt, null);

        assertNotNull(pd);
        assertEquals("1 năm 6 tháng", pd.getOriginalTimeText());
        assertEquals(18, pd.getDurationMonths());
        assertFalse(pd.isDays());
    }

    @Test
    public void testEndOfYear() {
        String prompt = "Tôi muốn có 100 triệu vào cuối năm.";
        DurationInfo info = dateResolverService.resolveDuration(prompt, LocalDate.of(2026, 8, 9));

        assertNotNull(info);
        assertEquals("cuối năm", info.getOriginalText());
        assertTrue(info.getMonths() >= 1);
    }
}
