/**
 * @module Header
 * @description Encabezado superior para la aplicación móvil de repartidores.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Bike, LogOut, ShieldCheck } from 'lucide-react-native';
import { THEME } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.headerWrapper}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Identidad de la Marca */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Bike size={20} color={THEME.colors.brandYellow} />
            </View>
            <View>
              <Text style={styles.brandTitle}>Tacos &ldquo;El Tío&rdquo;</Text>
              <Text style={styles.brandSubtitle}>Módulo de Repartidores</Text>
            </View>
          </View>

          {/* Perfil del Repartidor y Botón Salir */}
          <View style={styles.actionsContainer}>
            <View style={styles.driverInfo}>
              <View style={styles.driverNameRow}>
                <ShieldCheck size={12} color={THEME.colors.brandYellow} />
                <Text style={styles.driverName} numberOfLines={1}>
                  {user?.name || 'Repartidor'}
                </Text>
              </View>
              <Text style={styles.statusOnline}>En Turno</Text>
            </View>

            <TouchableOpacity
              onPress={logout}
              activeOpacity={0.7}
              style={styles.logoutButton}
              accessibilityLabel="Cerrar sesión"
            >
              <LogOut size={16} color={THEME.colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: THEME.colors.brandRed,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  safeArea: {
    backgroundColor: THEME.colors.brandRed,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.white,
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.brandYellow,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverInfo: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  driverName: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.white,
    maxWidth: 100,
  },
  statusOnline: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.brandYellow,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutButton: {
    width: 34,
    height: 34,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
