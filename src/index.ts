/**
 * @lass-lang/plugin-utils
 *
 * Shared utilities for Lass bundler plugins.
 *
 * These utilities handle bundler-agnostic plugin infrastructure:
 * - Virtual path conventions for .lass <-> .css mapping
 * - Import rewriting for isolated execution
 * - Constants shared across all bundler plugins
 *
 * This is separate from:
 * - Core's transpilation (handled by @lass-lang/core)
 * - Bundler-specific injection (each plugin implements its own injectStyle)
 */

import { posix, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Extension for .lass source files */
export const LASS_EXT = '.lass';

/** Virtual CSS extension for regular .lass files: foo.lass -> foo.lass.css */
export const VIRTUAL_CSS_EXT = '.lass.css';

/** Virtual CSS extension for CSS Modules: foo.module.lass -> foo.lass.module.css */
export const VIRTUAL_MODULE_CSS_EXT = '.lass.module.css';

/**
 * Regex for matching ES import statements with relative paths.
 *
 * Captures:
 * - Group 1: Import prefix (e.g., "import x from '")
 * - Group 2: Relative path (e.g., "./file.json")
 * - Group 3: Quote suffix (e.g., "'")
 * - Group 4: Trailing content (e.g., " with { type: 'json' };")
 */
export const IMPORT_STATEMENT_RE =
  /^(\s*import\s+(?:[\w*{}\s,]+\s+from\s+)?['"])(\.[^'"]+)(['"])(\s*(?:with\s+\{[^}]*\})?\s*;?\s*)$/gm;

// ============================================================================
// VIRTUAL PATH UTILITIES
// ============================================================================

/**
 * Convert a .lass file path to its virtual CSS path.
 *
 * @example
 * toVirtualCssPath('src/styles.lass') // => 'src/styles.lass.css'
 * toVirtualCssPath('src/component.module.lass') // => 'src/component.lass.module.css'
 */
export function toVirtualCssPath(lassPath: string): string {
  if (lassPath.endsWith('.module.lass')) {
    return lassPath.slice(0, -'.module.lass'.length) + VIRTUAL_MODULE_CSS_EXT;
  }
  return lassPath.slice(0, -LASS_EXT.length) + VIRTUAL_CSS_EXT;
}

/**
 * Convert a virtual CSS path back to its .lass source path.
 *
 * @example
 * fromVirtualCssPath('src/styles.lass.css') // => 'src/styles.lass'
 * fromVirtualCssPath('src/component.lass.module.css') // => 'src/component.module.lass'
 */
export function fromVirtualCssPath(virtualPath: string): string {
  if (virtualPath.endsWith(VIRTUAL_MODULE_CSS_EXT)) {
    return virtualPath.slice(0, -VIRTUAL_MODULE_CSS_EXT.length) + '.module.lass';
  }
  if (virtualPath.endsWith(VIRTUAL_CSS_EXT)) {
    return virtualPath.slice(0, -VIRTUAL_CSS_EXT.length) + LASS_EXT;
  }
  return virtualPath;
}

/**
 * Check if a path is a virtual CSS path (regular or module).
 */
export function isVirtualCssPath(path: string): boolean {
  return path.endsWith(VIRTUAL_CSS_EXT) || path.endsWith(VIRTUAL_MODULE_CSS_EXT);
}

/**
 * Check if a path is a virtual CSS Modules path.
 */
export function isVirtualModuleCssPath(path: string): boolean {
  return path.endsWith(VIRTUAL_MODULE_CSS_EXT);
}

// ============================================================================
// PATH UTILITIES
// ============================================================================

/**
 * Normalize path for cross-platform compatibility.
 * Converts backslashes to forward slashes.
 */
export function normalizePath(path: string): string {
  return path.split(/[\\/]/).join(posix.sep);
}

// ============================================================================
// IMPORT REWRITING
// ============================================================================

/**
 * Rewrite relative imports to absolute file:// URLs for isolated execution.
 *
 * When executing transpiled Lass code in isolation (data URL or temp file),
 * relative imports won't resolve correctly. This function converts them to
 * absolute file:// URLs that work from any execution context.
 *
 * Also auto-adds JSON import assertions when missing (required by runtimes).
 *
 * @param code - The transpiled JS code
 * @param baseDir - The directory to resolve relative paths from
 * @returns The code with rewritten imports
 */
export function rewriteImportsForExecution(code: string, baseDir: string): string {
  return code.replace(IMPORT_STATEMENT_RE, (_match, prefix, relativePath, suffix, trailing) => {
    const absolutePath = resolve(baseDir, relativePath);
    const fileUrl = pathToFileURL(absolutePath).href;

    // Handle import assertions
    let assertion = '';
    if (trailing.includes('with')) {
      // Already has assertion, don't add another
      assertion = '';
    } else if (relativePath.endsWith('.json')) {
      // Auto-add JSON assertion (required by runtimes)
      assertion = " with { type: 'json' }";
    }

    return `${prefix}${fileUrl}${suffix}${assertion}${trailing}`;
  });
}
