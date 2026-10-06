/**
 * @module Badge
 * @description Insignia visual para estados de pedido y etiquetas.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../config/theme';

export const Badge = ({ label, colors, icon: Icon, style }) => {
  const bg = colors?.bg || THEME.colors.slate100;
  const textColor = colors?.text || THEME.colors.slate700;
  const borderColor = colors?.border || THEME.colors.slate200;

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor }, style]}>
      {Icon && (
        <View style={styles.iconWrapper}>
          <Icon size={12} color={textColor} />
        </View>
      )}
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  iconWrapper: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
