/**
 * @module LoginScreen
 * @description Pantalla de inicio de sesión diseñada para repartidores.
 *              Incluye validaciones, manejo de carga, mensajes de error y credenciales de acceso rápido.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Bike, User, Lock, AlertCircle, LogIn, Info } from 'lucide-react-native';
import { THEME } from '../config/theme';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

export const LoginScreen = () => {
  const { login, isLoading, authError } = useAuth();

  const [username, setUsername] = useState('repartidor');
  const [password, setPassword] = useState('rep123');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async () => {
    if (!username.trim() || !password) {
      setLocalError('Por favor ingresa usuario y contraseña');
      return;
    }

    setLocalError('');
    try {
      await login(username, password);
    } catch (err) {
      // Error manejado en el contexto
    }
  };

  const errorMessage = localError || authError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.brandRed} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tarjeta de Inicio de Sesión */}
          <View style={styles.card}>
            {/* Encabezado y Marca */}
            <View style={styles.brandHeader}>
              <View style={styles.logoContainer}>
                <Bike size={36} color={THEME.colors.brandYellow} />
              </View>
              <Text style={styles.brandTitle}>Tacos &ldquo;El Tío&rdquo;</Text>
              <Text style={styles.appTitle}>Acceso de Repartidores</Text>
              <Text style={styles.appSubtitle}>
                Inicia sesión para gestionar tus rutas de entrega y pedidos asignados
              </Text>
            </View>

            {/* Mensaje de Error */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color={THEME.colors.error} style={styles.errorIcon} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Formulario */}
            <View style={styles.form}>
              <Input
                label="Nombre de Usuario"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (localError) setLocalError('');
                }}
                placeholder="repartidor"
                icon={User}
                autoCapitalize="none"
              />

              <Input
                label="Contraseña"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (localError) setLocalError('');
                }}
                placeholder="••••••••"
                secureTextEntry
                icon={Lock}
              />

              <Button
                title="Iniciar Turno"
                variant="primary"
                size="lg"
                icon={LogIn}
                isLoading={isLoading}
                onPress={handleSubmit}
                style={styles.submitButton}
              />
            </View>

            {/* Banner Informativo con Credenciales */}
            <View style={styles.demoCredentialsCard}>
              <Info size={16} color={THEME.colors.slate600} style={styles.infoIcon} />
              <View style={styles.demoTextWrapper}>
                <Text style={styles.demoTitle}>Credenciales de prueba:</Text>
                <Text style={styles.demoText}>Usuario: repartidor | Clave: rep123</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.brandRed,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: THEME.spacing.lg,
  },
  card: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: THEME.borderRadius.xl,
    backgroundColor: THEME.colors.brandRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.sm,
    shadowColor: THEME.colors.brandRed,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.slate900,
  },
  appTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.brandRed,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  appSubtitle: {
    fontSize: 12,
    color: THEME.colors.slate500,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.errorBg,
    borderWidth: 1,
    borderColor: THEME.colors.error,
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    marginBottom: THEME.spacing.md,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    fontSize: 12,
    color: THEME.colors.error,
    fontWeight: '600',
    flex: 1,
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: 6,
    width: '100%',
  },
  demoCredentialsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.slate50,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    marginTop: THEME.spacing.lg,
  },
  infoIcon: {
    marginRight: 8,
  },
  demoTextWrapper: {
    flex: 1,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.slate700,
  },
  demoText: {
    fontSize: 11,
    color: THEME.colors.slate500,
    marginTop: 1,
  },
});
