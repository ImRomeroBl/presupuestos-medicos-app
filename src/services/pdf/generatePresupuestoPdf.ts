import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';

export interface GeneratePresupuestoPdfInput {
  html: string;
  patientName: string;
}

export interface GeneratedPresupuestoPdf {
  uri: string;
  fileName: string;
}

/**
 * Nombre estable y seguro para el archivo. Conserva el comportamiento
 * anterior: nombre del paciente sin espacios ni caracteres especiales + timestamp.
 */
export function buildPdfFileName(patientName: string, timestamp: number = Date.now()): string {
  const nombreLimpio =
    (patientName || 'paciente')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '') || 'paciente';

  return `Presupuesto_${nombreLimpio}_${timestamp}.pdf`;
}

/**
 * Genera el PDF a partir del HTML, lo copia al directorio de documentos
 * con un nombre legible y elimina el archivo temporal de Expo Print.
 */
export async function generatePresupuestoPdf({
  html,
  patientName,
}: GeneratePresupuestoPdfInput): Promise<GeneratedPresupuestoPdf> {
  const { uri: temporaryUri } = await Print.printToFileAsync({ html });

  const fileName = buildPdfFileName(patientName);
  const destinationUri = `${FileSystem.documentDirectory}${fileName}`;

  try {
    await FileSystem.copyAsync({
      from: temporaryUri,
      to: destinationUri,
    });
  } finally {
    await FileSystem.deleteAsync(temporaryUri, { idempotent: true }).catch(() => {
      // El temporal puede haber sido eliminado por el sistema; no es un error.
    });
  }

  return { uri: destinationUri, fileName };
}
