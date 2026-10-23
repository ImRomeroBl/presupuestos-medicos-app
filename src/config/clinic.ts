/**
 * Datos de la clínica usados en la app y en el membrete del PDF.
 * `direccion` y `telefono` quedan preparados para cuando la clínica los configure;
 * hoy no se imprimen para no alterar el diseño actual del PDF.
 */
export const CLINICA = {
  nombre: 'CONSULTORIO DENTAL',
  doctora: 'DRA. MA. DEL ROCIO BLANCO GARCIA',
  direccion: '',
  telefono: '',
} as const;
