import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectTsconfig } from '../src/detect-tsconfig.js';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('detectTsconfig', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a unique temporary directory for each test
    testDir = join(tmpdir(), `lass-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    rmSync(testDir, { recursive: true, force: true });
  });

  it('returns true when tsconfig.json exists', () => {
    // Create a tsconfig.json in the test directory
    writeFileSync(join(testDir, 'tsconfig.json'), '{}');

    expect(detectTsconfig(testDir)).toBe(true);
  });

  it('returns false when tsconfig.json does not exist', () => {
    // Test directory exists but has no tsconfig.json
    expect(detectTsconfig(testDir)).toBe(false);
  });

  it('uses process.cwd() when no argument provided', () => {
    // This test just ensures the function can be called without arguments
    // We can't easily test the actual behavior without mocking process.cwd()
    expect(() => detectTsconfig()).not.toThrow();
  });
});
