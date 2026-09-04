import { describe, it, expect } from 'vitest';
import { challengeUrl, readChallenge } from '../public/source/share.js';

const BASE = 'https://sushi48.ryan-mapa.dev/';

describe('challengeUrl', () => {
    it('carries the score and the name', () => {
        const url = new URL(challengeUrl(12345, 'Ryan', BASE));
        expect(url.searchParams.get('beat')).toBe('12345');
        expect(url.searchParams.get('by')).toBe('Ryan');
    });

    it('leaves the name out when there is not one', () => {
        const url = new URL(challengeUrl(400, '', BASE));
        expect(url.searchParams.has('by')).toBe(false);
    });

    it('clips a name to the leaderboard limit', () => {
        const url = new URL(challengeUrl(400, 'x'.repeat(60), BASE));
        expect(url.searchParams.get('by')).toHaveLength(20);
    });

    it('round-trips through readChallenge', () => {
        const url = new URL(challengeUrl(9876, 'Ryan-Tait', BASE));
        expect(readChallenge(url.search)).toEqual({ score: 9876, by: 'Ryan-Tait' });
    });
});

describe('readChallenge', () => {
    it('is null without a beat parameter', () => {
        expect(readChallenge('')).toBeNull();
        expect(readChallenge('?by=Ryan')).toBeNull();
    });

    it('rejects scores that are not plausible', () => {
        expect(readChallenge('?beat=0')).toBeNull();
        expect(readChallenge('?beat=-5')).toBeNull();
        expect(readChallenge('?beat=abc')).toBeNull();
        expect(readChallenge('?beat=999999999999')).toBeNull();
    });

    it('takes the leading integer of a decimal score', () => {
        expect(readChallenge('?beat=1234.9').score).toBe(1234);
    });

    it('keeps punctuation and spaces in a name', () => {
        expect(readChallenge('?beat=10&by=Ryan-Tait M').by).toBe('Ryan-Tait M');
    });

    it('strips control characters from a name', () => {
        expect(readChallenge('?beat=10&by=a%00b%1fc%7f').by).toBe('abc');
    });

    it('clips a long name rather than trusting the link', () => {
        expect(readChallenge(`?beat=10&by=${'x'.repeat(200)}`).by).toHaveLength(20);
    });

    it('tolerates a missing name', () => {
        expect(readChallenge('?beat=10')).toEqual({ score: 10, by: '' });
    });
});
