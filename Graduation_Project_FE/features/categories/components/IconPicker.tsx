import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../shared/constants/Colors';

const AVAILABLE_ICONS = [
  "apps-outline", "grid-outline", "list-outline", "layers-outline", 
  "folder-outline", "briefcase-outline", "wallet-outline", "cash-outline",
  "card-outline", "cart-outline", "bag-handle-outline", "pricetag-outline",
  "car-outline", "bus-outline", "airplane-outline", "bicycle-outline",
  "fast-food-outline", "cafe-outline", "restaurant-outline", "pizza-outline",
  "heart-outline", "fitness-outline", "medkit-outline", "bed-outline",
  "book-outline", "school-outline", "library-outline", "newspaper-outline",
  "flash-outline", "water-outline", "home-outline", "construct-outline",
  "game-controller-outline", "headset-outline", "tv-outline", "desktop-outline",
  "film-outline", "musical-notes-outline", "ticket-outline", "color-palette-outline"
];

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (iconName: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelect }) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {AVAILABLE_ICONS.map((icon) => {
            const isSelected = selectedIcon === icon;
            return (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconItem,
                  isSelected && styles.selectedIconItem
                ]}
                onPress={() => onSelect(icon)}
              >
                <Ionicons 
                  name={icon as any} 
                  size={28} 
                  color={isSelected ? Colors.white : Colors.textMuted} 
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    height: 120, // 2 rows roughly
  },
  grid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    height: 120,
    gap: 8,
    paddingHorizontal: 4,
  },
  iconItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedIconItem: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  }
});
