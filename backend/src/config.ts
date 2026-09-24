import { resolve } from 'node:path';

/** Folder of the sample trades.csv and prices.csv. */
export const DATA_DIR = Symbol('DATA_DIR');

// Defaults are the repository's folders, seen from backend/.

export function dataDirFromEnv(env: NodeJS.ProcessEnv = process.env): string {
  return resolve(env.DATA_DIR ?? '../data');
}

/** The built frontend, served by the API in production (Vite serves it in development). */
export function staticDirFromEnv(env: NodeJS.ProcessEnv = process.env): string {
  return resolve(env.STATIC_DIR ?? '../frontend/dist');
}

/** Largest trades.csv accepted by the import endpoint. The sample is about 14 KB. */
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
