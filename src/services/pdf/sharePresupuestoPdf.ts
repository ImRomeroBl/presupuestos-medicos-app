import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export type SharePresupuestoPdfResult = 'shared' | 'missing-uri' | 'not-found';

/**
 * Valida que el PDF exista y abre el diálogo nativo de compartición.
 * No muestra alertas: devuelve un resultado para que la pantalla decida el mensaje.
 */
export async function sharePresupuestoPdf(
  uri: string | null
): Promise<SharePresupuestoPdfResult> {
  if (!uri) {
    return 'missing-uri';
  }

  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    return 'not-found';
  }

  await Sharing.shareAsync(uri);
  return 'shared';
}
