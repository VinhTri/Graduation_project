import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../../../shared/constants/Colors";
import { styles } from "./NotebookScreen.styles";
import { NotebookHeader } from "../../components/NotebookHeader/NotebookHeader";
import { NotebookList } from "../../components/NotebookList/NotebookList";
import { NotebookItem } from "../../components/NotebookList/NotebookList.types";

export default function NotebookScreen() {
  const insets = useSafeAreaInsets();
  
  // Dummy data for now, will connect to backend later
  const [totalBalance, setTotalBalance] = useState(15000000);
  const [monthlyIncome, setMonthlyIncome] = useState(20000000);
  const [monthlyExpense, setMonthlyExpense] = useState(5000000);
  const [notebooks, setNotebooks] = useState<NotebookItem[]>([
    {
      id: "1",
      name: "Tiền mặt",
      balance: 1500000,
      icon: "cash",
      color: "#10B981",
    },
    {
      id: "2",
      name: "Thẻ MB Bank",
      balance: 13500000,
      icon: "card",
      color: "#3B82F6",
    }
  ]);

  const handleAddNotebook = () => {
    // Navigate to Add Notebook Screen
    console.log("Add notebook clicked");
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <NotebookHeader 
        totalBalance={totalBalance}
        monthlyIncome={monthlyIncome}
        monthlyExpense={monthlyExpense}
      />

      {/* Content Section */}
      <View style={styles.content}>
        <NotebookList notebooks={notebooks} />
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: insets.bottom + 80 }]} 
        activeOpacity={0.8}
        onPress={handleAddNotebook}
      >
        <Ionicons name="add" size={32} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}
