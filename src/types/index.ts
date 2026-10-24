import type { Dispatch, SetStateAction } from 'react';

export interface Paciente {
  nombre: string;
  edad: string;
}

export interface Clinica {
  nombre: string;
  doctora: string;
  direccion: string;
  telefono: string;
}

export interface Tratamiento {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
}

export interface Presupuesto {
  id: string;
  paciente: Paciente;
  tratamientos: Tratamiento[];
  total: number;
  fecha: string;
  pdf: string;
}

export interface PresupuestoContextValue {
  paciente: Paciente;
  setPaciente: Dispatch<SetStateAction<Paciente>>;
  tratamientos: Tratamiento[];
  setTratamientos: Dispatch<SetStateAction<Tratamiento[]>>;
  presupuestos: Presupuesto[];
  isHydrated: boolean;
  guardarPresupuesto: (pdfUri: string) => void;
  eliminarPresupuesto: (id: string) => void;
  resetPresupuesto: () => void;
  editandoId: string | null;
  setEditandoId: Dispatch<SetStateAction<string | null>>;
}
