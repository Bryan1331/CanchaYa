import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  TextInput,
} from 'react-native';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Car,
  Umbrella,
  Lightbulb,
  MessageCircle,
  Trophy,
  Flame,
  Calendar,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Sun,
  Shirt,
  Disc,
} from 'lucide-react-native';
import { Cancha, HorarioSlot, TipoGrass, Torneo } from '../types';

interface HomePublicProps {
  canchas: Cancha[];
  torneos: Torneo[];
  onSelectSlot: (cancha: Cancha, horario: HorarioSlot, fecha: string) => void;
}

const TIPO_GRASS_TABS: { id: TipoGrass | 'todos'; label: string; iconEmoji: string }[] = [
  { id: 'todos', label: 'Todo Tipo de Grass', iconEmoji: '⚽' },
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
  torneos,
  onSelectSlot,
}) => {
  const [grassActivo, setGrassActivo] = useState<TipoGrass | 'todos'>('todos');
  const [soloTechadas, setSoloTechadas] = useState(false);
  const [soloConLuz, setSoloConLuz] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(DIAS_FILTRO[0]);
  const [busqueda, setBusqueda] = useState('');
  const [selectedSlotByCancha, setSelectedSlotByCancha] = useState<{ [canchaId: string]: string }>({});

  const canchasFiltradas = canchas.filter((cancha) => {
    const matchGrass = grassActivo === 'todos' || cancha.tipoGrass === grassActivo;
    const matchTecho = !soloTechadas || cancha.techada;
    const matchLuz = !soloConLuz || cancha.iluminacion;
    const matchBusqueda =
      cancha.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      cancha.sector.toLowerCase().includes(busqueda.toLowerCase()) ||
      cancha.ubicacion.toLowerCase().includes(busqueda.toLowerCase()) ||
      cancha.formato.toLowerCase().includes(busqueda.toLowerCase()) ||
      cancha.tipoSuperficie.toLowerCase().includes(busqueda.toLowerCase());
    return matchGrass && matchTecho && matchLuz && matchBusqueda;
  });

  const handleOpenWhatsApp = () => {
    const phone = '51976543210';
    const message = encodeURIComponent('¡Hola CanchaYA Cajamarca! ⚽ Quisiera consultar disponibilidad y promociones para reservar una cancha de fútbol para una pichanga.');
    Linking.openURL(`https://wa.me/${phone}?text=${message}`).catch(() => {
      Linking.openURL(`whatsapp://send?phone=${phone}&text=${message}`);
    });
  };

  const handleSlotClick = (cancha: Cancha, slot: HorarioSlot) => {
    if (!slot.disponible) return;
    setSelectedSlotByCancha((prev) => ({
      ...prev,
      [cancha.id]: slot.id,
    }));
  };

  const handleReservarDirecto = (cancha: Cancha) => {
    const slotId = selectedSlotByCancha[cancha.id];
    const slot = cancha.horarios.find((h) => h.id === slotId) || cancha.horarios.find((h) => h.disponible);
    if (slot) {
      onSelectSlot(cancha, slot, diaSeleccionado.fechaStr);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Hero Banner Cajamarca */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.cajamarcaTag}>
              <Text style={styles.cajamarcaTagText}>📍 Cajamarca • Pichangas & Torneos</Text>
            </View>
            <Text style={styles.heroTitle}>Reserva tu Cancha de Fútbol en Cajamarca</Text>
            <Text style={styles.heroSubtitle}>
              Campos de Grass Sintético y Césped Natural en Baños del Inca, Qhapaq Ñan y alrededores. Con balón y chalecos incluidos.
            </Text>
          </View>
        </View>

        {/* Barra de Búsqueda */}
        <View style={styles.searchBar}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por complejo, sector (Baños del Inca, Qhapaq Ñan...)"
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

        {/* Filtro: Tipo de Grass */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tipo de Terreno / Grass</Text>
          <Text style={styles.sectionSubtitle}>{canchasFiltradas.length} canchas</Text>
        </View>

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
              Solo Techadas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.togglePill, soloConLuz && styles.togglePillActive]}
            onPress={() => setSoloConLuz(!soloConLuz)}
          >
            <Lightbulb size={14} color={soloConLuz ? '#10b981' : '#94a3b8'} />
            <Text style={[styles.togglePillText, soloConLuz && styles.togglePillTextActive]}>
              Luz Nocturna
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selector de Día Rápido */}
        <View style={styles.diaSelectorContainer}>
          <View style={styles.diaHeader}>
            <Calendar size={15} color="#10b981" />
            <Text style={styles.diaHeaderTitle}>Fecha de la pichanga:</Text>
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

        {/* Torneos de Fútbol en Cajamarca */}
        {torneos.length > 0 && (
          <View style={styles.torneoBannerContainer}>
            <View style={styles.torneoBannerHeader}>
              <View style={styles.torneoTitleRow}>
                <Trophy size={16} color="#f59e0b" />
                <Text style={styles.torneoBannerTitle}>Torneos y Copas en Cajamarca</Text>
              </View>
              <Text style={styles.torneoBadge}>Inscripciones</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.torneosScroll}>
              {torneos.map((torneo) => (
                <View key={torneo.id} style={styles.torneoCard}>
                  <Text style={styles.torneoCardTitle}>{torneo.titulo}</Text>
                  <Text style={styles.torneoCardCat}>
                    ⚽ {torneo.formato} • {torneo.categoria}
                  </Text>
                  <View style={styles.torneoPrizeRow}>
                    <Text style={styles.torneoPrizeLabel}>Premio:</Text>
                    <Text style={styles.torneoPrizeValue}>{torneo.premio}</Text>
                  </View>
                  <View style={styles.torneoMetaRow}>
                    <Text style={styles.torneoInscritos}>
                      {torneo.equiposInscritos}/{torneo.maxEquipos} equipos
                    </Text>
                    <Text style={styles.torneoPrice}>S/ {torneo.inscripcion} x eq.</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Lista de Complejos de Fútbol */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Canchas Disponibles</Text>
          <Text style={styles.sectionSubtitle}>Turnos en tiempo real</Text>
        </View>

        {canchasFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No se encontraron canchas con estos filtros</Text>
            <Text style={styles.emptySubtitle}>
              Prueba desactivando los filtros de techada o tipo de grass.
            </Text>
          </View>
        ) : (
          canchasFiltradas.map((cancha) => {
            const selectedSlotId = selectedSlotByCancha[cancha.id] || cancha.horarios.find((h) => h.disponible)?.id;
            const currentSelectedSlot = cancha.horarios.find((h) => h.id === selectedSlotId);

            return (
              <View key={cancha.id} style={styles.canchaCard}>
                {/* Imagen del Complejo */}
                <View style={styles.imageContainer}>
                  <Image source={{ uri: cancha.imagenUrl }} style={styles.canchaImage} />
                  <View style={styles.ratingBadge}>
                    <Star size={13} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.ratingText}>{cancha.calificacion.toFixed(1)}</Text>
                  </View>
                  
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

                  <Text style={styles.superficieText}>
                    🏟️ {cancha.tipoSuperficie}
                  </Text>

                  {/* Badges Clave: Techo, Luz, Balón, Chalecos */}
                  <View style={styles.keyBadgesRow}>
                    {/* Badge Techo */}
                    <View style={[styles.featureBadge, cancha.techada ? styles.featureBadgeActive : styles.featureBadgeNeutral]}>
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

                    {/* Badge Luz */}
                    <View style={[styles.featureBadge, cancha.iluminacion ? styles.featureBadgeActive : styles.featureBadgeNeutral]}>
                      {cancha.iluminacion ? (
                        <>
                          <Lightbulb size={12} color="#34d399" />
                          <Text style={styles.featureBadgeTextActive}>Luz LED Nocturna</Text>
                        </>
                      ) : (
                        <>
                          <Sun size={12} color="#94a3b8" />
                          <Text style={styles.featureBadgeTextNeutral}>Solo Diurno</Text>
                        </>
                      )}
                    </View>

                    {/* Badge Cochera */}
                    {cancha.estacionamiento && (
                      <View style={[styles.featureBadge, styles.featureBadgeNeutral]}>
                        <Car size={12} color="#94a3b8" />
                        <Text style={styles.featureBadgeTextNeutral}>Cochera</Text>
                      </View>
                    )}
                  </View>

                  {/* Opciones de Fútbol Incluidas */}
                  <View style={styles.footballIncludedBox}>
                    <Text style={styles.footballIncludedTitle}>⚽ Equipamiento incluido gratis:</Text>
                    <View style={styles.footballIncludedList}>
                      {cancha.incluyeBalon && (
                        <Text style={styles.footballIncludedItem}>✓ Balón Oficial Puma/Adidas</Text>
                      )}
                      {cancha.incluyeChalecos && (
                        <Text style={styles.footballIncludedItem}>✓ Juego de 12 Chalecos</Text>
                      )}
                      {cancha.duchasCalientes && (
                        <Text style={styles.footballIncludedItem}>✓ Duchas con agua caliente</Text>
                      )}
                    </View>
                  </View>

                  {/* Bloques de Horarios */}
                  <View style={styles.slotsSection}>
                    <View style={styles.slotsHeaderRow}>
                      <View style={styles.slotsTitleRow}>
                        <Clock size={14} color="#94a3b8" />
                        <Text style={styles.slotsTitle}>Horarios ({diaSeleccionado.label}):</Text>
                      </View>
                      <View style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                        <Text style={styles.legendText}>Libre</Text>
                        <View style={[styles.legendDot, { backgroundColor: '#475569', marginLeft: 8 }]} />
                        <Text style={styles.legendText}>Ocupado</Text>
                      </View>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotsScroll}>
                      {cancha.horarios.map((slot) => {
                        const isSelected = selectedSlotId === slot.id && slot.disponible;
                        return (
                          <TouchableOpacity
                            key={slot.id}
                            disabled={!slot.disponible}
                            onPress={() => handleSlotClick(cancha, slot)}
                            style={[
                              styles.slotCard,
                              !slot.disponible && styles.slotCardDisabled,
                              isSelected && styles.slotCardSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.slotTimeText,
                                !slot.disponible && styles.slotTimeTextDisabled,
                                isSelected && styles.slotTimeTextSelected,
                              ]}
                            >
                              {slot.horaInicio}
                            </Text>
                            <Text
                              style={[
                                styles.slotPriceText,
                                !slot.disponible && styles.slotPriceTextDisabled,
                                isSelected && styles.slotPriceTextSelected,
                              ]}
                            >
                              {slot.disponible ? `S/ ${slot.precio}` : 'Ocupado'}
                            </Text>
                            {isSelected && (
                              <View style={styles.checkIcon}>
                                <CheckCircle2 size={12} color="#0f172a" />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Botón de Acción Directo */}
                  <TouchableOpacity
                    style={styles.bookActionBtn}
                    onPress={() => handleReservarDirecto(cancha)}
                  >
                    <Text style={styles.bookActionBtnText}>
                      Reservar {currentSelectedSlot ? `${currentSelectedSlot.horaInicio} (S/ ${currentSelectedSlot.precio})` : 'Horario'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Botón Flotante de WhatsApp Cajamarca */}
      <TouchableOpacity
        style={styles.floatingWhatsApp}
        activeOpacity={0.85}
        onPress={handleOpenWhatsApp}
      >
        <View style={styles.whatsappIconBg}>
          <MessageCircle size={26} color="#ffffff" fill="#25d366" />
        </View>
        <View style={styles.floatingLabel}>
          <Text style={styles.floatingWhatsAppText}>WhatsApp Pichangas</Text>
          <Text style={styles.floatingWhatsAppSub}>Cajamarca</Text>
        </View>
      </TouchableOpacity>
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
  heroCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroContent: {
    zIndex: 1,
  },
  cajamarcaTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cajamarcaTagText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#f9fafb',
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 6,
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
    marginBottom: 16,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
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
  grassTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  grassTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 10,
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
    fontSize: 13,
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
    marginBottom: 16,
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
    marginBottom: 18,
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
  torneoBannerContainer: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 20,
  },
  torneoBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  torneoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  torneoBannerTitle: {
    color: '#f4f4f5',
    fontSize: 14,
    fontWeight: '700',
  },
  torneoBadge: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  torneosScroll: {
    marginHorizontal: -4,
  },
  torneoCard: {
    width: 230,
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  torneoCardTitle: {
    color: '#fafafa',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  torneoCardCat: {
    color: '#a1a1aa',
    fontSize: 11,
    marginBottom: 8,
  },
  torneoPrizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  torneoPrizeLabel: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '600',
  },
  torneoPrizeValue: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: '700',
  },
  torneoMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#3f3f46',
    paddingTop: 6,
  },
  torneoInscritos: {
    color: '#71717a',
    fontSize: 10,
  },
  torneoPrice: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  canchaCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 160,
    position: 'relative',
    backgroundColor: '#1f2937',
  },
  canchaImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  grassTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
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
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  locationText: {
    color: '#9ca3af',
    fontSize: 12,
    flex: 1,
  },
  superficieText: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 10,
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
    color: '#9ca3af',
    fontSize: 11,
  },
  footballIncludedBox: {
    backgroundColor: '#090d16',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  footballIncludedTitle: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  footballIncludedList: {
    gap: 2,
  },
  footballIncludedItem: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  slotsSection: {
    backgroundColor: '#090d16',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 14,
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
    borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    minWidth: 90,
    position: 'relative',
  },
  slotCardDisabled: {
    backgroundColor: '#1f2937',
    borderColor: '#27272a',
    opacity: 0.5,
  },
  slotCardSelected: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  slotTimeText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  slotTimeTextDisabled: {
    color: '#6b7280',
  },
  slotTimeTextSelected: {
    color: '#34d399',
    fontWeight: '700',
  },
  slotPriceText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  slotPriceTextDisabled: {
    color: '#4b5563',
  },
  slotPriceTextSelected: {
    color: '#ffffff',
  },
  checkIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  bookActionBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookActionBtnText: {
    color: '#090d16',
    fontSize: 14,
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
  floatingWhatsApp: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25d366',
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 16,
    borderRadius: 30,
    shadowColor: '#25d366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 999,
  },
  whatsappIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#128c7e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  floatingLabel: {},
  floatingWhatsAppText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  floatingWhatsAppSub: {
    color: '#e6fffa',
    fontSize: 10,
    fontWeight: '600',
  },
});
