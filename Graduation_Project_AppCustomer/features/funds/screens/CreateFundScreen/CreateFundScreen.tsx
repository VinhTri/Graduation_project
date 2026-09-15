import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StatusBar, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch, ImageBackground
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FundHeaderShell } from '../../components';
import { useToast } from '../../../../shared/components/Toast';
import { fundStore, useFunds } from '../../store/fundStore';
import { FUND_PALETTE, FUND_THEMES, FUND_THEME_COUNT, pickFundTheme } from '../../theme';
import { MAX_OWNED_FUNDS, SYSTEM_MIN_DEPOSIT } from '../../constants';
import { formatCurrency, parseAmountInput } from '../../utils';
import { styles } from './CreateFundScreen.styles';

const TARGET_SUGGESTIONS = [1_000_000, 3_000_000, 5_000_000, 10_000_000];
const MIN_TARGET = 10_000;
const MIN_DEPOSIT_SUGGESTIONS = [2_000, 10_000, 50_000, 100_000];

export function CreateFundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
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
  const [minDeposit, setMinDeposit] = useState(String(SYSTEM_MIN_DEPOSIT));
  const [minDepositEnabled, setMinDepositEnabled] = useState(false);
  const [themeIndex, setThemeIndex] = useState(() => availableThemes[0]?.index ?? 0);
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
  const parsedMinDeposit = minDeposit ? parseInt(minDeposit, 10) : 0;
  const minDepositValid =
    !minDepositEnabled ||
    (parsedMinDeposit >= SYSTEM_MIN_DEPOSIT && parsedMinDeposit <= parsedTarget);
  const isValid =
    !reachedLimit &&
    !submitting &&
    name.trim().length >= 2 &&
    parsedTarget >= MIN_TARGET &&
    minDepositValid &&
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
        ...(minDepositEnabled ? { minDepositAmount: parsedMinDeposit } : {}),
        coverColorSeed: themeIndex,
      });
      showToast({ variant: 'success', message: `Tạo quỹ "${name.trim()}" thành công` });
      router.back();
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
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
                <Ionicons name="chevron-back-outline" size={24} color="#7C3AED" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Tạo quỹ mới</Text>
            </View>
          </View>

          <ImageBackground
            source={previewTheme.image}
            style={styles.previewCard}
            imageStyle={styles.previewCardImageFill}
            resizeMode="cover"
          >
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
              {minDepositEnabled && parsedMinDeposit > 0 && (
                <Text style={styles.previewTarget}>
                  Nạp tối thiểu: {formatCurrency(parsedMinDeposit)} ₫
                </Text>
              )}
            </LinearGradient>
          </ImageBackground>
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

          <View style={styles.switchCard}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchTitle}>Nạp tối thiểu mỗi thành viên</Text>
              <Text style={styles.switchHint}>
                Bật nếu muốn đặt mức nạp tối thiểu riêng. Tắt thì chỉ áp dụng sàn hệ thống {formatCurrency(SYSTEM_MIN_DEPOSIT)} ₫.
              </Text>
            </View>
            <Switch
              value={minDepositEnabled}
              onValueChange={(on) => {
                setMinDepositEnabled(on);
                if (on && !minDeposit) setMinDeposit(String(SYSTEM_MIN_DEPOSIT));
              }}
              disabled={reachedLimit}
              trackColor={{ false: FUND_PALETTE.border, true: FUND_PALETTE.primarySoft }}
              thumbColor={minDepositEnabled ? FUND_PALETTE.primary : FUND_PALETTE.white}
              ios_backgroundColor={FUND_PALETTE.border}
            />
          </View>

          {minDepositEnabled ? (
            <>
              <View style={[styles.inputWrap, { marginTop: 12 }]}>
                <Feather name="arrow-down-circle" size={18} color={FUND_PALETTE.textMuted} />
                <TextInput
                  style={[styles.input, { color: '#7C3AED', fontWeight: 'bold' }]}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={minDeposit ? formatCurrency(parseInt(minDeposit, 10)) : ''}
                  onChangeText={(t) => setMinDeposit(parseAmountInput(t))}
                  maxLength={14}
                  editable={!reachedLimit}
                />
                <Text style={[styles.currency, { color: '#7C3AED', fontWeight: 'bold' }]}>₫</Text>
              </View>

              <View style={styles.chipRow}>
                {MIN_DEPOSIT_SUGGESTIONS.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.chip, parsedMinDeposit === amt && styles.chipActive]}
                    onPress={() => !reachedLimit && setMinDeposit(amt.toString())}
                    activeOpacity={0.85}
                    disabled={reachedLimit}
                  >
                    <Text style={[styles.chipText, parsedMinDeposit === amt && styles.chipTextActive]}>
                      {formatCurrency(amt)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.hint}>
                Mỗi lần nạp phải từ {formatCurrency(SYSTEM_MIN_DEPOSIT)} ₫ và không vượt mục tiêu quỹ.
              </Text>
            </>
          ) : null}

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
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {reachedLimit ? 'Đã đạt tối đa' : 'Tạo quỹ'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
