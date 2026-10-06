/**
 * @module Button
 * @description Botón reutilizable y accesible para la app móvil de Tacos El Tío.
 *              Soporta múltiples variantes, tamaños, iconos de Lucide e indicador de carga.
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { THEME } from '../../config/theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  style,
  textStyle,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: styles.variantSecondary,
          text: styles.textSecondary,
          loaderColor: THEME.colors.slate900,
        };
      case 'outline':
        return {
          container: styles.variantOutline,
          text: styles.textOutline,
          loaderColor: THEME.colors.slate700,
        };
      case 'success':
        return {
          container: styles.variantSuccess,
          text: styles.textSuccess,
          loaderColor: THEME.colors.white,
        };
      case 'danger':
        return {
          container: styles.variantDanger,
          text: styles.textDanger,
          loaderColor: THEME.colors.white,
        };
      case 'primary':
      default:
        return {
          container: styles.variantPrimary,
          text: styles.textPrimary,
          loaderColor: THEME.colors.white,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 12, fontSize: 13 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 24, fontSize: 16 };
      case 'md':
      default:
        return { paddingVertical: 12, paddingHorizontal: 18, fontSize: 14 };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      style={[
        styles.baseContainer,
        vStyles.container,
        { paddingVertical: sStyles.paddingVertical, paddingHorizontal: sStyles.paddingHorizontal },
        (disabled || isLoading) && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={vStyles.loaderColor} />
      ) : (
        <View style={styles.contentRow}>
          {Icon && (
            <View style={styles.iconContainer}>
              <Icon size={sStyles.fontSize + 2} color={StyleSheet.flatten([vStyles.text, textStyle])?.color || '#FFFFFF'} />
            </View>
          )}
          <Text style={[styles.baseText, vStyles.text, { fontSize: sStyles.fontSize }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  baseText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  variantPrimary: {
    backgroundColor: THEME.colors.brandRed,
  },
  textPrimary: {
    color: THEME.colors.white,
  },
  variantSecondary: {
    backgroundColor: THEME.colors.brandYellow,
  },
  textSecondary: {
    color: THEME.colors.slate900,
  },
  variantOutline: {
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.slate300,
  },
  textOutline: {
    color: THEME.colors.slate700,
  },
  variantSuccess: {
    backgroundColor: THEME.colors.success,
  },
  textSuccess: {
    color: THEME.colors.white,
  },
  variantDanger: {
    backgroundColor: THEME.colors.error,
  },
  textDanger: {
    color: THEME.colors.white,
  },
});
