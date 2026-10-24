import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import { calcularTotal } from '../../domain/calculos';
import type { Presupuesto, Tratamiento } from '../../types';

/**
 * Clave versionada actual. La v1 se conserva intacta para evitar pérdida de datos.
 */
export const PRESUPUESTOS_STORAGE_KEY = '@presupuestos_v2';

/**
 * Claves heredadas:
 * - `@presupuestos`: clave v1 documentada.
 * - `presupuestos`: clave usada por las versiones anteriores de esta app.
 *
 * Nunca se eliminan: si la migración falla, los datos siguen disponibles.
 */
export const PRESUPUESTOS_LEGACY_KEYS = ['@presupuestos', 'presupuestos'] as const;

type UnknownRecord = Record<string, unknown>;

/**
 * Cola de escritura: serializa los `setItem` para que una escritura antigua
 * no pueda terminar después de una nueva y sobrescribirla.
 */
let writeQueue: Promise<void> = Promise.resolve();
let idSequence = 0;

function enqueueWrite(operacion: () => Promise<void>): Promise<void> {
  const siguiente = writeQueue.then(operacion, operacion);

  writeQueue = siguiente.catch(() => {
    // La cola debe seguir viva aunque una escritura falle.
  });

  return siguiente;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

function createUniqueId(prefijo: string, usados: Set<string>): string {
  let id = '';

  do {
    idSequence += 1;
    id = `${prefijo}_${Date.now().toString(36)}_${idSequence.toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  } while (usados.has(id));

  return id;
}

export function createPresupuestoId(idsExistentes: Iterable<string> = []): string {
  return createUniqueId('pre', new Set(idsExistentes));
}

function normalizeTratamiento(
  value: unknown,
  idsUsados: Set<string>
): Tratamiento | null {
  if (!isRecord(value)) return null;

  const idOriginal = typeof value.id === 'string' ? value.id.trim() : '';
  const id =
    idOriginal && !idsUsados.has(idOriginal)
      ? idOriginal
      : createUniqueId('tra', idsUsados);

  idsUsados.add(id);

  const precio = Number(value.precio);

  return {
    id,
    nombre: toText(value.nombre),
    descripcion: toText(value.descripcion),
    precio: Number.isFinite(precio) ? precio : 0,
  };
}

function normalizePresupuesto(
  value: unknown,
  idsUsados: Set<string>
): Presupuesto | null {
  if (!isRecord(value) || !isRecord(value.paciente)) {
    return null;
  }

  const idOriginal = typeof value.id === 'string' ? value.id.trim() : '';
  const id =
    idOriginal && !idsUsados.has(idOriginal)
      ? idOriginal
      : createUniqueId('pre', idsUsados);

  idsUsados.add(id);

  const idsTratamientos = new Set<string>();
  const tratamientosRaw = Array.isArray(value.tratamientos)
    ? value.tratamientos
    : [];

  const tratamientos = tratamientosRaw
    .map((tratamiento) => normalizeTratamiento(tratamiento, idsTratamientos))
    .filter((tratamiento): tratamiento is Tratamiento => tratamiento !== null);

  return {
    id,
    paciente: {
      nombre: toText(value.paciente.nombre),
      edad: toText(value.paciente.edad),
    },
    tratamientos,
    // El total siempre se recalcula con la semántica actual del dominio.
    total: calcularTotal(tratamientos),
    fecha: toText(value.fecha),
    pdf: toText(value.pdf),
  };
}

function parsePresupuestos(raw: string): Presupuesto[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const idsUsados = new Set<string>();

    return parsed
      .map((item) => normalizePresupuesto(item, idsUsados))
      .filter((item): item is Presupuesto => item !== null);
  } catch (error) {
    console.log('Error parseando presupuestos', error);
    return null;
  }
}

/**
 * Lee los presupuestos y migra automáticamente desde la clave heredada.
 * Si la lectura falla, lanza el error para que el contexto no marque la
 * hidratación como completada ni guarde datos vacíos encima.
 */
export async function loadPresupuestos(): Promise<Presupuesto[]> {
  // Espera escrituras pendientes antes de leer.
  await writeQueue;

  const v2Raw = await AsyncStorage.getItem(PRESUPUESTOS_STORAGE_KEY);

  if (v2Raw !== null) {
    const v2 = parsePresupuestos(v2Raw);
    if (v2 !== null) {
      return v2;
    }

    console.log('Datos v2 corruptos; se intentará migrar desde una clave legacy');
  }

  let legacyVacio = false;

  for (const key of PRESUPUESTOS_LEGACY_KEYS) {
    const legacyRaw = await AsyncStorage.getItem(key);
    if (legacyRaw === null) continue;

    const legacy = parsePresupuestos(legacyRaw);
    if (legacy === null) {
      console.log(`Datos legacy corruptos en ${key}`);
      continue;
    }

    if (legacy.length === 0) {
      legacyVacio = true;
      continue;
    }

    console.log(`Migrando presupuestos desde ${key} a ${PRESUPUESTOS_STORAGE_KEY}`);

    try {
      await savePresupuestos(legacy);
    } catch (error) {
      // La clave legacy permanece; aun si falla la escritura, devolvemos los datos.
      console.log('Error migrando presupuestos a v2', error);
    }

    return legacy;
  }

  if (legacyVacio) {
    try {
      await savePresupuestos([]);
    } catch (error) {
      console.log('Error inicializando presupuestos v2', error);
    }
  }

  return [];
}

export async function savePresupuestos(
  presupuestos: Presupuesto[]
): Promise<void> {
  const serialized = JSON.stringify(presupuestos);

  await enqueueWrite(async () => {
    await AsyncStorage.setItem(PRESUPUESTOS_STORAGE_KEY, serialized);
  });
}

/**
 * Upsert estricto por id. No busca ni compara por nombre del paciente.
 */
export function upsertPresupuesto(
  presupuestos: Presupuesto[],
  presupuesto: Presupuesto
): Presupuesto[] {
  const index = presupuestos.findIndex((item) => item.id === presupuesto.id);

  if (index === -1) {
    return [...presupuestos, presupuesto];
  }

  const next = [...presupuestos];
  next[index] = presupuesto;
  return next;
}

export function removePresupuesto(
  presupuestos: Presupuesto[],
  id: string
): Presupuesto[] {
  return presupuestos.filter((presupuesto) => presupuesto.id !== id);
}

/**
 * Fusiona datos cargados con cambios hechos antes de terminar la hidratación.
 * Los cambios pendientes ganan si comparten id con un registro almacenado.
 */
export function mergePresupuestos(
  base: Presupuesto[],
  pendientes: Presupuesto[]
): Presupuesto[] {
  if (pendientes.length === 0) return base;

  const merged = new Map(
    base.map((presupuesto) => [presupuesto.id, presupuesto])
  );

  pendientes.forEach((presupuesto) => {
    merged.set(presupuesto.id, presupuesto);
  });

  return Array.from(merged.values());
}

function esPdfDeLaApp(pdfUri: string): boolean {
  if (!pdfUri.toLowerCase().endsWith('.pdf')) return false;

  const roots = [FileSystem.documentDirectory, FileSystem.cacheDirectory].filter(
    (root): root is string => Boolean(root)
  );

  return roots.some((root) => pdfUri.startsWith(root));
}

/**
 * Elimina únicamente PDFs que pertenecen al almacenamiento de la app.
 * Si el archivo ya no existe, la operación es un no-op.
 */
export async function deletePresupuestoPdf(pdfUri: string): Promise<void> {
  if (!pdfUri) return;

  if (!esPdfDeLaApp(pdfUri)) {
    console.log('PDF fuera del almacenamiento de la app; no se elimina:', pdfUri);
    return;
  }

  const info = await FileSystem.getInfoAsync(pdfUri);
  if (!info.exists) return;

  await FileSystem.deleteAsync(pdfUri, { idempotent: true });
}

export const presupuestoRepository = {
  load: loadPresupuestos,
  save: savePresupuestos,
  createId: createPresupuestoId,
  upsert: upsertPresupuesto,
  remove: removePresupuesto,
  merge: mergePresupuestos,
  deletePdf: deletePresupuestoPdf,
} as const;
