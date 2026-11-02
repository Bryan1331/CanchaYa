import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
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
  PlusCircle,
  Calendar,
  AlertTriangle,
  Lock,
  Unlock,
  CloudRain,
  Wrench,
  User,
  Phone,
  CreditCard,
  Building,
  LogOut,
  ArrowLeft,
  Sparkles,
} from 'lucide-react-native';
import { Reserva, EstadoReserva, Cancha, HorarioSlot, MetodoPago, AdminUser } from '../types';
import { ReporteIngresos } from './ReporteIngresos';

interface AdminDashboardProps {
  reservas: Reserva[];
  canchas: Cancha[];
  localesAsignados?: number[]; // [US-24] Locales autorizados del administrador
  adminActual?: AdminUser | null;
  onCambiarEstadoReserva: (reservaId: string, nuevoEstado: EstadoReserva) => void;
  onCrearReservaManual: (nuevaReserva: Omit<Reserva, 'id' | 'fechaCreacion'> & { id?: string }) => void;
  onBloquearSlot: (canchaId: number | string, slotId: string, motivo: string) => void;
  onDesbloquearSlot: (canchaId: number | string, slotId: string) => void;
  onVolverPublico?: () => void;
  onLogoutAdmin?: () => void;
  onNavigateReportes?: () => void;
}

const DIAS_RECEPCION = [
  { id: 'hoy', label: 'Hoy, 30 Ago', fechaStr: 'Hoy, 30 Ago' },
  { id: 'manana', label: 'Mañana, 31 Ago', fechaStr: 'Mañana, 31 Ago' },
  { id: 'pasado', label: 'Martes, 1 Sep', fechaStr: 'Martes, 1 Sep' },
  { id: 'todos', label: 'Todos los Días', fechaStr: 'todos' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  reservas,
  canchas,
  localesAsignados = [1, 2, 3], // Por defecto administra locales 1, 2 y 3 en Cajamarca
  adminActual,
  onCambiarEstadoReserva,
  onCrearReservaManual,
  onBloquearSlot,
  onDesbloquearSlot,
  onVolverPublico,
  onLogoutAdmin,
  onNavigateReportes,
}) => {
  // Pestaña activa: Cuadro Diario o Reporte de Ingresos [US-17]
  const [activeTab, setActiveTab] = useState<'cuadro' | 'reporte'>('cuadro');

  // [US-24] Filtro Multilocal
  const [localSeleccionado, setLocalSeleccionado] = useState<number | 'todos'>('todos');

  // Filtros del Cuadro Diario
  const [diaSeleccionado, setDiaSeleccionado] = useState(DIAS_RECEPCION[0]);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoReserva>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Modal Ver Comprobante
  const [voucherModalVisible, setVoucherModalVisible] = useState(false);
  const [selectedReservaVoucher, setSelectedReservaVoucher] = useState<Reserva | null>(null);

  // [US-14] Modal Registro Manual Presencial / Telefónico
  const [modalPresencialVisible, setModalPresencialVisible] = useState(false);
  const [presencialNombre, setPresencialNombre] = useState('');
  const [presencialTelefono, setPresencialTelefono] = useState('');
  const [presencialCanchaId, setPresencialCanchaId] = useState<number | string>('');
  const [presencialFecha, setPresencialFecha] = useState('Hoy, 30 Ago');
  const [presencialSlotId, setPresencialSlotId] = useState<string>('');
  const [presencialMonto, setPresencialMonto] = useState<string>('80');
  const [presencialMetodo, setPresencialMetodo] = useState<MetodoPago>('efectivo');

  // [US-15] Modal Bloqueo por Mantenimiento o Lluvia
  const [modalBloqueoVisible, setModalBloqueoVisible] = useState(false);
  const [bloqueoCanchaId, setBloqueoCanchaId] = useState<number | string>('');
  const [bloqueoSlotId, setBloqueoSlotId] = useState<string>('');
  const [bloqueoMotivo, setBloqueoMotivo] = useState<string>('Lluvia');

  // [US-24] Locales asignados efectivos (desde adminActual o props)
  const localesAdmin = adminActual?.localesAsignados ?? localesAsignados;

  // [US-24] Filtrar canchas autorizadas según localesAsignados
  const canchasAutorizadas = canchas.filter((c) => {
    const locId = c.localId ?? c.id;
    return localesAdmin.includes(c.id) || localesAdmin.includes(locId);
  });

  // Canchas visibles según local seleccionado
  const canchasVisibles = canchasAutorizadas.filter((c) => {
    const locId = c.localId ?? c.id;
    return localSeleccionado === 'todos' ? true : locId === localSeleccionado;
  });

  // Locales asignados únicos para selector
  const localesDisponibles = Array.from(
    new Map(
      canchasAutorizadas.map((c) => {
        const idLocal = c.localId ?? c.id;
        const nombreLocal = c.establecimiento || c.localNombre || c.nombre;
        return [idLocal, { id: idLocal, nombre: nombreLocal }];
      })
    ).values()
  );

  // [US-24] Filtrar reservas que pertenezcan a los locales asignados y local seleccionado
  const reservasAutorizadas = reservas.filter((r) => {
    const canchaObj = canchas.find((c) => String(c.id) === String(r.canchaId));
    const localId = r.localId || (canchaObj ? (canchaObj.localId ?? canchaObj.id) : 1);

    if (!localesAdmin.includes(localId)) return false;
    if (localSeleccionado !== 'todos') return localId === localSeleccionado;
    return true;
  });

  // Métricas rápidas del Cuadro Diario
  const totalRecaudado = reservasAutorizadas
    .filter((r) => r.estado === 'aprobada' || r.estado === 'completada')
    .reduce((acc, curr) => acc + curr.monto, 0);

  const pendientesCount = reservasAutorizadas.filter(
    (r) => r.estado === 'pendiente' || r.estado === 'pendiente_validacion'
  ).length;

  const aprobadasCount = reservasAutorizadas.filter(
    (r) => r.estado === 'aprobada' || r.estado === 'completada'
  ).length;

  // Filtrar reservas por fecha seleccionada, estado y búsqueda
  const reservasFiltradas = reservasAutorizadas.filter((r) => {
    const matchDia = diaSeleccionado.fechaStr === 'todos' || r.fecha === diaSeleccionado.fechaStr;
    const matchEstado =
      filtroEstado === 'todos'
        ? true
        : filtroEstado === 'pendiente'
        ? r.estado === 'pendiente' || r.estado === 'pendiente_validacion'
        : r.estado === filtroEstado;
    const matchSearch =
      r.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.canchaNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (r.clienteTelefono && r.clienteTelefono.toLowerCase().includes(busqueda.toLowerCase()));
    return matchDia && matchEstado && matchSearch;
  });

  // Lista de slots bloqueados activos en los locales autorizados
  const slotsBloqueados: { cancha: Cancha; slot: HorarioSlot }[] = [];
  canchasVisibles.forEach((c) => {
    if (c.horarios) {
      c.horarios.forEach((s) => {
        if (s.bloqueado) {
          slotsBloqueados.push({ cancha: c, slot: s });
        }
      });
    }
  });

  // Canchas para modales
  const canchaPresencialSeleccionada =
    canchasVisibles.find((c) => String(c.id) === String(presencialCanchaId)) ||
    canchasVisibles[0] ||
    canchas[0];
  const canchaBloqueoSeleccionada =
    canchasVisibles.find((c) => String(c.id) === String(bloqueoCanchaId)) ||
    canchasVisibles[0] ||
    canchas[0];

  // Acciones sobre reservas
  const handleAprobarReserva = (reserva: Reserva) => {
    Alert.alert(
      'Aprobar Reserva',
      `¿Deseas validar el comprobante y confirmar la reserva de ${reserva.clienteNombre} (${reserva.horario}) por S/ ${reserva.monto}.00?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar y Aprobar',
          style: 'default',
          onPress: () => onCambiarEstadoReserva(reserva.id, 'aprobada'),
        },
      ]
    );
  };

  const handleRechazarReserva = (reserva: Reserva) => {
    Alert.alert(
      'Rechazar Reserva',
      `¿Estás seguro de rechazar la reserva de ${reserva.clienteNombre}? El turno ${reserva.horario} se liberará automáticamente en la grilla pública.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar y Liberar',
          style: 'destructive',
          onPress: () => onCambiarEstadoReserva(reserva.id, 'rechazada'),
        },
      ]
    );
  };

  const handleCompletarReserva = (reserva: Reserva) => {
    Alert.alert(
      'Finalizar Pichanga',
      `¿Marcar el turno de ${reserva.clienteNombre} como completado? Esto habilitará la opción para que el jugador califique la cancha en "Mis Pichangas".`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar como Completada',
          style: 'default',
          onPress: () => onCambiarEstadoReserva(reserva.id, 'completada'),
        },
      ]
    );
  };

  // Registro Manual Presencial
  const handleSubmitPresencial = () => {
    const nom = presencialNombre.trim();
    const tel = presencialTelefono.trim();

    if (!nom) {
      Alert.alert('Campo requerido', 'Por favor ingresa el nombre del cliente.');
      return;
    }

    const canchaObj = canchasVisibles.find((c) => c.id === presencialCanchaId) || canchasVisibles[0];
    if (!canchaObj) {
      Alert.alert('Error', 'Selecciona una cancha válida.');
      return;
    }

    const horariosCancha = canchaObj.horarios ?? [];
    const slotObj = horariosCancha.find((h) => h.id === presencialSlotId) || horariosCancha[0];
    const horarioStr = slotObj ? `${slotObj.horaInicio} - ${slotObj.horaFin}` : '07:00 PM - 08:00 PM';
    const montoNum = Number(presencialMonto) || slotObj?.precio || 80;
    const montoAdelanto = Math.round(montoNum * 0.5);

    onCrearReservaManual({
      localId: canchaObj.localId,
      canchaId: canchaObj.id,
      canchaNombre: canchaObj.nombre,
      tipoGrass: canchaObj.tipoGrass,
      formato: canchaObj.formato,
      clienteNombre: nom,
      clienteTelefono: tel || 'Presencial / En Caja',
      fecha: presencialFecha,
      horario: horarioStr,
      monto: montoNum,
      montoTotal: montoNum,
      montoAdelanto: montoAdelanto,
      saldoPendiente: montoNum - montoAdelanto,
      metodoPago: presencialMetodo,
      estado: 'aprobada',
      origen: 'presencial',
    });

    Alert.alert(
      '✅ Reserva Presencial Guardada',
      `Turno asignado a ${nom} en ${canchaObj.nombre} (${horarioStr}). El horario ha quedado ocupado.`
    );

    setPresencialNombre('');
    setPresencialTelefono('');
    setModalPresencialVisible(false);
  };

  // Bloqueo de Horario
  const handleSubmitBloqueo = () => {
    const canchaObj = canchasVisibles.find((c) => c.id === bloqueoCanchaId) || canchasVisibles[0];
    if (!canchaObj) return;

    const horariosBloqueo = canchaObj.horarios ?? [];
    const slotObj = horariosBloqueo.find((h) => h.id === bloqueoSlotId) || horariosBloqueo[0];
    if (!slotObj) {
      Alert.alert('Error', 'Selecciona un horario para bloquear.');
      return;
    }

    const motivo = bloqueoMotivo.trim() || 'Lluvia / Mantenimiento';

    onBloquearSlot(canchaObj.id, slotObj.id, motivo);

    Alert.alert(
      '🚫 Horario Bloqueado',
      `El horario ${slotObj.horaInicio} de ${canchaObj.nombre} ha sido bloqueado por: "${motivo}".`
    );

    setModalBloqueoVisible(false);
  };

  const verComprobante = (reserva: Reserva) => {
    setSelectedReservaVoucher(reserva);
    setVoucherModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Barra Superior de Recepción */}
        <View style={styles.topNavAdmin}>
          {onVolverPublico && (
            <TouchableOpacity
              style={styles.btnVolverPublico}
              onPress={onVolverPublico}
              activeOpacity={0.8}
            >
              <ArrowLeft size={13} color="#38bdf8" />
              <Text style={styles.btnVolverPublicoText}>Ver Canchas (Público)</Text>
            </TouchableOpacity>
          )}

          {onLogoutAdmin && (
            <TouchableOpacity
              style={styles.btnLogoutAdmin}
              onPress={onLogoutAdmin}
              activeOpacity={0.8}
            >
              <LogOut size={13} color="#f87171" />
              <Text style={styles.btnLogoutAdminText}>Salir</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Header Recepción */}
        <View style={styles.header}>
          <View style={styles.badgeReception}>
            <ShieldCheck size={13} color="#10b981" />
            <Text style={styles.badgeReceptionText}>RECEPCIÓN • CANCHAYA CAJAMARCA</Text>
          </View>
          <Text style={styles.headerTitle}>Panel de Control Diario</Text>
          <Text style={styles.headerSubtitle}>
            Gestión multilocal, validación de pagos y reportes de ingresos en tiempo real
          </Text>
          {adminActual && (
            <View style={styles.adminInfoCard}>
              <Text style={styles.adminInfoTitle}>
                👤 <Text style={{ color: '#38bdf8', fontWeight: '800' }}>{adminActual.nombre}</Text> ({adminActual.email})
              </Text>
              <Text style={styles.adminInfoCargo}>{adminActual.cargo}</Text>
            </View>
          )}
        </View>

        {/* [US-24] Barra de Control Multilocal por Propietario */}
        <View style={styles.multilocalBar}>
          <View style={styles.multilocalHeader}>
            <Building size={14} color="#38bdf8" />
            <Text style={styles.multilocalTitle}>
              Locales Autorizados ({localesDisponibles.length}):
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.multilocalScroll}>
            <TouchableOpacity
              style={[styles.localPill, localSeleccionado === 'todos' && styles.localPillActive]}
              onPress={() => setLocalSeleccionado('todos')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.localPillText,
                  localSeleccionado === 'todos' && styles.localPillTextActive,
                ]}
              >
                🏢 Todos mis locales ({localesDisponibles.length})
              </Text>
            </TouchableOpacity>

            {localesDisponibles.map((loc) => {
              const isSelected = localSeleccionado === loc.id;
              return (
                <TouchableOpacity
                  key={loc.id}
                  style={[styles.localPill, isSelected && styles.localPillActive]}
                  onPress={() => setLocalSeleccionado(loc.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.localPillText, isSelected && styles.localPillTextActive]}>
                    📍 {loc.nombre.replace('Complejo Deportivo', '').replace('Complejo', '').trim()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selector de Pestañas: Cuadro Diario vs Reporte de Ingresos [US-17] */}
        <View style={styles.tabsSwitcherContainer}>
          <TouchableOpacity
            style={[styles.tabSwitcherBtn, activeTab === 'cuadro' && styles.tabSwitcherBtnActive]}
            onPress={() => setActiveTab('cuadro')}
            activeOpacity={0.8}
          >
            <Calendar size={14} color={activeTab === 'cuadro' ? '#10b981' : '#94a3b8'} />
            <Text
              style={[
                styles.tabSwitcherBtnText,
                activeTab === 'cuadro' && styles.tabSwitcherBtnTextActive,
              ]}
            >
              Cuadro Diario
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabSwitcherBtn, activeTab === 'reporte' && styles.tabSwitcherBtnActive]}
            onPress={() => setActiveTab('reporte')}
            activeOpacity={0.8}
          >
            <TrendingUp size={14} color={activeTab === 'reporte' ? '#10b981' : '#94a3b8'} />
            <Text
              style={[
                styles.tabSwitcherBtnText,
                activeTab === 'reporte' && styles.tabSwitcherBtnTextActive,
              ]}
            >
              Reporte de Ingresos [US-17]
            </Text>
          </TouchableOpacity>
        </View>

        {/* PESTAÑA 2: [US-17] Reporte Simplificado de Ingresos */}
        {activeTab === 'reporte' ? (
          <ReporteIngresos
            reservas={reservasAutorizadas}
            canchas={canchasAutorizadas}
            localSeleccionadoId={localSeleccionado}
            localesAsignados={localesAdmin}
          />
        ) : (
          /* PESTAÑA 1: Cuadro Diario y Operaciones */
          <>
            {/* Botones de Acción de Gestión Rápida */}
            <View style={styles.adminActionRow}>
              <TouchableOpacity
                style={styles.btnActionPresencial}
                onPress={() => {
                  if (canchasVisibles.length > 0) {
                    setPresencialCanchaId(canchasVisibles[0].id);
                    const slots = canchasVisibles[0].horarios ?? [];
                    setPresencialSlotId(slots[0]?.id || '');
                    setPresencialMonto(String(slots[0]?.precio || 80));
                  }
                  setModalPresencialVisible(true);
                }}
                activeOpacity={0.8}
              >
                <PlusCircle size={16} color="#090d16" />
                <Text style={styles.btnActionPresencialText}>+ Reserva Presencial / Telefónica</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnActionBloqueo}
                onPress={() => {
                  if (canchasVisibles.length > 0) {
                    setBloqueoCanchaId(canchasVisibles[0].id);
                    const slots = canchasVisibles[0].horarios ?? [];
                    setBloqueoSlotId(slots[0]?.id || '');
                  }
                  setModalBloqueoVisible(true);
                }}
                activeOpacity={0.8}
              >
                <AlertTriangle size={15} color="#fbbf24" />
                <Text style={styles.btnActionBloqueoText}>Bloquear por Lluvia</Text>
              </TouchableOpacity>
            </View>

            {/* Métricas Cards */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <DollarSign size={18} color="#10b981" />
                </View>
                <Text style={styles.kpiValue}>S/ {totalRecaudado}</Text>
                <Text style={styles.kpiLabel}>Total Recaudado</Text>
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

            {/* Horarios Bloqueados Activos */}
            {slotsBloqueados.length > 0 && (
              <View style={styles.blockedSection}>
                <View style={styles.blockedHeader}>
                  <AlertTriangle size={15} color="#f59e0b" />
                  <Text style={styles.blockedTitle}>
                    Horarios Bloqueados en tus Locales ({slotsBloqueados.length})
                  </Text>
                </View>
                {slotsBloqueados.map(({ cancha, slot }) => (
                  <View key={`${cancha.id}-${slot.id}`} style={styles.blockedItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.blockedCanchaName}>
                        {cancha.nombre} • <Text style={{ color: '#fbbf24' }}>{slot.horaInicio}</Text>
                      </Text>
                      <Text style={styles.blockedReasonText}>
                        Motivo: {slot.motivoBloqueo || 'Lluvia / Mantenimiento'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.unblockBtn}
                      onPress={() => onDesbloquearSlot(cancha.id, slot.id)}
                    >
                      <Unlock size={13} color="#10b981" />
                      <Text style={styles.unblockBtnText}>Habilitar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Selector de Fecha del Cuadro Diario */}
            <View style={styles.sectionContainer}>
              <View style={styles.dateSelectorCard}>
                <View style={styles.dateSelectorHeader}>
                  <Calendar size={15} color="#10b981" />
                  <Text style={styles.dateSelectorTitle}>Fecha de Turno:</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                  {DIAS_RECEPCION.map((dia) => {
                    const isSelected = diaSeleccionado.id === dia.id;
                    const countForDay =
                      dia.fechaStr === 'todos'
                        ? reservasAutorizadas.length
                        : reservasAutorizadas.filter((r) => r.fecha === dia.fechaStr).length;

                    return (
                      <TouchableOpacity
                        key={dia.id}
                        style={[styles.datePill, isSelected && styles.datePillActive]}
                        onPress={() => setDiaSeleccionado(dia)}
                      >
                        <Text style={[styles.datePillText, isSelected && styles.datePillTextActive]}>
                          {dia.label}
                        </Text>
                        <View
                          style={[
                            styles.dateCountBadge,
                            isSelected && { backgroundColor: '#090d16' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dateCountBadgeText,
                              isSelected && { color: '#10b981' },
                            ]}
                          >
                            {countForDay}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
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
                {busqueda.length > 0 && (
                  <TouchableOpacity onPress={() => setBusqueda('')}>
                    <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '700' }}>Limpiar</Text>
                  </TouchableOpacity>
                )}
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
                        {estado === 'todos'
                          ? 'Todos'
                          : estado === 'pendiente'
                          ? 'Por Validar'
                          : estado === 'aprobada'
                          ? 'Confirmadas'
                          : 'Rechazadas'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Lista de Reservas del Cuadro Diario */}
              {reservasFiltradas.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>
                    No hay reservas registradas para {diaSeleccionado.label} en tus locales autorizados.
                  </Text>
                </View>
              ) : (
                reservasFiltradas.map((reserva) => {
                  const isPendiente =
                    reserva.estado === 'pendiente' || reserva.estado === 'pendiente_validacion';
                  const isAprobada = reserva.estado === 'aprobada';
                  const isCompletada = reserva.estado === 'completada';
                  const isPresencial = reserva.origen === 'presencial';

                  const adelanto = reserva.montoAdelanto ?? Math.round(reserva.monto * 0.5);
                  const saldo = reserva.saldoPendiente ?? (reserva.monto - adelanto);

                  return (
                    <View key={reserva.id} style={styles.reservaCard}>
                      {/* Top Bar de la Reserva */}
                      <View style={styles.reservaTop}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Text style={styles.reservaId}>{reserva.id}</Text>
                            {isPresencial ? (
                              <View style={styles.presencialPill}>
                                <Text style={styles.presencialPillText}>Presencial / Caja</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.clienteName}>{reserva.clienteNombre}</Text>
                          <Text style={styles.clientePhone}>
                            📱 {reserva.clienteTelefono} {reserva.clienteDni ? `• DNI: ${reserva.clienteDni}` : ''}
                          </Text>
                        </View>
                        <View style={styles.estadoContainer}>
                          <View
                            style={[
                              styles.estadoBadge,
                              isCompletada
                                ? styles.badgeCompletada
                                : isPendiente
                                ? styles.badgePendiente
                                : isAprobada
                                ? styles.badgeAprobado
                                : styles.badgeRechazado,
                            ]}
                          >
                            <Text
                              style={[
                                styles.estadoText,
                                isCompletada
                                  ? styles.textCompletada
                                  : isPendiente
                                  ? styles.textPendiente
                                  : isAprobada
                                  ? styles.textAprobado
                                  : styles.textRechazado,
                              ]}
                            >
                              {isCompletada
                                ? 'PICHANGA JUGADA'
                                : isPendiente
                                ? 'POR VALIDAR'
                                : isAprobada
                                ? 'CONFIRMADA'
                                : 'RECHAZADA'}
                            </Text>
                          </View>
                          <Text style={styles.reservaMonto}>S/ {reserva.monto}.00</Text>
                          <Text style={styles.metodoPagoText}>
                            {reserva.metodoPago?.toUpperCase() || 'YAPE'}
                          </Text>
                        </View>
                      </View>

                      {/* Detalles de la Cancha y Horario */}
                      <View style={styles.reservaDetailsBox}>
                        <Text style={styles.canchaDetalleText}>
                          🏟️ {reserva.canchaNombre} ({reserva.tipoGrass === 'sintetico' ? 'Grass Sintético' : 'Grass Natural'})
                        </Text>
                        <Text style={styles.horarioDetalleText}>
                          📅 {reserva.fecha} • 🕒 {reserva.horario}
                        </Text>
                      </View>

                      {/* Desglose Financiero Rápido [US-16 / US-17] */}
                      <View style={styles.reservaMontosBreakdown}>
                        <Text style={styles.reservaMontoItem}>
                          Adelanto: <Text style={{ color: '#10b981', fontWeight: '800' }}>S/ {adelanto}.00</Text>
                        </Text>
                        <Text style={styles.reservaMontoItem}>
                          Saldo en cancha: <Text style={{ color: '#fbbf24', fontWeight: '800' }}>S/ {saldo}.00</Text>
                        </Text>
                      </View>

                      {/* Botones de Acción para Recepción */}
                      <View style={styles.accionesRow}>
                        <TouchableOpacity
                          style={styles.btnVerVoucher}
                          onPress={() => verComprobante(reserva)}
                        >
                          <Eye size={14} color="#94a3b8" />
                          <Text style={styles.btnVerVoucherText}>
                            {reserva.comprobanteUrl ? 'Ver Voucher' : 'Ver Ficha'}
                          </Text>
                        </TouchableOpacity>

                        {isPendiente && (
                          <View style={styles.actionBtnsGroup}>
                            <TouchableOpacity
                              style={styles.btnRechazar}
                              onPress={() => handleRechazarReserva(reserva)}
                            >
                              <X size={15} color="#f87171" />
                              <Text style={styles.btnRechazarText}>Rechazar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.btnAprobar}
                              onPress={() => handleAprobarReserva(reserva)}
                            >
                              <Check size={15} color="#0f172a" />
                              <Text style={styles.btnAprobarText}>Aprobar</Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        {isAprobada && (
                          <View style={styles.actionBtnsGroup}>
                            <TouchableOpacity
                              style={styles.btnCompletar}
                              onPress={() => handleCompletarReserva(reserva)}
                            >
                              <Sparkles size={14} color="#a855f7" />
                              <Text style={styles.btnCompletarText}>Finalizar Turno</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.btnRevertir}
                              onPress={() => onCambiarEstadoReserva(reserva.id, 'pendiente_validacion')}
                            >
                              <Text style={styles.btnRevertirText}>Revertir</Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        {isCompletada && (
                          <View style={styles.completadaNoticePill}>
                            <CheckCircle2 size={12} color="#a855f7" />
                            <Text style={styles.completadaNoticeText}>
                              {reserva.calificado ? '⭐ Calificado por Jugador' : 'Turno Completado'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* MODAL [US-14]: REGISTRO MANUAL PRESENCIAL / TELEFÓNICO */}
      <Modal visible={modalPresencialVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>+ Reserva Presencial / Telefónica</Text>
                <Text style={styles.modalSubtitle}>Registro directo en caja con estado Aprobado</Text>
              </View>
              <TouchableOpacity onPress={() => setModalPresencialVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Nombre del Cliente *</Text>
              <View style={styles.modalInputGroup}>
                <User size={16} color="#10b981" />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ej: Juan Pérez"
                  placeholderTextColor="#64748b"
                  value={presencialNombre}
                  onChangeText={setPresencialNombre}
                />
              </View>

              <Text style={styles.fieldLabel}>Teléfono / WhatsApp</Text>
              <View style={styles.modalInputGroup}>
                <Phone size={16} color="#10b981" />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ej: 976543210 (opcional)"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  value={presencialTelefono}
                  onChangeText={setPresencialTelefono}
                />
              </View>

              <Text style={styles.fieldLabel}>Seleccionar Cancha (Locales Autorizados) *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
                {canchasVisibles.map((c) => {
                  const isSelected = c.id === presencialCanchaId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.selectorPill, isSelected && styles.selectorPillActive]}
                      onPress={() => {
                        setPresencialCanchaId(c.id);
                        const slots = c.horarios ?? [];
                        if (slots.length > 0) {
                          setPresencialSlotId(slots[0].id);
                          setPresencialMonto(String(slots[0].precio));
                        }
                      }}
                    >
                      <Text style={[styles.selectorPillText, isSelected && styles.selectorPillTextActive]}>
                        {c.nombre.split('-')[0].trim()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Fecha de la Pichanga *</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {['Hoy, 30 Ago', 'Mañana, 31 Ago', 'Martes, 1 Sep'].map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.selectorPill, presencialFecha === f && styles.selectorPillActive]}
                    onPress={() => setPresencialFecha(f)}
                  >
                    <Text style={[styles.selectorPillText, presencialFecha === f && styles.selectorPillTextActive]}>
                      {f.split(',')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Horario Disponible *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
                {(canchaPresencialSeleccionada.horarios ?? []).map((slot) => {
                  const isSelected = slot.id === presencialSlotId;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.selectorPill,
                        isSelected && styles.selectorPillActive,
                        !slot.disponible && { opacity: 0.6 },
                      ]}
                      onPress={() => {
                        setPresencialSlotId(slot.id);
                        setPresencialMonto(String(slot.precio));
                      }}
                    >
                      <Text style={[styles.selectorPillText, isSelected && styles.selectorPillTextActive]}>
                        {slot.horaInicio} ({slot.disponible ? `S/ ${slot.precio}` : 'Ocupado'})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Monto Cobrado (S/)</Text>
                  <View style={styles.modalInputGroup}>
                    <DollarSign size={16} color="#10b981" />
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="numeric"
                      value={presencialMonto}
                      onChangeText={setPresencialMonto}
                    />
                  </View>
                </View>

                <View style={{ flex: 1.2 }}>
                  <Text style={styles.fieldLabel}>Método de Pago</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {(['efectivo', 'yape', 'plin'] as MetodoPago[]).map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.selectorPill,
                          presencialMetodo === m && styles.selectorPillActive,
                          { flex: 1, paddingHorizontal: 4 },
                        ]}
                        onPress={() => setPresencialMetodo(m)}
                      >
                        <Text style={[styles.selectorPillText, presencialMetodo === m && styles.selectorPillTextActive]}>
                          {m.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.btnSubmitModal} onPress={handleSubmitPresencial}>
                <Text style={styles.btnSubmitModalText}>Guardar Reserva Presencial</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL [US-15]: BLOQUEO POR MANTENIMIENTO O LLUVIA */}
      <Modal visible={modalBloqueoVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🚫 Bloquear Horario / Cancha</Text>
                <Text style={styles.modalSubtitle}>Inhabilita un slot por lluvia o mantenimiento</Text>
              </View>
              <TouchableOpacity onPress={() => setModalBloqueoVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Seleccionar Cancha *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
                {canchasVisibles.map((c) => {
                  const isSelected = c.id === bloqueoCanchaId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.selectorPill, isSelected && styles.selectorPillActive]}
                      onPress={() => {
                        setBloqueoCanchaId(c.id);
                        const slots = c.horarios ?? [];
                        if (slots.length > 0) setBloqueoSlotId(slots[0].id);
                      }}
                    >
                      <Text style={[styles.selectorPillText, isSelected && styles.selectorPillTextActive]}>
                        {c.nombre.split('-')[0].trim()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Horario a Bloquear *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
                {(canchaBloqueoSeleccionada.horarios ?? []).map((slot) => {
                  const isSelected = slot.id === bloqueoSlotId;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.selectorPill,
                        isSelected && styles.selectorPillActive,
                        slot.bloqueado && { backgroundColor: '#78350f', borderColor: '#f59e0b' },
                      ]}
                      onPress={() => setBloqueoSlotId(slot.id)}
                    >
                      <Text style={[styles.selectorPillText, isSelected && styles.selectorPillTextActive]}>
                        {slot.horaInicio} {slot.bloqueado ? '(Ya Bloqueado)' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Motivo del Bloqueo *</Text>
              <View style={styles.modalInputGroup}>
                <AlertTriangle size={16} color="#fbbf24" />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ej: Lluvia Torrencial / Drenaje"
                  placeholderTextColor="#64748b"
                  value={bloqueoMotivo}
                  onChangeText={setBloqueoMotivo}
                />
              </View>

              <TouchableOpacity
                style={[styles.btnSubmitModal, { backgroundColor: '#f59e0b' }]}
                onPress={handleSubmitBloqueo}
              >
                <Text style={[styles.btnSubmitModalText, { color: '#090d16' }]}>
                  Confirmar Bloqueo de Horario
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL VER VOUCHER DE PAGO */}
      <Modal visible={voucherModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.voucherModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Comprobante de Adelanto</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedReservaVoucher?.clienteNombre} • S/ {selectedReservaVoucher?.monto}.00
                </Text>
              </View>
              <TouchableOpacity onPress={() => setVoucherModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {selectedReservaVoucher?.comprobanteUrl ? (
              <Image
                source={{ uri: selectedReservaVoucher.comprobanteUrl }}
                style={styles.voucherFullImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noVoucherBox}>
                <Text style={styles.noVoucherText}>
                  Esta reserva se registró de forma presencial o sin voucher adjunto.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.btnCloseVoucher}
              onPress={() => setVoucherModalVisible(false)}
            >
              <Text style={styles.btnCloseVoucherText}>Cerrar</Text>
            </TouchableOpacity>
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
  topNavAdmin: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnVolverPublico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnVolverPublicoText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  btnLogoutAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnLogoutAdminText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    marginBottom: 14,
  },
  badgeReception: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeReceptionText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  adminInfoCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  adminInfoTitle: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  adminInfoCargo: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  multilocalBar: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  multilocalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  multilocalTitle: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  multilocalScroll: {
    flexDirection: 'row',
  },
  localPill: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  localPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  localPillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  localPillTextActive: {
    color: '#38bdf8',
  },
  tabsSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabSwitcherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabSwitcherBtnActive: {
    backgroundColor: '#0f172a',
  },
  tabSwitcherBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabSwitcherBtnTextActive: {
    color: '#10b981',
  },
  adminActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  btnActionPresencial: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 11,
    borderRadius: 12,
  },
  btnActionPresencialText: {
    color: '#090d16',
    fontSize: 12,
    fontWeight: '800',
  },
  btnActionBloqueo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  btnActionBloqueoText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
  },
  kpiLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  blockedSection: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginBottom: 14,
  },
  blockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  blockedTitle: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800',
  },
  blockedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  blockedCanchaName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  blockedReasonText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  unblockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  unblockBtnText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateSelectorCard: {
    marginBottom: 12,
  },
  dateSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dateSelectorTitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  dateScroll: {
    flexDirection: 'row',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  datePillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  datePillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  datePillTextActive: {
    color: '#34d399',
  },
  dateCountBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  dateCountBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 12,
    marginLeft: 6,
  },
  filtrosRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filtroBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filtroBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  filtroBtnText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  filtroBtnTextActive: {
    color: '#34d399',
  },
  emptyCard: {
    backgroundColor: '#0f172a',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyCardText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  reservaCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  reservaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reservaId: {
    color: '#64748b',
    fontSize: 10,
  },
  presencialPill: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  presencialPillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  clienteName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  clientePhone: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  estadoContainer: {
    alignItems: 'flex-end',
  },
  estadoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 3,
  },
  badgePendiente: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  badgeAprobado: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeCompletada: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  badgeRechazado: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  estadoText: {
    fontSize: 9,
    fontWeight: '800',
  },
  textPendiente: {
    color: '#fbbf24',
  },
  textAprobado: {
    color: '#34d399',
  },
  textCompletada: {
    color: '#c084fc',
  },
  textRechazado: {
    color: '#f87171',
  },
  reservaMonto: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
  },
  metodoPagoText: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 1,
  },
  reservaDetailsBox: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  canchaDetalleText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  horarioDetalleText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  reservaMontosBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  reservaMontoItem: {
    color: '#94a3b8',
    fontSize: 11,
  },
  accionesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
  },
  btnVerVoucher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnVerVoucherText: {
    color: '#94a3b8',
    fontSize: 11,
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
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  btnRechazarText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
  btnAprobar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnAprobarText: {
    color: '#090d16',
    fontSize: 11,
    fontWeight: '800',
  },
  btnCompletar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  btnCompletarText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '700',
  },
  btnRevertir: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnRevertirText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  completadaNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completadaNoticeText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  formModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 10,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  fieldLabel: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
    height: 42,
  },
  modalInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    marginLeft: 8,
  },
  selectorScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  selectorPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectorPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  selectorPillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  selectorPillTextActive: {
    color: '#34d399',
  },
  btnSubmitModal: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  btnSubmitModalText: {
    color: '#090d16',
    fontSize: 13,
    fontWeight: '900',
  },
  voucherModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  voucherFullImage: {
    width: '100%',
    height: 380,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  noVoucherBox: {
    padding: 30,
    alignItems: 'center',
  },
  noVoucherText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  btnCloseVoucher: {
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  btnCloseVoucherText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
});
