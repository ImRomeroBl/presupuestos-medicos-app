import type { Paciente, Tratamiento } from '../types';
import { calcularTotales } from './calculos';

export type ErrorValidacion =
  | 'paciente-incompleto'
  | 'sin-tratamientos'
  | 'sin-tratamientos-validos'
  | 'total-invalido';

export function validarPaciente(paciente: Paciente): ErrorValidacion | null {
  const nombre = String(paciente.nombre ?? '').trim();
  const edad = String(paciente.edad ?? '').trim();

  return nombre.length > 0 && edad.length > 0 ? null : 'paciente-incompleto';
}

export function validarTratamientos(tratamientos: Tratamiento[]): ErrorValidacion | null {
  if (tratamientos.length === 0) {
    return 'sin-tratamientos';
  }

  const { tratamientosValidos, total } = calcularTotales(tratamientos);

  if (tratamientosValidos.length === 0) {
    return 'sin-tratamientos-validos';
  }

  if (total <= 0) {
    return 'total-invalido';
  }

  return null;
}

export function validarPresupuesto(
  paciente: Paciente,
  tratamientos: Tratamiento[]
): ErrorValidacion | null {
  return validarPaciente(paciente) ?? validarTratamientos(tratamientos);
}
