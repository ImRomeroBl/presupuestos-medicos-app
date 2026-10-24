import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

const LOGO_ASSET = require('../../../assets/images/logo.png');

/**
 * Carga el logo local y lo devuelve como data URI para incrustarlo en el PDF.
 * Cualquier fallo se registra y se traduce en una cadena vacía: el PDF debe
 * poder generarse igualmente, sin logo.
 */
export async function getLogoDataUri(): Promise<string> {
  try {
    console.log('[PDF] getLogoDataUri: iniciando carga del logo');

    const asset = Asset.fromModule(LOGO_ASSET);
    console.log('[PDF] getLogoDataUri: asset resuelto', {
      uri: asset.uri,
      localUri: asset.localUri,
    });

    await asset.downloadAsync();
    console.log('[PDF] getLogoDataUri: asset descargado', {
      localUri: asset.localUri,
    });

    if (!asset.localUri) {
      console.error(
        '[PDF] getLogoDataUri: asset.localUri es null; se generará el PDF sin logo'
      );
      return '';
    }

    const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('[PDF] getLogoDataUri: base64 leído correctamente', {
      length: base64.length,
    });

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error(
      '[PDF] getLogoDataUri: error cargando el logo; se generará el PDF sin logo',
      error
    );
    return '';
  }
}
