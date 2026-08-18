import React, { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { styles } from "./AIRecommendationCard.styles";
import { useTheme } from "@/shared/contexts/ThemeLanguageContext";

const ROBOT = require("../../../../assets/images/ai-robot/point-right.png");

const ADVICE =
  "Bạn đã chi tiêu ít hơn 15% so với cùng kỳ tuần trước. Hãy tiếp tục duy trì mức này để đạt mục tiêu tiết kiệm nhé!";

const TYPE_MS = 58
const HOLD_MS = 2200
const GAP_MS = 600

export const AIRecommendationCard = () => {
  const { theme } = useTheme();
  const [shown, setShown] = useState("");
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    let index = 0
    let typing = true

    const tick = () => {
      if (cancelled) return

      if (typing) {
        index += 1
        setShown(ADVICE.slice(0, index))
        if (index >= ADVICE.length) {
          typing = false
          timer = setTimeout(tick, HOLD_MS)
          return
        }
        timer = setTimeout(tick, TYPE_MS)
        return
      }

      index = 0
      typing = true
      setShown("")
      timer = setTimeout(tick, GAP_MS)
    }

    timer = setTimeout(tick, 240)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const blink = setInterval(() => {
      setCursorOn((prev) => !prev)
    }, 420)
    return () => clearInterval(blink)
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <Image source={ROBOT} style={styles.robot} resizeMode="contain" />
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Trợ lý AI khuyên bạn</Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {shown}
          <Text style={[styles.cursor, { opacity: cursorOn ? 1 : 0 }]}>|</Text>
        </Text>
      </View>
    </View>
  );
};

export default AIRecommendationCard;
