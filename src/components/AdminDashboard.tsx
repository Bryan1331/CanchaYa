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
} from 'lucide-react-native';
import { Reserva, EstadoReserva, Cancha, HorarioSlot, MetodoPago } from '../types';

interface AdminDashboardProps {
  reservas: Reserva[];
  canchas: Cancha[];
  onCambiarEstadoReserva: (reservaId: string, nuevoEstado: EstadoReserva) => void;
  onCrearReservaManual: (nuevaReserva: Omit<Reserva, 'id' | 'fechaCreacion'> & { id?: string }) => void;
  onBloquearSlot: (canchaId: string, slotId: string, motivo: string) => void;
  onDesbloquearSlot: (canchaId: string, slotId: string) => void;
}

const DIAS_RECEPCION = [
  { id: 'hoy', label: 'Hoy, 30 Ago', fechaStr: 'Hoy, 30 Ago' },
  { id: 'manana', label: 'Mañana, 31 Ago', fechaStr: 'Mañana, 31 Ago' },
  { id: 'pasado', label: 'Martes, 1 Sep', fechaStr: 'Martes, 1 Sep' },
  { id: 'todos', label: 'Todos los Días', fechaStr: 'todos' },
];

const MOTIVOS_BLOQUEO_RAPIDOS = [
  'Lluvia',
  'Mantenimiento',
  'Lluvia Torrencial',
  'Mantenimiento de Grass',
  'Torneo Local',
  'Corte de Luz',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  reservas,
  canchas,
  onCambiarEstadoReserva,
  onCrearReservaManual,
  onBloquearSlot,
  onDesbloquearSlot,
}) => {
  // Filtros principales
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
  const [presencialCanchaId, setPresencialCanchaId] = useState<string>(canchas[0]?.id || '');
  const [presencialFecha, setPresencialFecha] = useState('Hoy, 30 Ago');
  const [presencialSlotId, setPresencialSlotId] = useState<string>('');
  const [presencialMonto, setPresencialMonto] = useState<string>('80');
  const [presencialMetodo, setPresencialMetodo] = useState<MetodoPago>('efectivo');

  // [US-15] Modal Bloqueo por Mantenimiento o Lluvia
  const [modalBloqueoVisible, setModalBloqueoVisible] = useState(false);
  const [bloqueoCanchaId, setBloqueoCanchaId] = useState<string>(canchas[0]?.id || '');
  const [bloqueoSlotId, setBloqueoSlotId] = useState<string>('');
  const [bloqueoMotivo, setBloqueoMotivo] = useState<string>('Lluvia');

  // Cancha seleccionada para los formularios
  const canchaPresencialSeleccionada = canchas.find((c) => c.id === presencialCanchaId) || canchas[0];
  const canchaBloqueoSeleccionada = canchas.find((c) => c.id === bloqueoCanchaId) || canchas[0];

  // Métricas
  const totalRecaudado = reservas
    .filter((r) => r.estado === 'aprobada')
    .reduce((acc, curr) => acc + curr.monto, 0);

  const pendientesCount = reservas.filter(
    (r) => r.estado === 'pendiente' || r.estado === 'pendiente_validacion'
  ).length;
  const aprobadasCount = reservas.filter((r) => r.estado === 'aprobada').length;

  // Filtrar reservas por fecha seleccionada, estado y búsqueda
  const reservasFiltradas = reservas.filter((r) => {
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

  // Lista de todos los slots bloqueados en el sistema
  const slotsBloqueados: { cancha: Cancha; slot: HorarioSlot }[] = [];
  canchas.forEach((c) => {
    c.horarios.forEach((s) => {
      if (s.bloqueado) {
        slotsBloqueados.push({ cancha: c, slot: s });
      }
    });
  });

  // [US-13] Acciones con confirmación Alert.alert
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

  // [US-14] Enviar Registro Manual Presencial
  const handleSubmitPresencial = () => {
    const nom = presencialNombre.trim();
    const tel = presencialTelefono.trim();

    if (!nom) {
      Alert.alert('Campo requerido', 'Por favor ingresa el nombre del cliente.');
      return;
    }

    const canchaObj = canchas.find((c) => c.id === presencialCanchaId);
    if (!canchaObj) {
      Alert.alert('Error', 'Selecciona una cancha válida.');
      return;
    }

    const slotObj = canchaObj.horarios.find((h) => h.id === presencialSlotId) || canchaObj.horarios[0];
    const horarioStr = slotObj ? `${slotObj.horaInicio} - ${slotObj.horaFin}` : '07:00 PM - 08:00 PM';
    const montoNum = Number(presencialMonto) || slotObj?.precio || 80;

    onCrearReservaManual({
      canchaId: canchaObj.id,
      canchaNombre: canchaObj.nombre,
      tipoGrass: canchaObj.tipoGrass,
      formato: canchaObj.formato,
      clienteNombre: nom,
      clienteTelefono: tel || 'Presencial / En Caja',
      fecha: presencialFecha,
      horario: horarioStr,
      monto: montoNum,
      metodoPago: presencialMetodo,
      estado: 'aprobada',
      origen: 'presencial',
    });

    Alert.alert(
      '✅ Reserva Presencial Guardada',
      `Turno asignado a ${nom} en ${canchaObj.nombre} (${horarioStr}). El horario ha quedado ocupado.`
    );

    // Reset y cerrar
    setPresencialNombre('');
    setPresencialTelefono('');
    setModalPresencialVisible(false);
  };

  // [US-15] Enviar Bloqueo de Horario
  const handleSubmitBloqueo = () => {
    const canchaObj = canchas.find((c) => c.id === bloqueoCanchaId);
    if (!canchaObj) return;

    const slotObj = canchaObj.horarios.find((h) => h.id === bloqueoSlotId) || canchaObj.horarios[0];
    if (!slotObj) {
      Alert.alert('Error', 'Selecciona un horario para bloquear.');
      return;
    }

    const motivo = bloqueoMotivo.trim() || 'Lluvia / Mantenimiento';

    onBloquearSlot(canchaObj.id, slotObj.id, motivo);

    Alert.alert(
      '🚫 Horario Bloqueado',
      `El horario ${slotObj.horaInicio} de ${canchaObj.nombre} ha sido bloqueado por: "${motivo}". Aparecerá deshabilitado en la grilla pública.`
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
        {/* Header Recepción */}
        <View style={styles.header}>
          <View style={styles.badgeReception}>
            <ShieldCheck size={13} color="#10b981" />
            <Text style={styles.badgeReceptionText}>RECEPCIÓN • CANCHAYA CAJAMARCA</Text>
          </View>
          <Text style={styles.headerTitle}>Panel de Control Diario</Text>
          <Text style={styles.headerSubtitle}>
            Gestión de turnos, validación de pagos y control de mantenimiento
          </Text>
        </View>

        {/* Botones de Acción de Gestión Rápida */}
        <View style={styles.adminActionRow}>
          <TouchableOpacity
            style={styles.btnActionPresencial}
            onPress={() => {
              if (canchas.length > 0) {
                setPresencialCanchaId(canchas[0].id);
                setPresencialSlotId(canchas[0].horarios[0]?.id || '');
                setPresencialMonto(String(canchas[0].horarios[0]?.precio || 80));
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
              if (canchas.length > 0) {
                setBloqueoCanchaId(canchas[0].id);
                setBloqueoSlotId(canchas[0].horarios[0]?.id || '');
              }
              setModalBloqueoVisible(true);
            }}
            activeOpacity={0.8}
          >
            <AlertTriangle size={15} color="#fbbf24" />
            <Text style={styles.btnActionBloqueoText}>Bloquear por Lluvia / Mantenimiento</Text>
          </TouchableOpacity>
        </View>

        {/* Métricas Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <DollarSign size={18} color="#10b981" />
            </View>
            <Text style={styles.kpiValue}>S/ {totalRecaudado}</Text>
            <Text style={styles.kpiLabel}>Total Cobrado</Text>
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

        {/* [US-15] Sección de Horarios Bloqueados Activos */}
        {slotsBloqueados.length > 0 && (
          <View style={styles.blockedSection}>
            <View style={styles.blockedHeader}>
              <AlertTriangle size={15} color="#f59e0b" />
              <Text style={styles.blockedTitle}>
                Horarios Actualmente Bloqueados ({slotsBloqueados.length})
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

        {/* [US-13] CUADRO DIARIO: SELECTOR DE FECHA */}
        <View style={styles.sectionContainer}>
          <View style={styles.dateSelectorCard}>
            <View style={styles.dateSelectorHeader}>
              <Calendar size={15} color="#10b981" />
              <Text style={styles.dateSelectorTitle}>Cuadro Diario de Reservas:</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {DIAS_RECEPCION.map((dia) => {
                const isSelected = diaSeleccionado.id === dia.id;
                const countForDay =
                  dia.fechaStr === 'todos'
                    ? reservas.length
                    : reservas.filter((r) => r.fecha === dia.fechaStr).length;

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
                      ? 'Aprobadas'
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
                No hay reservas registradas para {diaSeleccionado.label} con los filtros activos.
              </Text>
            </View>
          ) : (
            reservasFiltradas.map((reserva) => {
              const isPendiente =
                reserva.estado === 'pendiente' || reserva.estado === 'pendiente_validacion';
              const isAprobada = reserva.estado === 'aprobada';
              const isPresencial = reserva.origen === 'presencial';

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
                          {isPendiente
                            ? 'POR VALIDAR'
                            : isAprobada
                            ? 'APROBADA'
                            : 'RECHAZADA'}
                        </Text>
                      </View>
                      <Text style={styles.reservaMonto}>S/ {reserva.monto}.00</Text>
                      <Text style={styles.metodoPagoText}>
                        Pago: {reserva.metodoPago?.toUpperCase() || 'EFECTIVO'}
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

                  {/* Botones de Acción para Recepción con Alert.alert */}
                  <View style={styles.accionesRow}>
                    <TouchableOpacity
                      style={styles.btnVerVoucher}
                      onPress={() => verComprobante(reserva)}
                    >
                      <Eye size={14} color="#94a3b8" />
                      <Text style={styles.btnVerVoucherText}>
                        {reserva.comprobanteUrl ? 'Ver Comprobante' : 'Ver Ficha'}
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

                    {!isPendiente && (
                      <TouchableOpacity
                        style={styles.btnRevertir}
                        onPress={() =>
                          onCambiarEstadoReserva(
                            reserva.id,
                            isAprobada ? 'pendiente_validacion' : 'aprobada'
                          )
                        }
                      >
                        <Text style={styles.btnRevertirText}>
                          {isAprobada ? 'Marcar como Por Validar' : 'Reaprobar Turno'}
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
              {/* Cliente */}
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

              {/* Cancha */}
              <Text style={styles.fieldLabel}>Seleccionar Cancha *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
                {canchas.map((c) => {
                  const isSelected = c.id === presencialCanchaId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.selectorPill, isSelected && styles.selectorPillActive]}
                      onPress={() => {
                        setPresencialCanchaId(c.id);
                        if (c.horarios.length > 0) {
                          setPresencialSlotId(c.horarios[0].id);
                          setPresencialMonto(String(c.horarios[0].precio));
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

              {/* Fecha */}
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

              {/* Horario */}
              <Text style={styles.fieldLabel}>Horario Disponible *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
                {canchaPresencialSeleccionada.horarios.map((slot) => {
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

              {/* Monto y Método de Pago */}
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
                <Text style={styles.modalSubtitle}>Inhabilita un slot por lluvia o reparaciones</Text>
              </View>
              <TouchableOpacity onPress={() => setModalBloqueoVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Cancha */}
              <Text style={styles.fieldLabel}>Seleccionar Cancha *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
                {canchas.map((c) => {
                  const isSelected = c.id === bloqueoCanchaId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.selectorPill, isSelected && styles.selectorPillActive]}
                      onPress={() => {
                        setBloqueoCanchaId(c.id);
                        if (c.horarios.length > 0) setBloqueoSlotId(c.horarios[0].id);
                      }}
                    >
                      <Text style={[styles.selectorPillText, isSelected && styles.selectorPillTextActive]}>
                        {c.nombre.split('-')[0].trim()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Horario a Bloquear */}
              <Text style={styles.fieldLabel}>Horario a Bloquear *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
                {canchaBloqueoSeleccionada.horarios.map((slot) => {
                  const isSelected = slot.id === bloqueoSlotId;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.selectorPill,
                        isSelected && styles.selectorPillActive,
                        slot.bloqueado && { backgroundColor: '#7f1d1d' },
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

              {/* Motivo Rápido */}
              <Text style={styles.fieldLabel}>Motivo de Bloqueo:</Text>
              {MOTIVOS_BLOQUEO_RAPIDOS.map((motivo) => (
                <TouchableOpacity
                  key={motivo}
                  style={[
                    styles.motivoOption,
                    bloqueoMotivo === motivo && styles.motivoOptionActive,
                  ]}
                  onPress={() => setBloqueoMotivo(motivo)}
                >
                  <Text
                    style={[
                      styles.motivoOptionText,
                      bloqueoMotivo === motivo && styles.motivoOptionTextActive,
                    ]}
                  >
                    {motivo}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.modalInputGroup}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="O escribe otro motivo específico..."
                  placeholderTextColor="#64748b"
                  value={bloqueoMotivo}
                  onChangeText={setBloqueoMotivo}
                />
              </View>

              <TouchableOpacity
                style={[styles.btnSubmitModal, { backgroundColor: '#ef4444' }]}
                onPress={handleSubmitBloqueo}
              >
                <Text style={[styles.btnSubmitModalText, { color: '#ffffff' }]}>
                  Confirmar Bloqueo de Horario
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL [US-13]: VER COMPROBANTE / FICHA */}
      <Modal visible={voucherModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.voucherPreviewCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comprobante de Reserva</Text>
              <TouchableOpacity onPress={() => setVoucherModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            {selectedReservaVoucher && (
              <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                {selectedReservaVoucher.comprobanteUrl ? (
                  <View style={styles.voucherImageWrapper}>
                    <Image
                      source={{ uri: selectedReservaVoucher.comprobanteUrl }}
                      style={styles.voucherImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}

                <View style={styles.voucherSummary}>
                  <Text style={styles.voucherClient}>{selectedReservaVoucher.clienteNombre}</Text>
                  <Text style={styles.voucherAmount}>Monto: S/ {selectedReservaVoucher.monto}.00</Text>
                  <Text style={styles.voucherOp}>
                    📱 Celular: {selectedReservaVoucher.clienteTelefono}
                  </Text>
                  <Text style={styles.voucherOp}>
                    🏟️ {selectedReservaVoucher.canchaNombre}
                  </Text>
                  <Text style={styles.voucherOp}>
                    🕒 {selectedReservaVoucher.fecha} • {selectedReservaVoucher.horario}
                  </Text>
                  <Text style={styles.voucherOp}>
                    💳 Método: {selectedReservaVoucher.metodoPago?.toUpperCase() || 'YAPE'}
                  </Text>
                </View>

                {/* Acciones directas desde el modal de comprobante */}
                {(selectedReservaVoucher.estado === 'pendiente' ||
                  selectedReservaVoucher.estado === 'pendiente_validacion') && (
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <TouchableOpacity
                      style={[styles.btnRechazar, { flex: 1, justifyContent: 'center', height: 44 }]}
                      onPress={() => {
                        setVoucherModalVisible(false);
                        handleRechazarReserva(selectedReservaVoucher);
                      }}
                    >
                      <X size={16} color="#f87171" />
                      <Text style={styles.btnRechazarText}>Rechazar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnAprobar, { flex: 1, justifyContent: 'center', height: 44 }]}
                      onPress={() => {
                        setVoucherModalVisible(false);
                        handleAprobarReserva(selectedReservaVoucher);
                      }}
                    >
                      <Check size={16} color="#0f172a" />
                      <Text style={styles.btnAprobarText}>Aprobar Pago</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.closePreviewBtn}
                  onPress={() => setVoucherModalVisible(false)}
                >
                  <Text style={styles.closePreviewBtnText}>Cerrar Vista</Text>
                </TouchableOpacity>
              </ScrollView>
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
    marginBottom: 14,
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
  adminActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  btnActionPresencial: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 10,
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
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  btnActionBloqueoText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
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
    marginBottom: 6,
  },
  kpiValue: {
    color: '#34d399',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  kpiLabel: {
    color: '#9ca3af',
    fontSize: 11,
    textAlign: 'center',
  },
  blockedSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginBottom: 16,
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
    fontWeight: '700',
  },
  blockedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  blockedCanchaName: {
    color: '#f9fafb',
    fontSize: 12,
    fontWeight: '700',
  },
  blockedReasonText: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  unblockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  unblockBtnText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  dateSelectorCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 12,
  },
  dateSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dateSelectorTitle: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '700',
  },
  dateScroll: {
    marginHorizontal: -4,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#374151',
  },
  datePillActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  datePillText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  datePillTextActive: {
    color: '#090d16',
    fontWeight: '800',
  },
  dateCountBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  dateCountBadgeText: {
    color: '#e2e8f0',
    fontSize: 10,
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
    marginBottom: 10,
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
    marginBottom: 12,
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
    textAlign: 'center',
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
  },
  presencialPill: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  presencialPillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  clienteName: {
    color: '#f9fafb',
    fontSize: 15,
    fontWeight: '700',
  },
  clientePhone: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
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
    fontWeight: '800',
  },
  metodoPagoText: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
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
    fontWeight: '800',
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  formModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  fieldLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    height: 44,
    marginBottom: 10,
  },
  modalInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    marginLeft: 6,
  },
  selectorScroll: {
    marginBottom: 10,
    marginHorizontal: -2,
  },
  selectorPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorPillActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  selectorPillText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  selectorPillTextActive: {
    color: '#090d16',
    fontWeight: '800',
  },
  motivoOption: {
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  motivoOptionActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#fbbf24',
  },
  motivoOptionText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  motivoOptionTextActive: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  btnSubmitModal: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  btnSubmitModalText: {
    color: '#090d16',
    fontSize: 14,
    fontWeight: '800',
  },
  voucherPreviewCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  voucherImageWrapper: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#090d16',
  },
  voucherImage: {
    width: '100%',
    height: '100%',
  },
  voucherSummary: {
    backgroundColor: '#090d16',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 4,
  },
  voucherClient: {
    color: '#f9fafb',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  voucherAmount: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '800',
  },
  voucherOp: {
    color: '#9ca3af',
    fontSize: 12,
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
