import { Cancha, HorarioSlot, TarifaCalculada } from '../types';

/**
 * Determina si una hora en formato "06:00 PM" o "05:30 PM" corresponde a la franja nocturna (con luz).
 * Por defecto, en Cajamarca a partir de las 06:00 PM (18:00 hrs) se requiere iluminación artificial.
 */
export const esHorarioNocturno = (horaInicio: string, horaCorte: number = 18): boolean => {
  if (!horaInicio) return false;

  const match = horaInicio.match(/(\d+):?(\d*)\s*(AM|PM)/i);
  if (!match) return false;

  let hora = parseInt(match[1], 10);
  const meridiano = match[3].toUpperCase();

  if (meridiano === 'PM' && hora !== 12) {
    hora += 12;
  } else if (meridiano === 'AM' && hora === 12) {
    hora = 0;
  }

  return hora >= horaCorte;
};

/**
 * Determina si la fecha seleccionada corresponde a un Fin de Semana (Sábado o Domingo).
 */
export const esFinDeSemana = (fechaStr: string): boolean => {
  if (!fechaStr) return false;
  const texto = fechaStr.toLowerCase();
  return (
    texto.includes('sáb') ||
    texto.includes('sab') ||
    texto.includes('dom') ||
    texto.includes('sábado') ||
    texto.includes('domingo')
  );
};

/**
 * [US-16] Calcula la tarifa dinámica para una cancha y horario según franja y tipo de día.
 * Retorna el precio total, adelanto (50%) y saldo por cobrar en cancha.
 */
export const calcularTarifaDinamica = (
  cancha: Cancha,
  slot: HorarioSlot,
  fechaStr: string
): TarifaCalculada => {
  const finSemana = esFinDeSemana(fechaStr);
  const noche = slot.esNoche !== undefined ? slot.esNoche : esHorarioNocturno(slot.horaInicio);

  let precioTotal = slot.precio;

  if (cancha.reglasTarifas) {
    const { precioDiaSemana, precioNocheSemana, precioDiaFinSemana, precioNocheFinSemana } =
      cancha.reglasTarifas;

    if (finSemana) {
      precioTotal = noche ? precioNocheFinSemana : precioDiaFinSemana;
    } else {
      precioTotal = noche ? precioNocheSemana : precioDiaSemana;
    }
  } else if (cancha.precioDia !== undefined && cancha.precioNoche !== undefined) {
    const base = noche ? cancha.precioNoche : cancha.precioDia;
    precioTotal = finSemana ? base + 10 : base;
  } else {
    // Si no tiene reglas explícitas, aplicar recargo nocturno estándar y fin de semana
    if (noche) {
      precioTotal = slot.precio;
    } else {
      precioTotal = Math.max(50, slot.precio - 20); // Tarifa diurna económica
    }
    if (finSemana) {
      precioTotal += 10;
    }
  }

  const montoAdelanto = Math.round(precioTotal * 0.5); // 50% de adelanto requerido
  const saldoPendiente = precioTotal - montoAdelanto;

  let etiquetaTarifa = '';
  if (finSemana) {
    etiquetaTarifa = noche ? 'Fin de Semana • Noche (con Luz)' : 'Fin de Semana • Turno Día';
  } else {
    etiquetaTarifa = noche ? 'Semana • Noche (con Luz LED)' : 'Semana • Turno Día Diurno';
  }

  return {
    precioTotal,
    montoAdelanto,
    saldoPendiente,
    esNoche: noche,
    esFinSemana: finSemana,
    etiquetaTarifa,
  };
};
