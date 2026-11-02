import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import {
  X,
  MapPin,
  Navigation,
  Star,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sun,
  Moon,
  Sparkles,
  MessageSquare,
  Building,
  Umbrella,
  Lightbulb,
  Car,
} from 'lucide-react-native';
import { Cancha, ResenaCancha, HorarioSlot } from '../types';

interface FichaCanchaModalProps {
  visible: boolean;
  cancha: Cancha | null;
  resenas: ResenaCancha[];
  fechaSeleccionada: string;
  onClose: () => void;
  onSelectSlot?: (cancha: Cancha, horario: HorarioSlot, fecha: string) => void;
}

const { width } = Dimensions.get('window');

export const FichaCanchaModal: React.FC<FichaCanchaModalProps> = ({
  visible,
  cancha,
  resenas,
  fechaSeleccionada,
  onClose,
  onSelectSlot,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!cancha) return null;

  // Filtrar reseñas de esta cancha
  const resenasCancha = resenas.filter((r) => String(r.canchaId) === String(cancha.id));

  // Recálculo del promedio general de estrellas [US-23]
  const promedioEstrellas =
    resenasCancha.length > 0
      ? (
          resenasCancha.reduce((acc, curr) => acc + curr.estrellas, 0) /
          resenasCancha.length
        ).toFixed(1)
      : (cancha.calificacionPromedio || cancha.estrellas || 4.8).toFixed(1);

  const totalComentarios = resenasCancha.length > 0 ? resenasCancha.length : (cancha.totalResenas || 0);

  const galeria =
    cancha.imagenes && cancha.imagenes.length > 0
      ? cancha.imagenes
      : cancha.galeriaFotos && cancha.galeriaFotos.length > 0
      ? cancha.galeriaFotos
      : [cancha.imagenUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800'];

  // [US-18] Botón "Cómo llegar" a Google Maps
  const handleComoLlegar = () => {
    Linking.openURL('https://www.google.com/maps/search/?api=1&query=' + cancha.coordenadas.lat + ',' + cancha.coordenadas.lng);
  };

  const primerHorarioLibre = (cancha.horarios || []).find((h) => h.disponible && !h.bloqueado);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Superior */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {cancha.establecimiento || cancha.localNombre}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {cancha.nombre}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* [US-07 / US-18] Carrusel / Galería Horizontal de Fotos Reales */}
            <View style={styles.galleryContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const offset = e.nativeEvent.contentOffset.x;
                  const index = Math.round(offset / (width - 40));
                  setActivePhotoIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {galeria.map((fotoUrl, idx) => (
                  <View key={`foto-${idx}`} style={styles.photoSlide}>
                    <Image source={{ uri: fotoUrl }} style={styles.galleryImage} />
                  </View>
                ))}
              </ScrollView>

              {/* Indicador de fotos */}
              <View style={styles.photoCounterBadge}>
                <Text style={styles.photoCounterText}>
                  📷 Foto {activePhotoIndex + 1} de {galeria.length}
                </Text>
              </View>

              {/* Tag Grass */}
              <View
                style={[
                  styles.grassTag,
                  cancha.tipoGrass === 'sintetico'
                    ? styles.grassTagSintetico
                    : styles.grassTagNatural,
                ]}
              >
                <Text style={styles.grassTagText}>
                  {cancha.tipoGrass === 'sintetico' ? '🌱 GRASS SINTÉTICO' : '🌾 GRASS NATURAL'} •{' '}
                  {cancha.formato}
                </Text>
              </View>
            </View>

            {/* Puntos del Carrusel */}
            {galeria.length > 1 && (
              <View style={styles.dotsRow}>
                {galeria.map((_, idx) => (
                  <View
                    key={`dot-${idx}`}
                    style={[styles.dot, activePhotoIndex === idx && styles.dotActive]}
                  />
                ))}
              </View>
            )}

            {/* Ficha Resumen con Calificación General */}
            <View style={styles.mainInfoCard}>
              <View style={styles.ratingRow}>
                <View style={styles.starsPill}>
                  <Star size={16} color="#fbbf24" fill="#fbbf24" />
                  <Text style={styles.ratingNumber}>{promedioEstrellas}</Text>
                  <Text style={styles.ratingTotalText}>/ 5.0</Text>
                </View>
                <Text style={styles.reviewsCountText}>
                  ({totalComentarios} {totalComentarios === 1 ? 'reseña verificada' : 'reseñas verificadas'})
                </Text>
              </View>

              <Text style={styles.surfaceText}>{cancha.tipoSuperficie}</Text>

              {/* [US-18] Dirección y Botón "Cómo llegar" */}
              <View style={styles.gpsCard}>
                <View style={styles.gpsInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MapPin size={16} color="#10b981" />
                    <Text style={styles.gpsSectorTitle}>{cancha.sector || cancha.direccion}</Text>
                  </View>
                  <Text style={styles.gpsAddressText}>{cancha.ubicacion || cancha.direccion}</Text>
                </View>

                <TouchableOpacity
                  style={styles.btnComoLlegar}
                  onPress={handleComoLlegar}
                  activeOpacity={0.8}
                >
                  <Navigation size={15} color="#090d16" />
                  <Text style={styles.btnComoLlegarText}>Cómo llegar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* [US-16] Bloque de Tarifas Dinámicas */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionTitleRow}>
                <Clock size={16} color="#10b981" />
                <Text style={styles.sectionTitle}>Tarifas por Franja Horaria (Dynamic Pricing)</Text>
              </View>
              <Text style={styles.sectionDesc}>
                La tarifa varía de forma justa según el horario y día de reserva.
              </Text>

              <View style={styles.pricingGrid}>
                <View style={styles.pricingCard}>
                  <View style={styles.pricingCardHeader}>
                    <Sun size={14} color="#f59e0b" />
                    <Text style={styles.pricingCardTitle}>Turno Día (Sin luz)</Text>
                  </View>
                  <Text style={styles.pricingHours}>08:00 AM - 06:00 PM</Text>
                  <Text style={styles.pricingPrice}>
                    S/ {cancha.precioDia || cancha.reglasTarifas?.precioDiaSemana || 50}.00
                  </Text>
                  <Text style={styles.pricingSub}>
                    Fin de semana S/ {(cancha.precioDia ? cancha.precioDia + 10 : cancha.reglasTarifas?.precioDiaFinSemana) || 65}
                  </Text>
                </View>

                <View style={[styles.pricingCard, styles.pricingCardNight]}>
                  <View style={styles.pricingCardHeader}>
                    <Moon size={14} color="#38bdf8" />
                    <Text style={[styles.pricingCardTitle, { color: '#38bdf8' }]}>
                      Turno Noche (Con Luz LED)
                    </Text>
                  </View>
                  <Text style={styles.pricingHours}>06:00 PM - 11:30 PM</Text>
                  <Text style={[styles.pricingPrice, { color: '#34d399' }]}>
                    S/ {cancha.precioNoche || cancha.reglasTarifas?.precioNocheSemana || 80}.00
                  </Text>
                  <Text style={styles.pricingSub}>
                    Fin de semana S/ {(cancha.precioNoche ? cancha.precioNoche + 10 : cancha.reglasTarifas?.precioNocheFinSemana) || 95}
                  </Text>
                </View>
              </View>

              <View style={styles.adelantoNotice}>
                <Sparkles size={13} color="#10b981" />
                <Text style={styles.adelantoNoticeText}>
                  Aparta con solo el <Text style={{ fontWeight: '800' }}>50% de adelanto</Text> por Yape o Plin.
                </Text>
              </View>
            </View>

            {/* [US-07] Chips de Servicios y Comodidades */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>Servicios Disponibles en el Complejo</Text>
              <View style={styles.chipsContainer}>
                {(cancha.servicios || []).map((servicio, idx) => (
                  <View key={`serv-${idx}`} style={styles.serviceChip}>
                    <CheckCircle2 size={13} color="#10b981" />
                    <Text style={styles.serviceChipText}>{servicio}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* [US-23] Sección de Calificaciones y Comentarios de Jugadores */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionTitleRow}>
                <MessageSquare size={16} color="#fbbf24" />
                <Text style={styles.sectionTitle}>
                  Comentarios de la Comunidad ({totalComentarios})
                </Text>
              </View>

              {resenasCancha.length === 0 ? (
                <View style={styles.emptyResenasBox}>
                  <Text style={styles.emptyResenasText}>
                    Aún no hay reseñas registradas para esta cancha. ¡Sé el primero en calificarla luego de tu pichanga!
                  </Text>
                </View>
              ) : (
                resenasCancha.map((resena) => (
                  <View key={resena.id} style={styles.resenaCard}>
                    <View style={styles.resenaTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resenaAutor}>{resena.autorNombre}</Text>
                        <Text style={styles.resenaFecha}>{resena.fecha}</Text>
                      </View>
                      <View style={styles.resenaStarsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            color={star <= resena.estrellas ? '#fbbf24' : '#475569'}
                            fill={star <= resena.estrellas ? '#fbbf24' : 'transparent'}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.resenaComentario}>{resena.comentario}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer de Acción Inmediata */}
          {primerHorarioLibre && onSelectSlot && (
            <View style={styles.footer}>
              <View>
                <Text style={styles.footerLabel}>Próximo horario libre:</Text>
                <Text style={styles.footerTime}>{primerHorarioLibre.horaInicio} (S/ {primerHorarioLibre.precio})</Text>
              </View>
              <TouchableOpacity
                style={styles.footerBtn}
                onPress={() => {
                  onClose();
                  onSelectSlot(cancha, primerHorarioLibre, fechaSeleccionada);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.footerBtnText}>Apartar este Turno</Text>
                <CheckCircle2 size={16} color="#090d16" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '92%',
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  localBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  localBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  galleryContainer: {
    marginTop: 14,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  photoSlide: {
    width: width - 40,
    height: 220,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoCounterBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  photoCounterText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
  },
  grassTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  grassTagSintetico: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  grassTagNatural: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
  },
  grassTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#334155',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#10b981',
  },
  mainInfoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  starsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingNumber: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '900',
  },
  ratingTotalText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  reviewsCountText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  surfaceText: {
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 12,
  },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  gpsInfo: {
    flex: 1,
  },
  gpsSectorTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  gpsAddressText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  btnComoLlegar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  btnComoLlegarText: {
    color: '#090d16',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionBox: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionDesc: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 12,
  },
  pricingGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pricingCardNight: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  pricingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  pricingCardTitle: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
  },
  pricingHours: {
    color: '#64748b',
    fontSize: 10,
    marginBottom: 4,
  },
  pricingPrice: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '900',
  },
  pricingSub: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  adelantoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 8,
    borderRadius: 10,
  },
  adelantoNoticeText: {
    color: '#34d399',
    fontSize: 11,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  serviceChipText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyResenasBox: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  emptyResenasText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  resenaCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resenaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  resenaAutor: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  resenaFecha: {
    color: '#64748b',
    fontSize: 10,
  },
  resenaStarsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  resenaComentario: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  footerLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  footerTime: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  footerBtnText: {
    color: '#090d16',
    fontSize: 13,
    fontWeight: '900',
  },
});
