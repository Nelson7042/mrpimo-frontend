import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

/**
 * Smoke tests to verify no remaining references to deleted/renamed artifacts
 * after the codebase cleanup spec has been applied.
 *
 * Each test greps the relevant source directories for patterns that should
 * no longer exist, excluding node_modules, .next, .git, spec/design files,
 * and this test file itself.
 */

const MPRIMO_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Runs grep across .ts and .tsx files, returning matched lines.
 * Returns an empty string if no matches are found (grep exit code 1).
 */
function grepSource(pattern: string, searchDir: string = MPRIMO_ROOT): string {
  const excludeDirs = '--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git --exclude-dir=.kiro';
  const excludeFiles = '--exclude=codebase-cleanup-smoke.test.ts --exclude=*.md';
  const cmd = `grep -rn ${excludeDirs} ${excludeFiles} --include="*.ts" --include="*.tsx" "${pattern}" "${searchDir}"`;
  try {
    const output = execSync(cmd, { encoding: 'utf-8', timeout: 15000 }).trim();
    // Filter out any lines from this test file (belt-and-suspenders)
    return output
      .split('\n')
      .filter((line) => !line.includes('codebase-cleanup-smoke.test.ts'))
      .join('\n')
      .trim();
  } catch {
    // grep returns exit code 1 when no matches found — that's the expected case
    return '';
  }
}

describe('Codebase Cleanup Smoke Tests', () => {
  /**
   * Validates: Requirement 8.2, 8.3
   * After renaming BraedCrumbs → BreadCrumbs, no references to the old
   * misspelled name should remain in any .ts or .tsx file.
   */
  it('should have zero references to "BraedCrumbs" in .ts/.tsx files', () => {
    const matches = grepSource('BraedCrumbs');
    expect(matches).toBe('');
  });

  /**
   * Validates: Requirement 5.3
   * After deleting the checkout_ directory, no path references to it
   * should remain in the codebase.
   */
  it('should have zero references to "checkout_" path in .ts/.tsx files', () => {
    const matches = grepSource('checkout_');
    expect(matches).toBe('');
  });

  /**
   * Validates: Requirement 6.3
   * After deleting the orders_ directory, no path references to it
   * should remain in the codebase.
   */
  it('should have zero references to "orders_" path in .ts/.tsx files', () => {
    const matches = grepSource('orders_');
    expect(matches).toBe('');
  });

  /**
   * Validates: Requirement 7.3
   * After deleting the messages-keep directory, no path references to it
   * should remain in the codebase.
   */
  it('should have zero references to "messages-keep" path in .ts/.tsx files', () => {
    const matches = grepSource('messages-keep');
    expect(matches).toBe('');
  });

  /**
   * Validates: Requirement 4.1
   * After removing debug statements, console.log(walletData) should not
   * exist in the wallet page.
   */
  it('should have zero "console.log(walletData)" in wallet page', () => {
    const walletDir = path.join(MPRIMO_ROOT, 'src', 'app', 'home', 'user', 'wallet');
    const matches = grepSource('console\\.log(walletData)', walletDir);
    expect(matches).toBe('');
  });

  /**
   * Validates: Requirement 4.2
   * After removing debug statements, console.log(transactionsData) should not
   * exist in the wallet page.
   */
  it('should have zero "console.log(transactionsData)" in wallet page', () => {
    const walletDir = path.join(MPRIMO_ROOT, 'src', 'app', 'home', 'user', 'wallet');
    const matches = grepSource('console\\.log(transactionsData)', walletDir);
    expect(matches).toBe('');
  });
});
