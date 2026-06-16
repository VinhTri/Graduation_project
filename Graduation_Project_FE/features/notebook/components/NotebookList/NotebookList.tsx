import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../../../shared/constants/Colors";
import { NotebookListProps } from "./NotebookList.types";
import { styles } from "./NotebookList.styles";

export const NotebookList: React.FC<NotebookListProps> = ({ notebooks }) => {
  const formatCurrency = (val: number) => {
    return `${val.toLocaleString("vi-VN")} ₫`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Danh sách sổ tay</Text>
      
      {notebooks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color={Colors.border} />
          <Text style={styles.emptyText}>Chưa có sổ tay nào</Text>
          <Text style={styles.emptySubtext}>
            Hãy tạo một sổ tay mới để bắt đầu ghi chép chi tiêu nhé.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {notebooks.map((notebook) => (
            <TouchableOpacity key={notebook.id} style={styles.notebookItem} activeOpacity={0.7}>
              <View style={[styles.iconContainer, { backgroundColor: `${notebook.color}20` }]}>
                <Ionicons name={notebook.icon as any} size={24} color={notebook.color} />
              </View>
              
              <View style={styles.detailsContainer}>
                <Text style={styles.name} numberOfLines={1}>{notebook.name}</Text>
                <Text style={styles.balance}>{formatCurrency(notebook.balance)}</Text>
              </View>
              
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default NotebookList;
