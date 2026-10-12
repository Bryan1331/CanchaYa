import React, { useState, useEffect } from 'react';
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
import { AuthModal } from './src/components/AuthModal';
import { MisPichangasModal } from './src/components/MisPichangasModal';
import { INITIAL_CANCHAS, INITIAL_RESERVAS } from './src/data/mockData';
import {
  Cancha,
  HorarioSlot,
  Reserva,
  EstadoReserva,
  UsuarioCliente,
} from './src/types';
import { ShieldCheck, User, Zap, LogOut, Lock, History, UserCheck } from 'lucide-react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { obtenerReservasAdmin } from './src/services/reservaService';

export default function App() {
  const [currentView, setCurrentView] = useState<'cliente' | 'recepcion'>('cliente');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  // [US-04] Estado global del cliente logueado (inicia anónimo por defecto)
  const [usuarioCliente, setUsuarioCliente] = useState<UsuarioCliente | null>(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authMotivoMensaje, setAuthMotivoMensaje] = useState<string>('');
  const [misPichangasVisible, setMisPichangasVisible] = useState(false);

  // Almacén de slot pendiente si el usuario intenta reservar sin sesión
  const [pendingSlot, setPendingSlot] = useState<{
    cancha: Cancha;
    horario: HorarioSlot;
    fecha: string;
  } | null>(null);

  const [canchas, setCanchas] = useState<Cancha[]>(INITIAL_CANCHAS);
  const [reservas, setReservas] = useState<Reserva[]>(INITIAL_RESERVAS);

  // Modal Checkout State
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [selectedCancha, setSelectedCancha] = useState<Cancha | null>(null);
  const [selectedHorario, setSelectedHorario] = useState<HorarioSlot | null>(null);
  const [selectedFecha, setSelectedFecha] = useState<string>('Hoy, 30 Ago');

  const pendingCount = reservas.filter(
    (r) => r.estado === 'pendiente' || r.estado === 'pendiente_validacion'
  ).length;

  // Escuchar estado de sesión de Administrador con Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdminLoggedIn(true);
      } else {
        setIsAdminLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Cargar reservas sincronizadas desde Cloud Firestore
  useEffect(() => {
    const sincronizarReservas = async () => {
      try {
        const firestoreReservas = await obtenerReservasAdmin();
        if (firestoreReservas && firestoreReservas.length > 0) {
          const reservasMapeadas: Reserva[] = firestoreReservas.map((r) => ({
            id: r.id || `RES-${Math.floor(1000 + Math.random() * 9000)}`,
            canchaId: r.canchaId || 'cancha-1',
            canchaNombre: r.canchaNombre || 'Cancha',
            tipoGrass: (r.tipoGrass as any) || 'sintetico',
            formato: r.formato || 'Fútbol 7',
            clienteNombre: r.clienteNombre || 'Cliente',
            clienteTelefono: r.clienteTelefono || '',
            clienteEmail: r.clienteEmail,
            clienteDni: r.clienteDni,
            fecha: r.fecha || 'Hoy, 30 Ago',
            horario: r.horario || '',
            monto: r.montoTotal || 0,
            metodoPago: (r.metodoPago as any) || 'yape',
            estado: (r.estado as any) || 'pendiente_validacion',
            comprobanteUrl: r.comprobanteUrl,
            origen: (r.origen as any) || 'web',
            fechaCreacion: r.fechaCreacion?.toDate ? 'Firestore' : 'Reciente',
          }));
          setReservas(reservasMapeadas);
        }
      } catch (err) {
        console.log('Utilizando reservas iniciales locales:', err);
      }
    };
    sincronizarReservas();
  }, []);

  // [US-21] Apertura directa de Checkout si ya está autenticado
  const handleOpenCheckout = (cancha: Cancha, horario: HorarioSlot, fecha: string) => {
    setSelectedCancha(cancha);
    setSelectedHorario(horario);
    setSelectedFecha(fecha);
    setCheckoutVisible(true);
  };

  // [US-21] Si no está autenticado, solicitar inicio/registro
  const handleRequireAuth = (cancha: Cancha, horario: HorarioSlot, fecha: string) => {
    setPendingSlot({ cancha, horario, fecha });
    setAuthMotivoMensaje(
      `Para apartar turno en "${cancha.nombre}" (${horario.horaInicio}), inicia sesión o regístrate.`
    );
    setAuthModalVisible(true);
  };

  // [US-04] Callback cuando el jugador inicia sesión o se registra exitosamente
  const handleSuccessAuth = (usuario: UsuarioCliente) => {
    setUsuarioCliente(usuario);
    setAuthModalVisible(false);

    // Si había un slot pendiente de reserva, abrir checkout automáticamente con sus datos
    if (pendingSlot) {
      handleOpenCheckout(pendingSlot.cancha, pendingSlot.horario, pendingSlot.fecha);
      setPendingSlot(null);
    }
  };

  const handleLogoutCliente = () => {
    Alert.alert('Cerrar Sesión de Jugador', '¿Deseas salir de tu cuenta de jugador?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: () => setUsuarioCliente(null),
      },
    ]);
  };

  // [US-09] Confirmar reserva y actualizar estado de la cancha
  const handleConfirmReserva = (
    nuevaReservaData: Omit<Reserva, 'id' | 'fechaCreacion'> & { id?: string }
  ) => {
    const nuevaReserva: Reserva = {
      ...nuevaReservaData,
      id: nuevaReservaData.id || `RES-${Math.floor(1000 + Math.random() * 9000)}`,
      fechaCreacion: 'Hace un momento',
    };

    // Añadir reserva a la lista local
    setReservas((prev) => [nuevaReserva, ...prev]);

    // Marcar horario como ocupado en la cancha
    setCanchas((prevCanchas) =>
      prevCanchas.map((c) => {
        if (c.id === nuevaReserva.canchaId) {
          return {
            ...c,
            horarios: c.horarios.map((h) => {
              const matches =
                `${h.horaInicio} - ${h.horaFin}` === nuevaReserva.horario ||
                nuevaReserva.horario.includes(h.horaInicio);
              return matches ? { ...h, disponible: false } : h;
            }),
          };
        }
        return c;
      })
    );

    Alert.alert(
      '🎉 ¡Turno Apartado!',
      `Tu reserva para ${nuevaReserva.canchaNombre} (${nuevaReserva.horario}) ha quedado en estado Pendiente de Validación. El horario quedó apartado.`,
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  // [US-13] Cambiar estado de reserva (Aprobar / Rechazar)
  const handleCambiarEstadoReserva = (reservaId: string, nuevoEstado: EstadoReserva) => {
    setReservas((prev) =>
      prev.map((r) => {
        if (r.id === reservaId) {
          return { ...r, estado: nuevoEstado };
        }
        return r;
      })
    );

    // Si se rechaza la reserva, liberar el horario automáticamente marcando disponible: true
    if (nuevoEstado === 'rechazada') {
      const res = reservas.find((r) => r.id === reservaId);
      if (res) {
        setCanchas((prev) =>
          prev.map((c) => {
            if (c.id === res.canchaId) {
              return {
                ...c,
                horarios: c.horarios.map((h) => {
                  const matches =
                    `${h.horaInicio} - ${h.horaFin}` === res.horario ||
                    res.horario.includes(h.horaInicio);
                  return matches
                    ? { ...h, disponible: true, bloqueado: false, motivoBloqueo: undefined }
                    : h;
                }),
              };
            }
            return c;
          })
        );
      }
    }
  };

  // [US-14] Registro Manual Presencial / Telefónico en Admin
  const handleCrearReservaManual = (
    nuevaReservaData: Omit<Reserva, 'id' | 'fechaCreacion'> & { id?: string }
  ) => {
    const nuevaReserva: Reserva = {
      ...nuevaReservaData,
      id: nuevaReservaData.id || `RES-DIR-${Math.floor(1000 + Math.random() * 9000)}`,
      fechaCreacion: 'Manual en Recepción',
      estado: 'aprobada',
      origen: 'presencial',
    };

    setReservas((prev) => [nuevaReserva, ...prev]);

    // Ocupar slot en la grilla pública
    setCanchas((prev) =>
      prev.map((c) => {
        if (c.id === nuevaReserva.canchaId) {
          return {
            ...c,
            horarios: c.horarios.map((h) => {
              const matches =
                `${h.horaInicio} - ${h.horaFin}` === nuevaReserva.horario ||
                nuevaReserva.horario.includes(h.horaInicio);
              return matches ? { ...h, disponible: false } : h;
            }),
          };
        }
        return c;
      })
    );
  };

  // [US-15] Bloqueo por Mantenimiento o Lluvia
  const handleBloquearSlot = (canchaId: string, slotId: string, motivo: string) => {
    setCanchas((prev) =>
      prev.map((c) => {
        if (c.id === canchaId) {
          return {
            ...c,
            horarios: c.horarios.map((h) =>
              h.id === slotId
                ? { ...h, disponible: false, bloqueado: true, motivoBloqueo: motivo }
                : h
            ),
          };
        }
        return c;
      })
    );
  };

  // [US-15] Desbloquear slot
  const handleDesbloquearSlot = (canchaId: string, slotId: string) => {
    setCanchas((prev) =>
      prev.map((c) => {
        if (c.id === canchaId) {
          return {
            ...c,
            horarios: c.horarios.map((h) =>
              h.id === slotId
                ? { ...h, disponible: true, bloqueado: false, motivoBloqueo: undefined }
                : h
            ),
          };
        }
        return c;
      })
    );

    Alert.alert('✅ Horario Habilitado', 'El horario vuelve a estar disponible en la grilla pública.');
  };

  // Manejo de cambio a Recepción con autenticación
  const handlePressRecepcion = () => {
    if (isAdminLoggedIn) {
      setCurrentView('recepcion');
    } else {
      setLoginModalVisible(true);
    }
  };

  const handleSuccessAdminLogin = () => {
    setIsAdminLoggedIn(true);
    setCurrentView('recepcion');
    setLoginModalVisible(false);
  };

  const handleLogoutAdmin = () => {
    Alert.alert('Cerrar Sesión Admin', '¿Deseas salir del panel de recepción?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (err) {
            console.warn('Error al cerrar sesión:', err);
          }
          setIsAdminLoggedIn(false);
          setCurrentView('cliente');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Top Navbar & Header */}
      <View style={styles.navbar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Zap size={18} color="#090d16" fill="#090d16" />
          </View>
          <View>
            <View style={styles.titleWithTag}>
              <Text style={styles.brandTitle}>
                Cancha<Text style={styles.brandAccent}>YA</Text>
              </Text>
              <View style={styles.cajamarcaPill}>
                <Text style={styles.cajamarcaPillText}>Cajamarca</Text>
              </View>
            </View>
            <Text style={styles.brandTagline}>Pichangas & Reservas en Vivo</Text>
          </View>
        </View>

        {/* Acceso de Administración y Perfil de Jugador */}
        <View style={styles.rightHeaderActions}>
          {isAdminLoggedIn ? (
            <View style={styles.switcherContainer}>
              <TouchableOpacity
                style={[styles.switcherBtn, currentView === 'cliente' && styles.switcherBtnActive]}
                onPress={() => setCurrentView('cliente')}
              >
                <User size={13} color={currentView === 'cliente' ? '#090d16' : '#9ca3af'} />
                <Text
                  style={[
                    styles.switcherBtnText,
                    currentView === 'cliente' && styles.switcherBtnTextActive,
                  ]}
                >
                  Público
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.switcherBtn,
                  currentView === 'recepcion' && styles.switcherBtnActiveAdmin,
                ]}
                onPress={() => setCurrentView('recepcion')}
              >
                <ShieldCheck
                  size={13}
                  color={currentView === 'recepcion' ? '#ffffff' : '#9ca3af'}
                />
                <Text
                  style={[
                    styles.switcherBtnText,
                    currentView === 'recepcion' && styles.switcherBtnTextActiveAdmin,
                  ]}
                >
                  Admin
                </Text>
                {pendingCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>{pendingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogoutAdmin}
                accessibilityLabel="Cerrar Sesión Admin"
              >
                <LogOut size={15} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {/* Acceso Jugador / Logout si está autenticado */}
              {usuarioCliente ? (
                <>
                  <TouchableOpacity
                    style={styles.playerPillBtn}
                    onPress={() => setMisPichangasVisible(true)}
                    activeOpacity={0.8}
                  >
                    <UserCheck size={12} color="#10b981" />
                    <Text style={styles.playerPillBtnText} numberOfLines={1}>
                      {usuarioCliente.nombre.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.playerLogoutBtn}
                    onPress={handleLogoutCliente}
                    activeOpacity={0.8}
                    accessibilityLabel="Cerrar Sesión Jugador"
                  >
                    <LogOut size={12} color="#f87171" />
                    <Text style={styles.playerLogoutBtnText}>Salir</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.authClientBtn}
                  onPress={() => {
                    setAuthMotivoMensaje('');
                    setAuthModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <User size={12} color="#10b981" />
                  <Text style={styles.authClientBtnText}>Ingresar</Text>
                </TouchableOpacity>
              )}

              {/* Botón Acceso Admin */}
              <TouchableOpacity
                style={styles.adminLoginBtn}
                onPress={handlePressRecepcion}
                activeOpacity={0.8}
              >
                <Lock size={12} color="#38bdf8" />
                <Text style={styles.adminLoginBtnText}>Admin</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Main Screen Content */}
      <View style={styles.content}>
        {currentView === 'cliente' ? (
          <HomePublic
            canchas={canchas}
            usuarioCliente={usuarioCliente}
            onSelectSlot={handleOpenCheckout}
            onRequireAuth={handleRequireAuth}
            onLogoutCliente={handleLogoutCliente}
            onOpenAdminLogin={handlePressRecepcion}
            onOpenAuthModal={() => {
              setAuthMotivoMensaje('');
              setAuthModalVisible(true);
            }}
            onOpenMisPichangas={() => setMisPichangasVisible(true)}
          />
        ) : (
          <AdminDashboard
            reservas={reservas}
            canchas={canchas}
            onCambiarEstadoReserva={handleCambiarEstadoReserva}
            onCrearReservaManual={handleCrearReservaManual}
            onBloquearSlot={handleBloquearSlot}
            onDesbloquearSlot={handleDesbloquearSlot}
          />
        )}
      </View>

      {/* Modal [US-04]: Login / Registro de Jugador */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSuccessAuth={handleSuccessAuth}
        motivoMensaje={authMotivoMensaje}
      />

      {/* Modal [US-04]: Historial "Mis Pichangas" */}
      <MisPichangasModal
        visible={misPichangasVisible}
        onClose={() => setMisPichangasVisible(false)}
        usuarioCliente={usuarioCliente}
        reservas={reservas}
        onLogout={() => {
          setMisPichangasVisible(false);
          handleLogoutCliente();
        }}
      />

      {/* Modal de Login Administrador (Firebase Auth) */}
      <AdminLoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onSuccessLogin={handleSuccessAdminLogin}
      />

      {/* Modal [US-09]: Checkout con Carga de Comprobante de Adelanto */}
      <CheckoutModal
        visible={checkoutVisible}
        cancha={selectedCancha}
        horario={selectedHorario}
        fechaSeleccionada={selectedFecha}
        usuarioCliente={usuarioCliente}
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
    gap: 6,
  },
  playerPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    maxWidth: 100,
  },
  playerPillBtnText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  playerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  playerLogoutBtnText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
  authClientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  authClientBtnText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  adminLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  adminLoginBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  switcherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 2,
  },
  switcherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
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
    fontSize: 11,
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
    width: 15,
    height: 15,
    borderRadius: 7.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  notificationText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  logoutBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
});
