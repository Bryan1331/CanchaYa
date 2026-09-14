import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase';

export interface ReservaData {
  id?: string;
  clienteNombre: string;
  clienteTelefono: string;
  canchaNombre: string;
  fecha: string;
  horario: string;
  montoTotal: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'completada' | string;
  canchaId?: string;
  tipoGrass?: string;
  formato?: string;
  metodoPago?: string;
  codigoOperacion?: string;
  comprobanteUrl?: string;
  adicionales?: {
    balonExtra?: boolean;
    juegoChalecos?: boolean;
    arbitroColegiado?: boolean;
  };
  fechaCreacion?: any;
}

/**
 * Agrega un nuevo documento a la colección 'reservas' en Firestore.
 * Asigna automáticamente el estado 'pendiente' y el timestamp del servidor.
 * 
 * @param data Datos de la reserva a registrar
 * @returns La reserva registrada con su ID de Firestore
 */
export const crearReserva = async (
  data: Omit<ReservaData, 'id' | 'estado' | 'fechaCreacion'> & { estado?: string }
): Promise<ReservaData> => {
  const collectionRef = collection(db, 'reservas');

  const nuevaReservaDoc = {
    ...data,
    estado: 'pendiente',
    fechaCreacion: serverTimestamp(),
  };

  const docRef = await addDoc(collectionRef, nuevaReservaDoc);

  return {
    id: docRef.id,
    ...nuevaReservaDoc,
  };
};

/**
 * Obtiene todas las reservas para el panel de administración ordenadas por fecha de creación descendente.
 * 
 * @returns Lista de reservas registradas en Firestore
 */
export const obtenerReservasAdmin = async (): Promise<ReservaData[]> => {
  try {
    const q = query(collection(db, 'reservas'), orderBy('fechaCreacion', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...(doc.data() as Omit<ReservaData, 'id'>),
    }));
  } catch (error) {
    console.warn('Fallback a consulta simple de reservas por ordenamiento o índice:', error);
    const querySnapshot = await getDocs(collection(db, 'reservas'));

    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...(doc.data() as Omit<ReservaData, 'id'>),
    }));
  }
};
