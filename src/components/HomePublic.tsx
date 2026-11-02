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
  User,
  History,
  LogOut,
  Star,
  Info,
  ChevronRight,
  Navigation,
  Sparkles,
} from 'lucide-react-native';
import { Cancha, HorarioSlot, TipoGrass, UsuarioCliente, ResenaCancha } from '../types';
import { calcularTarifaDinamica } from '../utils/pricing';

interface HomePublicProps {
  canchas: Cancha[];
  resenas?: ResenaCancha[];
  usuarioCliente: UsuarioCliente | null;
  isAdmin?: boolean;
  onSelectSlot: (cancha: Cancha, horario: HorarioSlot, fecha: string) => void;
  onRequireAuth: (cancha: Cancha, horario: HorarioSlot, fecha: string) => void;
  onOpenFichaCancha?: (cancha: Cancha) => void;
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
  { id: 'hoy', label: 'Hoy', fechaStr: 'Hoy, 30 Ago', tipo: 'Día de Semana' },
  { id: 'manana', label: 'Mañana', fechaStr: 'Mañana, 31 Ago', tipo: 'Día de Semana' },
  { id: 'sabado', label: 'Sábado', fechaStr: 'Sábado, 2 Sep', tipo: 'Fin de Semana' },
  { id: 'domingo', label: 'Domingo', fechaStr: 'Domingo, 3 Sep', tipo: 'Fin de Semana' },
];

export const HomePublic: React.FC<HomePublicProps> = ({
  canchas,
  resenas = [],
  usuarioCliente,
  isAdmin = false,
  onSelectSlot,
  onRequireAuth,
  onOpenFichaCancha,
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
    const grassActual = cancha.tipoGrass || 'sintetico';
    const matchGrass = grassActivo === 'todos' || grassActual === grassActivo;
    const matchTecho =
      !soloTechadas ||
      Boolean(
        cancha.techada ??
          cancha.servicios?.some((s) => s.toLowerCase().includes('tech') || s.toLowerCase().includes('cubiert'))
      );
    const matchLuz =
      !soloConLuz ||
      Boolean(
        cancha.iluminacion ??
          cancha.servicios?.some(
            (s) =>
              s.toLowerCase().includes('luz') ||
              s.toLowerCase().includes('iluminac') ||
              s.toLowerCase().includes('nocturn')
          )
      );

    const busq = busqueda.toLowerCase();
    const matchBusqueda =
      (cancha.nombre || '').toLowerCase().includes(busq) ||
      (cancha.sector || '').toLowerCase().includes(busq) ||
      (cancha.ubicacion || '').toLowerCase().includes(busq) ||
      (cancha.direccion || '').toLowerCase().includes(busq) ||
      (cancha.formato || '').toLowerCase().includes(busq) ||
      (cancha.establecimiento || '').toLowerCase().includes(busq) ||
      (cancha.localNombre || '').toLowerCase().includes(busq);
    return matchGrass && matchTecho && matchLuz && matchBusqueda;
  });

  const handleSlotClick = (cancha: Cancha, slot: HorarioSlot) => {
    if (!slot.disponible || slot.bloqueado) return;

    // [US-16] Aplicar tarifa dinámica calculada al slot
    const tarifa = calcularTarifaDinamica(cancha, slot, diaSeleccionado.fechaStr);
    const slotDinamico: HorarioSlot = {
      ...slot,
      precio: tarifa.precioTotal,
      precioDinamico: tarifa.precioTotal,
    };

    if (!usuarioCliente) {
      onRequireAuth(cancha, slotDinamico, diaSeleccionado.fechaStr);
    } else {
      onSelectSlot(cancha, slotDinamico, diaSeleccionado.fechaStr);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Barra de Estado de Jugador */}
        {!isAdmin && usuarioCliente?.rol !== 'admin' && (
          usuarioCliente ? (
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
                👋 Grilla pública en vivo con tarifas dinámicas.
              </Text>
              {onOpenAuthModal && (
                <TouchableOpacity onPress={onOpenAuthModal} style={styles.guestLoginBtn}>
                  <Text style={styles.guestLoginBtnText}>Iniciar Sesión</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        )}

        {/* Banner de Bienvenida */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.cajamarcaTag}>
              <Text style={styles.cajamarcaTagText}>📍 Cajamarca • Pichangas en Vivo</Text>
            </View>

            {(isAdmin || usuarioCliente?.rol === 'admin' || usuarioCliente?.rol === 'recepcion') && onOpenAdminLogin && (
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

          <Text style={styles.heroTitle}>Reserva tu Cancha Deportiva</Text>
          <Text style={styles.heroSubtitle}>
            Ajuste dinámico por franja horaria (día/noche con luz) y fines de semana. Aparta con 50% de adelanto.
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

        {/* [US-16] Selector de Día (Día de Semana vs Fin de Semana) */}
        <View style={styles.diaSelectorContainer}>
          <View style={styles.diaHeader}>
            <Calendar size={14} color="#10b981" />
            <Text style={styles.diaHeaderTitle}>Fecha del turno (Ajuste dinámico):</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.diasRow}>
            {DIAS_FILTRO.map((dia) => {
              const isSelected = diaSeleccionado.id === dia.id;
              return (
                <TouchableOpacity
                  key={dia.id}
                  style={[styles.diaPill, isSelected && styles.diaPillActive]}
                  onPress={() => setDiaSeleccionado(dia)}
                >
                  <Text style={[styles.diaPillText, isSelected && styles.diaPillTextActive]}>
                    {dia.label}
                  </Text>
                  <Text style={[styles.diaPillSub, isSelected && styles.diaPillSubActive]}>
                    {dia.tipo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
            const primerHorarioLibre = (cancha.horarios || []).find((h) => h.disponible && !h.bloqueado);

            // Recalcular promedio de estrellas si hay reseñas asociadas [US-23]
            const resenasCancha = resenas.filter((r) => String(r.canchaId) === String(cancha.id));
            const promedioEstrellas =
              resenasCancha.length > 0
                ? (
                    resenasCancha.reduce((acc, curr) => acc + curr.estrellas, 0) /
                    resenasCancha.length
                  ).toFixed(1)
                : (cancha.calificacionPromedio || cancha.estrellas || 4.8).toFixed(1);
            const totalResenas = resenasCancha.length > 0 ? resenasCancha.length : (cancha.totalResenas || 20);

            // Dynamic pricing del primer horario libre
            const tarifaPrimer = primerHorarioLibre
              ? calcularTarifaDinamica(cancha, primerHorarioLibre, diaSeleccionado.fechaStr)
              : null;

            const fotoPrincipal = (cancha.imagenes && cancha.imagenes[0]) || cancha.imagenUrl;
            const formatoTexto = cancha.formato || 'Fútbol 7';
            const tipoGrassTexto = cancha.tipoGrass === 'natural' ? '🌾 NATURAL' : '🌱 SINTÉTICO';

            return (
              <View key={cancha.id} style={styles.canchaCard}>
                {/* Imagen del Complejo con acceso a Ficha Detallada */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => onOpenFichaCancha && onOpenFichaCancha(cancha)}
                  style={styles.imageContainer}
                >
                  <Image source={{ uri: fotoPrincipal }} style={styles.canchaImage} />

                  {/* Badge Tipo Grass */}
                  <View
                    style={[
                      styles.grassTag,
                      cancha.tipoGrass === 'natural' ? styles.grassTagNatural : styles.grassTagSintetico,
                    ]}
                  >
                    <Text style={styles.grassTagText}>
                      {tipoGrassTexto} • {formatoTexto}
                    </Text>
                  </View>

                  {/* [US-23] Rating Badge de Estrellas */}
                  <View style={styles.ratingBadgeImage}>
                    <Star size={11} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.ratingBadgeImageText}>{promedioEstrellas}</Text>
                    <Text style={styles.ratingBadgeTotalText}>({totalResenas})</Text>
                  </View>
                </TouchableOpacity>

                {/* Info Card */}
                <View style={styles.canchaBody}>
                  <View style={styles.titleRatingRow}>
                    <View style={{ flex: 1, paddingRight: 6 }}>
                      <Text style={styles.canchaName}>{cancha.establecimiento || cancha.localNombre || cancha.nombre}</Text>
                      <Text style={styles.canchaLocalSub}>{cancha.nombre}</Text>
                    </View>
                  </View>

                  <View style={styles.locationRow}>
                    <MapPin size={13} color="#10b981" />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {cancha.direccion || `${cancha.sector || ''} • ${cancha.ubicacion || ''}`}
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

                  {/* [US-07 / US-18] Botón para ver Ficha Completa (Galería, Servicios y GPS) */}
                  {onOpenFichaCancha && (
                    <TouchableOpacity
                      style={styles.btnVerFicha}
                      onPress={() => onOpenFichaCancha(cancha)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Info size={13} color="#38bdf8" />
                        <Text style={styles.btnVerFichaText}>
                          Ver Galería ({(cancha.imagenes || cancha.galeriaFotos)?.length || 2} fotos), Servicios & GPS
                        </Text>
                      </View>
                      <ChevronRight size={13} color="#38bdf8" />
                    </TouchableOpacity>
                  )}

                  {/* [US-16] Grilla Interactiva con Dynamic Pricing recalculado en vivo */}
                  <View style={styles.slotsSection}>
                    <View style={styles.slotsHeaderRow}>
                      <View style={styles.slotsTitleRow}>
                        <Clock size={14} color="#94a3b8" />
                        <Text style={styles.slotsTitle}>Horarios (Tarifa Dinámica):</Text>
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
                      {(cancha.horarios || []).map((slot) => {
                        const isBloqueado = Boolean(slot.bloqueado);
                        const isOcupado = !slot.disponible && !isBloqueado;
                        const isLibre = slot.disponible && !isBloqueado;

                        // [US-16] Cálculo dinámico de tarifa por slot y tipo de día
                        const tarifaSlot = calcularTarifaDinamica(
                          cancha,
                          slot,
                          diaSeleccionado.fechaStr
                        );

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
                              <View style={{ alignItems: 'center' }}>
                                <Text style={styles.slotPriceText}>S/ {tarifaSlot.precioTotal}</Text>
                                <Text style={styles.slotAdelantoMini}>
                                  Adelanto S/ {tarifaSlot.montoAdelanto}
                                </Text>
                              </View>
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

                  {/* Botón de Acción Rápida con Precio Dinámico */}
                  {primerHorarioLibre && tarifaPrimer && (
                    <TouchableOpacity
                      style={styles.bookActionBtn}
                      onPress={() => handleSlotClick(cancha, primerHorarioLibre)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.bookActionBtnText}>
                        Apartar {primerHorarioLibre.horaInicio} (Total S/ {tarifaPrimer.precioTotal} • Adelanto S/ {tarifaPrimer.montoAdelanto})
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
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  clientStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  clientAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
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
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  clientLogoutBarBtnText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
  guestNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  guestNoticeText: {
    color: '#94a3b8',
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  guestLoginBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  guestLoginBtnText: {
    color: '#090d16',
    fontSize: 11,
    fontWeight: '800',
  },
  heroCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cajamarcaTag: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cajamarcaTagText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  adminAccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adminAccessBadgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    marginLeft: 8,
  },
  clearSearchText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
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
    gap: 6,
    backgroundColor: '#1e293b',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  grassTabBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  grassTabEmoji: {
    fontSize: 13,
  },
  grassTabText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  grassTabTextActive: {
    color: '#34d399',
  },
  togglesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  togglePill: {
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
  togglePillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  togglePillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  togglePillTextActive: {
    color: '#34d399',
  },
  diaSelectorContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  diaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  diaHeaderTitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  diasRow: {
    flexDirection: 'row',
  },
  diaPill: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  diaPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  diaPillText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  diaPillTextActive: {
    color: '#34d399',
  },
  diaPillSub: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  diaPillSubActive: {
    color: '#10b981',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 12,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 12,
  },
  canchaCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  imageContainer: {
    position: 'relative',
    height: 170,
    width: '100%',
  },
  canchaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  grassTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  grassTagSintetico: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  grassTagNatural: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
  },
  grassTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  ratingBadgeImage: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingBadgeImageText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
  },
  ratingBadgeTotalText: {
    color: '#94a3b8',
    fontSize: 9,
  },
  canchaBody: {
    padding: 14,
  },
  titleRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  canchaName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
  },
  canchaLocalSub: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  locationText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  keyBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    marginBottom: 8,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#0f172a',
  },
  featureBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  featureBadgeNeutral: {
    backgroundColor: '#0f172a',
  },
  featureBadgeTextActive: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
  },
  featureBadgeTextNeutral: {
    color: '#94a3b8',
    fontSize: 10,
  },
  btnVerFicha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 6,
  },
  btnVerFichaText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  slotsSection: {
    marginTop: 6,
    marginBottom: 10,
  },
  slotsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotsTitle: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    color: '#64748b',
    fontSize: 9,
    marginLeft: 3,
  },
  slotsScroll: {
    flexDirection: 'row',
  },
  slotCard: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    minWidth: 84,
  },
  slotCardOcupado: {
    opacity: 0.45,
    backgroundColor: '#0b1120',
  },
  slotCardBloqueado: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  slotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  slotTimeText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '800',
  },
  slotTimeTextOcupado: {
    color: '#64748b',
  },
  slotTimeTextBloqueado: {
    color: '#fbbf24',
  },
  slotPriceText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '900',
  },
  slotAdelantoMini: {
    color: '#64748b',
    fontSize: 8,
    marginTop: 1,
  },
  slotBloqueoReasonBadge: {
    backgroundColor: '#78350f',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  slotBloqueoReasonText: {
    color: '#fde68a',
    fontSize: 8,
    fontWeight: '700',
  },
  slotPriceTextOcupado: {
    color: '#64748b',
    fontSize: 10,
  },
  bookActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bookActionBtnText: {
    color: '#090d16',
    fontSize: 12,
    fontWeight: '900',
  },
});
