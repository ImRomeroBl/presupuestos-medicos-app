import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export type SharePresupuestoPdfResult =
  | 'shared'
  | 'missing-uri'
  | 'invalid-uri'
  | 'not-found'
  | 'unreadable'
  | 'sharing-unavailable';

const PDF_HEADER = '%PDF-';

/**
 * `expo-sharing` en Android solo acepta el esquema `file`; además la ruta debe
 * ser absoluta (`file:///...`). Las rutas relativas, `content://` y los
 * esquemas remotos no son válidos para `Sharing.shareAsync`.
 */
function hasSupportedPdfUriScheme(uri: string): boolean {
  return uri.toLowerCase().startsWith('file:///');
}

/**
 * Valida que el PDF exista, tenga formato correcto y sea legible por la app
 * antes de abrir el diálogo nativo de compartición.
 * No muestra alertas: devuelve un resultado para que la pantalla decida el mensaje.
 */
export async function sharePresupuestoPdf(
  uri: string | null
): Promise<SharePresupuestoPdfResult> {
  if (!uri) {
    return 'missing-uri';
  }

  const normalizedUri = uri.trim();

  if (!normalizedUri) {
    return 'missing-uri';
  }

  if (!hasSupportedPdfUriScheme(normalizedUri)) {
    console.error(
      '[PDF] sharePresupuestoPdf: URI con esquema o formato no soportado',
      { uri: normalizedUri }
    );
    return 'invalid-uri';
  }

  const info = await FileSystem.getInfoAsync(normalizedUri).catch((error) => {
    console.error(
      '[PDF] sharePresupuestoPdf: no se pudo inspeccionar el archivo',
      error
    );
    return null;
  });

  if (!info) {
    return 'unreadable';
  }

  if (!info.exists) {
    console.error('[PDF] sharePresupuestoPdf: el archivo no existe', {
      uri: normalizedUri,
    });
    return 'not-found';
  }

  if (info.isDirectory || info.size <= 0) {
    console.error(
      '[PDF] sharePresupuestoPdf: el archivo no es un PDF válido',
      {
        uri: normalizedUri,
        isDirectory: info.isDirectory,
        size: info.size,
      }
    );
    return 'unreadable';
  }

  // Verifica que la app pueda leer el archivo antes de pasarlo al FileProvider
  // de expo-sharing. Los archivos de documentDirectory son privados de la app,
  // pero esta lectura detecta rutas corruptas o archivos sin permisos.
  try {
    const header = await FileSystem.readAsStringAsync(normalizedUri, {
      encoding: FileSystem.EncodingType.UTF8,
      position: 0,
      length: PDF_HEADER.length,
    });

    if (!header.startsWith(PDF_HEADER)) {
      console.error(
        '[PDF] sharePresupuestoPdf: el archivo no tiene cabecera PDF',
        {
          uri: normalizedUri,
          header,
        }
      );
      return 'unreadable';
    }
  } catch (error) {
    console.error(
      '[PDF] sharePresupuestoPdf: el archivo no es legible',
      error
    );
    return 'unreadable';
  }

  try {
    const sharingAvailable = await Sharing.isAvailableAsync();

    if (!sharingAvailable) {
      console.error(
        '[PDF] sharePresupuestoPdf: Sharing no está disponible en este dispositivo'
      );
      return 'sharing-unavailable';
    }

    console.log('[PDF] sharePresupuestoPdf: compartiendo archivo', {
      uri: normalizedUri,
      size: info.size,
    });

    await Sharing.shareAsync(normalizedUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartir presupuesto',
      UTI: 'com.adobe.pdf',
    });

    return 'shared';
  } catch (error) {
    console.error(
      '[PDF] sharePresupuestoPdf: falló Sharing.shareAsync',
      error
    );
    throw error;
  }
}
