import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StatusBar, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FundHeaderShell } from '../../components';
import { SuccessModal } from '../../../../shared/components';
import { fundStore, useFunds } from '../../store/fundStore';
import { FUND_PALETTE, FUND_THEMES, FUND_THEME_COUNT, pickFundTheme } from '../../theme';
import { MAX_OWNED_FUNDS } from '../../constants';
import { formatCurrency, parseAmountInput } from '../../utils';
import { styles } from './CreateFundScreen.styles';

const TARGET_SUGGESTIONS = [1_000_000, 3_000_000, 5_000_000, 10_000_000];
const MIN_TARGET = 10_000;

export function CreateFundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const funds = useFunds();

  const myFunds = useMemo(() => funds.filter((f) => f.isOwner), [funds]);
  const usedThemeSeeds = useMemo(
    () => new Set(myFunds.map((f) => Math.abs(f.coverColorSeed) % FUND_THEME_COUNT)),
    [myFunds]
  );
  const availableThemes = useMemo(
    () =>
      FUND_THEMES.map((theme, index) => ({ theme, index })).filter(
        ({ index }) => !usedThemeSeeds.has(index)
      ),
    [usedThemeSeeds]
  );

  const reachedLimit = myFunds.length >= MAX_OWNED_FUNDS;

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [themeIndex, setThemeIndex] = useState(() => availableThemes[0]?.index ?? 0);
  const [successVisible, setSuccessVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fundStore.refreshFunds().catch(() => {});
  }, []);

  useEffect(() => {
    if (availableThemes.length === 0) return;
    if (!availableThemes.some((t) => t.index === themeIndex)) {
      setThemeIndex(availableThemes[0].index);
    }
  }, [availableThemes, themeIndex]);

  const parsedTarget = target ? parseInt(target, 10) : 0;
  const isValid =
    !reachedLimit &&
    !submitting &&
    name.trim().length >= 2 &&
    parsedTarget >= MIN_TARGET &&
    availableThemes.some((t) => t.index === themeIndex);

  const handleCreate = async () => {
    if (reachedLimit) {
      Alert.alert('Đã đạt giới hạn', `Bạn chỉ có thể tự tạo tối đa ${MAX_OWNED_FUNDS} quỹ.`);
      return;
    }
    if (!isValid) return;
    try {
      setSubmitting(true);
      await fundStore.addFund({
        name: name.trim(),
        targetAmount: parsedTarget,
        coverColorSeed: themeIndex,
      });
      setSuccessVisible(true);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể tạo quỹ');
    } finally {
      setSubmitting(false);
    }
  };

  const previewTheme = pickFundTheme(themeIndex);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFD6EC" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FundHeaderShell contentStyle={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color={FUND_PALETTE.subtitle} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tạo quỹ mới</Text>
            <View style={styles.iconBtn} />
          </View>

          <View style={styles.previewCard}>
            <Image
              source={previewTheme.image}
              style={styles.previewCardImageFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={0}
            />
            <LinearGradient
              colors={['rgba(15,23,42,0.2)', 'rgba(15,23,42,0.7)']}
              style={styles.previewOverlay}
            >
              <Text style={styles.previewThemeTag}>{previewTheme.label}</Text>
              <Text style={styles.previewName} numberOfLines={1}>
                {name.trim() || 'Tên quỹ của bạn'}
              </Text>
              <Text style={styles.previewBalanceLabel}>Số dư quỹ</Text>
              <Text style={styles.previewBalance}>0 ₫</Text>
              {parsedTarget > 0 && (
                <Text style={styles.previewTarget}>Mục tiêu: {formatCurrency(parsedTarget)} ₫</Text>
              )}
            </LinearGradient>
          </View>
        </FundHeaderShell>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {reachedLimit && (
            <View style={styles.limitBanner}>
              <Ionicons name="alert-circle" size={18} color={FUND_PALETTE.danger} />
              <Text style={styles.limitBannerText}>
                Bạn đã tạo đủ {MAX_OWNED_FUNDS} quỹ — không thể tạo thêm.
              </Text>
            </View>
          )}

          <Text style={styles.label}>Tên quỹ</Text>
          <View style={styles.inputWrap}>
            <Feather name="edit-3" size={18} color={FUND_PALETTE.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="VD: Quỹ du lịch Đà Lạt"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              maxLength={50}
              editable={!reachedLimit}
            />
          </View>

          <Text style={styles.label}>
            Mục tiêu số tiền <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrap}>
            <Feather name="target" size={18} color={FUND_PALETTE.textMuted} />
            <TextInput
              style={[styles.input, { color: '#EC4899', fontWeight: 'bold' }]}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={target ? formatCurrency(parseInt(target, 10)) : ''}
              onChangeText={(t) => setTarget(parseAmountInput(t))}
              maxLength={14}
              editable={!reachedLimit}
            />
            <Text style={[styles.currency, { color: '#EC4899', fontWeight: 'bold' }]}>₫</Text>
          </View>

          <View style={styles.chipRow}>
            {TARGET_SUGGESTIONS.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[styles.chip, parsedTarget === amt && styles.chipActive]}
                onPress={() => !reachedLimit && setTarget(amt.toString())}
                activeOpacity={0.85}
                disabled={reachedLimit}
              >
                <Text style={[styles.chipText, parsedTarget === amt && styles.chipTextActive]}>
                  {formatCurrency(amt)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.hint}>
            Mỗi quỹ cần có mục tiêu cụ thể (tối thiểu {formatCurrency(MIN_TARGET)} ₫).
          </Text>

          <Text style={styles.label}>Chủ đề quỹ</Text>
          {availableThemes.length === 0 ? (
            <Text style={styles.hint}>Không còn chủ đề khả dụng. Hãy xóa bớt quỹ để tạo mới.</Text>
          ) : (
            <>
              <View style={styles.themeGrid}>
                {availableThemes.map(({ theme, index }) => {
                  const selected = themeIndex === index;
                  return (
                    <TouchableOpacity
                      key={theme.id}
                      style={[styles.themeItem, selected && styles.themeItemActive]}
                      onPress={() => setThemeIndex(index)}
                      activeOpacity={0.85}
                      disabled={reachedLimit}
                    >
                      <Image
                        source={theme.image}
                        style={styles.themeThumb}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={0}
                      />
                      {selected && (
                        <View style={styles.themeCheck}>
                          <Feather name="check" size={14} color="#FFFFFF" />
                        </View>
                      )}
                      <Text style={[styles.themeLabel, selected && styles.themeLabelActive]} numberOfLines={1}>
                        {theme.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.hint}>
                Mỗi quỹ một chủ đề riêng. Chủ đề đã dùng sẽ không hiện lại.
              </Text>
            </>
          )}

          <View style={styles.infoBox}>
            <Feather name="info" size={16} color={FUND_PALETTE.primaryDeep} />
            <Text style={styles.infoText}>
              Sau khi tạo, bạn có thể mời bạn bè tham gia và cùng nạp tiền vào quỹ.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
            disabled={!isValid}
            onPress={handleCreate}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>
              {reachedLimit ? 'Đã đạt tối đa' : 'Tạo quỹ'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={successVisible}
        variant="pastel"
        title="Tạo quỹ thành công"
        message={`Quỹ "${name.trim()}" đã được tạo. Hãy mời bạn bè cùng tham gia nhé!`}
        onClose={() => {
          setSuccessVisible(false);
          router.back();
        }}
      />
    </View>
  );
}
