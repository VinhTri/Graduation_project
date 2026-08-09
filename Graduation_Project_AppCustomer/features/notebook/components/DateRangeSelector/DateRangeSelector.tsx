import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';
import { styles } from './DateRangeSelector.styles';

export type DateFilterType = 'week' | 'month' | 'year';

interface Props {
  dateFilter: DateFilterType;
  selectedDate: Date;
  onChangeFilter: (filter: DateFilterType) => void;
  onChangeDate: (date: Date) => void;
}

export const DateRangeSelector: React.FC<Props> = ({
  dateFilter,
  selectedDate,
  onChangeFilter,
  onChangeDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const startOfWeek = (d: Date) => {
    const start = new Date(d);
    const day = start.getDay() === 0 ? 6 : start.getDay() - 1;
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getDateLabel = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    if (dateFilter === 'week') {
      const start = startOfWeek(selectedDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
    }
    if (dateFilter === 'month') {
      if (selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear) {
        return 'Tháng này';
      }
      return `Tháng ${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;
    }
    if (selectedDate.getFullYear() === currentYear) return 'Năm nay';
    return `Năm ${selectedDate.getFullYear()}`;
  };

  const shiftPeriod = (dir: -1 | 1) => {
    const next = new Date(selectedDate);
    if (dateFilter === 'week') {
      next.setDate(next.getDate() + dir * 7);
    } else if (dateFilter === 'month') {
      next.setMonth(next.getMonth() + dir);
    } else {
      next.setFullYear(next.getFullYear() + dir);
    }
    const now = new Date();
    if (next > now) return;
    onChangeDate(next);
  };

  const canGoNext = () => {
    const probe = new Date(selectedDate);
    if (dateFilter === 'week') probe.setDate(probe.getDate() + 7);
    else if (dateFilter === 'month') probe.setMonth(probe.getMonth() + 1);
    else probe.setFullYear(probe.getFullYear() + 1);
    return probe <= new Date();
  };

  return (
    <View>
      <View style={styles.periodChips}>
        {(
          [
            { key: 'week', label: 'Tuần' },
            { key: 'month', label: 'Tháng' },
            { key: 'year', label: 'Năm' },
          ] as const
        ).map((item) => {
          const active = dateFilter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.periodChip, active && styles.periodChipActive]}
              onPress={() => onChangeFilter(item.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.dateSelector}>
        <TouchableOpacity style={styles.dateNavBtn} onPress={() => shiftPeriod(-1)} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={PASTEL_PALETTE.title} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateTextContainer} 
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={18} color={PASTEL_PALETTE.title} />
          <Text style={styles.dateText}>{getDateLabel()}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dateNavBtn, !canGoNext() && { opacity: 0.4 }]}
          onPress={() => shiftPeriod(1)}
          disabled={!canGoNext()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={18} color={PASTEL_PALETTE.title} />
        </TouchableOpacity>
      </View>

      {showPicker && Platform.OS !== 'ios' && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowPicker(false);
            if (date) {
              const now = new Date();
              if (date > now) {
                onChangeDate(now);
              } else {
                onChangeDate(date);
              }
            }
          }}
          maximumDate={new Date()}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
        >
          <TouchableOpacity 
            style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          >
            <TouchableWithoutFeedback>
              <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 32 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, marginBottom: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: PASTEL_PALETTE.title }}>
                    Chọn ngày
                  </Text>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: PASTEL_PALETTE.accentDeep }}>Xong</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="inline"
                    onChange={(event, date) => {
                      if (date) {
                        const now = new Date();
                        if (date > now) {
                          onChangeDate(now);
                        } else {
                          onChangeDate(date);
                        }
                      }
                    }}
                    maximumDate={new Date()}
                    locale="vi-VN"
                    themeVariant="light"
                    style={{ alignSelf: 'center' }}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};
