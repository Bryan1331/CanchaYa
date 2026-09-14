import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  CheckCircle2,
  Phone,
  User,
  ShieldCheck,
  AlertCircle,
  Clock,
  Calendar,
} from 'lucide-react-native';
import { Cancha, HorarioSlot, Reserva } from '../types';
import { crearReserva } from '../services/reservaService';

interface CheckoutModalProps {
  visible: boolean;
  cancha: Cancha | null;
  horario: HorarioSlot | null;
  fechaSeleccionada: string;
  onClose: () => void;
  onConfirmReserva: (nuevaReserva: Omit<Reserva, 'id' | 'fechaCreacion'> & { id?: string }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  visible,
  cancha,
  horario,
  fechaSeleccionada,
  onClose,
  onConfirmReserva,
}) => {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!cancha || !horario) return null;

  const handleConfirmar = async () => {
    const nombreLimpio = nombre.trim();
    const telefonoLimpio = telefono.trim();

    if (!nombreLimpio) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu nombre completo.');
      return;
    }
    if (!telefonoLimpio) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu número de WhatsApp para confirmar tu turno.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // Registrar en Cloud Firestore vía reservaService
      const reservaCreada = await crearReserva({
        clienteNombre: nombreLimpio,
        clienteTelefono: telefonoLimpio,
        canchaNombre: cancha.nombre,
        fecha: fechaSeleccionada,
        horario: `${horario.horaInicio} - ${horario.horaFin}`,
        montoTotal: horario.precio,
        canchaId: cancha.id,
        tipoGrass: cancha.tipoGrass,
        formato: cancha.formato,
        metodoPago: 'efectivo',
      });

      // Notificar a la aplicación para actualizar la UI local
      onConfirmReserva({
        id: reservaCreada.id,
        canchaId: cancha.id,
        canchaNombre: cancha.nombre,
        tipoGrass: cancha.tipoGrass,
        formato: cancha.formato,
        clienteNombre: nombreLimpio,
        clienteTelefono: telefonoLimpio,
        fecha: fechaSeleccionada,
        horario: `${horario.horaInicio} - ${horario.horaFin}`,
        monto: horario.precio,
        metodoPago: 'efectivo',
        estado: 'pendiente',
      });

      // Limpiar y cerrar
      setNombre('');
      setTelefono('');
      setErrorMsg(null);
      onClose();
    } catch (error: any) {
      console.error('Error al registrar reserva en Firestore:', error);
      const msg = 'Hubo un problema al conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
      setErrorMsg(msg);
      Alert.alert('Error al apartar turno', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setErrorMsg(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Apartar Turno</Text>
              <Text style={styles.headerSubtitle}>Registro rápido en Cajamarca</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={loading}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Resumen del Turno */}
            <View style={styles.resumenCard}>
              <View style={styles.resumenHeader}>
                <Text style={styles.canchaNombre} numberOfLines={1}>
                  {cancha.nombre}
                </Text>
                <View style={styles.precioBadge}>
                  <Text style={styles.precioText}>S/ {horario.precio}.00</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.resumenDetailsRow}>
                <View style={styles.resumenDetailItem}>
                  <View style={styles.detailLabelRow}>
                    <Calendar size={12} color="#10b981" />
                    <Text style={styles.detailLabel}>Fecha</Text>
                  </View>
                  <Text style={styles.detailValue}>{fechaSeleccionada}</Text>
                </View>

                <View style={styles.resumenDetailItem}>
                  <View style={styles.detailLabelRow}>
                    <Clock size={12} color="#10b981" />
                    <Text style={styles.detailLabel}>Horario</Text>
                  </View>
                  <Text style={styles.detailValue}>{horario.horaInicio} - {horario.horaFin}</Text>
                </View>

                <View style={styles.resumenDetailItem}>
                  <Text style={styles.detailLabel}>Terreno</Text>
                  <Text style={styles.detailValueGrass}>
                    {cancha.tipoGrass === 'sintetico' ? 'Sintético' : 'Natural'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Captura de Datos Mínimos: Nombre y Teléfono */}
            <Text style={styles.sectionTitle}>Datos para la Reserva</Text>
            <Text style={styles.sectionSubtitle}>
              Ingresa tus datos para registrar el turno a tu nombre.
            </Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <User size={18} color="#10b981" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Nombre y Apellidos completos"
                placeholderTextColor="#64748b"
                value={nombre}
                editable={!loading}
                onChangeText={(text) => {
                  setNombre(text);
                  setErrorMsg(null);
                }}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <Phone size={18} color="#10b981" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Celular / WhatsApp (ej: 976543210)"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                value={telefono}
                editable={!loading}
                onChangeText={(text) => {
                  setTelefono(text);
                  setErrorMsg(null);
                }}
              />
            </View>

            {/* Mensaje de Error */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#f87171" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Nota Informativa */}
            <View style={styles.guaranteeBox}>
              <ShieldCheck size={16} color="#10b981" />
              <Text style={styles.guaranteeText}>
                Tu turno quedará registrado en estado pendiente y sincronizado con Cloud Firestore.
              </Text>
            </View>
          </ScrollView>

          {/* Botón de Confirmación */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
              onPress={handleConfirmar}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#0f172a" />
                  <Text style={styles.confirmBtnText}>Apartando Turno...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.confirmBtnText}>Confirmar y Apartar Turno</Text>
                  <CheckCircle2 size={20} color="#0f172a" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  resumenCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  resumenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  canchaNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
    flex: 1,
    marginRight: 10,
  },
  precioBadge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  precioText: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  resumenDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resumenDetailItem: {
    flex: 1,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  detailValueGrass: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#f8fafc',
    fontSize: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 12,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  guaranteeText: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  confirmBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
});
