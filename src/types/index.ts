export type TipoGrass = 'sintetico' | 'natural';

export interface HorarioSlot {
  id: string;
  horaInicio: string; // ej: "06:00 PM"
  horaFin: string;    // ej: "07:00 PM"
  disponible: boolean;
  precio: number;     // en Soles S/
  bloqueado?: boolean;
  motivoBloqueo?: string; // ej: "Lluvia", "Mantenimiento", "Torneo"
}

export interface Cancha {
  id: string;
  nombre: string;
  tipoGrass: TipoGrass;
  formato: string;        // ej: "Fútbol 6", "Fútbol 7", "Fútbol 8", "Fútbol 11"
  tipoSuperficie: string; // ej: "Grass Sintético Monofilamento 55mm", "Césped Natural Andino"
  ubicacion: string;
  sector: string;         // ej: "Baños del Inca", "Av. Hoyos Rubio", "Santa Apolonia", "Qhapaq Ñan"
  precioDesde: number;
  imagenUrl: string;
  techada: boolean;
  iluminacion: boolean;
  estacionamiento: boolean;
  horarios: HorarioSlot[];
}

export type EstadoReserva = 'pendiente' | 'pendiente_validacion' | 'aprobada' | 'rechazada' | 'completada';
export type MetodoPago = 'yape' | 'plin' | 'transferencia' | 'efectivo';

export interface UsuarioCliente {
  id?: string;
  nombre: string;
  telefono: string;
  email: string;
  dni?: string;
}

export interface Reserva {
  id: string;
  canchaId: string;
  canchaNombre: string;
  tipoGrass: TipoGrass;
  formato: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  clienteDni?: string;
  fecha: string;       // ej: "Hoy, 30 Ago"
  horario: string;     // ej: "07:00 PM - 08:00 PM"
  monto: number;       // en Soles S/
  metodoPago: MetodoPago;
  estado: EstadoReserva;
  comprobanteUrl?: string; // URL o base64 del comprobante de adelanto
  origen?: 'web' | 'presencial' | 'telefonica';
  fechaCreacion: string;
}
