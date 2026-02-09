# @lass-lang/plugin-utils

Shared utilities for Lass bundler plugins. Provides bundler-agnostic infrastructure for building Lass integration plugins.

## Installation

```bash
pnpm add @lass-lang/plugin-utils
```

## Overview

This package provides utilities shared across all Lass bundler plugins (Vite, Bun, etc.):

- **Virtual path conventions** - Consistent `.lass` to `.css` path mapping
- **Import rewriting** - Resolve relative imports for isolated execution
- **Constants** - Shared extensions and patterns

## API

### Virtual Path Utilities

#### `toVirtualCssPath(lassPath: string): string`

Converts a `.lass` file path to its virtual CSS path.

```typescript
import { toVirtualCssPath } from '@lass-lang/plugin-utils';

toVirtualCssPath('src/styles.lass');           // => 'src/styles.lass.css'
toVirtualCssPath('src/button.module.lass');    // => 'src/button.lass.module.css'
```

#### `fromVirtualCssPath(virtualPath: string): string`

Converts a virtual CSS path back to its `.lass` source path.

```typescript
import { fromVirtualCssPath } from '@lass-lang/plugin-utils';

fromVirtualCssPath('src/styles.lass.css');         // => 'src/styles.lass'
fromVirtualCssPath('src/button.lass.module.css');  // => 'src/button.module.lass'
```

#### `isVirtualCssPath(path: string): boolean`

Checks if a path is a virtual CSS path (regular or module).

```typescript
import { isVirtualCssPath } from '@lass-lang/plugin-utils';

isVirtualCssPath('styles.lass.css');         // => true
isVirtualCssPath('button.lass.module.css');  // => true
isVirtualCssPath('styles.css');              // => false
```

#### `isVirtualModuleCssPath(path: string): boolean`

Checks if a path is a virtual CSS Modules path.

```typescript
import { isVirtualModuleCssPath } from '@lass-lang/plugin-utils';

isVirtualModuleCssPath('button.lass.module.css');  // => true
isVirtualModuleCssPath('styles.lass.css');         // => false
```

### Import Rewriting

#### `rewriteImportsForExecution(code: string, baseDir: string): string`

Rewrites relative imports to absolute `file://` URLs for isolated execution.

When executing transpiled Lass code in isolation (via data URL or temp file), relative imports won't resolve correctly. This function converts them to absolute URLs that work from any execution context.

```typescript
import { rewriteImportsForExecution } from '@lass-lang/plugin-utils';

const code = `import tokens from './tokens.json';`;
const rewritten = rewriteImportsForExecution(code, '/project/src');
// => `import tokens from 'file:///project/src/tokens.json' with { type: 'json' };`
```

Features:
- Converts relative paths to absolute `file://` URLs
- Auto-adds JSON import assertions when missing (required by runtimes)
- Preserves existing import assertions

### Path Utilities

#### `normalizePath(path: string): string`

Normalizes path separators for cross-platform compatibility.

```typescript
import { normalizePath } from '@lass-lang/plugin-utils';

normalizePath('src\\styles\\main.lass');  // => 'src/styles/main.lass'
```

### Constants

```typescript
import {
  LASS_EXT,              // '.lass'
  VIRTUAL_CSS_EXT,       // '.lass.css'
  VIRTUAL_MODULE_CSS_EXT // '.lass.module.css'
} from '@lass-lang/plugin-utils';
```

## Usage in Plugins

This package is used by official Lass bundler plugins:

- [`bun-plugin-lass`](https://github.com/lass-lang/bun-plugin-lass) - Bun bundler plugin
- [`vite-plugin-lass`](https://github.com/lass-lang/vite-plugin-lass) - Vite plugin

### Example Plugin Pattern

```typescript
import { transpile } from '@lass-lang/core';
import {
  toVirtualCssPath,
  fromVirtualCssPath,
  isVirtualCssPath,
  rewriteImportsForExecution
} from '@lass-lang/plugin-utils';

// In resolve hook: redirect .lass imports to virtual .lass.css
if (path.endsWith('.lass')) {
  return toVirtualCssPath(path);
}

// In load hook: transpile and execute .lass files
if (isVirtualCssPath(id)) {
  const lassPath = fromVirtualCssPath(id);
  const source = await readFile(lassPath, 'utf-8');
  const { code } = transpile(source, { filename: lassPath });
  const executableCode = rewriteImportsForExecution(code, dirname(lassPath));
  const css = await executeModule(executableCode);
  return { contents: css, loader: 'css' };
}
```

## Requirements

- Node.js >= 20.0.0

## License

MIT
