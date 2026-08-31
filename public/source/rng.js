// mulberry32: a small, fast, deterministic PRNG.
//
// The leaderboard depends on the server reproducing a client's game exactly,
// so every source of randomness in the game must come from here, seeded by a
// value the server issued. Math.random() must never appear in engine code.
export default function mulberry32(seed) {
    let a = seed >>> 0;

    return function random() {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
