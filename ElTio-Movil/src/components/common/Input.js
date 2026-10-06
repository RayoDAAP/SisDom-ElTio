/**
 * @module Input
 * @description Campo de texto reusable con etiqueta, icono de Lucide y manejo de errores.
 */
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { THEME } from '../../config/theme';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon: Icon,
  secureTextEntry = false,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
        {Icon && (
          <View style={styles.iconContainer}>
            <Icon size={18} color={error ? THEME.colors.error : THEME.colors.slate400} />
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={THEME.colors.slate400}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={styles.textInput}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.slate700,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.slate50,
    borderWidth: 1,
    borderColor: THEME.colors.slate300,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperError: {
    borderColor: THEME.colors.error,
    backgroundColor: THEME.colors.errorBg,
  },
  iconContainer: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.slate900,
    fontWeight: '500',
    height: '100%',
  },
  errorText: {
    fontSize: 11,
    color: THEME.colors.error,
    marginTop: 4,
    fontWeight: '600',
  },
});
