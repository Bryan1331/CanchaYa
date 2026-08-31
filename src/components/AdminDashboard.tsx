import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import {
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Trophy,
  Plus,
  ShieldCheck,
  Search,
  Check,
  X,
  Eye,
} from 'lucide-react-native';
import { Reserva, Torneo, EstadoReserva, TipoGrass } from '../types';

interface AdminDashboardProps {
  reservas: Reserva[];
  torneos: Torneo[];
  onCambiarEstadoReserva: (reservaId: string, nuevoEstado: EstadoReserva) => void;
  onCrearTorneo: (nuevoTorneo: Torneo) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  reservas,
  torneos,
  onCambiarEstadoReserva,
  onCrearTorneo,
}) => {
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoReserva>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [modalTorneoVisible, setModalTorneoVisible] = useState(false);
  const [voucherModalVisible, setVoucherModalVisible] = useState(false);
  const [selectedReservaVoucher, setSelectedReservaVoucher] = useState<Reserva | null>(null);

  // Form nuevo torneo
  const [tituloTorneo, setTituloTorneo] = useState('');
  const [formatoTorneo, setFormatoTorneo] = useState('Fútbol 7');
  const [grassTorneo, setGrassTorneo] = useState<TipoGrass>('sintetico');
  const [categoriaTorneo, setCategoriaTorneo] = useState('');
  const [premioTorneo, setPremioTorneo] = useState('');
  const [inscripcionTorneo, setInscripcionTorneo] = useState('250');
  const [maxEquiposTorneo, setMaxEquiposTorneo] = useState('16');

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
      (r.codigoOperacion && r.codigoOperacion.toLowerCase().includes(busqueda.toLowerCase()));
    return matchEstado && matchSearch;
  });

  const handleCrearNuevoTorneo = () => {
    if (!tituloTorneo.trim() || !categoriaTorneo.trim() || !premioTorneo.trim()) {
      Alert.alert('Campos incompletos', 'Por favor llena los campos principales del torneo.');
      return;
    }

    const nuevo: Torneo = {
      id: `torneo-${Date.now()}`,
      titulo: tituloTorneo.trim(),
      formato: formatoTorneo,
      tipoGrass: grassTorneo,
      categoria: categoriaTorneo.trim(),
      premio: premioTorneo.trim(),
      inscripcion: parseFloat(inscripcionTorneo) || 200,
      fechaInicio: 'Próximo Mes',
      equiposInscritos: 1,
      maxEquipos: parseInt(maxEquiposTorneo) || 16,
      estado: 'abierto',
    };

    onCrearTorneo(nuevo);
    setTituloTorneo('');
    setCategoriaTorneo('');
    setPremioTorneo('');
    setModalTorneoVisible(false);
    Alert.alert('¡Torneo Publicado!', 'El torneo ya está disponible para inscripciones en Cajamarca.');
  };

  const verComprobante = (reserva: Reserva) => {
    setSelectedReservaVoucher(reserva);
    setVoucherModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Header Recepción */}
        <View style={styles.header}>
          <View>
            <View style={styles.badgeReception}>
              <ShieldCheck size={13} color="#10b981" />
              <Text style={styles.badgeReceptionText}>RECEPCIÓN • CANCHAYA CAJAMARCA</Text>
            </View>
            <Text style={styles.headerTitle}>Panel de Control</Text>
            <Text style={styles.headerSubtitle}>Validación de pagos Yape/Plin y gestión de canchas</Text>
          </View>
        </View>

        {/* Métricas Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <DollarSign size={18} color="#10b981" />
            </View>
            <Text style={styles.kpiValue}>S/ {totalRecaudado}</Text>
            <Text style={styles.kpiLabel}>Recaudado Hoy</Text>
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

        {/* Gestión de Torneos */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Trophy size={18} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Torneos en Cajamarca</Text>
            </View>
            <TouchableOpacity
              style={styles.addTorneoBtn}
              onPress={() => setModalTorneoVisible(true)}
            >
              <Plus size={14} color="#0f172a" />
              <Text style={styles.addTorneoBtnText}>Nuevo Torneo</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.torneosAdminScroll}>
            {torneos.map((t) => (
              <View key={t.id} style={styles.adminTorneoCard}>
                <View style={styles.adminTorneoTop}>
                  <Text style={styles.adminTorneoTag}>
                    {t.tipoGrass === 'sintetico' ? '🌱 SINTÉTICO' : '🌾 NATURAL'} • {t.formato}
                  </Text>
                  <Text style={styles.adminTorneoEstado}>
                    {t.estado === 'abierto' ? '🟢 Abierto' : '🟡 En Juego'}
                  </Text>
                </View>
                <Text style={styles.adminTorneoTitle}>{t.titulo}</Text>
                <Text style={styles.adminTorneoCat}>{t.categoria}</Text>
                <View style={styles.adminTorneoProgress}>
                  <Text style={styles.adminTorneoCupos}>
                    Inscritos: {t.equiposInscritos}/{t.maxEquipos} equipos
                  </Text>
                  <Text style={styles.adminTorneoPremio}>{t.premio}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Lista de Reservas por Validar */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Validación de Reservas ({reservasFiltradas.length})</Text>
          </View>

          {/* Buscador */}
          <View style={styles.searchBar}>
            <Search size={16} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por cliente, cancha o código OP..."
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
                      <Text style={styles.reservaId}>{reserva.id} • {reserva.fechaCreacion}</Text>
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
                    <View style={styles.pagoInfoRow}>
                      <Text style={styles.pagoMetodoTag}>
                        Pago: {reserva.metodoPago.toUpperCase()}
                      </Text>
                      <Text style={styles.pagoOpTag}>
                        Cód: {reserva.codigoOperacion || 'N/D'}
                      </Text>
                    </View>
                  </View>

                  {/* Botones de Acción para Recepción */}
                  <View style={styles.accionesRow}>
                    <TouchableOpacity
                      style={styles.btnVerVoucher}
                      onPress={() => verComprobante(reserva)}
                    >
                      <Eye size={14} color="#94a3b8" />
                      <Text style={styles.btnVerVoucherText}>Ver Voucher</Text>
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
                          <Text style={styles.btnAprobarText}>Validar Pago</Text>
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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal Crear Torneo */}
      <Modal visible={modalTorneoVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Torneo en Cajamarca</Text>
              <TouchableOpacity onPress={() => setModalTorneoVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Título del Torneo</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: Copa Carnaval Cajamarquino 2026"
                placeholderTextColor="#64748b"
                value={tituloTorneo}
                onChangeText={setTituloTorneo}
              />

              <Text style={styles.inputLabel}>Tipo de Terreno</Text>
              <View style={styles.modalDeportesRow}>
                {(['sintetico', 'natural'] as TipoGrass[]).map((tg) => (
                  <TouchableOpacity
                    key={tg}
                    style={[styles.modalDepBtn, grassTorneo === tg && styles.modalDepBtnActive]}
                    onPress={() => setGrassTorneo(tg)}
                  >
                    <Text style={[styles.modalDepText, grassTorneo === tg && styles.modalDepTextActive]}>
                      {tg === 'sintetico' ? '🌱 GRASS SINTÉTICO' : '🌾 GRASS NATURAL'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Formato de Fútbol</Text>
              <View style={styles.modalDeportesRow}>
                {['Fútbol 6', 'Fútbol 7', 'Fútbol 8', 'Fútbol 11'].map((fmt) => (
                  <TouchableOpacity
                    key={fmt}
                    style={[styles.modalDepBtn, formatoTorneo === fmt && styles.modalDepBtnActive]}
                    onPress={() => setFormatoTorneo(fmt)}
                  >
                    <Text style={[styles.modalDepText, formatoTorneo === fmt && styles.modalDepTextActive]}>
                      {fmt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Categoría</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: Libre Varones / Interbarrios Cajamarca"
                placeholderTextColor="#64748b"
                value={categoriaTorneo}
                onChangeText={setCategoriaTorneo}
              />

              <Text style={styles.inputLabel}>Premio Total</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: S/ 4,000 + Copa de Campeones"
                placeholderTextColor="#64748b"
                value={premioTorneo}
                onChangeText={setPremioTorneo}
              />

              <View style={styles.modalInputRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Costo Inscripción (S/)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={inscripcionTorneo}
                    onChangeText={setInscripcionTorneo}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Max Equipos</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={maxEquiposTorneo}
                    onChangeText={setMaxEquiposTorneo}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCrearNuevoTorneo}>
                <Text style={styles.modalSubmitBtnText}>Publicar Torneo</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Ver Voucher */}
      <Modal visible={voucherModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.voucherPreviewCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comprobante de Pago</Text>
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
                    Método: {selectedReservaVoucher.metodoPago.toUpperCase()} • OP: {selectedReservaVoucher.codigoOperacion}
                  </Text>
                </View>

                <View style={styles.voucherSimulatorBox}>
                  <CheckCircle2 size={40} color="#10b981" />
                  <Text style={styles.voucherValidText}>Comprobante Digital Recibido</Text>
                  <Text style={styles.voucherHashText}>
                    HASH: {selectedReservaVoucher.id}-YAPE-PLIN-CAJAMARCA
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
    marginBottom: 20,
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
  },
  addTorneoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addTorneoBtnText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  torneosAdminScroll: {
    marginHorizontal: -4,
  },
  adminTorneoCard: {
    width: 230,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  adminTorneoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  adminTorneoTag: {
    backgroundColor: '#1f2937',
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminTorneoEstado: {
    fontSize: 11,
    color: '#9ca3af',
  },
  adminTorneoTitle: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  adminTorneoCat: {
    color: '#9ca3af',
    fontSize: 11,
    marginBottom: 8,
  },
  adminTorneoProgress: {
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    paddingTop: 8,
  },
  adminTorneoCupos: {
    color: '#6b7280',
    fontSize: 11,
    marginBottom: 2,
  },
  adminTorneoPremio: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '600',
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
    marginBottom: 6,
  },
  pagoInfoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pagoMetodoTag: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '600',
  },
  pagoOpTag: {
    color: '#6b7280',
    fontSize: 11,
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
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#1f2937',
  },
  btnVerVoucherText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  actionBtnsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  btnRechazar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  btnRechazarText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
  },
  btnAprobar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnAprobarText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  btnRevertir: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  btnRevertirText: {
    color: '#9ca3af',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#f9fafb',
    fontSize: 17,
    fontWeight: '700',
  },
  modalBody: {},
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#090d16',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    height: 42,
    color: '#f3f4f6',
    fontSize: 13,
  },
  modalDeportesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  modalDepBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalDepBtnActive: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  modalDepText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '700',
  },
  modalDepTextActive: {
    color: '#34d399',
  },
  modalInputRow: {
    flexDirection: 'row',
  },
  modalSubmitBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  modalSubmitBtnText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  voucherPreviewCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  voucherContent: {
    alignItems: 'center',
  },
  voucherSummary: {
    width: '100%',
    backgroundColor: '#090d16',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  voucherClient: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '700',
  },
  voucherAmount: {
    color: '#34d399',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  voucherOp: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  voucherSimulatorBox: {
    width: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  voucherValidText: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  voucherHashText: {
    color: '#6b7280',
    fontSize: 10,
    marginTop: 4,
  },
  closePreviewBtn: {
    backgroundColor: '#1f2937',
    width: '100%',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  closePreviewBtnText: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '600',
  },
});
