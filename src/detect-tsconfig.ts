/**
 * TypeScript configuration detection for Lass plugins.
 *
 * Detects the presence of tsconfig.json to determine if type-checking should be enabled.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Detects if tsconfig.json exists in the given directory.
 *
 * **Limitations:**
 * - Only checks for `tsconfig.json` (not `tsconfig.app.json`, `tsconfig.build.json`, etc.)
 * - Does not walk parent directories (unlike TypeScript's own resolution)
 * - Synchronous filesystem check (acceptable for one-time plugin initialization)
 *
 * For Vite plugins, pass `config.root` from the `configResolved` hook.
 * For Bun plugins, defaults to `process.cwd()` (Bun's plugin API doesn't expose a project root).
 *
 * @param cwd - Directory to check (defaults to process.cwd())
 * @returns true if tsconfig.json exists, false otherwise
 *
 * @example
 * ```ts
 * import { detectTsconfig } from '@lass-lang/plugin-utils';
 *
 * if (detectTsconfig()) {
 *   console.log('TypeScript project detected');
 * }
 * ```
 */
export function detectTsconfig(cwd: string = process.cwd()): boolean {
  const tsconfigPath = resolve(cwd, 'tsconfig.json');
  return existsSync(tsconfigPath);
}
