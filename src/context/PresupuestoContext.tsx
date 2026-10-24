import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { calcularTotal } from '../domain/calculos';
import { formatDate } from '../lib/date';
import { presupuestoRepository } from '../services/storage/presupuestoRepository';
import type {
  Paciente,
  Presupuesto,
  PresupuestoContextValue,
  Tratamiento,
} from '../types';

export const PresupuestoContext = createContext<PresupuestoContextValue | null>(null);

export function usePresupuesto(): PresupuestoContextValue {
  const contexto = useContext(PresupuestoContext);

  if (!contexto) {
    throw new Error('usePresupuesto debe usarse dentro de PresupuestoProvider');
  }

  return contexto;
}

export function PresupuestoProvider({ children }: { children: ReactNode }) {

  const [paciente, setPaciente] = useState<Paciente>({
    nombre: '',
    edad: ''
  });

  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hidratación inicial: una sola lectura y ningún guardado hasta terminar.
  useEffect(() => {
    let cancelado = false;

    const hidratar = async () => {
      try {
        const almacenados = await presupuestoRepository.load();
        if (cancelado) return;

        // Si el usuario alcanzó a crear algo antes de hidratar, se conserva.
        setPresupuestos((previos) =>
          presupuestoRepository.merge(almacenados, previos)
        );
        setIsHydrated(true);
      } catch (error) {
        // No marcar hidratado si la lectura falla: así nunca se sobrescribe
        // el almacenamiento con un arreglo vacío.
        console.log('Error cargando presupuestos', error);
      }
    };

    hidratar();

    return () => {
      cancelado = true;
    };
  }, []);

  // Persistencia: solo después de una hidratación exitosa.
  useEffect(() => {
    if (!isHydrated) return;

    presupuestoRepository.save(presupuestos).catch((error) => {
      console.log('Error guardando presupuestos', error);
    });
  }, [isHydrated, presupuestos]);

  const resetPresupuesto = useCallback(() => {
    setPaciente({ nombre: '', edad: '' });
    setTratamientos([]);
    setEditandoId(null);
  }, []);

  // Upsert estricto por id: nunca se busca por nombre del paciente.
  const guardarPresupuesto = useCallback(
    (pdfUri: string) => {
      const id =
        editandoId ??
        presupuestoRepository.createId(
          presupuestos.map((presupuesto) => presupuesto.id)
        );

      const nuevo: Presupuesto = {
        id,
        paciente,
        tratamientos,
        total: calcularTotal(tratamientos),
        fecha: formatDate(),
        pdf: pdfUri
      };

      setPresupuestos((previos) =>
        presupuestoRepository.upsert(previos, nuevo)
      );
      setEditandoId(id);
    },
    [editandoId, paciente, presupuestos, tratamientos]
  );

  const eliminarPresupuesto = useCallback(
    (id: string) => {
      const objetivo = presupuestos.find(
        (presupuesto) => presupuesto.id === id
      );

      if (objetivo?.pdf) {
        presupuestoRepository.deletePdf(objetivo.pdf).catch((error) => {
          console.log('Error eliminando PDF', error);
        });
      }

      setPresupuestos((previos) =>
        presupuestoRepository.remove(previos, id)
      );

      if (editandoId === id) {
        setEditandoId(null);
      }
    },
    [editandoId, presupuestos]
  );

  return (
    <PresupuestoContext.Provider value={{
      paciente,
      setPaciente,
      tratamientos,
      setTratamientos,
      presupuestos,
      isHydrated,
      guardarPresupuesto,
      eliminarPresupuesto,
      resetPresupuesto,
      editandoId,
      setEditandoId,
    }}>
      {children}
    </PresupuestoContext.Provider>
  );
}
