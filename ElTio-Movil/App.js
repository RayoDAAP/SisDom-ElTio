/**
 * @module App
 * @description Punto de entrada principal de la aplicación móvil de Tacos El Tío para repartidores.
 *              Configura el proveedor de autenticación global y la navegación condicional por sesión.
 *              Incluye barra de navegación inferior con pestañas: Entregas y Mi Ruta.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Bike, ClipboardList, Navigation } from 'lucide-react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { DeliveriesScreen } from './src/screens/DeliveriesScreen';
import { RouteScreen } from './src/screens/RouteScreen';
import { orderService } from './src/services/orderService';
import { THEME } from './src/config/theme';

/**
 * Barra de navegación inferior con pestañas para repartidores autenticados.
 */
const AuthenticatedApp = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('deliveries');
  const [routeCount, setRouteCount] = useState(0);
  const pollRef = useRef(null);

  // Polling ligero: solo cuenta pedidos asignados para el badge de la pestaña Mi Ruta
  useEffect(() => {
    const fetchRouteCount = async () => {
      try {
        const data = await orderService.getDriverRoute(token);
        setRouteCount(data?.totalOrders ?? 0);
      } catch {
        // Sin acceso al endpoint o sin pedidos — ignorar silenciosamente
      }
    };

    fetchRouteCount();
    pollRef.current = setInterval(fetchRouteCount, 30000); // cada 30 s

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [token]);

  const tabs = [
    {
      key: 'deliveries',
      label: 'Entregas',
      Icon: ClipboardList,
    },
    {
      key: 'route',
      label: 'Mi Ruta',
      Icon: Navigation,
      badge: routeCount > 0 ? routeCount : null,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Contenido principal */}
      <View style={styles.screenContainer}>
        {activeTab === 'deliveries' ? <DeliveriesScreen /> : <RouteScreen />}
      </View>

      {/* Barra de navegación inferior */}
      <View style={styles.tabBar}>
        {tabs.map(({ key, label, Icon, badge }) => {
          const isActive = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={styles.tabItem}
              onPress={() => setActiveTab(key)}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconWrapper}>
                <Icon
                  size={22}
                  color={isActive ? THEME.colors.brandRed : THEME.colors.textSecondary}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {badge != null && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {label}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.logoBadge}>
          <Bike size={44} color={THEME.colors.brandYellow} />
        </View>
        <Text style={styles.splashTitle}>Tacos "El Tío"</Text>
        <Text style={styles.splashSubtitle}>Repartidores</Text>
        <ActivityIndicator
          size="small"
          color={THEME.colors.brandYellow}
          style={styles.loader}
        />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {isAuthenticated ? <AuthenticatedApp /> : <LoginScreen />}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  // ── Splash ──────────────────────────────────────────────────────────────────
  splashContainer: {
    flex: 1,
    backgroundColor: THEME.colors.brandRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.colors.white,
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.brandYellow,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  loader: {
    marginTop: 24,
  },

  // ── Layout autenticado ───────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.backgroundDark ?? '#111827',
  },
  screenContainer: {
    flex: 1,
  },

  // ── Tab bar ─────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface ?? '#1F2937',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border ?? '#374151',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabIconWrapper: {
    position: 'relative',
    marginBottom: 3,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: THEME.colors.brandRed,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textSecondary ?? '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: THEME.colors.brandRed,
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: THEME.colors.brandRed,
  },
});

