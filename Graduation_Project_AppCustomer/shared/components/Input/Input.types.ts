import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleProp, TextInput, TextInputProps, ViewStyle } from "react-native";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: StyleProp<ViewStyle>;
  ref?: React.Ref<TextInput>;
}
