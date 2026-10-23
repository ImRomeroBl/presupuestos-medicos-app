import type { Tratamiento } from '../types';

/**
 * Un tratamiento solo se cobra si tiene nombre y un precio positivo.
 * Los tratamientos incompletos se conservan para poder editarlos,
 * pero no participan en el total ni en el PDF.
 */
export function esTratamientoValido(tratamiento: Tratamiento): boolean {
  const nombre = String(tratamiento.nombre ?? '').trim();
  const precio = Number(tratamiento.precio);

  return nombre.length > 0 && Number.isFinite(precio) && precio > 0;
}

export function filtrarTratamientosValidos(tratamientos: Tratamiento[]): Tratamiento[] {
  return tratamientos.filter(esTratamientoValido);
}

export interface TotalesPresupuesto {
  tratamientosValidos: Tratamiento[];
  total: number;
}

/**
 * Única fuente de verdad para el total de un presupuesto.
 * Se usa tanto al guardar como al pintar el resumen y generar el PDF.
 */
export function calcularTotales(tratamientos: Tratamiento[]): TotalesPresupuesto {
  const tratamientosValidos = filtrarTratamientosValidos(tratamientos);

  const total = tratamientosValidos.reduce(
    (acumulado, tratamiento) => acumulado + Number(tratamiento.precio),
    0
  );

  return { tratamientosValidos, total };
}

export function calcularTotal(tratamientos: Tratamiento[]): number {
  return calcularTotales(tratamientos).total;
}
