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
import { Zap } from 'lucide-react-native';
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

  // [US-04] Callback cuando el jugador o admin inicia sesión o se registra exitosamente
  const handleSuccessAuth = (usuario: UsuarioCliente) => {
    setUsuarioCliente(usuario);
    setAuthModalVisible(false);

    // Si es Administrador o Recepción, activar directamente la vista de Recepción
    if (usuario.rol === 'admin' || usuario.rol === 'recepcion' || usuario.email.toLowerCase() === 'admin1@gmail.com') {
      setIsAdminLoggedIn(true);
      setCurrentView('recepcion');
      return;
    }

    // Si había un slot pendiente de reserva, abrir checkout automáticamente con sus datos
    if (pendingSlot) {
      handleOpenCheckout(pendingSlot.cancha, pendingSlot.horario, pendingSlot.fecha);
      setPendingSlot(null);
    }
  };

  const handleLogoutCliente = () => {
    Alert.alert('Cerrar Sesión', '¿Deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: () => {
          setUsuarioCliente(null);
          setIsAdminLoggedIn(false);
          setCurrentView('cliente');
        },
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
          setUsuarioCliente(null);
          setCurrentView('cliente');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Top Navbar & Header (100% enfocado en Branding CanchaYA) */}
      <View style={styles.navbar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Zap size={20} color="#090d16" fill="#090d16" />
          </View>
          <View>
            <Text style={styles.brandTitle}>
              Cancha<Text style={styles.brandAccent}>YA</Text>
            </Text>
            <Text style={styles.brandTagline}>Pichangas & Reservas en Vivo</Text>
          </View>
        </View>
      </View>

      {/* Main Screen Content */}
      <View style={styles.content}>
        {currentView === 'cliente' ? (
          <HomePublic
            canchas={canchas}
            usuarioCliente={usuarioCliente}
            isAdmin={isAdminLoggedIn}
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
            onVolverPublico={() => setCurrentView('cliente')}
            onLogoutAdmin={handleLogoutAdmin}
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
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
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
  brandTagline: {
    color: '#64748b',
    fontSize: 11,
    marginTop: -1,
  },
  content: {
    flex: 1,
  },
});
