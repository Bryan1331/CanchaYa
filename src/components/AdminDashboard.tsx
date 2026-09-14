import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import {
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Search,
  Check,
  X,
  Eye,
} from 'lucide-react-native';
import { Reserva, EstadoReserva } from '../types';

interface AdminDashboardProps {
  reservas: Reserva[];
  onCambiarEstadoReserva: (reservaId: string, nuevoEstado: EstadoReserva) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  reservas,
  onCambiarEstadoReserva,
}) => {
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoReserva>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [voucherModalVisible, setVoucherModalVisible] = useState(false);
  const [selectedReservaVoucher, setSelectedReservaVoucher] = useState<Reserva | null>(null);

  // Metricas
  const totalRecaudado = reservas
    .filter((r) => r.estado === 'aprobada')
    .reduce((acc, curr) => acc + curr.monto, 0);

  const pendientesCount = reservas.filter((r) => r.estado === 'pendiente').length;
  const aprobadasCount = reservas.filter((r) => r.estado === 'aprobada').length;

  const reservasFiltradas = reservas.filter((r) => {
    const matchEstado = filtroEstado === 'todos' || r.estado === filtroEstado;
    const matchSearch =
      r.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.canchaNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (r.clienteTelefono && r.clienteTelefono.toLowerCase().includes(busqueda.toLowerCase()));
    return matchEstado && matchSearch;
  });

  const verComprobante = (reserva: Reserva) => {
    setSelectedReservaVoucher(reserva);
    setVoucherModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Header Recepción */}
        <View style={styles.header}>
          <View style={styles.badgeReception}>
            <ShieldCheck size={13} color="#10b981" />
            <Text style={styles.badgeReceptionText}>RECEPCIÓN • CANCHAYA CAJAMARCA</Text>
          </View>
          <Text style={styles.headerTitle}>Panel de Control</Text>
          <Text style={styles.headerSubtitle}>Gestión y validación de turnos registrados</Text>
        </View>

        {/* Métricas Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <DollarSign size={18} color="#10b981" />
            </View>
            <Text style={styles.kpiValue}>S/ {totalRecaudado}</Text>
            <Text style={styles.kpiLabel}>Total Aprobado</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Clock size={18} color="#f59e0b" />
            </View>
            <Text style={[styles.kpiValue, { color: '#f59e0b' }]}>{pendientesCount}</Text>
            <Text style={styles.kpiLabel}>Por Validar</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <TrendingUp size={18} color="#818cf8" />
            </View>
            <Text style={[styles.kpiValue, { color: '#818cf8' }]}>{aprobadasCount}</Text>
            <Text style={styles.kpiLabel}>Confirmadas</Text>
          </View>
        </View>

        {/* Lista de Reservas por Validar */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Reservas ({reservasFiltradas.length})</Text>
          </View>

          {/* Buscador */}
          <View style={styles.searchBar}>
            <Search size={16} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por cliente, cancha o celular..."
              placeholderTextColor="#64748b"
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>

          {/* Filtros de Estado */}
          <View style={styles.filtrosRow}>
            {(['todos', 'pendiente', 'aprobada', 'rechazada'] as const).map((estado) => {
              const isActive = filtroEstado === estado;
              return (
                <TouchableOpacity
                  key={estado}
                  style={[styles.filtroBtn, isActive && styles.filtroBtnActive]}
                  onPress={() => setFiltroEstado(estado)}
                >
                  <Text style={[styles.filtroBtnText, isActive && styles.filtroBtnTextActive]}>
                    {estado === 'todos' ? 'Todos' : estado === 'pendiente' ? 'Pendientes' : estado === 'aprobada' ? 'Aprobadas' : 'Rechazadas'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Lista de Reservas */}
          {reservasFiltradas.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No hay reservas en este estado.</Text>
            </View>
          ) : (
            reservasFiltradas.map((reserva) => {
              const isPendiente = reserva.estado === 'pendiente';
              const isAprobada = reserva.estado === 'aprobada';

              return (
                <View key={reserva.id} style={styles.reservaCard}>
                  {/* Top Bar de la Reserva */}
                  <View style={styles.reservaTop}>
                    <View>
                      <Text style={styles.reservaId}>{reserva.id} • {reserva.fechaCreacion || 'Reciente'}</Text>
                      <Text style={styles.clienteName}>{reserva.clienteNombre}</Text>
                      <Text style={styles.clientePhone}>{reserva.clienteTelefono}</Text>
                    </View>
                    <View style={styles.estadoContainer}>
                      <View
                        style={[
                          styles.estadoBadge,
                          isPendiente
                            ? styles.badgePendiente
                            : isAprobada
                            ? styles.badgeAprobado
                            : styles.badgeRechazado,
                        ]}
                      >
                        <Text
                          style={[
                            styles.estadoText,
                            isPendiente
                              ? styles.textPendiente
                              : isAprobada
                              ? styles.textAprobado
                              : styles.textRechazado,
                          ]}
                        >
                          {reserva.estado.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.reservaMonto}>S/ {reserva.monto}.00</Text>
                    </View>
                  </View>

                  {/* Detalles de la Cancha y Horario */}
                  <View style={styles.reservaDetailsBox}>
                    <Text style={styles.canchaDetalleText}>
                      🏟️ {reserva.canchaNombre} ({reserva.tipoGrass === 'sintetico' ? 'Grass Sintético' : 'Grass Natural'})
                    </Text>
                    <Text style={styles.horarioDetalleText}>
                      🕒 {reserva.fecha} | {reserva.horario}
                    </Text>
                  </View>

                  {/* Botones de Acción para Recepción */}
                  <View style={styles.accionesRow}>
                    <TouchableOpacity
                      style={styles.btnVerVoucher}
                      onPress={() => verComprobante(reserva)}
                    >
                      <Eye size={14} color="#94a3b8" />
                      <Text style={styles.btnVerVoucherText}>Ver Ficha</Text>
                    </TouchableOpacity>

                    {isPendiente && (
                      <View style={styles.actionBtnsGroup}>
                        <TouchableOpacity
                          style={styles.btnRechazar}
                          onPress={() => onCambiarEstadoReserva(reserva.id, 'rechazada')}
                        >
                          <X size={15} color="#f87171" />
                          <Text style={styles.btnRechazarText}>Rechazar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.btnAprobar}
                          onPress={() => onCambiarEstadoReserva(reserva.id, 'aprobada')}
                        >
                          <Check size={15} color="#0f172a" />
                          <Text style={styles.btnAprobarText}>Validar</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {!isPendiente && (
                      <TouchableOpacity
                        style={styles.btnRevertir}
                        onPress={() => onCambiarEstadoReserva(reserva.id, isAprobada ? 'pendiente' : 'aprobada')}
                      >
                        <Text style={styles.btnRevertirText}>
                          {isAprobada ? 'Marcar como Pendiente' : 'Reaprobar'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Modal Ver Ficha */}
      <Modal visible={voucherModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.voucherPreviewCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del Turno</Text>
              <TouchableOpacity onPress={() => setVoucherModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            {selectedReservaVoucher && (
              <View style={styles.voucherContent}>
                <View style={styles.voucherSummary}>
                  <Text style={styles.voucherClient}>{selectedReservaVoucher.clienteNombre}</Text>
                  <Text style={styles.voucherAmount}>Monto: S/ {selectedReservaVoucher.monto}.00</Text>
                  <Text style={styles.voucherOp}>
                    Teléfono: {selectedReservaVoucher.clienteTelefono}
                  </Text>
                  <Text style={styles.voucherOp}>
                    Cancha: {selectedReservaVoucher.canchaNombre} ({selectedReservaVoucher.horario})
                  </Text>
                </View>

                <View style={styles.voucherSimulatorBox}>
                  <CheckCircle2 size={36} color="#10b981" />
                  <Text style={styles.voucherValidText}>Turno Registrado</Text>
                  <Text style={styles.voucherHashText}>
                    ID: {selectedReservaVoucher.id}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closePreviewBtn}
                  onPress={() => setVoucherModalVisible(false)}
                >
                  <Text style={styles.closePreviewBtnText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    marginBottom: 16,
  },
  badgeReception: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 8,
  },
  badgeReceptionText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#f9fafb',
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
  },
  kpiIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    color: '#34d399',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  kpiLabel: {
    color: '#9ca3af',
    fontSize: 11,
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#f3f4f6',
    fontSize: 13,
    marginLeft: 8,
  },
  filtrosRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  filtroBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  filtroBtnActive: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  filtroBtnText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  filtroBtnTextActive: {
    color: '#34d399',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#111827',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyCardText: {
    color: '#6b7280',
    fontSize: 13,
  },
  reservaCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 12,
  },
  reservaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reservaId: {
    color: '#6b7280',
    fontSize: 11,
    marginBottom: 2,
  },
  clienteName: {
    color: '#f9fafb',
    fontSize: 15,
    fontWeight: '700',
  },
  clientePhone: {
    color: '#9ca3af',
    fontSize: 12,
  },
  estadoContainer: {
    alignItems: 'flex-end',
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  badgePendiente: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  badgeAprobado: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeRechazado: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  estadoText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textPendiente: {
    color: '#f59e0b',
  },
  textAprobado: {
    color: '#10b981',
  },
  textRechazado: {
    color: '#ef4444',
  },
  reservaMonto: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '700',
  },
  reservaDetailsBox: {
    backgroundColor: '#090d16',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  canchaDetalleText: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
  horarioDetalleText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  accionesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    paddingTop: 10,
  },
  btnVerVoucher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1f2937',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnVerVoucherText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtnsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  btnRechazar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  btnRechazarText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '700',
  },
  btnAprobar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnAprobarText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  btnRevertir: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnRevertirText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  voucherPreviewCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
  },
  voucherContent: {},
  voucherSummary: {
    backgroundColor: '#090d16',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  voucherClient: {
    color: '#f9fafb',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  voucherAmount: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  voucherOp: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 2,
  },
  voucherSimulatorBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  voucherValidText: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  voucherHashText: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
  },
  closePreviewBtn: {
    backgroundColor: '#1f2937',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  closePreviewBtnText: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '700',
  },
});
