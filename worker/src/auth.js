// Minimal HMAC-SHA256 JWT + hashing helpers built on Web Crypto.
//
// The signed token this produces is stored in an HttpOnly cookie, never
// handed to page scripts. It also signs the OAuth `state` parameter, which is
// what keeps the sign-in flow stateless.

const encoder = new TextEncoder();

function base64url(bytes) {
    const binary = String.fromCharCode(...new Uint8Array(bytes));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBytes(value) {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    return Uint8Array.from(binary, ch => ch.charCodeAt(0));
}

async function hmacKey(secret) {
    return crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
}

export async function signJwt(payload, secret, ttlSeconds) {
    const now = Math.floor(Date.now() / 1000);
    const body = { ...payload, iat: now, exp: now + ttlSeconds };

    const head = base64url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
    const claims = base64url(encoder.encode(JSON.stringify(body)));
    const data = `${head}.${claims}`;

    const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(data));
    return `${data}.${base64url(signature)}`;
}

// Returns the payload, or null for anything malformed, mis-signed or expired.
export async function verifyJwt(token, secret) {
    if (typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const data = `${parts[0]}.${parts[1]}`;
    let valid;
    try {
        valid = await crypto.subtle.verify(
            'HMAC',
            await hmacKey(secret),
            base64urlToBytes(parts[2]),
            encoder.encode(data)
        );
    } catch {
        return null;
    }
    if (!valid) return null;

    let payload;
    try {
        payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(parts[1])));
    } catch {
        return null;
    }

    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
}

// Salted so stored values cannot be walked back to an address, but stable
// enough to rate-limit against.
export async function hashIp(ip, salt) {
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${salt}:${ip}`));
    return base64url(digest);
}
