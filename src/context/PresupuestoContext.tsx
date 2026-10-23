import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { calcularTotal } from '../domain/calculos';
import { formatDate } from '../lib/date';
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

  // 🔹 CARGAR AL INICIAR
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const data = await AsyncStorage.getItem('presupuestos');
      if (data) {
        const parsed: unknown = JSON.parse(data);
        if (Array.isArray(parsed)) {
          setPresupuestos(parsed as Presupuesto[]);
        }
      }
    } catch (error) {
      console.log('Error cargando datos', error);
    }
  };

  // 🔹 GUARDAR SIEMPRE (incluso vacío)
  useEffect(() => {
    guardarEnStorage(presupuestos);
  }, [presupuestos]);

  const guardarEnStorage = async (data: Presupuesto[]) => {
    try {
      await AsyncStorage.setItem('presupuestos', JSON.stringify(data));
    } catch (error) {
      console.log('Error guardando', error);
    }
  };

  const resetPresupuesto = useCallback(() => {
    setPaciente({ nombre: '', edad: '' });
    setTratamientos([]);
  }, []);

  // 🔥 GUARDAR / ACTUALIZAR PRESUPUESTO
  const guardarPresupuesto = (pdfUri: string) => {

    // Solo los tratamientos válidos participan en el total.
    const total = calcularTotal(tratamientos);

    // 🔍 BUSCAR SI YA EXISTE ESTE PACIENTE
    const existente = presupuestos.find(
      (p) => p.paciente.nombre === paciente.nombre
    );

    const nuevo: Presupuesto = {
      id: existente?.id || Date.now().toString(),
      paciente,
      tratamientos,
      total,
      fecha: formatDate(),
      pdf: pdfUri
    };

    if (existente) {
      // 🔁 ACTUALIZA
      setPresupuestos(prev =>
        prev.map(p => (p.id === existente.id ? nuevo : p))
      );
    } else {
      // ➕ CREA NUEVO
      setPresupuestos(prev => [...prev, nuevo]);
    }
  };

  // 🔥 ELIMINAR PRESUPUESTO
  const eliminarPresupuesto = (id: string) => {
    setPresupuestos(prev => prev.filter(p => p.id !== id));
  };

  return (
    <PresupuestoContext.Provider value={{
      paciente,
      setPaciente,
      tratamientos,
      setTratamientos,
      presupuestos,
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
