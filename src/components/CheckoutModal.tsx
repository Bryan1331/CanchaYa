import React, { useState, useEffect } from 'react';
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
  Image,
  Linking,
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
  Camera,
  ImageIcon,
  Sparkles,
  Trash2,
  CreditCard,
  Building,
  DollarSign,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Cancha, HorarioSlot, Reserva, UsuarioCliente, MetodoPago } from '../types';
import { crearReserva } from '../services/reservaService';
import { calcularTarifaDinamica } from '../utils/pricing';

interface CheckoutModalProps {
  visible: boolean;
  cancha: Cancha | null;
  horario: HorarioSlot | null;
  fechaSeleccionada: string;
  usuarioCliente?: UsuarioCliente | null;
  onClose: () => void;
  onConfirmReserva: (nuevaReserva: Omit<Reserva, 'id' | 'fechaCreacion'> & { id?: string }) => void;
}

const MOCK_VOUCHER_DEMO =
  'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?auto=format&fit=crop&w=600&q=80';

const NUMERO_RECEPCION_WHATSAPP = '51999888777'; // Número de recepción en Cajamarca

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  visible,
  cancha,
  horario,
  fechaSeleccionada,
  usuarioCliente,
  onClose,
  onConfirmReserva,
}) => {
  const [nombre, setNombre] = useState(usuarioCliente?.nombre || '');
  const [telefono, setTelefono] = useState(usuarioCliente?.telefono || '');
  const [email, setEmail] = useState(usuarioCliente?.email || '');
  const [dni, setDni] = useState(usuarioCliente?.dni || '');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('yape');
  const [comprobanteUri, setComprobanteUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sincronizar datos si el usuarioCliente cambia o inicia sesión
  useEffect(() => {
    if (usuarioCliente) {
      setNombre(usuarioCliente.nombre || '');
      setTelefono(usuarioCliente.telefono || '');
      setEmail(usuarioCliente.email || '');
      setDni(usuarioCliente.dni || '');
    }
  }, [usuarioCliente, visible]);

  if (!cancha || !horario) return null;

  // [US-16] Cálculo de Dynamic Pricing para el horario y fecha elegida
  const tarifaInfo = calcularTarifaDinamica(cancha, horario, fechaSeleccionada);

  // Selección de foto desde Galería
  const handleSeleccionarGaleria = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permiso Requerido',
          'Se necesita acceso a la galería para adjuntar tu captura de Yape/Plin.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setComprobanteUri(result.assets[0].uri);
        setErrorMsg(null);
      }
    } catch (err) {
      console.warn('Error al abrir galería, usando comprobante demo:', err);
      setComprobanteUri(MOCK_VOUCHER_DEMO);
    }
  };

  // Selección de foto con Cámara
  const handleTomarFoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permiso Requerido', 'Se necesita acceso a la cámara para tomar la foto del voucher.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setComprobanteUri(result.assets[0].uri);
        setErrorMsg(null);
      }
    } catch (err) {
      console.warn('Error al abrir cámara, usando comprobante demo:', err);
      setComprobanteUri(MOCK_VOUCHER_DEMO);
    }
  };

  const handleUsarComprobanteDemo = () => {
    setComprobanteUri(MOCK_VOUCHER_DEMO);
    setErrorMsg(null);
  };

  const handleConfirmar = async () => {
    const nombreLimpio = nombre.trim();
    const telefonoLimpio = telefono.trim();

    if (!nombreLimpio) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu nombre completo.');
      return;
    }

    if (!telefonoLimpio.startsWith('9') || telefonoLimpio.length !== 9) {
      Alert.alert(
        'Celular inválido',
        'Por favor ingresa un número de celular/WhatsApp válido de 9 dígitos.'
      );
      return;
    }

    if (!comprobanteUri) {
      Alert.alert(
        'Comprobante requerido',
        'Por favor adjunta la captura de tu pago o comprobante de Yape/Plin (o pulsa "Usar Voucher Demo").'
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const comprobanteFinal = comprobanteUri || MOCK_VOUCHER_DEMO;

    try {
      // 1. Registrar en Cloud Firestore vía reservaService con estado 'pendiente_validacion'
      const reservaCreada = await crearReserva({
        clienteNombre: nombreLimpio,
        clienteTelefono: telefonoLimpio,
        clienteEmail: email.trim(),
        clienteDni: dni.trim(),
        canchaNombre: cancha.nombre,
        fecha: fechaSeleccionada,
        horario: `${horario.horaInicio} - ${horario.horaFin}`,
        montoTotal: tarifaInfo.precioTotal,
        canchaId: cancha.id,
        tipoGrass: cancha.tipoGrass,
        formato: cancha.formato,
        metodoPago: metodoPago,
        estado: 'pendiente_validacion',
        comprobanteUrl: comprobanteFinal,
        origen: 'web',
      });

      // 2. Notificar al estado central de la app con los montos dinámicos
      onConfirmReserva({
        id: reservaCreada.id,
        localId: cancha.localId ?? cancha.id,
        canchaId: cancha.id,
        canchaNombre: cancha.nombre,
        tipoGrass: cancha.tipoGrass,
        formato: cancha.formato,
        clienteNombre: nombreLimpio,
        clienteTelefono: telefonoLimpio,
        clienteEmail: email.trim(),
        clienteDni: dni.trim(),
        fecha: fechaSeleccionada,
        horario: `${horario.horaInicio} - ${horario.horaFin}`,
        monto: tarifaInfo.precioTotal,
        montoTotal: tarifaInfo.precioTotal,
        montoAdelanto: tarifaInfo.montoAdelanto,
        saldoPendiente: tarifaInfo.saldoPendiente,
        metodoPago: metodoPago,
        estado: 'pendiente_validacion',
        comprobanteUrl: comprobanteFinal,
        origen: 'web',
      });

      // 3. Enviar mensaje formateado a WhatsApp de recepción con desglose de adelanto y saldo
      const mensajeWhatsApp =
        `*¡Hola Recepción CanchaYa Cajamarca!* ⚽🔥\n` +
        `Acabo de registrar una reserva con comprobante adjunto:\n\n` +
        `🏟️ *Cancha:* ${cancha.nombre}\n` +
        `🏢 *Local:* ${cancha.establecimiento || cancha.localNombre}\n` +
        `📍 *Sector:* ${cancha.direccion || cancha.sector}\n` +
        `📅 *Fecha:* ${fechaSeleccionada}\n` +
        `🕒 *Horario:* ${horario.horaInicio} - ${horario.horaFin}\n` +
        `⚡ *Tarifa Aplicada:* ${tarifaInfo.etiquetaTarifa}\n` +
        `💰 *Monto Total del Turno:* S/ ${tarifaInfo.precioTotal}.00\n` +
        `💵 *Adelanto Validado (50%):* S/ ${tarifaInfo.montoAdelanto}.00\n` +
        `📌 *Saldo a Pagar en Cancha:* S/ ${tarifaInfo.saldoPendiente}.00\n` +
        `👤 *Cliente:* ${nombreLimpio}\n` +
        `📱 *Celular:* ${telefonoLimpio}\n` +
        `💳 *Método:* ${metodoPago.toUpperCase()}\n` +
        `📋 *Estado:* Pendiente de Validación\n\n` +
        `Adjunto mi captura para la confirmación de la cancha. ¡Gracias!`;

      const whatsappUrl = `https://wa.me/${NUMERO_RECEPCION_WHATSAPP}?text=${encodeURIComponent(
        mensajeWhatsApp
      )}`;

      try {
        await Linking.openURL(whatsappUrl);
      } catch (linkError) {
        console.warn('No se pudo abrir WhatsApp automáticamente:', linkError);
      }

      // Limpiar y cerrar
      setComprobanteUri(null);
      setErrorMsg(null);
      onClose();
    } catch (error: any) {
      console.error('Error al registrar reserva:', error);
      const msg =
        'Hubo un problema al conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
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
              <Text style={styles.headerTitle}>Apartar Turno & Pago</Text>
              <Text style={styles.headerSubtitle}>Valida tu pichanga en Cajamarca</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={loading}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* [US-16] Resumen del Turno con Tarifas Dinámicas */}
            <View style={styles.resumenCard}>
              <View style={styles.resumenHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.canchaNombre} numberOfLines={1}>
                    {cancha.nombre}
                  </Text>
                  <Text style={styles.canchaLocalNombre}>{cancha.establecimiento || cancha.localNombre}</Text>
                </View>
                <View style={styles.precioBadge}>
                  <Text style={styles.precioTotalLabel}>TOTAL</Text>
                  <Text style={styles.precioText}>S/ {tarifaInfo.precioTotal}.00</Text>
                </View>
              </View>

              {/* Tag de Tarifa Dinámica */}
              <View style={styles.tagTarifaBox}>
                <Sparkles size={12} color="#10b981" />
                <Text style={styles.tagTarifaText}>{tarifaInfo.etiquetaTarifa}</Text>
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
                  <Text style={styles.detailValue}>
                    {horario.horaInicio} - {horario.horaFin}
                  </Text>
                </View>

                <View style={styles.resumenDetailItem}>
                  <Text style={styles.detailLabel}>Terreno</Text>
                  <Text style={styles.detailValueGrass}>
                    {cancha.tipoGrass === 'sintetico' ? '🌱 Sintético' : '🌾 Natural'}
                  </Text>
                </View>
              </View>

              {/* Desglose de Adelanto (50%) vs Saldo en Cancha [US-16] */}
              <View style={styles.adelantoBanner}>
                <View style={styles.adelantoBannerCol}>
                  <Text style={styles.adelantoBannerLabel}>Adelanto Requerido (50%):</Text>
                  <Text style={styles.adelantoBannerValueHighlight}>
                    S/ {tarifaInfo.montoAdelanto}.00
                  </Text>
                </View>
                <View style={styles.adelantoBannerCol}>
                  <Text style={styles.adelantoBannerLabel}>Saldo a pagar en Cancha:</Text>
                  <Text style={styles.adelantoBannerValue}>S/ {tarifaInfo.saldoPendiente}.00</Text>
                </View>
              </View>
            </View>

            {/* SECCIÓN [US-09]: PAGO DE ADELANTO POR YAPE / PLIN */}
            <Text style={styles.sectionTitle}>1. Pago de Adelanto (Yape / Plin)</Text>
            <Text style={styles.sectionSubtitle}>
              Transfiere únicamente el adelanto de{' '}
              <Text style={{ color: '#34d399', fontWeight: '800' }}>
                S/ {tarifaInfo.montoAdelanto}.00
              </Text>{' '}
              a la cuenta oficial del complejo.
            </Text>

            {/* Selector de Método */}
            <View style={styles.metodosRow}>
              <TouchableOpacity
                style={[styles.metodoCard, metodoPago === 'yape' && styles.metodoCardActiveYape]}
                onPress={() => setMetodoPago('yape')}
              >
                <View style={[styles.metodoIconCircle, { backgroundColor: '#701a75' }]}>
                  <Text style={styles.metodoIconText}>🟣</Text>
                </View>
                <Text style={styles.metodoTitle}>YAPE</Text>
                <Text style={styles.metodoPhone}>976 543 210</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.metodoCard, metodoPago === 'plin' && styles.metodoCardActivePlin]}
                onPress={() => setMetodoPago('plin')}
              >
                <View style={[styles.metodoIconCircle, { backgroundColor: '#0284c7' }]}>
                  <Text style={styles.metodoIconText}>🔵</Text>
                </View>
                <Text style={styles.metodoTitle}>PLIN</Text>
                <Text style={styles.metodoPhone}>976 543 210</Text>
              </TouchableOpacity>
            </View>

            {/* Tarjeta Visual de Pago / QR Fija */}
            <View style={styles.paymentInfoCard}>
              <View style={styles.paymentInfoTop}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <View
                      style={[
                        styles.metodoPillSmall,
                        { backgroundColor: metodoPago === 'yape' ? '#701a75' : '#0284c7' },
                      ]}
                    >
                      <Text style={styles.metodoPillSmallText}>{metodoPago.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.montoLabelMini}>Adelanto a pagar ahora:</Text>
                  </View>
                  <Text style={styles.montoDestacadoText}>S/ {tarifaInfo.montoAdelanto}.00</Text>
                  <Text style={styles.paymentInfoTitular}>Titular: {cancha.establecimiento || cancha.localNombre}</Text>
                  <Text style={styles.paymentInfoNumero}>
                    Número oficial: <Text style={{ color: '#34d399', fontWeight: '800' }}>976 543 210</Text>
                  </Text>
                </View>
                <View style={styles.qrImageContainer}>
                  <Image
                    source={{
                      uri:
                        metodoPago === 'yape'
                          ? 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=YAPE_CANCHAYA_976543210'
                          : 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=PLIN_CANCHAYA_976543210',
                    }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.qrCaptionText}>QR Oficial</Text>
                </View>
              </View>
              <Text style={styles.paymentInfoHint}>
                ⚡ Paga el adelanto desde tu app de {metodoPago.toUpperCase()} y adjunta el comprobante.
              </Text>
            </View>

            {/* Adjuntar Comprobante */}
            <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
              2. Adjuntar Comprobante de Pago *
            </Text>

            {comprobanteUri ? (
              <View style={styles.voucherPreviewContainer}>
                <Image source={{ uri: comprobanteUri }} style={styles.voucherPreviewImage} />
                <View style={styles.voucherPreviewInfo}>
                  <Text style={styles.voucherAttachedTitle}>✅ Comprobante adjuntado</Text>
                  <Text style={styles.voucherAttachedSubtitle}>Listo para validación</Text>
                  <TouchableOpacity
                    style={styles.removeVoucherBtn}
                    onPress={() => setComprobanteUri(null)}
                  >
                    <Trash2 size={13} color="#ef4444" />
                    <Text style={styles.removeVoucherText}>Cambiar imagen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.voucherPickerRow}>
                <TouchableOpacity
                  style={styles.voucherOptionBtn}
                  onPress={handleSeleccionarGaleria}
                >
                  <ImageIcon size={18} color="#10b981" />
                  <Text style={styles.voucherOptionText}>Galería</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.voucherOptionBtn} onPress={handleTomarFoto}>
                  <Camera size={18} color="#10b981" />
                  <Text style={styles.voucherOptionText}>Cámara</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.voucherOptionBtn, styles.voucherOptionDemoBtn]}
                  onPress={handleUsarComprobanteDemo}
                >
                  <Sparkles size={16} color="#38bdf8" />
                  <Text style={[styles.voucherOptionText, { color: '#38bdf8' }]}>Voucher Demo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* SECCIÓN [US-04]: DATOS DEL JUGADOR */}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>3. Datos del Jugador</Text>
            <Text style={styles.sectionSubtitle}>
              Tus datos para registrar la reserva a tu nombre.
            </Text>

            <View style={styles.inputGroup}>
              <User size={16} color="#10b981" style={styles.inputIcon} />
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
              <Phone size={16} color="#10b981" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Celular / WhatsApp (ej: 976543210)"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                maxLength={9}
                value={telefono}
                editable={!loading}
                onChangeText={(text) => {
                  setTelefono(text);
                  setErrorMsg(null);
                }}
              />
            </View>

            {dni ? (
              <View style={styles.inputGroup}>
                <CreditCard size={16} color="#10b981" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="DNI"
                  placeholderTextColor="#64748b"
                  value={dni}
                  editable={!loading}
                  onChangeText={setDni}
                />
              </View>
            ) : null}

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
                Tu turno se aparta con el 50% de adelanto. El saldo de S/ {tarifaInfo.saldoPendiente}.00 se cancela en la recepción del local.
              </Text>
            </View>

            <View style={{ height: 20 }} />
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
                  <Text style={styles.confirmBtnText}>Procesando Reserva...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.confirmBtnText}>
                    Confirmar Adelanto (S/ {tarifaInfo.montoAdelanto})
                  </Text>
                  <CheckCircle2 size={18} color="#0f172a" />
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
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
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
    fontWeight: '800',
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
  },
  resumenCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resumenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  canchaNombre: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  canchaLocalNombre: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
    marginTop: 2,
  },
  precioBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  precioTotalLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
  },
  precioText: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '900',
  },
  tagTarifaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  tagTarifaText: {
    color: '#34d399',
    fontSize: 11,
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
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  detailValueGrass: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },
  adelantoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  adelantoBannerCol: {
    flex: 1,
  },
  adelantoBannerLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 2,
  },
  adelantoBannerValueHighlight: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '900',
  },
  adelantoBannerValue: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 10,
    lineHeight: 16,
  },
  metodosRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metodoCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
  },
  metodoCardActiveYape: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(112, 26, 117, 0.2)',
  },
  metodoCardActivePlin: {
    borderColor: '#0284c7',
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
  },
  metodoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  metodoIconText: {
    fontSize: 14,
  },
  metodoTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metodoPhone: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  paymentInfoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 6,
  },
  paymentInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metodoPillSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metodoPillSmallText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  montoLabelMini: {
    color: '#94a3b8',
    fontSize: 11,
  },
  montoDestacadoText: {
    color: '#34d399',
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 4,
  },
  paymentInfoTitular: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  paymentInfoNumero: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  qrImageContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 6,
    borderRadius: 12,
  },
  qrImage: {
    width: 75,
    height: 75,
  },
  qrCaptionText: {
    color: '#090d16',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  paymentInfoHint: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 10,
    fontStyle: 'italic',
  },
  voucherPickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  voucherOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  voucherOptionDemoBtn: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  voucherOptionText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  voucherPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#10b981',
    gap: 12,
  },
  voucherPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#0f172a',
  },
  voucherPreviewInfo: {
    flex: 1,
  },
  voucherAttachedTitle: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '800',
  },
  voucherAttachedSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  removeVoucherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  removeVoucherText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 13,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    flex: 1,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  guaranteeText: {
    color: '#94a3b8',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 16,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#090d16',
    fontSize: 14,
    fontWeight: '900',
  },
});