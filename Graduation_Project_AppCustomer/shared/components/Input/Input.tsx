import { Ionicons } from "@expo/vector-icons";
import React, { useState, useRef } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
  NativeSyntheticEvent,
  TargetedEvent,
} from "react-native";
import Colors from "../../constants/Colors";
import { styles } from "./Input.styles";
import { InputProps } from "./Input.types";

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  secureTextEntry,
  containerStyle,
  onFocus,
  onBlur,
  ref,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const localInputRef = useRef<TextInput | null>(null);

  // Merge forwarded ref and local ref
  const setRefs = (node: TextInput | null) => {
    localInputRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      if (typeof ref === "object" && "current" in ref) {
        (ref as any).current = node;
      }
    }
  };

  const handleFocus = (e: NativeSyntheticEvent<TargetedEvent>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TargetedEvent>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const isPassword = !!secureTextEntry;
  const isSecure = isPassword && !isPasswordVisible;

  const handleTogglePassword = () => {
    setIsPasswordVisible((prev) => !prev);
    // Wait a short delay and focus back to prevent keyboard dismissal
    setTimeout(() => {
      localInputRef.current?.focus();
    }, 60);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        onPress={() => localInputRef.current?.focus()}
        style={[
          styles.inputWrapper,
          isFocused && styles.focusedWrapper,
          !!error && styles.errorWrapper,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={
              error
                ? Colors.error
                : isFocused
                ? Colors.primary
                : Colors.textMuted
            }
            style={styles.leftIcon}
          />
        )}

        <TextInput
          ref={setRefs}
          style={[styles.input, isPassword && styles.passwordInput]}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isSecure}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={handleTogglePassword}
            style={styles.rightIconButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default Input;
