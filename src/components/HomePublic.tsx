import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import {
  Search,
  MapPin,
  Clock,
  Car,
  Umbrella,
  Lightbulb,
  Calendar,
  CheckCircle2,
  Sun,
  ShieldCheck,
  Lock,
  CloudRain,
  Wrench,
  User,
  History,
  AlertTriangle,
  LogOut,
} from 'lucide-react-native';
import { Cancha, HorarioSlot, TipoGrass, UsuarioCliente } from '../types';

interface HomePublicProps {
  canchas: Cancha[];
  usuarioCliente: UsuarioCliente | null;
  onSelectSlot: (cancha: Cancha, horario: HorarioSlot, fecha: string) => void;
  onRequireAuth: (cancha: Cancha, horario: HorarioSlot, fecha: string) => void;
  onLogoutCliente?: () => void;
  onOpenAdminLogin?: () => void;
  onOpenAuthModal?: () => void;
  onOpenMisPichangas?: () => void;
}

const TIPO_GRASS_TABS: { id: TipoGrass | 'todos'; label: string; iconEmoji: string }[] = [
  { id: 'todos', label: 'Todo Terreno', iconEmoji: '⚽' },
  { id: 'sintetico', label: 'Grass Sintético', iconEmoji: '🌱' },
  { id: 'natural', label: 'Grass Natural', iconEmoji: '🌾' },
];

const DIAS_FILTRO = [
  { id: 'hoy', label: 'Hoy', fechaStr: 'Hoy, 30 Ago' },
  { id: 'manana', label: 'Mañana', fechaStr: 'Mañana, 31 Ago' },
  { id: 'pasado', label: 'Martes', fechaStr: 'Martes, 1 Sep' },
];

export const HomePublic: React.FC<HomePublicProps> = ({
  canchas,
  usuarioCliente,
  onSelectSlot,
  onRequireAuth,
  onLogoutCliente,
  onOpenAdminLogin,
  onOpenAuthModal,
  onOpenMisPichangas,
}) => {
  const [grassActivo, setGrassActivo] = useState<TipoGrass | 'todos'>('todos');
  const [soloTechadas, setSoloTechadas] = useState(false);
  const [soloConLuz, setSoloConLuz] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(DIAS_FILTRO[0]);
  const [busqueda, setBusqueda] = useState('');

  const canchasFiltradas = canchas.filter((cancha) => {
    const matchGrass = grassActivo === 'todos' || cancha.tipoGrass === grassActivo;
    const matchTecho = !soloTechadas || cancha.techada;
    const matchLuz = !soloConLuz || cancha.iluminacion;
    const matchBusqueda =
      cancha.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      cancha.sector.toLowerCase().includes(busqueda.toLowerCase()) ||
      cancha.ubicacion.toLowerCase().includes(busqueda.toLowerCase()) ||
      cancha.formato.toLowerCase().includes(busqueda.toLowerCase());
    return matchGrass && matchTecho && matchLuz && matchBusqueda;
  });

  const handleSlotClick = (cancha: Cancha, slot: HorarioSlot) => {
    // Si está ocupado o bloqueado por mantenimiento/lluvia, no permitir acción
    if (!slot.disponible || slot.bloqueado) return;

    // [US-21] Si el usuario no está autenticado, requerir autenticación
    if (!usuarioCliente) {
      onRequireAuth(cancha, slot, diaSeleccionado.fechaStr);
    } else {
      onSelectSlot(cancha, slot, diaSeleccionado.fechaStr);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Banner Superior de Estado de Jugador */}
        {usuarioCliente ? (
          <View style={styles.clientStatusBar}>
            <View style={styles.clientStatusInfo}>
              <View style={styles.clientAvatar}>
                <User size={14} color="#10b981" />
              </View>
              <Text style={styles.clientStatusText}>
                Jugador: <Text style={{ color: '#f8fafc', fontWeight: '800' }}>{usuarioCliente.nombre}</Text>
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {onOpenMisPichangas && (
                <TouchableOpacity
                  style={styles.misPichangasBtn}
                  onPress={onOpenMisPichangas}
                  activeOpacity={0.8}
                >
                  <History size={13} color="#34d399" />
                  <Text style={styles.misPichangasBtnText}>Mis Pichangas</Text>
                </TouchableOpacity>
              )}
              {onLogoutCliente && (
                <TouchableOpacity
                  style={styles.clientLogoutBarBtn}
                  onPress={onLogoutCliente}
                  activeOpacity={0.8}
                >
                  <LogOut size={13} color="#f87171" />
                  <Text style={styles.clientLogoutBarBtnText}>Salir</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.guestNoticeBar}>
            <Text style={styles.guestNoticeText}>
              👋 Consulta la disponibilidad pública en tiempo real.
            </Text>
            {onOpenAuthModal && (
              <TouchableOpacity onPress={onOpenAuthModal} style={styles.guestLoginBtn}>
                <Text style={styles.guestLoginBtnText}>Iniciar Sesión</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Banner de Bienvenida */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.cajamarcaTag}>
              <Text style={styles.cajamarcaTagText}>📍 Cajamarca • Pichangas en Vivo</Text>
            </View>

            {onOpenAdminLogin && (
              <TouchableOpacity
                style={styles.adminAccessBadge}
                onPress={onOpenAdminLogin}
                activeOpacity={0.8}
              >
                <ShieldCheck size={13} color="#38bdf8" />
                <Text style={styles.adminAccessBadgeText}>Acceso Recepción</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.heroTitle}>Consulta de Disponibilidad</Text>
          <Text style={styles.heroSubtitle}>
            Revisa los horarios libres de las mejores canchas de Cajamarca y aparta tu turno al instante.
          </Text>
        </View>

        {/* Barra de Búsqueda */}
        <View style={styles.searchBar}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por complejo, grass o sector..."
            placeholderTextColor="#64748b"
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Text style={styles.clearSearchText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros: Tipo de Grass */}
        <View style={styles.grassTabsContainer}>
          {TIPO_GRASS_TABS.map((tab) => {
            const isActive = grassActivo === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.grassTabBtn, isActive && styles.grassTabBtnActive]}
                onPress={() => setGrassActivo(tab.id)}
              >
                <Text style={styles.grassTabEmoji}>{tab.iconEmoji}</Text>
                <Text style={[styles.grassTabText, isActive && styles.grassTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Toggles de Cobertura y Luz */}
        <View style={styles.togglesRow}>
          <TouchableOpacity
            style={[styles.togglePill, soloTechadas && styles.togglePillActive]}
            onPress={() => setSoloTechadas(!soloTechadas)}
          >
            <Umbrella size={14} color={soloTechadas ? '#10b981' : '#94a3b8'} />
            <Text style={[styles.togglePillText, soloTechadas && styles.togglePillTextActive]}>
              Techadas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.togglePill, soloConLuz && styles.togglePillActive]}
            onPress={() => setSoloConLuz(!soloConLuz)}
          >
            <Lightbulb size={14} color={soloConLuz ? '#10b981' : '#94a3b8'} />
            <Text style={[styles.togglePillText, soloConLuz && styles.togglePillTextActive]}>
              Con Luz LED
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selector de Día */}
        <View style={styles.diaSelectorContainer}>
          <View style={styles.diaHeader}>
            <Calendar size={14} color="#10b981" />
            <Text style={styles.diaHeaderTitle}>Fecha del turno:</Text>
          </View>
          <View style={styles.diasRow}>
            {DIAS_FILTRO.map((dia) => {
              const isSelected = diaSeleccionado.id === dia.id;
              return (
                <TouchableOpacity
                  key={dia.id}
                  style={[styles.diaPill, isSelected && styles.diaPillActive]}
                  onPress={() => setDiaSeleccionado(dia)}
                >
                  <Text style={[styles.diaPillText, isSelected && styles.diaPillTextActive]}>
                    {dia.label} ({dia.fechaStr.split(',')[1]?.trim()})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Encabezado Lista de Canchas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Canchas y Complejos</Text>
          <Text style={styles.sectionSubtitle}>{canchasFiltradas.length} disponibles</Text>
        </View>

        {/* Lista de Canchas con Grilla Interactiva */}
        {canchasFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No hay canchas con estos filtros</Text>
            <Text style={styles.emptySubtitle}>Prueba ajustando la búsqueda o el tipo de terreno.</Text>
          </View>
        ) : (
          canchasFiltradas.map((cancha) => {
            const primerHorarioLibre = cancha.horarios.find((h) => h.disponible && !h.bloqueado);

            return (
              <View key={cancha.id} style={styles.canchaCard}>
                {/* Imagen del Complejo */}
                <View style={styles.imageContainer}>
                  <Image source={{ uri: cancha.imagenUrl }} style={styles.canchaImage} />

                  {/* Badge Tipo Grass */}
                  <View
                    style={[
                      styles.grassTag,
                      cancha.tipoGrass === 'sintetico' ? styles.grassTagSintetico : styles.grassTagNatural,
                    ]}
                  >
                    <Text style={styles.grassTagText}>
                      {cancha.tipoGrass === 'sintetico' ? '🌱 SINTÉTICO' : '🌾 NATURAL'} • {cancha.formato}
                    </Text>
                  </View>
                </View>

                {/* Info Card */}
                <View style={styles.canchaBody}>
                  <Text style={styles.canchaName}>{cancha.nombre}</Text>

                  <View style={styles.locationRow}>
                    <MapPin size={14} color="#10b981" />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {cancha.sector} • {cancha.ubicacion}
                    </Text>
                  </View>

                  {/* Badges de características */}
                  <View style={styles.keyBadgesRow}>
                    <View
                      style={[
                        styles.featureBadge,
                        cancha.techada ? styles.featureBadgeActive : styles.featureBadgeNeutral,
                      ]}
                    >
                      {cancha.techada ? (
                        <>
                          <Umbrella size={12} color="#34d399" />
                          <Text style={styles.featureBadgeTextActive}>Techada</Text>
                        </>
                      ) : (
                        <>
                          <Sun size={12} color="#94a3b8" />
                          <Text style={styles.featureBadgeTextNeutral}>Al Aire Libre</Text>
                        </>
                      )}
                    </View>

                    <View
                      style={[
                        styles.featureBadge,
                        cancha.iluminacion ? styles.featureBadgeActive : styles.featureBadgeNeutral,
                      ]}
                    >
                      {cancha.iluminacion ? (
                        <>
                          <Lightbulb size={12} color="#34d399" />
                          <Text style={styles.featureBadgeTextActive}>Con Luz LED</Text>
                        </>
                      ) : (
                        <>
                          <Sun size={12} color="#94a3b8" />
                          <Text style={styles.featureBadgeTextNeutral}>Solo Diurno</Text>
                        </>
                      )}
                    </View>

                    {cancha.estacionamiento && (
                      <View style={[styles.featureBadge, styles.featureBadgeNeutral]}>
                        <Car size={12} color="#94a3b8" />
                        <Text style={styles.featureBadgeTextNeutral}>Cochera</Text>
                      </View>
                    )}
                  </View>

                  {/* [US-15] Grilla Interactiva de Horarios con Soporte de Bloqueo por Lluvia/Mantenimiento */}
                  <View style={styles.slotsSection}>
                    <View style={styles.slotsHeaderRow}>
                      <View style={styles.slotsTitleRow}>
                        <Clock size={14} color="#94a3b8" />
                        <Text style={styles.slotsTitle}>Horarios en tiempo real:</Text>
                      </View>
                      <View style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                        <Text style={styles.legendText}>Libre</Text>
                        <View style={[styles.legendDot, { backgroundColor: '#475569', marginLeft: 6 }]} />
                        <Text style={styles.legendText}>Ocupado</Text>
                        <View style={[styles.legendDot, { backgroundColor: '#f59e0b', marginLeft: 6 }]} />
                        <Text style={styles.legendText}>Bloqueado</Text>
                      </View>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotsScroll}>
                      {cancha.horarios.map((slot) => {
                        const isBloqueado = Boolean(slot.bloqueado);
                        const isOcupado = !slot.disponible && !isBloqueado;
                        const isLibre = slot.disponible && !isBloqueado;

                        return (
                          <TouchableOpacity
                            key={slot.id}
                            disabled={!isLibre}
                            onPress={() => handleSlotClick(cancha, slot)}
                            style={[
                              styles.slotCard,
                              isOcupado && styles.slotCardOcupado,
                              isBloqueado && styles.slotCardBloqueado,
                            ]}
                            activeOpacity={isLibre ? 0.7 : 1}
                          >
                            <View style={styles.slotTopRow}>
                              {isBloqueado ? (
                                <Lock size={11} color="#94a3b8" style={{ marginRight: 3 }} />
                              ) : null}
                              <Text
                                style={[
                                  styles.slotTimeText,
                                  isOcupado && styles.slotTimeTextOcupado,
                                  isBloqueado && styles.slotTimeTextBloqueado,
                                ]}
                              >
                                {slot.horaInicio}
                              </Text>
                            </View>

                            {isLibre ? (
                              <Text style={styles.slotPriceText}>S/ {slot.precio}</Text>
                            ) : isBloqueado ? (
                              <View style={styles.slotBloqueoReasonBadge}>
                                <Text style={styles.slotBloqueoReasonText} numberOfLines={1}>
                                  {slot.motivoBloqueo || 'Bloqueado'}
                                </Text>
                              </View>
                            ) : (
                              <Text style={styles.slotPriceTextOcupado}>Ocupado</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Botón de Acción Rápida */}
                  {primerHorarioLibre && (
                    <TouchableOpacity
                      style={styles.bookActionBtn}
                      onPress={() => handleSlotClick(cancha, primerHorarioLibre)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.bookActionBtnText}>
                        Apartar {primerHorarioLibre.horaInicio} (S/ {primerHorarioLibre.precio})
                      </Text>
                      <CheckCircle2 size={16} color="#090d16" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  clientStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  clientStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientStatusText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  misPichangasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  misPichangasBtnText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  clientLogoutBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clientLogoutBarBtnText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
  guestNoticeBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  guestNoticeText: {
    color: '#94a3b8',
    fontSize: 11,
    flex: 1,
  },
  guestLoginBtn: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  guestLoginBtnText: {
    color: '#090d16',
    fontSize: 11,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  cajamarcaTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cajamarcaTagText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '700',
  },
  adminAccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  adminAccessBadgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#f9fafb',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#f3f4f6',
    fontSize: 14,
    marginLeft: 10,
  },
  clearSearchText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  grassTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  grassTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 4,
  },
  grassTabBtnActive: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  grassTabEmoji: {
    fontSize: 12,
  },
  grassTabText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  grassTabTextActive: {
    color: '#34d399',
    fontWeight: '700',
  },
  togglesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  togglePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#111827',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  togglePillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10b981',
  },
  togglePillText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  togglePillTextActive: {
    color: '#34d399',
    fontWeight: '700',
  },
  diaSelectorContainer: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 16,
  },
  diaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  diaHeaderTitle: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  diasRow: {
    flexDirection: 'row',
    gap: 8,
  },
  diaPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
  },
  diaPillActive: {
    backgroundColor: '#10b981',
  },
  diaPillText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  diaPillTextActive: {
    color: '#090d16',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#6b7280',
    fontSize: 12,
  },
  canchaCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 18,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 150,
    position: 'relative',
    backgroundColor: '#1f2937',
  },
  canchaImage: {
    width: '100%',
    height: '100%',
  },
  grassTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  grassTagSintetico: {
    backgroundColor: '#10b981',
  },
  grassTagNatural: {
    backgroundColor: '#15803d',
  },
  grassTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  canchaBody: {
    padding: 16,
  },
  canchaName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  locationText: {
    color: '#9ca3af',
    fontSize: 12,
    flex: 1,
  },
  keyBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  featureBadgeNeutral: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  featureBadgeTextActive: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '600',
  },
  featureBadgeTextNeutral: {
    color: '#94a3b8',
    fontSize: 11,
  },
  slotsSection: {
    backgroundColor: '#090d16',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 12,
  },
  slotsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slotsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotsTitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  legendText: {
    color: '#6b7280',
    fontSize: 10,
  },
  slotsScroll: {
    marginHorizontal: -4,
  },
  slotCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    minWidth: 92,
  },
  slotCardOcupado: {
    backgroundColor: '#1f2937',
    borderColor: '#27272a',
    opacity: 0.5,
  },
  slotCardBloqueado: {
    backgroundColor: '#1e293b',
    borderColor: '#475569',
    opacity: 0.65,
  },
  slotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  slotTimeText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '700',
  },
  slotTimeTextOcupado: {
    color: '#6b7280',
    fontWeight: '500',
  },
  slotTimeTextBloqueado: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  slotPriceText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  slotPriceTextOcupado: {
    color: '#4b5563',
    fontSize: 11,
  },
  slotBloqueoReasonBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    maxWidth: 96,
  },
  slotBloqueoReasonText: {
    color: '#e2e8f0',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  bookActionBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 11,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookActionBtnText: {
    color: '#090d16',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    backgroundColor: '#111827',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
  },
});
