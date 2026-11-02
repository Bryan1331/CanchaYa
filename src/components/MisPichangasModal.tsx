import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  User,
  LogOut,
  Star,
  Sparkles,
} from 'lucide-react-native';
import { Reserva, UsuarioCliente } from '../types';

interface MisPichangasModalProps {
  visible: boolean;
  onClose: () => void;
  usuarioCliente: UsuarioCliente | null;
  reservas: Reserva[];
  onLogout?: () => void;
  onAbrirCalificar?: (reserva: Reserva) => void;
}

export const MisPichangasModal: React.FC<MisPichangasModalProps> = ({
  visible,
  onClose,
  usuarioCliente,
  reservas,
  onLogout,
  onAbrirCalificar,
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
                const isCompletada = reserva.estado === 'completada';
                const isAprobada = reserva.estado === 'aprobada';
                const isPendiente =
                  reserva.estado === 'pendiente' || reserva.estado === 'pendiente_validacion';
                const isRechazada = reserva.estado === 'rechazada';

                const adelanto = reserva.montoAdelanto ?? Math.round(reserva.monto * 0.5);
                const saldo = reserva.saldoPendiente ?? (reserva.monto - adelanto);

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
                          isCompletada && styles.estadoBadgeCompletada,
                          isAprobada && styles.estadoBadgeAprobada,
                          isPendiente && styles.estadoBadgePendiente,
                          isRechazada && styles.estadoBadgeRechazada,
                        ]}
                      >
                        {isCompletada && <Sparkles size={12} color="#a855f7" />}
                        {isAprobada && <CheckCircle2 size={12} color="#10b981" />}
                        {isPendiente && <AlertCircle size={12} color="#f59e0b" />}
                        {isRechazada && <XCircle size={12} color="#ef4444" />}
                        <Text
                          style={[
                            styles.estadoText,
                            isCompletada && styles.estadoTextCompletada,
                            isAprobada && styles.estadoTextAprobada,
                            isPendiente && styles.estadoTextPendiente,
                            isRechazada && styles.estadoTextRechazada,
                          ]}
                        >
                          {isCompletada
                            ? 'Pichanga Jugada'
                            : isAprobada
                            ? 'Confirmada'
                            : isPendiente
                            ? 'Pendiente Validación'
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

                    {/* Desglose Financiero */}
                    <View style={styles.pricingBreakdownBox}>
                      <View style={styles.pricingBreakdownCol}>
                        <Text style={styles.pricingBreakdownLabel}>Monto Total:</Text>
                        <Text style={styles.pricingBreakdownValue}>S/ {reserva.monto}.00</Text>
                      </View>
                      <View style={styles.pricingBreakdownCol}>
                        <Text style={styles.pricingBreakdownLabel}>Adelanto Validado:</Text>
                        <Text style={[styles.pricingBreakdownValue, { color: '#34d399' }]}>
                          S/ {adelanto}.00
                        </Text>
                      </View>
                      <View style={styles.pricingBreakdownCol}>
                        <Text style={styles.pricingBreakdownLabel}>Saldo en Cancha:</Text>
                        <Text style={[styles.pricingBreakdownValue, { color: '#cbd5e1' }]}>
                          S/ {saldo}.00
                        </Text>
                      </View>
                    </View>

                    {/* Bottom Row: [US-23] Botón Calificar post-pichanga sólo si estado === 'completada' */}
                    <View style={styles.reservaBottomRow}>
                      {reserva.comprobanteUrl ? (
                        <View style={styles.voucherPill}>
                          <FileText size={12} color="#10b981" />
                          <Text style={styles.voucherPillText}>Adelanto Adjunto</Text>
                        </View>
                      ) : (
                        <View />
                      )}

                      {/* [US-23] Calificación: solo para reservas completadas */}
                      {isCompletada && (
                        reserva.calificado ? (
                          <View style={styles.calificadoBadge}>
                            <Star size={12} color="#fbbf24" fill="#fbbf24" />
                            <Text style={styles.calificadoBadgeText}>
                              {reserva.calificacion?.estrellas || 5} ★ Calificado
                            </Text>
                          </View>
                        ) : (
                          onAbrirCalificar && (
                            <TouchableOpacity
                              style={styles.calificarBtn}
                              onPress={() => onAbrirCalificar(reserva)}
                              activeOpacity={0.8}
                            >
                              <Star size={13} color="#090d16" fill="#090d16" />
                              <Text style={styles.calificarBtnText}>Calificar Pichanga</Text>
                            </TouchableOpacity>
                          )
                        )
                      )}
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  userMeta: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  modalLogoutBtnText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 18,
  },
  reservaCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reservaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  canchaNombre: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  formatoText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  estadoBadgeCompletada: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  estadoBadgeAprobada: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  estadoBadgePendiente: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  estadoBadgeRechazada: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
  },
  estadoTextCompletada: {
    color: '#c084fc',
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
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  pricingBreakdownBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pricingBreakdownCol: {
    alignItems: 'center',
  },
  pricingBreakdownLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 2,
  },
  pricingBreakdownValue: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
  },
  reservaBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  voucherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  voucherPillText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
  calificarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  calificarBtnText: {
    color: '#090d16',
    fontSize: 12,
    fontWeight: '900',
  },
  calificadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  calificadoBadgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
  },
});
