import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  X,
  Star,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ThumbsUp,
} from 'lucide-react-native';
import { Reserva } from '../types';

interface CalificarModalProps {
  visible: boolean;
  reserva: Reserva | null;
  onClose: () => void;
  onEnviarCalificacion: (reservaId: string, estrellas: number, comentario: string) => void;
}

const DESCRIPCION_ESTRELLAS: Record<number, string> = {
  1: 'Mala experiencia / Cancha descuidada',
  2: 'Regular / Podría mejorar el mantenimiento',
  3: 'Buena pichanga / Cumple con lo básico',
  4: '¡Muy buena! Excelente grass e iluminación',
  5: '¡Cancha Top 10/10! Totalmente recomendada',
};

export const CalificarModal: React.FC<CalificarModalProps> = ({
  visible,
  reserva,
  onClose,
  onEnviarCalificacion,
}) => {
  const [estrellas, setEstrellas] = useState<number>(5);
  const [comentario, setComentario] = useState<string>('');

  if (!reserva) return null;

  const handleSubmit = () => {
    const comentarioLimpio = comentario.trim();
    if (!comentarioLimpio) {
      Alert.alert(
        'Comentario requerido',
        'Por favor comparte unas breves palabras sobre tu pichanga (estado del césped, vestuarios, iluminación, etc.).'
      );
      return;
    }

    onEnviarCalificacion(reserva.id, estrellas, comentarioLimpio);
    setComentario('');
    setEstrellas(5);
    onClose();
  };

  const handleClose = () => {
    setComentario('');
    setEstrellas(5);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeHeader}>
              <Sparkles size={13} color="#fbbf24" />
              <Text style={styles.badgeHeaderText}>POST-PICHANGA</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Califica tu Pichanga</Text>
          <Text style={styles.subtitle}>
            ¿Cómo estuvo el partido en{' '}
            <Text style={{ color: '#f8fafc', fontWeight: '800' }}>{reserva.canchaNombre}</Text>?
          </Text>

          {/* Selector de 1 a 5 Estrellas */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((item) => {
              const active = item <= estrellas;
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => setEstrellas(item)}
                  style={styles.starTouch}
                  activeOpacity={0.7}
                >
                  <Star
                    size={36}
                    color={active ? '#fbbf24' : '#334155'}
                    fill={active ? '#fbbf24' : 'transparent'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.starDescription}>{DESCRIPCION_ESTRELLAS[estrellas]}</Text>

          {/* Caja de Texto para Comentario */}
          <View style={styles.inputBox}>
            <View style={styles.inputHeader}>
              <MessageSquare size={14} color="#94a3b8" />
              <Text style={styles.inputLabel}>Tu opinión sincera:</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Ej: Excelente drenaje a pesar de la lluvia, iluminación potente y atención rápida en caja..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              maxLength={250}
              value={comentario}
              onChangeText={setComentario}
              textAlignVertical="top"
            />
            <Text style={styles.charCounter}>{comentario.length}/250</Text>
          </View>

          {/* Botón de Envío */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
            <CheckCircle2 size={18} color="#090d16" />
            <Text style={styles.submitBtnText}>Publicar Calificación</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeHeaderText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  starTouch: {
    padding: 4,
  },
  starDescription: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  inputBox: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 18,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  textInput: {
    color: '#f8fafc',
    fontSize: 13,
    minHeight: 75,
    padding: 0,
  },
  charCounter: {
    color: '#64748b',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 14,
  },
  submitBtnText: {
    color: '#090d16',
    fontSize: 14,
    fontWeight: '900',
  },
});
