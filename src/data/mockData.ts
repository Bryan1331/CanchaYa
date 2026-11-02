import { Cancha, Reserva, ResenaCancha, HorarioSlot, AdminUser } from '../types';

/**
 * =========================================================================
 * 1. ESTRUCTURA DE CANCHAS REALES DE CAJAMARCA (7 CANCHAS EN TOTAL)
 * =========================================================================
 * Coordenadas GPS nativas, fotos directas HTTPS de alta calidad y tarifas
 * dinámicas por turno día y noche (con luz LED).
 */
export const CANCHAS_CAJAMARCA: Cancha[] = [
  {
    id: 1,
    nombre: 'Cancha Principal (Fútbol 7)',
    establecimiento: 'Grass El Chugurano',
    direccion: 'Jr. Manuel Seoane 780, Cajamarca',
    precioDia: 50,
    precioNoche: 80,
    coordenadas: { lat: -7.1612, lng: -78.5134 },
    servicios: ['Iluminación LED', 'Vestuarios', 'Bar / Snacks', 'Zona de espera'],
    imagenes: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800',
    ],
    estrellas: 4.7,
    totalResenas: 28,
  },
  {
    id: 2,
    nombre: 'Campo Central',
    establecimiento: 'Allianz Arena Soccer',
    direccion: 'Jr. Cinco Esquinas N° 1502, Cajamarca',
    precioDia: 60,
    precioNoche: 90,
    coordenadas: { lat: -7.1645, lng: -78.5098 },
    servicios: ['Iluminación Nocturna', 'Vestuarios', 'Estacionamiento', 'Tribuna'],
    imagenes: [
      'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=800',
    ],
    estrellas: 4.8,
    totalResenas: 42,
  },
  {
    id: 3,
    nombre: 'Cancha 1 Sintética',
    establecimiento: 'CAMPO REAL',
    direccion: 'C. El Jardín, Cajamarca',
    precioDia: 55,
    precioNoche: 85,
    coordenadas: { lat: -7.1472, lng: -78.5085 },
    servicios: ['Atención 24 horas', 'Iluminación LED', 'Estacionamiento', 'Cafetería'],
    imagenes: [
      'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=800',
    ],
    estrellas: 4.6,
    totalResenas: 35,
  },
  {
    id: 4,
    nombre: 'Cancha Oficial',
    establecimiento: 'EL DORADO',
    direccion: 'Sin Número, Cajamarca',
    precioDia: 50,
    precioNoche: 75,
    coordenadas: { lat: -7.155, lng: -78.512 },
    servicios: ['Iluminación Nocturna', 'Bancas cubiertas', 'Estacionamiento'],
    imagenes: [
      'https://images.unsplash.com/photo-1459865264668-b25873140a32?q=80&w=800',
    ],
    estrellas: 4.5,
    totalResenas: 19,
  },
  {
    id: 5,
    nombre: 'Cancha Nocturna',
    establecimiento: 'Grass Sintético Rabanal',
    direccion: 'Av. Vía de Evitamiento Sur (espaldas del Imperio Gym), Cajamarca',
    precioDia: 50,
    precioNoche: 80,
    coordenadas: { lat: -7.168, lng: -78.505 },
    servicios: ['Iluminación Artificial', 'Servicios Higiénicos', 'Atención Continua'],
    imagenes: [
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=800',
    ],
    estrellas: 4.4,
    totalResenas: 15,
  },
  {
    id: 6,
    nombre: 'Cancha Principal',
    establecimiento: 'Grass La Cantera',
    direccion: 'Av. Hoyos Rubio (cerca al Quinde), Cajamarca',
    precioDia: 60,
    precioNoche: 90,
    coordenadas: { lat: -7.152, lng: -78.506 },
    servicios: ['Iluminación LED pro', 'Estacionamiento privado', 'Vestuarios', 'Snack Bar'],
    imagenes: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800',
    ],
    estrellas: 4.9,
    totalResenas: 50,
  },
  {
    id: 7,
    nombre: 'Campo Tradicional',
    establecimiento: 'Complejo San Martín',
    direccion: 'Av. San Martín, Cajamarca',
    precioDia: 50,
    precioNoche: 75,
    coordenadas: { lat: -7.159, lng: -78.515 },
    servicios: ['Iluminación Nocturna', 'Gradas para público', 'Canchas múltiples'],
    imagenes: [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800',
    ],
    estrellas: 4.3,
    totalResenas: 12,
  },
];

/**
 * =========================================================================
 * 2. CONTROL DE ACCESO MULTILOCAL PARA 3 ADMINISTRADORES (FASE T3)
 * =========================================================================
 * Distribución de los 7 locales entre los 3 administradores encargados:
 * - Admin 1: Locales [1, 2, 3] (Chugurano, Allianz Arena, Campo Real)
 * - Admin 2: Locales [4, 5] (El Dorado, Rabanal)
 * - Admin 3: Locales [6, 7] (La Cantera, San Martín)
 */
export const ADMINISTRADORES_CAJAMARCA: AdminUser[] = [
  {
    id: 'ADM-01',
    email: 'admin1@gmail.com',
    password: 'password123',
    nombre: 'Carlos Cueva',
    cargo: 'Supervisor Multilocal Centro (Chugurano / Allianz / Campo Real)',
    localesAsignados: [1, 2, 3],
    telefono: '976543210',
  },
  {
    id: 'ADM-02',
    email: 'admin2@gmail.com',
    password: 'password123',
    nombre: 'Jhony Rabanal',
    cargo: 'Supervisor Multilocal Sur (El Dorado / Rabanal)',
    localesAsignados: [4, 5, 6],
    telefono: '942819302',
  },
  {
    id: 'ADM-03',
    email: 'admin3@gmail.com',
    password: 'password123',
    nombre: 'Manuel Pajares',
    cargo: 'Supervisor Multilocal Este/Norte (La Cantera / San Martín)',
    localesAsignados: [7],
    telefono: '988341205',
  },
];

/**
 * Generador de franjas horarias realistas para cada cancha con tarifas
 * diferenciadas día y noche (con luz a partir de las 06:00 PM).
 */
const generarHorariosPorCancha = (canchaId: number, precioDia: number, precioNoche: number): HorarioSlot[] => [
  { id: `slot-${canchaId}-1`, horaInicio: '03:00 PM', horaFin: '04:00 PM', disponible: true, precio: precioDia, esNoche: false },
  { id: `slot-${canchaId}-2`, horaInicio: '04:00 PM', horaFin: '05:00 PM', disponible: true, precio: precioDia, esNoche: false },
  { id: `slot-${canchaId}-3`, horaInicio: '05:00 PM', horaFin: '06:00 PM', disponible: true, precio: precioDia, esNoche: false },
  { id: `slot-${canchaId}-4`, horaInicio: '06:00 PM', horaFin: '07:00 PM', disponible: false, precio: precioNoche, esNoche: true },
  { id: `slot-${canchaId}-5`, horaInicio: '07:00 PM', horaFin: '08:00 PM', disponible: true, precio: precioNoche, esNoche: true },
  { id: `slot-${canchaId}-6`, horaInicio: '08:00 PM', horaFin: '09:00 PM', disponible: false, precio: precioNoche, esNoche: true },
  { id: `slot-${canchaId}-7`, horaInicio: '09:00 PM', horaFin: '10:00 PM', disponible: true, precio: precioNoche, esNoche: true },
  { id: `slot-${canchaId}-8`, horaInicio: '10:00 PM', horaFin: '11:00 PM', disponible: true, precio: Math.max(50, precioNoche - 10), esNoche: true },
];

/**
 * Canchas enriquecidas con soporte completo para la grilla interactiva,
 * filtros, dynamic pricing y detalles de servicios.
 */
export const INITIAL_CANCHAS: Cancha[] = CANCHAS_CAJAMARCA.map((c) => {
  const serviciosLower = c.servicios.map((s) => s.toLowerCase());
  const tieneTechada = serviciosLower.some((s) => s.includes('tech') || s.includes('cubiert'));
  const tieneLuz = serviciosLower.some((s) => s.includes('luz') || s.includes('iluminac') || s.includes('nocturn'));
  const tieneCochera = serviciosLower.some((s) => s.includes('estacionamiento') || s.includes('cochera') || s.includes('privado'));
  const esNatural = c.id === 7 || c.nombre.toLowerCase().includes('natural');

  return {
    ...c,
    localId: c.id,
    localNombre: c.establecimiento,
    ubicacion: c.direccion,
    sector: c.direccion.split(',')[0],
    precioDesde: c.precioDia,
    imagenUrl: c.imagenes[0],
    galeriaFotos: c.imagenes,
    tipoGrass: esNatural ? 'natural' : 'sintetico',
    formato: c.nombre.includes('Fútbol') ? c.nombre : 'Fútbol 7',
    tipoSuperficie: esNatural ? 'Césped Natural Andino Kikuyo' : 'Grass Sintético Monofilamento Pro Anti-impacto',
    techada: tieneTechada,
    iluminacion: tieneLuz,
    estacionamiento: tieneCochera,
    calificacionPromedio: c.estrellas,
    reglasTarifas: {
      precioDiaSemana: c.precioDia,
      precioNocheSemana: c.precioNoche,
      precioDiaFinSemana: c.precioDia + 10,
      precioNocheFinSemana: c.precioNoche + 10,
      horaCorteNoche: 18,
    },
    horarios: generarHorariosPorCancha(c.id, c.precioDia, c.precioNoche),
  };
});

/**
 * =========================================================================
 * 3. RESERVAS REALISTAS DISTRIBUIDAS ENTRE LOS 7 LOCALES Y 3 ADMINS
 * =========================================================================
 */
export const INITIAL_RESERVAS: Reserva[] = [
  // Admin 1: Locales [1, 2, 3]
  {
    id: 'RES-8901',
    localId: 1,
    canchaId: 1,
    canchaNombre: 'Cancha Principal (Fútbol 7) - Grass El Chugurano',
    tipoGrass: 'sintetico',
    formato: 'Fútbol 7',
    clienteNombre: 'Carlos Cueva Mendoza',
    clienteTelefono: '976543210',
    clienteEmail: 'carlos.cueva@gmail.com',
    clienteDni: '72458921',
    fecha: 'Ayer, 29 Ago',
    horario: '07:00 PM - 08:00 PM',
    monto: 80,
    montoTotal: 80,
    montoAdelanto: 40,
    saldoPendiente: 40,
    metodoPago: 'yape',
    estado: 'completada',
    comprobanteUrl: 'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?auto=format&fit=crop&w=600&q=80',
    origen: 'web',
    fechaCreacion: 'Ayer',
    calificado: true,
  },
  {
    id: 'RES-8902',
    localId: 1,
    canchaId: 1,
    canchaNombre: 'Cancha Principal (Fútbol 7) - Grass El Chugurano',
    tipoGrass: 'sintetico',
    formato: 'Fútbol 7',
    clienteNombre: 'Jorge Díaz Alva',
    clienteTelefono: '951234876',
    clienteEmail: 'jorge.diaz@gmail.com',
    clienteDni: '74128956',
    fecha: 'Hoy, 30 Ago',
    horario: '06:00 PM - 07:00 PM',
    monto: 80,
    montoTotal: 80,
    montoAdelanto: 40,
    saldoPendiente: 40,
    metodoPago: 'yape',
    estado: 'pendiente_validacion',
    comprobanteUrl: 'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?auto=format&fit=crop&w=600&q=80',
    origen: 'web',
    fechaCreacion: 'Hace 15 min',
  },
  {
    id: 'RES-8903',
    localId: 2,
    canchaId: 2,
    canchaNombre: 'Campo Central - Allianz Arena Soccer',
    tipoGrass: 'sintetico',
    formato: 'Fútbol 7',
    clienteNombre: 'Renzo Bazán Vásquez',
    clienteTelefono: '942819302',
    clienteEmail: 'renzo.bazan@gmail.com',
    clienteDni: '44812390',
    fecha: 'Hoy, 30 Ago',
    horario: '08:00 PM - 09:00 PM',
    monto: 90,
    montoTotal: 90,
    montoAdelanto: 45,
    saldoPendiente: 45,
    metodoPago: 'plin',
    estado: 'aprobada',
    comprobanteUrl: 'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?auto=format&fit=crop&w=600&q=80',
    origen: 'web',
    fechaCreacion: 'Hace 40 min',
  },
  {
    id: 'RES-8904',
    localId: 3,
    canchaId: 3,
    canchaNombre: 'Cancha 1 - Grass sintético CAMPO REAL',
    tipoGrass: 'sintetico',
    formato: 'Fútbol 7',
    clienteNombre: 'Walter Terrones Cabrera',
    clienteTelefono: '988341205',
    clienteEmail: 'walter.terrones@gmail.com',
    clienteDni: '41982345',
    fecha: 'Hoy, 30 Ago',
    horario: '05:00 PM - 06:00 PM',
    monto: 55,
    montoTotal: 55,
    montoAdelanto: 30,
    saldoPendiente: 25,
    metodoPago: 'efectivo',
    estado: 'aprobada',
    origen: 'presencial',
    fechaCreacion: 'Hace 1 hora',
  },

  // Admin 2: Locales [4, 5]
  {
    id: 'RES-8905',
    localId: 4,
    canchaId: 4,
    canchaNombre: 'Cancha Oficial - Gras Sintético EL DORADO',
    tipoGrass: 'sintetico',
    formato: 'Fútbol 7',
    clienteNombre: 'Jhony Rabanal Díaz',
    clienteTelefono: '976112233',
    clienteEmail: 'jhony.rabanal@gmail.com',
    clienteDni: '44812391',
    fecha: 'Hoy, 30 Ago',
    horario: '06:00 PM - 07:00 PM',
    monto: 75,
    montoTotal: 75,
    montoAdelanto: 40,
    saldoPendiente: 35,
    metodoPago: 'yape',
    estado: 'aprobada',
    comprobanteUrl: 'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?auto=format&fit=crop&w=600&q=80',
    origen: 'web',
    fechaCreacion: 'Hace 30 min',
  },
  {
    id: 'RES-8906',
    localId: 5,
    canchaId: 5,
    canchaNombre: 'Cancha Nocturna - Grass Sintetico Rabanal',
    tipoGrass: 'sintetico',
    formato: 'Fútbol 7',
    clienteNombre: 'Segundo Alva Salazar',
    clienteTelefono: '987654321',
    clienteEmail: 'segundo.alva@gmail.com',
    clienteDni: '43981245',
    fecha: 'Mañana, 31 Ago',
    horario: '07:00 PM - 08:00 PM',
    monto: 80,
    montoTotal: 80,
    montoAdelanto: 40,
    saldoPendiente: 40,
    metodoPago: 'plin',
    estado: 'pendiente_validacion',
    comprobanteUrl: 'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?auto=format&fit=crop&w=600&q=80',
    origen: 'web',
    fechaCreacion: 'Hace 5 min',
  },

  // Admin 3: Locales [6, 7]
  {
    id: 'RES-8907',
    localId: 6,
    canchaId: 6,
    canchaNombre: 'Cancha Sintética La Cantera - Grass La Cantera',
    tipoGrass: 'sintetico',
    formato: 'Fútbol 7',
    clienteNombre: 'Manuel Pajares Huamán',
    clienteTelefono: '978554433',
    clienteEmail: 'manuel.pajares@gmail.com',
    clienteDni: '72334455',
    fecha: 'Hoy, 30 Ago',
    horario: '08:00 PM - 09:00 PM',
    monto: 90,
    montoTotal: 90,
    montoAdelanto: 45,
    saldoPendiente: 45,
    metodoPago: 'yape',
    estado: 'aprobada',
    comprobanteUrl: 'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?auto=format&fit=crop&w=600&q=80',
    origen: 'web',
    fechaCreacion: 'Hace 50 min',
  },
  {
    id: 'RES-8908',
    localId: 7,
    canchaId: 7,
    canchaNombre: 'Campo Tradicional - Complejo Deportivo San Martín',
    tipoGrass: 'natural',
    formato: 'Fútbol 7',
    clienteNombre: 'David Terrones Aliaga',
    clienteTelefono: '965443322',
    clienteEmail: 'david.terrones@gmail.com',
    clienteDni: '45889912',
    fecha: 'Hoy, 30 Ago',
    horario: '04:00 PM - 05:00 PM',
    monto: 50,
    montoTotal: 50,
    montoAdelanto: 25,
    saldoPendiente: 25,
    metodoPago: 'efectivo',
    estado: 'aprobada',
    origen: 'presencial',
    fechaCreacion: 'Hace 2 horas',
  },
];

/**
 * =========================================================================
 * 4. RESEÑAS REALISTAS PARA LAS CANCHAS DE CAJAMARCA
 * =========================================================================
 */
export const INITIAL_RESENAS: ResenaCancha[] = [
  {
    id: 'res-1',
    reservaId: 'RES-8901',
    canchaId: 1,
    canchaNombre: 'Grass El Chugurano',
    autorNombre: 'Manuel Pajares',
    estrellas: 5,
    comentario: '¡Excelente cancha en Manuel Seoane! Grass sintético en perfecto estado y la luz LED de noche no deslumbra. Muy buen servicio de snacks.',
    fecha: 'Hace 2 días',
  },
  {
    id: 'res-2',
    reservaId: 'RES-8902',
    canchaId: 2,
    canchaNombre: 'Allianz Arena Soccer',
    autorNombre: 'Renzo Bazán',
    estrellas: 5,
    comentario: 'Tribunas amplias, vestuarios limpios y estacionamiento vigilado. Muy buena iluminación nocturna para jugar en Cinco Esquinas.',
    fecha: 'Hace 3 días',
  },
  {
    id: 'res-3',
    reservaId: 'RES-8904',
    canchaId: 3,
    canchaNombre: 'Grass sintético CAMPO REAL',
    autorNombre: 'Jhony Rabanal',
    estrellas: 5,
    comentario: 'Atención 24 horas y buena cafetería. Ideal para jugar con amigos después del trabajo.',
    fecha: 'Hace 4 días',
  },
  {
    id: 'res-4',
    reservaId: 'RES-8907',
    canchaId: 6,
    canchaNombre: 'Grass La Cantera',
    autorNombre: 'David Terrones',
    estrellas: 5,
    comentario: 'La mejor cancha cerca al Quinde en Av. Hoyos Rubio. Césped suave, iluminación pro y buena zona de snacks.',
    fecha: 'Hace 5 días',
  },
];
