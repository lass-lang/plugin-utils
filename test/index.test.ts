import { describe, it, expect } from 'vitest';
import {
  LASS_EXT,
  VIRTUAL_CSS_EXT,
  VIRTUAL_MODULE_CSS_EXT,
  IMPORT_STATEMENT_RE,
  toVirtualCssPath,
  fromVirtualCssPath,
  isVirtualCssPath,
  isVirtualModuleCssPath,
  normalizePath,
  rewriteImportsForExecution,
} from '../src/index.js';

describe('Constants', () => {
  it('exports correct extension constants', () => {
    expect(LASS_EXT).toBe('.lass');
    expect(VIRTUAL_CSS_EXT).toBe('.lass.css');
    expect(VIRTUAL_MODULE_CSS_EXT).toBe('.lass.module.css');
  });

  it('IMPORT_STATEMENT_RE matches import statements', () => {
    const code = `import foo from './bar.js';`;
    const matches = [...code.matchAll(IMPORT_STATEMENT_RE)];
    expect(matches).toHaveLength(1);
    expect(matches[0]?.[2]).toBe('./bar.js');
  });
});

describe('toVirtualCssPath', () => {
  it('converts regular .lass to .lass.css', () => {
    expect(toVirtualCssPath('src/styles.lass')).toBe('src/styles.lass.css');
    expect(toVirtualCssPath('/path/to/theme.lass')).toBe('/path/to/theme.lass.css');
  });

  it('converts .module.lass to .lass.module.css', () => {
    expect(toVirtualCssPath('src/component.module.lass')).toBe('src/component.lass.module.css');
    expect(toVirtualCssPath('/path/to/card.module.lass')).toBe('/path/to/card.lass.module.css');
  });
});

describe('fromVirtualCssPath', () => {
  it('converts .lass.css back to .lass', () => {
    expect(fromVirtualCssPath('src/styles.lass.css')).toBe('src/styles.lass');
    expect(fromVirtualCssPath('/path/to/theme.lass.css')).toBe('/path/to/theme.lass');
  });

  it('converts .lass.module.css back to .module.lass', () => {
    expect(fromVirtualCssPath('src/component.lass.module.css')).toBe('src/component.module.lass');
    expect(fromVirtualCssPath('/path/to/card.lass.module.css')).toBe('/path/to/card.module.lass');
  });

  it('returns unchanged path for non-virtual paths', () => {
    expect(fromVirtualCssPath('src/styles.css')).toBe('src/styles.css');
    expect(fromVirtualCssPath('src/main.ts')).toBe('src/main.ts');
  });
});

describe('isVirtualCssPath', () => {
  it('returns true for .lass.css paths', () => {
    expect(isVirtualCssPath('src/styles.lass.css')).toBe(true);
  });

  it('returns true for .lass.module.css paths', () => {
    expect(isVirtualCssPath('src/component.lass.module.css')).toBe(true);
  });

  it('returns false for non-virtual paths', () => {
    expect(isVirtualCssPath('src/styles.css')).toBe(false);
    expect(isVirtualCssPath('src/styles.lass')).toBe(false);
  });
});

describe('isVirtualModuleCssPath', () => {
  it('returns true for .lass.module.css paths', () => {
    expect(isVirtualModuleCssPath('src/component.lass.module.css')).toBe(true);
  });

  it('returns false for regular .lass.css paths', () => {
    expect(isVirtualModuleCssPath('src/styles.lass.css')).toBe(false);
  });

  it('returns false for non-virtual paths', () => {
    expect(isVirtualModuleCssPath('src/styles.css')).toBe(false);
  });
});

describe('normalizePath', () => {
  it('converts backslashes to forward slashes', () => {
    expect(normalizePath('src\\styles\\theme.lass')).toBe('src/styles/theme.lass');
    expect(normalizePath('C:\\Users\\dev\\project')).toBe('C:/Users/dev/project');
  });

  it('leaves forward slashes unchanged', () => {
    expect(normalizePath('src/styles/theme.lass')).toBe('src/styles/theme.lass');
  });

  it('handles mixed slashes', () => {
    expect(normalizePath('src\\styles/theme.lass')).toBe('src/styles/theme.lass');
  });
});

describe('rewriteImportsForExecution', () => {
  it('rewrites relative imports to file:// URLs', () => {
    const code = `import foo from './bar.js';`;
    const result = rewriteImportsForExecution(code, '/project/src');
    expect(result).toMatch(/^import foo from 'file:\/\/.*\/project\/src\/bar\.js';$/);
  });

  it('adds JSON import assertion for .json imports', () => {
    const code = `import data from './config.json';`;
    const result = rewriteImportsForExecution(code, '/project/src');
    expect(result).toContain("with { type: 'json' }");
  });

  it('does not add assertion if already present', () => {
    const code = `import data from './config.json' with { type: 'json' };`;
    const result = rewriteImportsForExecution(code, '/project/src');
    // Should only have one assertion
    const assertionCount = (result.match(/with/g) || []).length;
    expect(assertionCount).toBe(1);
  });

  it('preserves non-relative imports', () => {
    const code = `import lodash from 'lodash';`;
    const result = rewriteImportsForExecution(code, '/project/src');
    expect(result).toBe(code);
  });
});
