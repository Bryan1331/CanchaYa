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
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import {
  X,
  CheckCircle2,
  QrCode,
  Upload,
  Copy,
  CreditCard,
  Phone,
  User,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import { Cancha, HorarioSlot, MetodoPago, Reserva } from '../types';

interface CheckoutModalProps {
  visible: boolean;
  cancha: Cancha | null;
  horario: HorarioSlot | null;
  fechaSeleccionada: string;
  onClose: () => void;
  onConfirmReserva: (nuevaReserva: Omit<Reserva, 'id' | 'fechaCreacion'>) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  visible,
  cancha,
  horario,
  fechaSeleccionada,
  onClose,
  onConfirmReserva,
}) => {
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('yape');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [codigoOperacion, setCodigoOperacion] = useState('');
  const [comprobanteSubido, setComprobanteSubido] = useState(false);
  const [copiado, setCopiado] = useState(false);

  if (!cancha || !horario) return null;

  const handleCopiarNumero = () => {
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleSimularSubida = () => {
    setComprobanteSubido(true);
    if (!codigoOperacion) {
      const randomOp = `${metodoPago.toUpperCase().slice(0, 2)}-${Math.floor(100000 + Math.random() * 900000)}`;
      setCodigoOperacion(randomOp);
    }
  };

  const handleConfirmar = () => {
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu nombre completo.');
      return;
    }
    if (!telefono.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu número de WhatsApp para enviarte la confirmación.');
      return;
    }

    onConfirmReserva({
      canchaId: cancha.id,
      canchaNombre: cancha.nombre,
      tipoGrass: cancha.tipoGrass,
      formato: cancha.formato,
      clienteNombre: nombre.trim(),
      clienteTelefono: telefono.trim(),
      fecha: fechaSeleccionada,
      horario: `${horario.horaInicio} - ${horario.horaFin}`,
      monto: horario.precio,
      metodoPago: metodoPago,
      estado: 'pendiente',
      codigoOperacion: codigoOperacion.trim() || `OP-${Math.floor(100000 + Math.random() * 900000)}`,
      comprobanteUrl: comprobanteSubido ? 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80' : undefined,
      adicionales: {
        balonExtra: true,
        juegoChalecos: true,
      },
    });

    // Reset fields
    setNombre('');
    setTelefono('');
    setCodigoOperacion('');
    setComprobanteSubido(false);
    onClose();
  };

  const numeroYapePlin = '976 543 210';
  const titularCuenta = 'CanchaYA Cajamarca Deportes S.A.C.';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Confirmar Reserva de Cancha</Text>
              <Text style={styles.headerSubtitle}>Pichanga en Cajamarca • Paso final</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Resumen Card */}
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
                  <Text style={styles.detailLabel}>Fecha</Text>
                  <Text style={styles.detailValue}>{fechaSeleccionada}</Text>
                </View>
                <View style={styles.resumenDetailItem}>
                  <Text style={styles.detailLabel}>Horario</Text>
                  <Text style={styles.detailValue}>{horario.horaInicio} - {horario.horaFin}</Text>
                </View>
                <View style={styles.resumenDetailItem}>
                  <Text style={styles.detailLabel}>Terreno</Text>
                  <Text style={styles.detailValueCapitalized}>
                    {cancha.tipoGrass === 'sintetico' ? 'Grass Sintético' : 'Grass Natural'}
                  </Text>
                </View>
              </View>

              <View style={styles.includedInCard}>
                <Text style={styles.includedInCardText}>
                  ⚽ Incluye: Balón reglamentario, chalecos y duchas con agua caliente
                </Text>
              </View>
            </View>

            {/* Datos de contacto */}
            <Text style={styles.sectionTitle}>Datos del Capitán / Organizador</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <User size={18} color="#10b981" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Nombre y Apellidos completos"
                placeholderTextColor="#64748b"
                value={nombre}
                onChangeText={setNombre}
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
                onChangeText={setTelefono}
              />
            </View>

            {/* Selector de Método de Pago */}
            <Text style={styles.sectionTitle}>Método de Pago</Text>
            <View style={styles.metodosContainer}>
              <TouchableOpacity
                style={[styles.metodoBtn, metodoPago === 'yape' && styles.metodoBtnActiveYape]}
                onPress={() => setMetodoPago('yape')}
              >
                <View style={[styles.metodoDot, { backgroundColor: '#7b1fa2' }]} />
                <Text style={[styles.metodoText, metodoPago === 'yape' && styles.metodoTextActive]}>
                  Yape
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.metodoBtn, metodoPago === 'plin' && styles.metodoBtnActivePlin]}
                onPress={() => setMetodoPago('plin')}
              >
                <View style={[styles.metodoDot, { backgroundColor: '#00b0ff' }]} />
                <Text style={[styles.metodoText, metodoPago === 'plin' && styles.metodoTextActive]}>
                  Plin
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.metodoBtn, metodoPago === 'transferencia' && styles.metodoBtnActiveTransf]}
                onPress={() => setMetodoPago('transferencia')}
              >
                <CreditCard size={14} color={metodoPago === 'transferencia' ? '#10b981' : '#94a3b8'} />
                <Text style={[styles.metodoText, metodoPago === 'transferencia' && styles.metodoTextActive]}>
                  Transferencia
                </Text>
              </TouchableOpacity>
            </View>

            {/* Caja de Pago QR / Cuentas */}
            <View style={styles.paymentBox}>
              <View style={styles.paymentHeader}>
                <QrCode size={20} color={metodoPago === 'yape' ? '#c084fc' : metodoPago === 'plin' ? '#38bdf8' : '#34d399'} />
                <Text style={styles.paymentTitle}>
                  {metodoPago === 'yape' ? 'Paga con Yape' : metodoPago === 'plin' ? 'Paga con Plin' : 'Transferencia BCP / BBVA / Caja Cajamarca'}
                </Text>
              </View>

              {/* QR Code Simulado con SVG */}
              <View style={styles.qrContainer}>
                <View style={styles.qrWrapper}>
                  <Svg width={120} height={120} viewBox="0 0 130 130">
                    <Rect width="130" height="130" fill="#ffffff" rx={8} />
                    <Rect x="15" y="15" width="30" height="30" fill="#0f172a" />
                    <Rect x="20" y="20" width="20" height="20" fill="#ffffff" />
                    <Rect x="25" y="25" width="10" height="10" fill="#0f172a" />

                    <Rect x="85" y="15" width="30" height="30" fill="#0f172a" />
                    <Rect x="90" y="20" width="20" height="20" fill="#ffffff" />
                    <Rect x="95" y="25" width="10" height="10" fill="#0f172a" />

                    <Rect x="15" y="85" width="30" height="30" fill="#0f172a" />
                    <Rect x="20" y="90" width="20" height="20" fill="#ffffff" />
                    <Rect x="25" y="95" width="10" height="10" fill="#0f172a" />

                    <Rect x="55" y="20" width="8" height="8" fill="#0f172a" />
                    <Rect x="68" y="20" width="8" height="8" fill="#0f172a" />
                    <Rect x="55" y="35" width="18" height="8" fill="#0f172a" />
                    <Rect x="20" y="55" width="10" height="10" fill="#0f172a" />
                    <Rect x="35" y="60" width="8" height="15" fill="#0f172a" />
                    <Rect x="50" y="55" width="30" height="20" fill={metodoPago === 'yape' ? '#7b1fa2' : metodoPago === 'plin' ? '#0284c7' : '#059669'} />
                    <Rect x="90" y="55" width="12" height="10" fill="#0f172a" />
                    <Rect x="105" y="68" width="10" height="10" fill="#0f172a" />
                    <Rect x="55" y="85" width="15" height="10" fill="#0f172a" />
                    <Rect x="75" y="85" width="15" height="25" fill="#0f172a" />
                    <Rect x="95" y="95" width="20" height="15" fill="#0f172a" />
                    <Rect x="55" y="102" width="12" height="12" fill="#0f172a" />
                  </Svg>
                  <View style={styles.qrLogoBadge}>
                    <Zap size={14} color="#ffffff" />
                  </View>
                </View>

                <View style={styles.qrInfo}>
                  <Text style={styles.qrInfoTitle}>{titularCuenta}</Text>
                  <Text style={styles.qrInfoNumber}>{numeroYapePlin}</Text>
                  <TouchableOpacity style={styles.copyBtn} onPress={handleCopiarNumero}>
                    <Copy size={13} color="#10b981" />
                    <Text style={styles.copyBtnText}>
                      {copiado ? '¡Número copiado!' : 'Copiar número'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.qrMontoAlert}>Monto: S/ {horario.precio}.00</Text>
                </View>
              </View>

              {/* Subir Comprobante / Nro Operación */}
              <View style={styles.voucherSection}>
                <Text style={styles.voucherLabel}>Validación de Pago (Comprobante / Captura):</Text>
                
                <TouchableOpacity
                  style={[styles.uploadBtn, comprobanteSubido && styles.uploadBtnSuccess]}
                  onPress={handleSimularSubida}
                >
                  {comprobanteSubido ? (
                    <>
                      <CheckCircle2 size={18} color="#10b981" />
                      <Text style={styles.uploadBtnTextSuccess}>Voucher adjuntado con éxito ✓</Text>
                    </>
                  ) : (
                    <>
                      <Upload size={18} color="#94a3b8" />
                      <Text style={styles.uploadBtnText}>Subir foto de Voucher / Captura Yape</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TextInput
                  style={styles.operacionInput}
                  placeholder="N° de Operación (opcional si subes captura)"
                  placeholderTextColor="#64748b"
                  value={codigoOperacion}
                  onChangeText={setCodigoOperacion}
                />
              </View>
            </View>

            <View style={styles.guaranteeBox}>
              <ShieldCheck size={16} color="#10b981" />
              <Text style={styles.guaranteeText}>
                La cancha queda reservada por 15 minutos mientras recepción valida el abono en Cajamarca.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmar}>
              <Text style={styles.confirmBtnText}>Confirmar y Reservar Cancha</Text>
              <CheckCircle2 size={20} color="#0f172a" />
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
    maxHeight: '92%',
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
    marginBottom: 18,
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
    marginBottom: 10,
  },
  resumenDetailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  detailValueCapitalized: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  includedInCard: {
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  includedInCardText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 10,
    marginTop: 4,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 46,
    color: '#f8fafc',
    fontSize: 14,
  },
  metodosContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  metodoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metodoBtnActiveYape: {
    borderColor: '#a855f7',
    backgroundColor: '#3b0764',
  },
  metodoBtnActivePlin: {
    borderColor: '#38bdf8',
    backgroundColor: '#075985',
  },
  metodoBtnActiveTransf: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b',
  },
  metodoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  metodoText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  metodoTextActive: {
    color: '#f8fafc',
  },
  paymentBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  qrContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  qrWrapper: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  qrLogoBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  qrInfo: {
    flex: 1,
  },
  qrInfoTitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2,
  },
  qrInfoNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
  },
  copyBtnText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  qrMontoAlert: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34d399',
    marginTop: 6,
  },
  voucherSection: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  voucherLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 8,
    fontWeight: '500',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#475569',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 10,
  },
  uploadBtnSuccess: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderStyle: 'solid',
  },
  uploadBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  uploadBtnTextSuccess: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '600',
  },
  operacionInput: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 42,
    color: '#f8fafc',
    fontSize: 13,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
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
  confirmBtnText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
});
