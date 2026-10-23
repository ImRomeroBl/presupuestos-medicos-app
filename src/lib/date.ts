/**
 * Formato de fecha centralizado. Se mantiene el formato local del dispositivo
 * para conservar el comportamiento actual de la aplicación.
 */
export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString();
}
