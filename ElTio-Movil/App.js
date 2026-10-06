/**
 * @module App
 * @description Punto de entrada principal de la aplicación móvil de Tacos El Tío para repartidores.
 *              Configura el proveedor de autenticación global y la navegación condicional por sesión.
 */
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Bike } from 'lucide-react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { DeliveriesScreen } from './src/screens/DeliveriesScreen';
import { THEME } from './src/config/theme';

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.logoBadge}>
          <Bike size={44} color={THEME.colors.brandYellow} />
        </View>
        <Text style={styles.splashTitle}>Tacos &ldquo;El Tío&rdquo;</Text>
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
      {isAuthenticated ? <DeliveriesScreen /> : <LoginScreen />}
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
});
