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
  QrCode,
  Sparkles,
  Trash2,
  CreditCard,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Cancha, HorarioSlot, Reserva, UsuarioCliente, MetodoPago } from '../types';
import { crearReserva } from '../services/reservaService';

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

const NUMERO_RECEPCION_WHATSAPP = '51999888777'; // Número ficticio de pruebas (US-09)

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
        montoTotal: horario.precio,
        canchaId: cancha.id,
        tipoGrass: cancha.tipoGrass,
        formato: cancha.formato,
        metodoPago: metodoPago,
        estado: 'pendiente_validacion',
        comprobanteUrl: comprobanteFinal,
        origen: 'web',
      });

      // 2. Notificar al estado central de la app
      onConfirmReserva({
        id: reservaCreada.id,
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
        monto: horario.precio,
        metodoPago: metodoPago,
        estado: 'pendiente_validacion',
        comprobanteUrl: comprobanteFinal,
        origen: 'web',
      });

      // 3. Enviar mensaje formateado a WhatsApp de recepción
      const mensajeWhatsApp =
        `*¡Hola Recepción CanchaYa Cajamarca!* ⚽🔥\n` +
        `Acabo de registrar una reserva con comprobante adjunto:\n\n` +
        `🏟️ *Cancha:* ${cancha.nombre}\n` +
        `📍 *Sector:* ${cancha.sector}\n` +
        `📅 *Fecha:* ${fechaSeleccionada}\n` +
        `🕒 *Horario:* ${horario.horaInicio} - ${horario.horaFin}\n` +
        `💰 *Monto Total:* S/ ${horario.precio}.00\n` +
        `👤 *Cliente:* ${nombreLimpio}\n` +
        `📱 *Celular:* ${telefonoLimpio}\n` +
        `💳 *Método:* ${metodoPago.toUpperCase()}\n` +
        `📋 *Estado:* Pendiente de Validación\n\n` +
        `Por favor validar el comprobante para confirmar mi turno. ¡Muchas gracias!`;

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
            </View>

            {/* SECCIÓN [US-09]: PAGO POR YAPE / PLIN Y COMPROBANTE */}
            <Text style={styles.sectionTitle}>1. Pago de Adelanto (Yape / Plin)</Text>
            <Text style={styles.sectionSubtitle}>
              Monto a pagar: <Text style={{ color: '#34d399', fontWeight: '700' }}>S/ {horario.precio}.00</Text> a la cuenta oficial del local.
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
                    <Text style={styles.montoLabelMini}>Monto a transferir:</Text>
                  </View>
                  <Text style={styles.montoDestacadoText}>S/ {horario.precio}.00</Text>
                  <Text style={styles.paymentInfoTitular}>Titular: CanchaYa Cajamarca S.A.C.</Text>
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
                ⚡ Paga desde tu app de {metodoPago.toUpperCase()} y toma captura al comprobante.
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
                Tu reserva se registrará en estado <Text style={{ color: '#fbbf24', fontWeight: '700' }}>Pendiente de Validación</Text> y se abrirá WhatsApp con el mensaje preformateado para recepción.
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
                  <Text style={styles.confirmBtnText}>Confirmar & Enviar por WhatsApp</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
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
    paddingTop: 14,
  },
  resumenCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
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
    marginVertical: 10,
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
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  detailValueGrass: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 10,
  },
  metodosRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  metodoCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
  },
  metodoCardActiveYape: {
    borderColor: '#d946ef',
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
  },
  metodoCardActivePlin: {
    borderColor: '#0284c7',
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  metodoIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  metodoIconText: {
    fontSize: 14,
  },
  metodoTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  metodoPhone: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  paymentInfoCard: {
    backgroundColor: '#090d16',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
  },
  paymentInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentInfoTitular: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  paymentInfoNumero: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  metodoPillSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metodoPillSmallText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  montoLabelMini: {
    color: '#94a3b8',
    fontSize: 11,
  },
  montoDestacadoText: {
    color: '#34d399',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  qrImageContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrImage: {
    width: 72,
    height: 72,
  },
  qrCaptionText: {
    color: '#090d16',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  paymentInfoHint: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 6,
  },
  voucherPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  voucherOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  voucherOptionDemoBtn: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  voucherOptionText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  voucherPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#10b981',
    marginBottom: 10,
    gap: 12,
  },
  voucherPreviewImage: {
    width: 60,
    height: 75,
    borderRadius: 8,
    backgroundColor: '#090d16',
  },
  voucherPreviewInfo: {
    flex: 1,
  },
  voucherAttachedTitle: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '700',
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
    marginTop: 8,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 46,
    color: '#f8fafc',
    fontSize: 13,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 10,
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
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
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
    gap: 8,
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
    fontSize: 15,
    fontWeight: '800',
  },
});