import React from "react";
import { ActivityIndicator, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";
import Colors from "../../constants/Colors";
import { styles } from "./Button.styles";
import { ButtonProps } from "./Button.types";

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  const isDark = variant === "primary" || variant === "secondary";

  const getButtonStyle = () => {
    const base: ViewStyle[] = [styles.button];
    
    if (variant === "primary") base.push(styles.primaryButton);
    else if (variant === "secondary") base.push(styles.secondaryButton);
    else if (variant === "outline") base.push(styles.outlineButton);
    else if (variant === "text") base.push(styles.textButton);
    
    if (disabled) base.push(styles.disabledButton);
    
    return base;
  };

  const getTextStyle = () => {
    const base: TextStyle[] = [styles.text];
    
    if (variant === "primary") base.push(styles.primaryText);
    else if (variant === "secondary") base.push(styles.secondaryText);
    else if (variant === "outline") base.push(styles.outlineText);
    else if (variant === "text") base.push(styles.textText);
    
    if (disabled) base.push(styles.disabledText);
    
    return base;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isDark ? Colors.white : Colors.primary}
        />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Button;
