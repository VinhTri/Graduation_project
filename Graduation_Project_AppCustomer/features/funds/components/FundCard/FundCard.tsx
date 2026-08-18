import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { Fund } from '../../types';
import { pickFundTheme } from '../../theme';
import { formatCurrencyWithSymbol } from '../../utils';
import FundProgressBar from '../FundProgressBar/FundProgressBar';

interface FundCardProps {
  fund: Fund;
  onPress?: () => void;
}

export default function FundCard({ fund, onPress }: FundCardProps) {
  const theme = pickFundTheme(fund.coverColorSeed);
  const hasTarget = !!fund.targetAmount && fund.targetAmount > 0;
  const progress = hasTarget ? fund.balance / (fund.targetAmount as number) : 0;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.shadow}>
      <View style={styles.card}>
        <Image
          source={theme.image}
          style={styles.cardImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
        />
        <LinearGradient
          colors={['rgba(15,23,42,0.25)', 'rgba(15,23,42,0.72)']}
          style={styles.overlay}
        >
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{fund.name}</Text>
              <View style={styles.metaRow}>
                {fund.isOwner && (
                  <View style={styles.tag}>
                    <FontAwesome5 name="crown" size={9} color="#FFFFFF" solid />
                    <Text style={styles.tagText}>Chủ quỹ</Text>
                  </View>
                )}
                <View style={styles.tag}>
                  <Feather name="users" size={10} color="#FFFFFF" />
                  <Text style={styles.tagText}>{fund.memberCount} thành viên</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{theme.label}</Text>
                </View>
              </View>
            </View>
            <View style={styles.chevron}>
              <Feather name="chevron-right" size={18} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.bottom}>
            <Text style={styles.balanceLabel}>Số dư quỹ</Text>
            <Text style={styles.balance}>
              {formatCurrencyWithSymbol(fund.balance)}
            </Text>

            {hasTarget && (
              <View style={styles.progressWrap}>
                <FundProgressBar progress={progress} />
                <Text style={styles.progressText}>
                  {Math.round(progress * 100)}% của mục tiêu {formatCurrencyWithSymbol(fund.targetAmount as number)}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadow: {
    marginBottom: 16,
    borderRadius: 22,
    shadowColor: '#BE185D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    minHeight: 168,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
    minHeight: 168,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  bottom: {
    marginTop: 18,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  balance: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  currency: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressWrap: {
    marginTop: 10,
  },
  progressText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
});
