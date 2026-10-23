/**
 * Formato de moneda usado en toda la aplicación.
 * No incluye símbolo ni sufijo para que cada pantalla decida cómo presentarlo.
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('es-MX');
}
