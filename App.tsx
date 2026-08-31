import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { HomePublic } from './src/components/HomePublic';
import { CheckoutModal } from './src/components/CheckoutModal';
import { AdminDashboard } from './src/components/AdminDashboard';
import { AdminLoginModal } from './src/components/AdminLoginModal';
import { INITIAL_CANCHAS, INITIAL_RESERVAS, INITIAL_TORNEOS } from './src/data/mockData';
import { Cancha, HorarioSlot, Reserva, Torneo, EstadoReserva } from './src/types';
import { ShieldCheck, User, Zap, LogOut, Lock } from 'lucide-react-native';

export default function App() {
  const [currentView, setCurrentView] = useState<'cliente' | 'recepcion'>('cliente');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  const [canchas, setCanchas] = useState<Cancha[]>(INITIAL_CANCHAS);
  const [reservas, setReservas] = useState<Reserva[]>(INITIAL_RESERVAS);
  const [torneos, setTorneos] = useState<Torneo[]>(INITIAL_TORNEOS);

  // Modal Checkout State
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [selectedCancha, setSelectedCancha] = useState<Cancha | null>(null);
  const [selectedHorario, setSelectedHorario] = useState<HorarioSlot | null>(null);
  const [selectedFecha, setSelectedFecha] = useState<string>('Hoy, 30 Ago');

  const pendingCount = reservas.filter((r) => r.estado === 'pendiente').length;

  const handleOpenCheckout = (cancha: Cancha, horario: HorarioSlot, fecha: string) => {
    setSelectedCancha(cancha);
    setSelectedHorario(horario);
    setSelectedFecha(fecha);
    setCheckoutVisible(true);
  };

  const handleConfirmReserva = (nuevaReservaData: Omit<Reserva, 'id' | 'fechaCreacion'>) => {
    const nuevaReserva: Reserva = {
      ...nuevaReservaData,
      id: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
      fechaCreacion: 'Hace un momento',
    };

    // Añadir reserva a la lista
    setReservas((prev) => [nuevaReserva, ...prev]);

    // Marcar slot como ocupado en la cancha
    setCanchas((prevCanchas) =>
      prevCanchas.map((c) => {
        if (c.id === nuevaReserva.canchaId) {
          return {
            ...c,
            horarios: c.horarios.map((h) =>
              `${h.horaInicio} - ${h.horaFin}` === nuevaReserva.horario
                ? { ...h, disponible: false }
                : h
            ),
          };
        }
        return c;
      })
    );

    Alert.alert(
      '🎉 ¡Pichanga Reservada!',
      `Tu reserva para ${nuevaReserva.canchaNombre} (${nuevaReserva.horario}) ha sido registrada. Recepción en Cajamarca validará tu comprobante en breve.`,
      [
        {
          text: 'Ver en Recepción',
          onPress: () => {
            if (isAdminLoggedIn) {
              setCurrentView('recepcion');
            } else {
              setLoginModalVisible(true);
            }
          },
        },
        {
          text: 'Aceptar',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCambiarEstadoReserva = (reservaId: string, nuevoEstado: EstadoReserva) => {
    setReservas((prev) =>
      prev.map((r) => {
        if (r.id === reservaId) {
          return { ...r, estado: nuevoEstado };
        }
        return r;
      })
    );

    // Si se rechaza, liberar el horario nuevamente
    if (nuevoEstado === 'rechazada') {
      const res = reservas.find((r) => r.id === reservaId);
      if (res) {
        setCanchas((prev) =>
          prev.map((c) => {
            if (c.id === res.canchaId) {
              return {
                ...c,
                horarios: c.horarios.map((h) =>
                  `${h.horaInicio} - ${h.horaFin}` === res.horario
                    ? { ...h, disponible: true }
                    : h
                ),
              };
            }
            return c;
          })
        );
      }
    }
  };

  const handleCrearTorneo = (nuevoTorneo: Torneo) => {
    setTorneos((prev) => [nuevoTorneo, ...prev]);
  };

  // Manejo de cambio a Recepción con autenticación
  const handlePressRecepcion = () => {
    if (isAdminLoggedIn) {
      setCurrentView('recepcion');
    } else {
      setLoginModalVisible(true);
    }
  };

  const handleSuccessLogin = () => {
    setIsAdminLoggedIn(true);
    setCurrentView('recepcion');
    setLoginModalVisible(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Deseas salir del panel de recepción y volver al modo cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            setIsAdminLoggedIn(false);
            setCurrentView('cliente');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Top Navbar & Profile Switcher */}
      <View style={styles.navbar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Zap size={18} color="#090d16" fill="#090d16" />
          </View>
          <View>
            <View style={styles.titleWithTag}>
              <Text style={styles.brandTitle}>Cancha<Text style={styles.brandAccent}>YA</Text></Text>
              <View style={styles.cajamarcaPill}>
                <Text style={styles.cajamarcaPillText}>Cajamarca</Text>
              </View>
            </View>
            <Text style={styles.brandTagline}>Fútbol & Pichangas al instante</Text>
          </View>
        </View>

        {/* View Switcher Toggle & Logout */}
        <View style={styles.rightHeaderActions}>
          <View style={styles.switcherContainer}>
            <TouchableOpacity
              style={[styles.switcherBtn, currentView === 'cliente' && styles.switcherBtnActive]}
              onPress={() => setCurrentView('cliente')}
            >
              <User size={14} color={currentView === 'cliente' ? '#090d16' : '#9ca3af'} />
              <Text style={[styles.switcherBtnText, currentView === 'cliente' && styles.switcherBtnTextActive]}>
                Cliente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switcherBtn, currentView === 'recepcion' && styles.switcherBtnActiveAdmin]}
              onPress={handlePressRecepcion}
            >
              {isAdminLoggedIn ? (
                <ShieldCheck size={14} color={currentView === 'recepcion' ? '#ffffff' : '#9ca3af'} />
              ) : (
                <Lock size={13} color={currentView === 'recepcion' ? '#ffffff' : '#9ca3af'} />
              )}
              <Text style={[styles.switcherBtnText, currentView === 'recepcion' && styles.switcherBtnTextActiveAdmin]}>
                Recepción
              </Text>
              {pendingCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>{pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Botón de Cerrar Sesión (Visible en modo Recepción) */}
          {currentView === 'recepcion' && isAdminLoggedIn && (
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              accessibilityLabel="Cerrar Sesión"
            >
              <LogOut size={16} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Screen Content */}
      <View style={styles.content}>
        {currentView === 'cliente' ? (
          <HomePublic
            canchas={canchas}
            torneos={torneos}
            onSelectSlot={handleOpenCheckout}
          />
        ) : (
          <AdminDashboard
            reservas={reservas}
            torneos={torneos}
            onCambiarEstadoReserva={handleCambiarEstadoReserva}
            onCrearTorneo={handleCrearTorneo}
          />
        )}
      </View>

      {/* Modal de Login Administrador */}
      <AdminLoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onSuccessLogin={handleSuccessLogin}
      />

      {/* Modal de Checkout */}
      <CheckoutModal
        visible={checkoutVisible}
        cancha={selectedCancha}
        horario={selectedHorario}
        fechaSeleccionada={selectedFecha}
        onClose={() => setCheckoutVisible(false)}
        onConfirmReserva={handleConfirmReserva}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  navbar: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWithTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandAccent: {
    color: '#10b981',
  },
  cajamarcaPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cajamarcaPillText: {
    fontSize: 10,
    color: '#34d399',
    fontWeight: '700',
  },
  brandTagline: {
    color: '#64748b',
    fontSize: 10,
    marginTop: -2,
  },
  rightHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  switcherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    position: 'relative',
  },
  switcherBtnActive: {
    backgroundColor: '#10b981',
  },
  switcherBtnActiveAdmin: {
    backgroundColor: '#3b82f6',
  },
  switcherBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  switcherBtnTextActive: {
    color: '#090d16',
    fontWeight: '700',
  },
  switcherBtnTextActiveAdmin: {
    color: '#ffffff',
    fontWeight: '700',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  notificationText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
});
