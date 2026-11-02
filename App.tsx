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
import { FichaCanchaModal } from './src/components/FichaCanchaModal';
import { CalificarModal } from './src/components/CalificarModal';
import { ReporteIngresos } from './src/components/ReporteIngresos';
import {
  INITIAL_CANCHAS,
  INITIAL_RESERVAS,
  INITIAL_RESENAS,
  ADMINISTRADORES_CAJAMARCA,
} from './src/data/mockData';
import {
  Cancha,
  HorarioSlot,
  Reserva,
  EstadoReserva,
  UsuarioCliente,
  ResenaCancha,
  AdminUser,
} from './src/types';
import { Zap, ArrowLeft } from 'lucide-react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { obtenerReservasAdmin } from './src/services/reservaService';

export default function App() {
  const [currentView, setCurrentView] = useState<'cliente' | 'recepcion' | 'reportes'>('cliente');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminActual, setAdminActual] = useState<AdminUser | null>(ADMINISTRADORES_CAJAMARCA[0]);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  // [US-04] Estado global del cliente logueado (inicia anónimo por defecto)
  const [usuarioCliente, setUsuarioCliente] = useState<UsuarioCliente | null>(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authMotivoMensaje, setAuthMotivoMensaje] = useState<string>('');
  const [misPichangasVisible, setMisPichangasVisible] = useState(false);

  // [US-07 / US-18] Ficha Detallada de Cancha State
  const [fichaCanchaVisible, setFichaCanchaVisible] = useState(false);
  const [selectedCanchaFicha, setSelectedCanchaFicha] = useState<Cancha | null>(null);

  // [US-23] Calificaciones y Reseñas State
  const [resenas, setResenas] = useState<ResenaCancha[]>(INITIAL_RESENAS);
  const [calificarModalVisible, setCalificarModalVisible] = useState(false);
  const [reservaParaCalificar, setReservaParaCalificar] = useState<Reserva | null>(null);

  // [US-24] Locales autorizados del Administrador activo (Fase T3: 3 Administradores)
  const [adminLocalesAsignados, setAdminLocalesAsignados] = useState<number[]>(
    ADMINISTRADORES_CAJAMARCA[0].localesAsignados
  );

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

  // Escuchar estado de sesión de Administrador con Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdminLoggedIn(true);
        const adminFound = ADMINISTRADORES_CAJAMARCA.find(
          (a) => a.email.toLowerCase() === (user.email || '').toLowerCase()
        );
        if (adminFound) {
          setAdminActual(adminFound);
          setAdminLocalesAsignados(adminFound.localesAsignados);
        }
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
          const reservasMapeadas: Reserva[] = firestoreReservas.map((r) => {
            const montoTot = r.montoTotal || 80;
            const adelanto = (r as any).montoAdelanto ?? Math.round(montoTot * 0.5);
            const saldo = (r as any).saldoPendiente ?? montoTot - adelanto;

            return {
              id: r.id || `RES-${Math.floor(1000 + Math.random() * 9000)}`,
              localId: (r as any).localId || 1,
              canchaId: (r as any).canchaId || 1,
              canchaNombre: r.canchaNombre || 'Cancha',
              tipoGrass: (r.tipoGrass as any) || 'sintetico',
              formato: r.formato || 'Fútbol 7',
              clienteNombre: r.clienteNombre || 'Cliente',
              clienteTelefono: r.clienteTelefono || '',
              clienteEmail: r.clienteEmail,
              clienteDni: r.clienteDni,
              fecha: r.fecha || 'Hoy, 30 Ago',
              horario: r.horario || '',
              monto: montoTot,
              montoTotal: montoTot,
              montoAdelanto: adelanto,
              saldoPendiente: saldo,
              metodoPago: (r.metodoPago as any) || 'yape',
              estado: (r.estado as any) || 'pendiente_validacion',
              comprobanteUrl: r.comprobanteUrl,
              origen: (r.origen as any) || 'web',
              fechaCreacion: r.fechaCreacion?.toDate ? 'Firestore' : 'Reciente',
            };
          });
          setReservas(reservasMapeadas);
        }
      } catch (err) {
        console.log('Utilizando reservas iniciales locales:', err);
      }
    };
    sincronizarReservas();
  }, []);

  // Apertura directa de Checkout si ya está autenticado
  const handleOpenCheckout = (cancha: Cancha, horario: HorarioSlot, fecha: string) => {
    setSelectedCancha(cancha);
    setSelectedHorario(horario);
    setSelectedFecha(fecha);
    setCheckoutVisible(true);
  };

  // Si no está autenticado, solicitar inicio/registro
  const handleRequireAuth = (cancha: Cancha, horario: HorarioSlot, fecha: string) => {
    setPendingSlot({ cancha, horario, fecha });
    setAuthMotivoMensaje(
      `Para apartar turno en "${cancha.nombre}" (${horario.horaInicio}), ingresa tus datos.`
    );
    setAuthModalVisible(true);
  };

  // [US-07 / US-18] Abrir Ficha Detallada de Cancha
  const handleOpenFichaCancha = (cancha: Cancha) => {
    setSelectedCanchaFicha(cancha);
    setFichaCanchaVisible(true);
  };

  // [US-23] Abrir modal de Calificación
  const handleAbrirCalificar = (reserva: Reserva) => {
    setReservaParaCalificar(reserva);
    setCalificarModalVisible(true);
  };

  // [US-23] Publicar calificación post-pichanga y recalcular promedio de estrellas
  const handleEnviarCalificacion = (reservaId: string, estrellas: number, comentario: string) => {
    const reservaObj = reservas.find((r) => r.id === reservaId);
    if (!reservaObj) return;

    // 1. Actualizar reserva marcándola como calificada
    setReservas((prev) =>
      prev.map((r) =>
        r.id === reservaId
          ? {
              ...r,
              calificado: true,
              calificacion: { estrellas, comentario, fecha: 'Hoy' },
            }
          : r
      )
    );

    // 2. Crear nueva reseña
    const nuevaResena: ResenaCancha = {
      id: `res-${Date.now()}`,
      reservaId: reservaObj.id,
      canchaId: reservaObj.canchaId,
      canchaNombre: reservaObj.canchaNombre,
      autorNombre: usuarioCliente?.nombre || reservaObj.clienteNombre,
      estrellas,
      comentario,
      fecha: 'Hace un momento',
    };

    const nuevasResenas = [nuevaResena, ...resenas];
    setResenas(nuevasResenas);

    // 3. Recalcular promedio general de estrellas para la cancha
    const resenasDeEstaCancha = nuevasResenas.filter(
      (r) => String(r.canchaId) === String(reservaObj.canchaId)
    );
    const nuevoPromedio =
      resenasDeEstaCancha.reduce((acc, curr) => acc + curr.estrellas, 0) /
      resenasDeEstaCancha.length;

    setCanchas((prev) =>
      prev.map((c) =>
        String(c.id) === String(reservaObj.canchaId)
          ? {
              ...c,
              calificacionPromedio: Number(nuevoPromedio.toFixed(1)),
              estrellas: Number(nuevoPromedio.toFixed(1)),
              totalResenas: resenasDeEstaCancha.length,
            }
          : c
      )
    );

    Alert.alert(
      '⭐ ¡Gracias por tu Calificación!',
      `Tu reseña de ${estrellas} estrellas para "${reservaObj.canchaNombre}" ha sido publicada con éxito.`,
      [{ text: 'Aceptar', style: 'default' }]
    );
  };

  // Callback cuando el usuario o admin inicia sesión desde AuthModal
  const handleSuccessAuth = (usuario: UsuarioCliente) => {
    setUsuarioCliente(usuario);
    setAuthModalVisible(false);

    // Detección automática si corresponde a uno de los 3 administradores
    const adminCorrespondiente = ADMINISTRADORES_CAJAMARCA.find(
      (a) => a.email.toLowerCase() === (usuario.email || '').toLowerCase()
    );

    if (adminCorrespondiente || usuario.rol === 'admin' || usuario.rol === 'recepcion') {
      const adminFinal = adminCorrespondiente || ADMINISTRADORES_CAJAMARCA[0];
      setAdminActual(adminFinal);
      setAdminLocalesAsignados(adminFinal.localesAsignados);
      setIsAdminLoggedIn(true);
      setCurrentView('recepcion');
      return;
    }

    // Si había un slot pendiente de reserva, abrir checkout automáticamente
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

  // Confirmar reserva con montos dinámicos y comprobante
  const handleConfirmReserva = (
    nuevaReservaData: Omit<Reserva, 'id' | 'fechaCreacion'> & { id?: string }
  ) => {
    const adelanto =
      nuevaReservaData.montoAdelanto !== undefined
        ? nuevaReservaData.montoAdelanto
        : Math.round(nuevaReservaData.monto * 0.5);

    const saldo =
      nuevaReservaData.saldoPendiente !== undefined
        ? nuevaReservaData.saldoPendiente
        : nuevaReservaData.monto - adelanto;

    const nuevaReserva: Reserva = {
      ...nuevaReservaData,
      id: nuevaReservaData.id || `RES-${Math.floor(1000 + Math.random() * 9000)}`,
      montoTotal: nuevaReservaData.monto,
      montoAdelanto: adelanto,
      saldoPendiente: saldo,
      fechaCreacion: 'Hace un momento',
    };

    setReservas((prev) => [nuevaReserva, ...prev]);

    // Ocupar slot en la grilla pública
    setCanchas((prevCanchas) =>
      prevCanchas.map((c) => {
        if (String(c.id) === String(nuevaReserva.canchaId)) {
          return {
            ...c,
            horarios: (c.horarios || []).map((h) => {
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
      '🎉 ¡Turno Apartado con Adelanto!',
      `Tu reserva para ${nuevaReserva.canchaNombre} (${nuevaReserva.horario}) ha quedado en Pendiente de Validación.\n\n` +
        `• Total: S/ ${nuevaReserva.monto}.00\n` +
        `• Adelanto transferido: S/ ${adelanto}.00\n` +
        `• Saldo en cancha: S/ ${saldo}.00`,
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  // Cambiar estado de reserva
  const handleCambiarEstadoReserva = (reservaId: string, nuevoEstado: EstadoReserva) => {
    setReservas((prev) =>
      prev.map((r) => {
        if (r.id === reservaId) {
          return { ...r, estado: nuevoEstado };
        }
        return r;
      })
    );

    // Si se rechaza, liberar slot
    if (nuevoEstado === 'rechazada') {
      const res = reservas.find((r) => r.id === reservaId);
      if (res) {
        setCanchas((prev) =>
          prev.map((c) => {
            if (String(c.id) === String(res.canchaId)) {
              return {
                ...c,
                horarios: (c.horarios || []).map((h) => {
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

  // Registro Manual Presencial en Recepción
  const handleCrearReservaManual = (
    nuevaReservaData: Omit<Reserva, 'id' | 'fechaCreacion'> & { id?: string }
  ) => {
    const adelanto =
      nuevaReservaData.montoAdelanto !== undefined
        ? nuevaReservaData.montoAdelanto
        : Math.round(nuevaReservaData.monto * 0.5);

    const nuevaReserva: Reserva = {
      ...nuevaReservaData,
      id: nuevaReservaData.id || `RES-DIR-${Math.floor(1000 + Math.random() * 9000)}`,
      montoTotal: nuevaReservaData.monto,
      montoAdelanto: adelanto,
      saldoPendiente: nuevaReservaData.monto - adelanto,
      fechaCreacion: 'Manual en Recepción',
      estado: 'aprobada',
      origen: 'presencial',
    };

    setReservas((prev) => [nuevaReserva, ...prev]);

    // Ocupar slot
    setCanchas((prev) =>
      prev.map((c) => {
        if (String(c.id) === String(nuevaReserva.canchaId)) {
          return {
            ...c,
            horarios: (c.horarios || []).map((h) => {
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

  // Bloquear slot por lluvia o mantenimiento
  const handleBloquearSlot = (canchaId: number | string, slotId: string, motivo: string) => {
    setCanchas((prev) =>
      prev.map((c) => {
        if (String(c.id) === String(canchaId)) {
          return {
            ...c,
            horarios: (c.horarios || []).map((h) =>
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

  // Desbloquear slot
  const handleDesbloquearSlot = (canchaId: number | string, slotId: string) => {
    setCanchas((prev) =>
      prev.map((c) => {
        if (String(c.id) === String(canchaId)) {
          return {
            ...c,
            horarios: (c.horarios || []).map((h) =>
              h.id === slotId
                ? { ...h, disponible: true, bloqueado: false, motivoBloqueo: undefined }
                : h
            ),
          };
        }
        return c;
      })
    );
    Alert.alert('✅ Horario Habilitado', 'El horario vuelve a estar disponible en la grilla.');
  };

  const handlePressRecepcion = () => {
    if (isAdminLoggedIn) {
      setCurrentView('recepcion');
    } else {
      setLoginModalVisible(true);
    }
  };

  const handleSuccessAdminLogin = (adminUser: AdminUser) => {
    setIsAdminLoggedIn(true);
    setAdminActual(adminUser);
    setAdminLocalesAsignados(adminUser.localesAsignados);
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
      <StatusBar barStyle="light-content" />

      {/* Top Navbar & Header */}
      <View style={styles.navbar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Zap size={20} color="#090d16" fill="#090d16" />
          </View>
          <View>
            <Text style={styles.brandTitle}>
              Cancha<Text style={styles.brandAccent}>YA</Text>
            </Text>
            <Text style={styles.brandTagline}>Pichangas & Reservas en Vivo • Cajamarca</Text>
          </View>
        </View>

        {/* Barra de Navegación Global por Estado `currentView` */}
        {isAdminLoggedIn && (
          <View style={styles.viewSwitcherBar}>
            <TouchableOpacity
              style={[styles.viewPill, currentView === 'cliente' && styles.viewPillActive]}
              onPress={() => setCurrentView('cliente')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.viewPillText,
                  currentView === 'cliente' && styles.viewPillTextActive,
                ]}
              >
                Público
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewPill, currentView === 'recepcion' && styles.viewPillActiveAdmin]}
              onPress={() => setCurrentView('recepcion')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.viewPillText,
                  currentView === 'recepcion' && styles.viewPillTextActiveAdmin,
                ]}
              >
                Recepción
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewPill, currentView === 'reportes' && styles.viewPillActiveReportes]}
              onPress={() => setCurrentView('reportes')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.viewPillText,
                  currentView === 'reportes' && styles.viewPillTextActiveReportes,
                ]}
              >
                Reportes
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Screen Content */}
      <View style={styles.content}>
        {currentView === 'cliente' && (
          <HomePublic
            canchas={canchas}
            resenas={resenas}
            usuarioCliente={usuarioCliente}
            isAdmin={isAdminLoggedIn}
            onSelectSlot={handleOpenCheckout}
            onRequireAuth={handleRequireAuth}
            onOpenFichaCancha={handleOpenFichaCancha}
            onLogoutCliente={() => setUsuarioCliente(null)}
            onOpenAdminLogin={handlePressRecepcion}
            onOpenAuthModal={() => {
              setAuthMotivoMensaje('');
              setAuthModalVisible(true);
            }}
            onOpenMisPichangas={() => setMisPichangasVisible(true)}
          />
        )}

        {currentView === 'recepcion' && (
          <AdminDashboard
            reservas={reservas}
            canchas={canchas}
            localesAsignados={adminLocalesAsignados}
            adminActual={adminActual}
            onCambiarEstadoReserva={handleCambiarEstadoReserva}
            onCrearReservaManual={handleCrearReservaManual}
            onBloquearSlot={handleBloquearSlot}
            onDesbloquearSlot={handleDesbloquearSlot}
            onVolverPublico={() => setCurrentView('cliente')}
            onLogoutAdmin={handleLogoutAdmin}
            onNavigateReportes={() => setCurrentView('reportes')}
          />
        )}

        {currentView === 'reportes' && (
          <View style={styles.reportesContainer}>
            <View style={styles.reportesSubHeader}>
              <TouchableOpacity
                style={styles.btnVolverRecepcion}
                onPress={() => setCurrentView('recepcion')}
                activeOpacity={0.8}
              >
                <ArrowLeft size={14} color="#38bdf8" />
                <Text style={styles.btnVolverRecepcionText}>Volver a Recepción</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnIrPublico}
                onPress={() => setCurrentView('cliente')}
                activeOpacity={0.8}
              >
                <Text style={styles.btnIrPublicoText}>Ver Grilla Pública</Text>
              </TouchableOpacity>
            </View>

            <ReporteIngresos
              reservas={reservas}
              canchas={canchas}
              localSeleccionadoId="todos"
              localesAsignados={adminLocalesAsignados}
            />
          </View>
        )}
      </View>

      {/* Modal [US-07 / US-18]: Ficha Detallada de Cancha (Galería, Servicios y GPS) */}
      <FichaCanchaModal
        visible={fichaCanchaVisible}
        cancha={selectedCanchaFicha}
        resenas={resenas}
        fechaSeleccionada={selectedFecha}
        onClose={() => setFichaCanchaVisible(false)}
        onSelectSlot={(c, h, f) => {
          setFichaCanchaVisible(false);
          handleOpenCheckout(c, h, f);
        }}
      />

      {/* Modal [US-23]: Calificar Pichanga post-partido */}
      <CalificarModal
        visible={calificarModalVisible}
        reserva={reservaParaCalificar}
        onClose={() => setCalificarModalVisible(false)}
        onEnviarCalificacion={handleEnviarCalificacion}
      />

      {/* Modal: Identificación para Reserva */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSuccessAuth={handleSuccessAuth}
        motivoMensaje={authMotivoMensaje}
      />

      {/* Modal [US-23]: Historial "Mis Pichangas" con botón Calificar */}
      <MisPichangasModal
        visible={misPichangasVisible}
        onClose={() => setMisPichangasVisible(false)}
        usuarioCliente={usuarioCliente}
        reservas={reservas}
        onLogout={() => {
          setMisPichangasVisible(false);
          handleLogoutCliente();
        }}
        onAbrirCalificar={handleAbrirCalificar}
      />

      {/* Modal de Login Administrador Multilocal (Fase T3) */}
      <AdminLoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onSuccessLogin={handleSuccessAdminLogin}
      />

      {/* Modal [US-09 / US-16]: Checkout con Dynamic Pricing y Adelanto 50% */}
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
    justifyContent: 'space-between',
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
  viewSwitcherBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 2,
  },
  viewPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  viewPillActive: {
    backgroundColor: '#10b981',
  },
  viewPillActiveAdmin: {
    backgroundColor: '#3b82f6',
  },
  viewPillActiveReportes: {
    backgroundColor: '#8b5cf6',
  },
  viewPillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  viewPillTextActive: {
    color: '#090d16',
    fontWeight: '900',
  },
  viewPillTextActiveAdmin: {
    color: '#ffffff',
    fontWeight: '900',
  },
  viewPillTextActiveReportes: {
    color: '#ffffff',
    fontWeight: '900',
  },
  content: {
    flex: 1,
  },
  reportesContainer: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  reportesSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  btnVolverRecepcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnVolverRecepcionText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  btnIrPublico: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnIrPublicoText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
});
