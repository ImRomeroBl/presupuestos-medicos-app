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
 * Comprueba que exista el directorio de documentos y lo crea si hace falta.
 * Devuelve `null` si no se puede usar.
 */
async function prepareDocumentDirectory(): Promise<string | null> {
  const documentDirectory = FileSystem.documentDirectory;

  if (!documentDirectory) {
    console.error(
      '[PDF] generatePresupuestoPdf: FileSystem.documentDirectory es null'
    );
    return null;
  }

  try {
    const info = await FileSystem.getInfoAsync(documentDirectory);

    console.log('[PDF] generatePresupuestoPdf: documentDirectory verificado', {
      documentDirectory,
      exists: info.exists,
    });

    if (!info.exists) {
      console.log(
        '[PDF] generatePresupuestoPdf: creando documentDirectory inexistente'
      );
      await FileSystem.makeDirectoryAsync(documentDirectory, {
        intermediates: true,
      });
    }

    return documentDirectory;
  } catch (error) {
    console.error(
      '[PDF] generatePresupuestoPdf: error verificando/creando documentDirectory',
      error
    );
    return null;
  }
}

/**
 * Genera el PDF a partir del HTML y lo escribe directamente en
 * `FileSystem.documentDirectory`.
 *
 * En Expo Print 58 `printToFileAsync` no acepta una ruta de destino
 * (`filePath` no existe en `FilePrintOptions`), por lo que el PDF se solicita
 * también en Base64 y se escribe con FileSystem. Así evitamos leer o copiar el
 * archivo temporal de la caché, que en algunos Android no es accesible desde JS.
 */
export async function generatePresupuestoPdf({
  html,
  patientName,
}: GeneratePresupuestoPdfInput): Promise<GeneratedPresupuestoPdf> {
  const fileName = buildPdfFileName(patientName);

  let result: Print.FilePrintResult;

  try {
    console.log('[PDF] generatePresupuestoPdf: llamando a Print.printToFileAsync', {
      htmlLength: html.length,
      fileName,
      base64: true,
    });

    result = await Print.printToFileAsync({ html, base64: true });

    console.log('[PDF] generatePresupuestoPdf: PDF generado por Print', {
      temporaryUri: result.uri,
      numberOfPages: result.numberOfPages,
      base64Length: result.base64?.length ?? 0,
    });
  } catch (error) {
    console.error(
      '[PDF] generatePresupuestoPdf: falló Print.printToFileAsync',
      error
    );
    throw error;
  }

  // iOS puede devolver el Base64 con saltos de línea. Se eliminan antes de
  // escribir el archivo para que el decodificador Base64 reciba una cadena limpia.
  const base64 = result.base64?.replace(/\s/g, '') ?? '';

  if (!base64) {
    console.error(
      '[PDF] generatePresupuestoPdf: Print no devolvió el PDF en Base64'
    );
    throw new Error('Expo Print no devolvió el PDF en Base64');
  }

  const documentDirectory = await prepareDocumentDirectory();

  if (!documentDirectory) {
    console.error(
      '[PDF] generatePresupuestoPdf: documentDirectory no está disponible; no se puede guardar el PDF'
    );
    throw new Error('FileSystem.documentDirectory no está disponible');
  }

  const destinationUri = `${documentDirectory}${fileName}`;

  try {
    console.log(
      '[PDF] generatePresupuestoPdf: escribiendo PDF en documentDirectory',
      {
        destinationUri,
        base64Length: base64.length,
      }
    );

    await FileSystem.writeAsStringAsync(destinationUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const destinationInfo = await FileSystem.getInfoAsync(destinationUri);

    console.log('[PDF] generatePresupuestoPdf: archivo final verificado', {
      destinationUri,
      exists: destinationInfo.exists,
      size: destinationInfo.exists ? destinationInfo.size : 0,
      isDirectory: destinationInfo.exists
        ? destinationInfo.isDirectory
        : false,
    });

    if (
      !destinationInfo.exists ||
      destinationInfo.isDirectory ||
      destinationInfo.size <= 0
    ) {
      console.error(
        '[PDF] generatePresupuestoPdf: el archivo final no es válido'
      );
      throw new Error(
        'El PDF no se escribió correctamente en documentDirectory'
      );
    }
  } catch (error) {
    console.error(
      '[PDF] generatePresupuestoPdf: falló la escritura del PDF en documentDirectory',
      error
    );
    throw error;
  }

  // El archivo temporal de Print ya no es necesario. Si no se puede eliminar,
  // no debe bloquear la compartición del PDF final.
  try {
    await FileSystem.deleteAsync(result.uri, { idempotent: true });
    console.log(
      '[PDF] generatePresupuestoPdf: archivo temporal de Print eliminado'
    );
  } catch (error) {
    console.error(
      '[PDF] generatePresupuestoPdf: no se pudo eliminar el archivo temporal (no bloqueante)',
      error
    );
  }

  return { uri: destinationUri, fileName };
}
