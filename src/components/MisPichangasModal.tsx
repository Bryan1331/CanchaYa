import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  User,
  LogOut,
} from 'lucide-react-native';
import { Reserva, UsuarioCliente } from '../types';

interface MisPichangasModalProps {
  visible: boolean;
  onClose: () => void;
  usuarioCliente: UsuarioCliente | null;
  reservas: Reserva[];
  onLogout?: () => void;
}

export const MisPichangasModal: React.FC<MisPichangasModalProps> = ({
  visible,
  onClose,
  usuarioCliente,
  reservas,
  onLogout,
}) => {
  if (!usuarioCliente) return null;

  // Filtrar reservas que pertenezcan al usuario logueado
  const misReservas = reservas.filter(
    (r) =>
      r.clienteTelefono === usuarioCliente.telefono ||
      r.clienteNombre.toLowerCase() === usuarioCliente.nombre.toLowerCase() ||
      (r.clienteEmail && r.clienteEmail.toLowerCase() === usuarioCliente.email.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Mis Pichangas</Text>
              <Text style={styles.headerSubtitle}>
                Historial de reservas de {usuarioCliente.nombre}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* User Profile Pill */}
          <View style={styles.userBanner}>
            <View style={styles.userAvatar}>
              <User size={16} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{usuarioCliente.nombre}</Text>
              <Text style={styles.userMeta}>
                📱 {usuarioCliente.telefono} {usuarioCliente.dni ? `• DNI: ${usuarioCliente.dni}` : ''}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{misReservas.length} reservas</Text>
              </View>
              {onLogout && (
                <TouchableOpacity
                  style={styles.modalLogoutBtn}
                  onPress={onLogout}
                  activeOpacity={0.8}
                >
                  <LogOut size={12} color="#f87171" />
                  <Text style={styles.modalLogoutBtnText}>Salir</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Lista de Reservas */}
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {misReservas.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Calendar size={40} color="#475569" style={{ marginBottom: 10 }} />
                <Text style={styles.emptyTitle}>Aún no tienes pichangas registradas</Text>
                <Text style={styles.emptySubtitle}>
                  Selecciona un horario disponible en la grilla pública para apartar tu cancha al instante.
                </Text>
              </View>
            ) : (
              misReservas.map((reserva) => {
                const isAprobada = reserva.estado === 'aprobada';
                const isPendiente =
                  reserva.estado === 'pendiente' || reserva.estado === 'pendiente_validacion';
                const isRechazada = reserva.estado === 'rechazada';

                return (
                  <View key={reserva.id} style={styles.reservaCard}>
                    {/* Top Row: Cancha y Estado */}
                    <View style={styles.reservaTopRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.canchaNombre}>{reserva.canchaNombre}</Text>
                        <Text style={styles.formatoText}>
                          {reserva.tipoGrass === 'sintetico' ? '🌱 Sintético' : '🌾 Natural'} • {reserva.formato}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.estadoBadge,
                          isAprobada && styles.estadoBadgeAprobada,
                          isPendiente && styles.estadoBadgePendiente,
                          isRechazada && styles.estadoBadgeRechazada,
                        ]}
                      >
                        {isAprobada && <CheckCircle2 size={12} color="#10b981" />}
                        {isPendiente && <AlertCircle size={12} color="#f59e0b" />}
                        {isRechazada && <XCircle size={12} color="#ef4444" />}
                        <Text
                          style={[
                            styles.estadoText,
                            isAprobada && styles.estadoTextAprobada,
                            isPendiente && styles.estadoTextPendiente,
                            isRechazada && styles.estadoTextRechazada,
                          ]}
                        >
                          {isAprobada
                            ? 'Aprobada'
                            : isPendiente
                            ? 'Pendiente de Validación'
                            : 'Rechazada'}
                        </Text>
                      </View>
                    </View>

                    {/* Details Row */}
                    <View style={styles.detailsBox}>
                      <View style={styles.detailRow}>
                        <Calendar size={13} color="#94a3b8" />
                        <Text style={styles.detailText}>{reserva.fecha}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Clock size={13} color="#94a3b8" />
                        <Text style={styles.detailText}>{reserva.horario}</Text>
                      </View>
                    </View>

                    {/* Bottom Row: Monto y Comprobante info */}
                    <View style={styles.reservaBottomRow}>
                      <View>
                        <Text style={styles.montoLabel}>Total pagado / acordado:</Text>
                        <Text style={styles.montoText}>S/ {reserva.monto}.00</Text>
                      </View>

                      {reserva.comprobanteUrl ? (
                        <View style={styles.voucherPill}>
                          <FileText size={12} color="#10b981" />
                          <Text style={styles.voucherPillText}>Comprobante Adjunto</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '88%',
    paddingBottom: 20,
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  userMeta: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  countBadgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  modalLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  modalLogoutBtnText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  emptyContainer: {
    backgroundColor: '#1e293b',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  reservaCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 12,
  },
  reservaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  canchaNombre: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '700',
  },
  formatoText: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  estadoBadgeAprobada: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  estadoBadgePendiente: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  estadoBadgeRechazada: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
  },
  estadoTextAprobada: {
    color: '#34d399',
  },
  estadoTextPendiente: {
    color: '#fbbf24',
  },
  estadoTextRechazada: {
    color: '#f87171',
  },
  detailsBox: {
    backgroundColor: '#090d16',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  reservaBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    paddingTop: 10,
  },
  montoLabel: {
    color: '#94a3b8',
    fontSize: 10,
  },
  montoText: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '800',
  },
  voucherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  voucherPillText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '600',
  },
});
