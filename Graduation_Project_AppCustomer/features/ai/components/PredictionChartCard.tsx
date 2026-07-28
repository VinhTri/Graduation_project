import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface TrendItem {
  category: string;
  trend: 'UP' | 'DOWN';
  percentage: number;
}

interface PredictionProps {
  currentSpent: number;
  predictedTotal: number;
  budgetLimit: number;
  categoryTrends: TrendItem[];
}

export const PredictionChartCard: React.FC<PredictionProps> = ({
  currentSpent,
  predictedTotal,
  budgetLimit,
  categoryTrends = []
}) => {
  const isOverBudget = budgetLimit > 0 && predictedTotal > budgetLimit;
  const percentageOfBudget = budgetLimit > 0 ? Math.min((currentSpent / budgetLimit) * 100, 100) : 0;
  const projectedPercentage = budgetLimit > 0 ? Math.min((predictedTotal / budgetLimit) * 100, 200) : 0;

  return (
    <View style={[styles.card, isOverBudget ? styles.borderWarning : styles.borderSafe]}>
      <Text style={styles.title}>📊 Dự Báo Chi Tiêu & Ngân Sách</Text>
      
      {/* Visual Progress Indicators */}
      <View style={styles.chartContainer}>
        {/* Actual spent bar */}
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Đã tiêu thực tế ({Math.round(percentageOfBudget)}%)</Text>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${percentageOfBudget}%`, backgroundColor: '#0a84ff' }]} />
          </View>
        </View>

        {/* Projected spent bar */}
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Dự kiến cuối tháng ({Math.round(projectedPercentage)}%)</Text>
          <View style={styles.track}>
            <View style={[styles.bar, { 
              width: `${Math.min(projectedPercentage, 100)}%`, 
              backgroundColor: isOverBudget ? '#ff453a' : '#30d158' 
            }]} />
          </View>
        </View>
      </View>

      {/* Numerical Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Hạn mức:</Text>
          <Text style={styles.metricValue}>{budgetLimit.toLocaleString()} VND</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Đã tiêu lũy kế:</Text>
          <Text style={styles.metricValue}>{currentSpent.toLocaleString()} VND</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Dự kiến cuối tháng:</Text>
          <Text style={[styles.metricValue, isOverBudget ? styles.textAlert : styles.textSuccess]}>
            {predictedTotal.toLocaleString()} VND
          </Text>
        </View>
      </View>

      {/* Danger/Warning message if over budget */}
      {isOverBudget && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>
            ⚠️ Cảnh báo: Chi tiêu của bạn dự kiến sẽ vượt hạn mức ngân sách khoảng {(predictedTotal - budgetLimit).toLocaleString()} VND. Hãy cân nhắc cắt giảm chi phí không thiết yếu!
          </Text>
        </View>
      )}

      {/* Dynamic Trend Alert List */}
      {categoryTrends.length > 0 && (
        <View style={styles.trendList}>
          <Text style={styles.trendTitle}>Xu hướng chi tiêu danh mục:</Text>
          {categoryTrends.map((item, idx) => (
            <View key={idx} style={styles.trendRow}>
              <Text style={styles.trendCategoryLabel}>• {item.category}</Text>
              <Text style={item.trend === 'UP' ? styles.trendUp : styles.trendDown}>
                {item.trend === 'UP' ? '▲ Tăng' : '▼ Giảm'} {item.percentage}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
  },
  borderWarning: {
    borderColor: '#ff453a',
  },
  borderSafe: {
    borderColor: '#30d158',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  chartContainer: {
    marginBottom: 16,
  },
  progressRow: {
    marginBottom: 12,
  },
  progressLabel: {
    color: '#aeaea3',
    fontSize: 12,
    marginBottom: 6,
  },
  track: {
    height: 10,
    backgroundColor: '#2c2c2e',
    borderRadius: 5,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 5,
  },
  metricsContainer: {
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#38383a',
    paddingVertical: 12,
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  metricLabel: {
    color: '#aeaea3',
    fontSize: 14,
  },
  metricValue: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  textAlert: {
    color: '#ff453a',
  },
  textSuccess: {
    color: '#30d158',
  },
  alertBanner: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  alertText: {
    color: '#ff453a',
    fontSize: 12,
    lineHeight: 18,
  },
  trendList: {
    paddingTop: 4,
  },
  trendTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  trendCategoryLabel: {
    color: '#aeaea3',
    fontSize: 13,
  },
  trendUp: {
    color: '#ff453a',
    fontWeight: '600',
    fontSize: 13,
  },
  trendDown: {
    color: '#30d158',
    fontWeight: '600',
    fontSize: 13,
  }
});
