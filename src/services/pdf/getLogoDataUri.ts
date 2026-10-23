import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

const LOGO_ASSET = require('../../../assets/images/logo.png');

/**
 * Carga el logo local y lo devuelve como data URI para incrustarlo en el PDF.
 * Si falla, retorna una cadena vacía: el PDF se genera igual, sin logo.
 */
export async function getLogoDataUri(): Promise<string> {
  try {
    const asset = Asset.fromModule(LOGO_ASSET);
    await asset.downloadAsync();

    if (!asset.localUri) {
      return '';
    }

    const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.log('Error logo:', error);
    return '';
  }
}
