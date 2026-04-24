import type { CSSProperties } from 'react';

import type { Banner } from '@tea-time/types';

type BannerVariant = 'hero' | 'preview';

interface BannerRendererProps {
  banner: Banner;
  variant?: BannerVariant;
}

const DEFAULT_OVERLAY =
  'linear-gradient(90deg,rgba(18,24,18,.62) 0%,rgba(18,24,18,.28) 38%,rgba(18,24,18,.08) 100%)';
const DEFAULT_BACKGROUND = 'linear-gradient(135deg, #375c36 0%, #7d8f49 42%, #283b24 100%)';

const ALLOWED_TAGS = new Set([
  'a',
  'article',
  'aside',
  'blockquote',
  'br',
  'button',
  'code',
  'div',
  'em',
  'figure',
  'figcaption',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'img',
  'li',
  'main',
  'ol',
  'p',
  'pre',
  'section',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

const GLOBAL_ATTRS = new Set([
  'class',
  'id',
  'role',
  'title',
  'align',
  'dir',
  'lang',
  'width',
  'height',
]);

const allowedTagAttrs: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel', 'title']),
  img: new Set(['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding']),
};

function normalizeHexColor(value: string | null | undefined, fallback = '#315f40') {
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

function hexToRgb(hex: string) {
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

function overlayToCss(value: string | null | undefined) {
  const fallback = { color: '#111812', opacity: 24 };
  if (!value) {
    const { r, g, b } = hexToRgb(fallback.color);
    return `rgba(${r}, ${g}, ${b}, ${fallback.opacity / 100})`;
  }

  const rgbaMatch = value.match(
    /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([0-9.]+))?\s*\)/i,
  );
  if (rgbaMatch) {
    const r = Number(rgbaMatch[1]);
    const g = Number(rgbaMatch[2]);
    const b = Number(rgbaMatch[3]);
    const opacity = Math.max(0, Math.min(1, Number(rgbaMatch[4] ?? 1) || 1));
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  if (/^#[0-9a-f]{3,6}$/i.test(value)) {
    const { r, g, b } = hexToRgb(normalizeHexColor(value, fallback.color));
    return `rgba(${r}, ${g}, ${b}, 1)`;
  }

  const { r, g, b } = hexToRgb(fallback.color);
  return `rgba(${r}, ${g}, ${b}, ${fallback.opacity / 100})`;
}

function slideBackgroundStyle(banner: Banner): CSSProperties {
  if (banner.background_type === 'solid' || banner.background_type === 'gradient') {
    return {
      background: banner.background_value ?? DEFAULT_BACKGROUND,
    };
  }

  const source = banner.background_value || banner.media_url;
  if (!source) {
    return {
      background: DEFAULT_BACKGROUND,
    };
  }

  return {
    backgroundColor: '#1d2b20',
    backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.28)), url(${source})`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  };
}

function buildHtmlDocument(html: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>
    html, body {
      margin: 0;
      width: 100%;
      min-height: 100%;
      background: transparent;
      color: inherit;
      font: inherit;
      overflow: hidden;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    img, video, svg {
      max-width: 100%;
      height: auto;
    }
    a {
      color: inherit;
    }
  </style></head><body>${html}</body></html>`;
}

export function sanitizeBannerHtml(html: string) {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="banner-root">${html}</div>`, 'text/html');
  const root = doc.getElementById('banner-root');
  if (!root) return '';

  const sanitizeNode = (node: Element) => {
    const tagName = node.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tagName)) {
      const parent = node.parentNode;
      if (!parent) return;
      const children = Array.from(node.childNodes);
      children.forEach((child) => parent.insertBefore(child, node));
      parent.removeChild(node);
      return;
    }

    Array.from(node.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;
      const allowedForTag = allowedTagAttrs[tagName];
      const allowed =
        GLOBAL_ATTRS.has(name) ||
        name.startsWith('aria-') ||
        name.startsWith('data-') ||
        (allowedForTag ? allowedForTag.has(name) : false);

      if (!allowed) {
        node.removeAttribute(attribute.name);
        return;
      }

      if ((name === 'href' || name === 'src') && /^(javascript|vbscript|data:text\/html)/i.test(value)) {
        node.removeAttribute(attribute.name);
      }
    });

    if (tagName === 'a' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer');
    }

    Array.from(node.children).forEach((child) => sanitizeNode(child));
  };

  Array.from(root.children).forEach((child) => sanitizeNode(child));
  return root.innerHTML;
}

function StructuredPreview({ banner, variant }: { banner: Banner; variant: BannerVariant }) {
  const textColor = banner.text_color ?? '#ffffff';
  const hasMedia = Boolean(banner.media_url);
  const showArt = variant === 'hero';

  return (
    <div
      className={`banner-renderer-content banner-renderer-content--${variant} hero-slide-content${
        variant === 'hero' ? ' container' : ''
      }`}
    >
      <div className="hero-copy" style={{ '--hero-text': textColor } as CSSProperties}>
        {banner.subtitle ? <span className="eyebrow">{banner.subtitle}</span> : null}
        <h1>{banner.title}</h1>
        {banner.description ? <p>{banner.description}</p> : null}
        <div className="hero-actions-row">
          {banner.primary_button_label && banner.primary_button_href ? (
            <a className="solid-button" href={banner.primary_button_href}>
              {banner.primary_button_label}
            </a>
          ) : null}
          {banner.secondary_button_label && banner.secondary_button_href ? (
            <a className="ghost-button" href={banner.secondary_button_href}>
              {banner.secondary_button_label}
            </a>
          ) : null}
        </div>
        <div className="slide-badges">
          {variant === 'hero' ? (
            <>
              <span className="slide-badge">Freshly brewed for the workday</span>
              <span className="slide-badge">Simple ordering, reliable delivery</span>
              {hasMedia ? <span className="slide-badge">Banner media from admin</span> : null}
            </>
          ) : (
            <>
              <span className="slide-badge">{banner.is_active ? 'Active' : 'Hidden'}</span>
              <span className="slide-badge">{banner.media_kind}</span>
            </>
          )}
        </div>
      </div>

      {showArt ? (
        <div className="hero-art">
          {banner.media_kind === 'video' && banner.media_url ? (
            <video
              className="hero-img"
              src={banner.media_url}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : banner.media_url ? (
            <img src={banner.media_url} alt={banner.title} className="hero-img" />
          ) : (
            <div className="hero-card hero-card--fallback">
              <h4>Admin-managed banner</h4>
              <p>{banner.title}</p>
            </div>
          )}
          {banner.media_url ? null : (
            <div className="hero-card">
              <h4>{banner.subtitle ?? 'Landing banner'}</h4>
              <p>{banner.description ?? 'Managed from the admin banner pipeline.'}</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function HtmlPreview({ banner, variant }: { banner: Banner; variant: BannerVariant }) {
  const sanitized = sanitizeBannerHtml(banner.content_html ?? '');
  const fallbackHtml = `<div style="padding: 1rem; color: ${banner.text_color ?? '#ffffff'}; font-size: 1rem;">
    <strong>${banner.title}</strong>
    <p style="margin: 0.75rem 0 0; opacity: 0.85;">Paste HTML to render the custom banner here.</p>
  </div>`;
  const srcDoc = buildHtmlDocument(sanitized || fallbackHtml);

  return (
    <div className={`banner-html-shell banner-html-shell--${variant}`}>
      <iframe
        className={`banner-html-frame banner-html-frame--${variant}`}
        title={banner.title}
        srcDoc={srcDoc}
        sandbox=""
        loading="lazy"
      />
    </div>
  );
}

export function BannerRenderer({ banner, variant = 'hero' }: BannerRendererProps) {
  const isHtml = banner.content_mode === 'html';
  const textColor = banner.text_color ?? '#ffffff';

  return (
    <div className={`banner-renderer banner-renderer--${variant} banner-renderer--${banner.content_mode}`}>
      <div className="hero-slide-background" style={slideBackgroundStyle(banner)} />
      <div
        className="hero-overlay"
        style={{
          background: banner.overlay_color ?? DEFAULT_OVERLAY,
        }}
      />
      <div className="banner-renderer-frame" style={{ '--hero-text': textColor } as CSSProperties}>
        {isHtml ? <HtmlPreview banner={banner} variant={variant} /> : <StructuredPreview banner={banner} variant={variant} />}
      </div>
    </div>
  );
}
