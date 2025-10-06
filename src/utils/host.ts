export function isIPv4(host: string): boolean {
    const parts = host.split('.');
    if (parts.length !== 4) return false;
    return parts.every(p => /^\d+$/.test(p) && +p >= 0 && +p <= 255);
}

export function isIPv6(host: string): boolean {
    const h = host.replace(/^\[|]$/g, '');
    if (!h.includes(':')) return false;
    try {
        // noinspection HttpUrlsUsage
        const u = new URL(`http://[${h}]/`);
        return u.hostname === h;
    } catch {
        return false;
    }
}

export function isIP(host: string): boolean {
    return isIPv4(host) || isIPv6(host);
}