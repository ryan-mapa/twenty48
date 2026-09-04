// Sharing, and the "beat my score" challenge links that come back the other
// way. The pure half lives here so it can be tested without a browser; the
// DOM side (button wiring, the toast) stays in 2048.js.

// Shares the page you are on rather than a hardcoded host, and drops the
// search string so an arriving challenge's parameters are never passed along.
export function gameUrl() {
    return `${location.origin}${location.pathname}`;
}

export function challengeUrl(score, name, base) {
    const url = new URL(base);
    url.searchParams.set('beat', String(Math.max(0, Math.trunc(score))));
    if (name) url.searchParams.set('by', name.slice(0, 20));
    return url.toString();
}

// A challenge arrives in a link anyone can hand-edit, so nothing in it is
// trusted: the score is coerced to a plausible integer and the name is
// stripped of control characters and clipped to the same 20 the leaderboard
// allows. Callers render both with textContent, never innerHTML.
export function readChallenge(search) {
    const params = new URLSearchParams(search);
    if (!params.has('beat')) return null;

    const score = Number.parseInt(params.get('beat'), 10);
    if (!Number.isFinite(score) || score <= 0 || score > 1e9) return null;

    const by = (params.get('by') || '')
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .trim()
        .slice(0, 20);

    return { score, by };
}

// Returns what actually happened, so the caller can stay quiet when the user
// simply dismissed the share sheet — a toast there would be noise.
export async function shareOrCopy({ text, url }) {
    if (navigator.share) {
        try {
            await navigator.share({ title: 'SUSHI48', text, url });
            return 'shared';
        } catch (error) {
            if (error.name === 'AbortError') return 'cancelled';
            // Anything else: fall through and copy instead.
        }
    }

    try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        return 'copied';
    } catch {
        return 'failed';
    }
}
