import { CSSProperties } from 'react';

export function hexToRgb(hex: string) {
    const normalized = hex.replace('#', '').trim();
    if (normalized.length === 3) {
        const r = normalized[0];
        const g = normalized[1];
        const b = normalized[2];
        return {
            r: Number.parseInt(`${r}${r}`, 16),
            g: Number.parseInt(`${g}${g}`, 16),
            b: Number.parseInt(`${b}${b}`, 16),
        };
    }

    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return {
        r: Number.isNaN(r) ? 0 : r,
        g: Number.isNaN(g) ? 0 : g,
        b: Number.isNaN(b) ? 0 : b,
    };
}

export function rgbToHex(r: number, g: number, b: number) {
    return `#${[r, g, b]
        .map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0'))
        .join('')}`;
}

export function normalizeHexColor(value: string | null | undefined, fallback = '#315f40') {
    if (!value) return fallback;
    if (/^#[0-9a-f]{6}$/i.test(value)) return value;
    if (/^#[0-9a-f]{3}$/i.test(value)) {
        const expanded = value
            .replace('#', '')
            .split('')
            .map((char) => `${char}${char}`)
            .join('');
        return `#${expanded}`;
    }
    return fallback;
}

export function parseOverlayColor(value: string | null | undefined) {
    const fallback = { color: '#111812', opacity: 24 };
    if (!value) return fallback;

    const rgbaMatch = value.match(
        /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([0-9.]+))?\s*\)/i,
    );
    if (rgbaMatch) {
        return {
            color: rgbToHex(Number(rgbaMatch[1]), Number(rgbaMatch[2]), Number(rgbaMatch[3])),
            opacity: Math.round((Number(rgbaMatch[4] ?? 1) || 1) * 100),
        };
    }

    if (/^#[0-9a-f]{3,6}$/i.test(value)) {
        return {
            color: normalizeHexColor(value, fallback.color),
            opacity: 100,
        };
    }

    return fallback;
}

export function rgbaFromHex(color: string, opacity: number) {
    const { r, g, b } = hexToRgb(normalizeHexColor(color));
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(100, opacity)) / 100})`;
}

export function backgroundThumbStyle(
    banner: { background_type: string; background_value?: string | null; media_url?: string | null }
): CSSProperties {
    if (banner.background_type === 'solid') {
        return { background: normalizeHexColor(banner.background_value, '#315f40') };
    }

    if (banner.background_type === 'gradient') {
        return {
            background:
                banner.background_value ?? 'linear-gradient(135deg, #375c36 0%, #7d8f49 42%, #283b24 100%)',
        };
    }

    const source = banner.background_value || banner.media_url;
    return source
        ? {
            backgroundColor: '#1d2b20',
            backgroundImage: `url(${source})`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
        }
        : { background: '#315f40' };
}
