/**
 * @module Header
 * @description Encabezado superior para la aplicación móvil de repartidores.
 *              Incluye botón directo de estado y control de GPS.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Bike, LogOut, ShieldCheck, Radio } from 'lucide-react-native';
import { THEME } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ trackingStatus, onOpenGpsModal }) => {
  const { user, logout } = useAuth();
  const isGpsOn = trackingStatus?.isTrackingEnabled !== false;
  const isRequestPending = Boolean(trackingStatus?.requestPending);

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

          {/* Perfil del Repartidor, Control de GPS y Salir */}
          <View style={styles.actionsContainer}>
            {/* Botón de estado de GPS */}
            {onOpenGpsModal && (
              <TouchableOpacity
                onPress={onOpenGpsModal}
                activeOpacity={0.7}
                style={[
                  styles.gpsBadgeBtn,
                  isGpsOn
                    ? isRequestPending
                      ? styles.gpsBadgePending
                      : styles.gpsBadgeOn
                    : styles.gpsBadgeOff,
                ]}
              >
                <Radio
                  size={12}
                  color={
                    isGpsOn
                      ? isRequestPending
                        ? '#D97706'
                        : '#16A34A'
                      : '#DC2626'
                  }
                />
                <Text
                  style={[
                    styles.gpsBadgeBtnText,
                    {
                      color: isGpsOn
                        ? isRequestPending
                          ? '#D97706'
                          : '#16A34A'
                        : '#DC2626',
                    },
                  ]}
                >
                  {isGpsOn
                    ? isRequestPending
                      ? 'GPS Solicitado'
                      : 'GPS Activo'
                    : 'GPS Off'}
                </Text>
              </TouchableOpacity>
            )}

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
    borderBottomWidth: 2,
    borderBottomColor: THEME.colors.brandYellow,
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
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.brandRedDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.brandYellow,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.white,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginTop: -2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
  },
  gpsBadgeOn: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  gpsBadgePending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  gpsBadgeOff: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  gpsBadgeBtnText: {
    fontSize: 9,
    fontWeight: '800',
  },
  driverInfo: {
    alignItems: 'flex-end',
    maxWidth: 90,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  driverName: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.white,
  },
  statusOnline: {
    fontSize: 9,
    color: THEME.colors.brandYellow,
    fontWeight: '600',
    marginTop: 1,
  },
  logoutButton: {
    width: 32,
    height: 32,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
