import { describe, it, expect } from 'vitest';
import { normaliseName, cleanName, accountName } from '../worker/src/index.js';

// Two rules, deliberately different: a name the player typed is rejected when
// it runs long (they can fix it), while a name from an OAuth profile is
// truncated (they cannot).

describe('normaliseName', () => {
    it('collapses whitespace and trims', () => {
        expect(normaliseName('  Toro   Enjoyer  ')).toBe('Toro Enjoyer');
    });

    it('strips control characters used to pad a name out', () => {
        expect(normaliseName('Ryan')).toBe('Ryan');
        expect(normaliseName('\tRyan\n')).toBe('Ryan');
    });

    it('returns an empty string for non-strings', () => {
        for (const value of [null, undefined, 42, {}, []]) {
            expect(normaliseName(value)).toBe('');
        }
    });
});

describe('cleanName (player-typed)', () => {
    it('accepts a name at the limit', () => {
        const name = 'Toro Enjoyer Supreme';
        expect(name).toHaveLength(20);
        expect(cleanName(name)).toBe(name);
    });

    it('rejects one character over', () => {
        expect(cleanName('x'.repeat(21))).toBe(null);
    });

    it('rejects empty and whitespace-only names', () => {
        expect(cleanName('')).toBe(null);
        expect(cleanName('   ')).toBe(null);
    });

    it('measures after normalising, so padding does not buy length', () => {
        expect(cleanName('  ' + 'x'.repeat(21) + '  ')).toBe(null);
        expect(cleanName('  ' + 'x'.repeat(18) + '  ')).toBe('x'.repeat(18));
    });
});

describe('accountName (from an OAuth profile)', () => {
    it('keeps a short name as-is', () => {
        expect(accountName('Ryan')).toBe('Ryan');
    });

    it('keeps a name exactly at the limit', () => {
        expect(accountName('Toro Enjoyer Supreme')).toBe('Toro Enjoyer Supreme');
    });

    it('truncates a long name rather than rejecting it', () => {
        // The bug this guards: rejecting sent the player to the 'Player'
        // fallback instead of showing any of their actual name.
        const result = accountName('Alexandra Constantinopoulos');
        expect(result).toBe('Alexandra Constanti…');
        expect(result).toHaveLength(20);
    });

    it('does not leave a dangling space before the ellipsis', () => {
        expect(accountName('Bartholomew Xavier Wright')).toBe('Bartholomew Xavier…');
    });

    it('returns null only when nothing is left', () => {
        expect(accountName('')).toBe(null);
        expect(accountName('   ')).toBe(null);
        expect(accountName(undefined)).toBe(null);
    });
});
