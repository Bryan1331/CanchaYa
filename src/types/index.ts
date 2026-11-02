export type TipoGrass = 'sintetico' | 'natural';

export interface ReglasTarifa {
  precioDiaSemana: number;      // ej: S/ 50 (Turno diurno Lunes a Viernes)
  precioNocheSemana: number;    // ej: S/ 80 (Turno nocturno con luz Lunes a Viernes)
  precioDiaFinSemana: number;   // ej: S/ 65 (Turno diurno Sábado o Domingo)
  precioNocheFinSemana: number; // ej: S/ 95 (Turno nocturno Sábado o Domingo con luz)
  horaCorteNoche?: number;      // Por defecto hora 18 (06:00 PM)
}

export interface HorarioSlot {
  id: string;
  horaInicio: string; // ej: "06:00 PM"
  horaFin: string;    // ej: "07:00 PM"
  disponible: boolean;
  precio: number;     // en Soles S/ (precio base)
  precioDinamico?: number; // precio calculado según franja y día
  esNoche?: boolean;
  bloqueado?: boolean;
  motivoBloqueo?: string; // ej: "Lluvia", "Mantenimiento", "Torneo"
}

export interface CoordenadasGPS {
  lat: number;
  lng: number;
}

export interface Cancha {
  id: number;
  nombre: string;
  establecimiento: string;
  direccion: string;
  precioDia: number;
  precioNoche: number;
  coordenadas: { lat: number; lng: number };
  servicios: string[];
  imagenes: string[];
  estrellas: number;
  totalResenas: number;

  // Campos complementarios para compatibilidad con la UI y motor de reservas
  localId?: number;
  localNombre?: string;
  tipoGrass?: TipoGrass;
  formato?: string;
  tipoSuperficie?: string;
  ubicacion?: string;
  sector?: string;
  precioDesde?: number;
  imagenUrl?: string;
  galeriaFotos?: string[];
  techada?: boolean;
  iluminacion?: boolean;
  estacionamiento?: boolean;
  reglasTarifas?: ReglasTarifa;
  calificacionPromedio?: number;
  horarios?: HorarioSlot[];
}

export type EstadoReserva = 'pendiente' | 'pendiente_validacion' | 'aprobada' | 'rechazada' | 'completada';
export type MetodoPago = 'yape' | 'plin' | 'transferencia' | 'efectivo';

export interface UsuarioCliente {
  id?: string;
  nombre: string;
  telefono: string;
  email: string;
  dni?: string;
  foto?: string; // URL de foto de perfil (Google OAuth)
  rol?: 'admin' | 'recepcion' | 'cliente';
  localesAsignados?: number[]; // [US-24] Locales autorizados para administradores y recepcionistas
}

export interface AdminUser {
  id: string;
  email: string;
  password?: string;
  nombre: string;
  cargo: string;
  localesAsignados: number[];
  telefono: string;
}

export interface Reserva {
  id: string;
  localId?: number;     // Local correspondiente [US-24]
  canchaId: number | string;
  canchaNombre: string;
  tipoGrass?: TipoGrass;
  formato?: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  clienteDni?: string;
  fecha: string;        // ej: "Hoy, 30 Ago" o "Sábado, 30 Ago"
  horario: string;      // ej: "07:00 PM - 08:00 PM"
  monto: number;        // Monto total del turno (S/)
  montoTotal?: number;  // Alias monto total
  montoAdelanto?: number; // Adelanto validado en Yape/Plin (ej: 50%) [US-16/US-17]
  saldoPendiente?: number; // Saldo pendiente a cobrar en cancha [US-17]
  metodoPago: MetodoPago;
  estado: EstadoReserva;
  comprobanteUrl?: string; // URL o base64 del comprobante de adelanto
  origen?: 'web' | 'presencial' | 'telefonica';
  fechaCreacion: string;
  calificado?: boolean; // [US-23] Si ya fue valorado por el jugador post-pichanga
  calificacion?: {
    estrellas: number;
    comentario: string;
    fecha: string;
  };
}

export interface ResenaCancha {
  id: string;
  reservaId: string;
  canchaId: number | string;
  canchaNombre: string;
  autorNombre: string;
  estrellas: number; // 1 a 5
  comentario: string;
  fecha: string;
}

export interface TarifaCalculada {
  precioTotal: number;
  montoAdelanto: number;
  saldoPendiente: number;
  esNoche: boolean;
  esFinSemana: boolean;
  etiquetaTarifa: string;
}
