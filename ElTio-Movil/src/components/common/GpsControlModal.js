/**
 * @module GpsControlModal
 * @description Modal para que el repartidor pueda ver el estado de su GPS,
 *              reactivarlo o solicitar al administrador el apagado de su ubicación.
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  MapPin,
  Power,
  ShieldAlert,
  CheckCircle2,
  X,
  Send,
  Radio,
} from 'lucide-react-native';
import { THEME } from '../config/theme';
import { locationService } from '../services/locationService';

export const GpsControlModal = ({
  visible,
  onClose,
  token,
  trackingStatus,
  onStatusUpdated,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isTrackingEnabled = trackingStatus?.isTrackingEnabled !== false;
  const isRequestPending = Boolean(trackingStatus?.requestPending);

  const handleTurnOn = async () => {
    setSubmitting(true);
    try {
      const res = await locationService.turnOn(token);
      onStatusUpdated(res?.data || { isTrackingEnabled: true, requestPending: null });
      Alert.alert('GPS Activado', 'Tu ubicación en vivo está transmitiéndose nuevamente.');
      onClose();
    } catch (e) {
      Alert.alert('Error', 'No se pudo activar la ubicación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestTurnOff = async () => {
    if (!reason.trim()) {
      Alert.alert('Motivo requerido', 'Por favor escribe el motivo para apagar la ubicación (ej. fin de turno, descanso).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await locationService.requestTurnOff(token, reason.trim());
      onStatusUpdated(res?.data || { isTrackingEnabled: true, requestPending: { reason: reason.trim() } });
      Alert.alert(
        'Solicitud Enviada',
        'Se notificó al administrador en el panel web. La ubicación se apagará en cuanto sea aprobada.'
      );
      setReason('');
      onClose();
    } catch (e) {
      Alert.alert('Error', 'No se pudo enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Radio size={20} color={isTrackingEnabled ? '#16A34A' : '#DC2626'} />
              <Text style={styles.headerTitle}>Estado de Ubicación GPS</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={THEME.colors.slate600} />
            </TouchableOpacity>
          </View>

          {/* Cuerpo */}
          <View style={styles.body}>
            {/* Estado actual */}
            <View
              style={[
                styles.statusBadge,
                isTrackingEnabled
                  ? isRequestPending
                    ? styles.statusBadgePending
                    : styles.statusBadgeOn
                  : styles.statusBadgeOff,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isTrackingEnabled
                      ? isRequestPending
                        ? '#D97706'
                        : '#16A34A'
                      : '#DC2626',
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: isTrackingEnabled
                      ? isRequestPending
                        ? '#92400E'
                        : '#166534'
                      : '#991B1B',
                  },
                ]}
              >
                {isTrackingEnabled
                  ? isRequestPending
                    ? 'Solicitud de apagado enviada (Esperando admin)'
                    : 'GPS Activo (Transmitiendo en tiempo real)'
                  : 'GPS Apagado (Aprobado por administración)'}
              </Text>
            </View>

            {/* Caso 1: GPS apagado -> Opción de reactivar directo */}
            {!isTrackingEnabled && (
              <View style={styles.turnOnBox}>
                <Text style={styles.hintText}>
                  Tu ubicación está apagada. Puedes reactivarla cuando comiences nuevas entregas.
                </Text>
                <TouchableOpacity
                  onPress={handleTurnOn}
                  disabled={submitting}
                  style={styles.turnOnBtn}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Power size={16} color="#ffffff" />
                      <Text style={styles.turnOnBtnText}>Encender Ubicación</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Caso 2: GPS encendido con solicitud pendiente */}
            {isTrackingEnabled && isRequestPending && (
              <View style={styles.pendingBox}>
                <ShieldAlert size={18} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingTitle}>Pendiente de Aprobación</Text>
                  <Text style={styles.pendingBody}>
                    El administrador debe aceptar tu solicitud desde el panel web de la sucursal.
                  </Text>
                </View>
              </View>
            )}

            {/* Caso 3: GPS encendido -> Formulario para solicitar apagado */}
            {isTrackingEnabled && !isRequestPending && (
              <View style={styles.requestForm}>
                <Text style={styles.inputLabel}>
                  ¿Deseas apagar tu ubicación? (Requiere autorización)
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Escribe el motivo (ej. Fin de jornada, descanso para comer...)"
                  placeholderTextColor={THEME.colors.slate400}
                  value={reason}
                  onChangeText={setReason}
                  multiline={true}
                  numberOfLines={2}
                  textAlignVertical="top"
                  editable={!submitting}
                />
                <TouchableOpacity
                  onPress={handleRequestTurnOff}
                  disabled={submitting}
                  style={styles.requestBtn}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Send size={14} color="#ffffff" />
                      <Text style={styles.requestBtnText}>Solicitar Apagado a Administración</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.xl,
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.slate200,
    backgroundColor: THEME.colors.slate50,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.slate900,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    marginBottom: 14,
  },
  statusBadgeOn: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  statusBadgeOff: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  turnOnBox: {
    alignItems: 'center',
    gap: 12,
  },
  hintText: {
    fontSize: 12,
    color: THEME.colors.slate600,
    textAlign: 'center',
    lineHeight: 16,
  },
  turnOnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    width: '100%',
    justifyContent: 'center',
  },
  turnOnBtnText: {
    color: THEME.colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  pendingBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  pendingTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  pendingBody: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  requestForm: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.slate800,
  },
  textInput: {
    backgroundColor: THEME.colors.slate50,
    borderWidth: 1,
    borderColor: THEME.colors.slate300,
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    fontSize: 12,
    color: THEME.colors.slate900,
    minHeight: 60,
  },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: THEME.colors.brandRed,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    marginTop: 4,
  },
  requestBtnText: {
    color: THEME.colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
