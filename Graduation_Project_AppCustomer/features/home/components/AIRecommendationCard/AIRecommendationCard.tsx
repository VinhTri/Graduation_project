import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { styles } from "./AIRecommendationCard.styles";
import { useTheme } from "@/shared/contexts/ThemeLanguageContext";
import { aiInsightService } from "@/shared/services/aiInsightService";

const ROBOT = require("../../../../assets/images/ai-robot/point-right.png");

const TYPE_MS = 58;
const HOLD_MS = 2200;
const GAP_MS = 600;
const FALLBACK =
  "Hỏi Trợ lý AI: \"Tháng này thu chi thế nào?\" để xem báo cáo nhanh.";

export const AIRecommendationCard = () => {
  const { theme } = useTheme();
  const [advice, setAdvice] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [shown, setShown] = useState("");
  const [cursorOn, setCursorOn] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          const insight = await aiInsightService.getHomeInsight();
          if (cancelled) return;
          setAdvice(insight.message?.trim() || FALLBACK);
        } catch {
          if (!cancelled) setAdvice(FALLBACK);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  useEffect(() => {
    if (loading) {
      setShown("");
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let index = 0;
    let typing = true;

    const tick = () => {
      if (cancelled) return;

      if (typing) {
        index += 1;
        setShown(advice.slice(0, index));
        if (index >= advice.length) {
          typing = false;
          timer = setTimeout(tick, HOLD_MS);
          return;
        }
        timer = setTimeout(tick, TYPE_MS);
        return;
      }

      index = 0;
      typing = true;
      setShown("");
      timer = setTimeout(tick, GAP_MS);
    };

    timer = setTimeout(tick, 240);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [advice, loading]);

  useEffect(() => {
    const blink = setInterval(() => {
      setCursorOn((prev) => !prev);
    }, 420);
    return () => clearInterval(blink);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <Image source={ROBOT} style={styles.robot} resizeMode="contain" />
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Trợ lý AI khuyên bạn</Text>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.textSecondary} />
            <Text style={[styles.message, { color: theme.textSecondary, marginLeft: 8 }]}>
              Đang phân tích thu chi…
            </Text>
          </View>
        ) : (
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            {shown}
            <Text style={[styles.cursor, { opacity: cursorOn ? 1 : 0 }]}>|</Text>
          </Text>
        )}
      </View>
    </View>
  );
};

export default AIRecommendationCard;
