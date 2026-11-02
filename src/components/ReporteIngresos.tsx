import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Phone,
  FileText,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Reserva, Cancha } from '../types';

interface ReporteIngresosProps {
  reservas: Reserva[];
  canchas: Cancha[];
  localSeleccionadoId: number | 'todos';
  localesAsignados: number[];
}

type RangoFecha = 'hoy' | 'semana' | 'mes' | 'todos';

const PERIODOS: { id: RangoFecha; label: string; desc: string }[] = [
  { id: 'hoy', label: 'Hoy (30 Ago)', desc: 'Cierre del día en vivo' },
  { id: 'semana', label: 'Esta Semana', desc: 'Últimos 7 días' },
  { id: 'mes', label: 'Este Mes (Agosto)', desc: 'Acumulado mensual' },
  { id: 'todos', label: 'Todo el Historial', desc: 'Consolidado general' },
];

export const ReporteIngresos: React.FC<ReporteIngresosProps> = ({
  reservas,
  canchas,
  localSeleccionadoId,
  localesAsignados,
}) => {
  const [periodo, setPeriodo] = useState<RangoFecha>('hoy');

  // Filtrar reservas que pertenezcan a los locales autorizados y al local seleccionado
  const reservasPorLocal = reservas.filter((r) => {
    const canchaObj = canchas.find((c) => String(c.id) === String(r.canchaId));
    const canchaLocalId = r.localId || (canchaObj ? (canchaObj.localId ?? canchaObj.id) : 1);

    // Control de seguridad Multilocal [US-24]
    const perteneceALocalesAutorizados = localesAsignados.includes(canchaLocalId);
    if (!perteneceALocalesAutorizados) return false;

    if (localSeleccionadoId !== 'todos') {
      return canchaLocalId === localSeleccionadoId;
    }
    return true;
  });

  // [US-17] Filtrar por período de fecha
  const reservasPorPeriodo = reservasPorLocal.filter((r) => {
    if (periodo === 'todos') return true;
    if (periodo === 'hoy') {
      return r.fecha.toLowerCase().includes('hoy') || r.fecha.includes('30 Ago');
    }
    if (periodo === 'semana') {
      return (
        r.fecha.toLowerCase().includes('hoy') ||
        r.fecha.toLowerCase().includes('ayer') ||
        r.fecha.toLowerCase().includes('mañana') ||
        r.fecha.includes('30 Ago') ||
        r.fecha.includes('31 Ago') ||
        r.fecha.includes('29 Ago')
      );
    }
    if (periodo === 'mes') {
      return (
        r.fecha.includes('Ago') ||
        r.fecha.includes('Agosto') ||
        r.fecha.toLowerCase().includes('hoy') ||
        r.fecha.toLowerCase().includes('ayer')
      );
    }
    return true;
  });

  // [US-17] "Los cálculos aplican solo para reservas en estado 'confirmada' o 'validada' (aprobada o completada)"
  const reservasValidadas = reservasPorPeriodo.filter(
    (r) => r.estado === 'aprobada' || r.estado === 'completada'
  );

  // [US-17] Cálculos financieros de resumen
  const totalTurnosReservados = reservasValidadas.length;

  const totalAdelantosValidados = reservasValidadas.reduce((acc, r) => {
    const adelanto = r.montoAdelanto !== undefined ? r.montoAdelanto : Math.round(r.monto * 0.5);
    return acc + adelanto;
  }, 0);

  const totalSaldoPendiente = reservasValidadas.reduce((acc, r) => {
    const adelanto = r.montoAdelanto !== undefined ? r.montoAdelanto : Math.round(r.monto * 0.5);
    const saldo = r.saldoPendiente !== undefined ? r.saldoPendiente : r.monto - adelanto;
    return acc + saldo;
  }, 0);

  const totalRecaudacionProyectada = totalAdelantosValidados + totalSaldoPendiente;

  return (
    <View style={styles.container}>
      {/* Selector de Rango de Fecha */}
      <View style={styles.periodosContainer}>
        <View style={styles.periodosHeader}>
          <Calendar size={15} color="#10b981" />
          <Text style={styles.periodosTitle}>Período de Liquidación:</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodosScroll}>
          {PERIODOS.map((p) => {
            const isSelected = periodo === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.periodoPill, isSelected && styles.periodoPillActive]}
                onPress={() => setPeriodo(p.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodoPillText, isSelected && styles.periodoPillTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* [US-17] Tarjetas de Resumen KPI */}
      <View style={styles.kpiContainer}>
        {/* KPI 1: Total Turnos Reservados */}
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
            <Clock size={20} color="#38bdf8" />
          </View>
          <Text style={styles.kpiLabel}>Total Turnos Reservados</Text>
          <Text style={[styles.kpiValue, { color: '#38bdf8' }]}>{totalTurnosReservados}</Text>
          <Text style={styles.kpiFootnote}>Confirmadas o validadas</Text>
        </View>

        {/* KPI 2: Total Adelantos Validados (S/) */}
        <View style={[styles.kpiCard, styles.kpiCardHighlight]}>
          <View style={[styles.kpiIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
            <DollarSign size={20} color="#10b981" />
          </View>
          <Text style={styles.kpiLabel}>Total Adelantos Validados</Text>
          <Text style={[styles.kpiValue, { color: '#10b981' }]}>
            S/ {totalAdelantosValidados}.00
          </Text>
          <Text style={styles.kpiFootnote}>Ingresado vía Yape / Plin</Text>
        </View>

        {/* KPI 3: Saldo Pendiente por Cobrar en Cancha (S/) */}
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <TrendingUp size={20} color="#f59e0b" />
          </View>
          <Text style={styles.kpiLabel}>Saldo Pendiente en Cancha</Text>
          <Text style={[styles.kpiValue, { color: '#fbbf24' }]}>
            S/ {totalSaldoPendiente}.00
          </Text>
          <Text style={styles.kpiFootnote}>Por cobrar en caja local</Text>
        </View>
      </View>

      {/* Total Consolidado */}
      <View style={styles.totalConsolidadoCard}>
        <View>
          <Text style={styles.totalConsolidadoLabel}>Total Recaudación Estimada (100%):</Text>
          <Text style={styles.totalConsolidadoSub}>
            Adelantos bancarizados + Saldos presenciales
          </Text>
        </View>
        <Text style={styles.totalConsolidadoValue}>S/ {totalRecaudacionProyectada}.00</Text>
      </View>

      {/* Auditoría Detallada de Turnos Validados */}
      <View style={styles.auditSection}>
        <View style={styles.auditHeader}>
          <ShieldCheck size={16} color="#10b981" />
          <Text style={styles.auditTitle}>
            Desglose de Reservas Liquidadas ({reservasValidadas.length})
          </Text>
        </View>

        {reservasValidadas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No hay reservas confirmadas ni validadas en el período seleccionado.
            </Text>
          </View>
        ) : (
          reservasValidadas.map((reserva) => {
            const adelanto =
              reserva.montoAdelanto !== undefined
                ? reserva.montoAdelanto
                : Math.round(reserva.monto * 0.5);
            const saldo =
              reserva.saldoPendiente !== undefined
                ? reserva.saldoPendiente
                : reserva.monto - adelanto;

            return (
              <View key={reserva.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemCanchaNombre}>{reserva.canchaNombre}</Text>
                    <Text style={styles.itemCliente}>
                      👤 {reserva.clienteNombre} • 📱 {reserva.clienteTelefono}
                    </Text>
                  </View>
                  <View style={styles.itemEstadoPill}>
                    <Text style={styles.itemEstadoText}>
                      {reserva.estado === 'completada' ? 'JUGADA' : 'CONFIRMADA'}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemDetailsRow}>
                  <Text style={styles.itemHorario}>
                    📅 {reserva.fecha} • 🕒 {reserva.horario}
                  </Text>
                  <Text style={styles.itemMetodo}>
                    {reserva.metodoPago?.toUpperCase() || 'YAPE'}
                  </Text>
                </View>

                {/* Desglose de Montos */}
                <View style={styles.itemMontosRow}>
                  <View style={styles.montoCol}>
                    <Text style={styles.montoColLabel}>Monto Total</Text>
                    <Text style={styles.montoColValue}>S/ {reserva.monto}.00</Text>
                  </View>

                  <View style={styles.montoCol}>
                    <Text style={styles.montoColLabel}>Adelanto Validado</Text>
                    <Text style={[styles.montoColValue, { color: '#10b981' }]}>
                      S/ {adelanto}.00
                    </Text>
                  </View>

                  <View style={styles.montoCol}>
                    <Text style={styles.montoColLabel}>Saldo a Cobrar</Text>
                    <Text style={[styles.montoColValue, { color: '#fbbf24' }]}>
                      S/ {saldo}.00
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  periodosContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  periodosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  periodosTitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  periodosScroll: {
    flexDirection: 'row',
  },
  periodoPill: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  periodoPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  periodoPillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  periodoPillTextActive: {
    color: '#34d399',
  },
  kpiContainer: {
    gap: 10,
    marginBottom: 12,
  },
  kpiCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  kpiCardHighlight: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  kpiIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  kpiFootnote: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },
  totalConsolidadoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  totalConsolidadoLabel: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  totalConsolidadoSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  totalConsolidadoValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '900',
  },
  auditSection: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  auditTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyBox: {
    backgroundColor: '#0f172a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  itemCanchaNombre: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  itemCliente: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
  itemEstadoPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemEstadoText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800',
  },
  itemDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemHorario: {
    color: '#94a3b8',
    fontSize: 11,
  },
  itemMetodo: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
  itemMontosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 10,
  },
  montoCol: {
    alignItems: 'center',
  },
  montoColLabel: {
    color: '#94a3b8',
    fontSize: 9,
    marginBottom: 2,
  },
  montoColValue: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
  },
});
