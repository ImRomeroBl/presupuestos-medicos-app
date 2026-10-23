import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';

export const PresupuestoContext = createContext<any>(null);

export function PresupuestoProvider({ children }: any) {

  const [paciente, setPaciente] = useState({
    nombre: '',
    edad: ''
  });

  const [tratamientos, setTratamientos] = useState<any[]>([]);
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // 🔹 CARGAR AL INICIAR
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const data = await AsyncStorage.getItem('presupuestos');
      if (data) {
        setPresupuestos(JSON.parse(data));
      }
    } catch (error) {
      console.log('Error cargando datos', error);
    }
  };

  // 🔹 GUARDAR SIEMPRE (incluso vacío)
  useEffect(() => {
    guardarEnStorage(presupuestos);
  }, [presupuestos]);

  const guardarEnStorage = async (data: any) => {
    try {
      await AsyncStorage.setItem('presupuestos', JSON.stringify(data));
    } catch (error) {
      console.log('Error guardando', error);
    }
  };

  const resetPresupuesto = () => {
    setPaciente({ nombre: '', edad: '' });
    setTratamientos([]);
  };

  // 🔥 GUARDAR / ACTUALIZAR PRESUPUESTO (CORREGIDO)
  const guardarPresupuesto = (pdfUri: string) => {

    const total = tratamientos.reduce(
      (acc, t) => acc + Number(t.precio || 0),
      0
    );

    // 🔍 BUSCAR SI YA EXISTE ESTE PACIENTE
    const existente = presupuestos.find(
      (p) => p.paciente.nombre === paciente.nombre
    );

    const nuevo = {
      id: existente?.id || Date.now().toString(),
      paciente,
      tratamientos,
      total,
      fecha: new Date().toLocaleDateString(),
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
    const filtrados = presupuestos.filter(p => p.id !== id);
    setPresupuestos(filtrados);
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