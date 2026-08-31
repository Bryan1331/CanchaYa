export type TipoGrass = 'sintetico' | 'natural';

export interface HorarioSlot {
  id: string;
  horaInicio: string; // ej: "06:00 PM"
  horaFin: string;    // ej: "07:00 PM"
  disponible: boolean;
  precio: number;     // en Soles S/
}

export interface Cancha {
  id: string;
  nombre: string;
  tipoGrass: TipoGrass;
  formato: string;        // ej: "Fútbol 6", "Fútbol 7", "Fútbol 8", "Fútbol 11"
  tipoSuperficie: string; // ej: "Grass Sintético Monofilamento 55mm", "Césped Natural Andino"
  ubicacion: string;
  sector: string;         // ej: "Baños del Inca", "Av. Hoyos Rubio", "Santa Apolonia", "Qhapaq Ñan"
  calificacion: number;
  precioDesde: number;
  imagenUrl: string;
  techada: boolean;
  iluminacion: boolean;
  estacionamiento: boolean;
  incluyeBalon: boolean;
  incluyeChalecos: boolean;
  duchasCalientes: boolean;
  horarios: HorarioSlot[];
}

export type EstadoReserva = 'pendiente' | 'aprobada' | 'rechazada' | 'completada';
export type MetodoPago = 'yape' | 'plin' | 'transferencia' | 'efectivo';

export interface Reserva {
  id: string;
  canchaId: string;
  canchaNombre: string;
  tipoGrass: TipoGrass;
  formato: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  fecha: string;       // ej: "Hoy, 30 Ago"
  horario: string;     // ej: "07:00 PM - 08:00 PM"
  monto: number;       // en Soles S/
  metodoPago: MetodoPago;
  estado: EstadoReserva;
  comprobanteUrl?: string;
  codigoOperacion?: string;
  fechaCreacion: string;
  adicionales?: {
    balonExtra?: boolean;
    juegoChalecos?: boolean;
    arbitroColegiado?: boolean;
  };
}

export interface Torneo {
  id: string;
  titulo: string;
  formato: string;     // ej: "Fútbol 7", "Fútbol 8 Libre"
  tipoGrass: TipoGrass;
  categoria: string;   // ej: "Libre Varones", "Interbarrios Cajamarca", "Master 35+"
  premio: string;      // ej: "S/ 4,000 + Copa Cajamarquina"
  inscripcion: number; // en Soles S/
  fechaInicio: string;
  equiposInscritos: number;
  maxEquipos: number;
  estado: 'abierto' | 'en_progreso' | 'finalizado';
  bannerUrl?: string;
}
