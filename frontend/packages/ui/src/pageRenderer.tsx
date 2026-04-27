import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';

import type {
  ButtonBlockProps,
  DividerBlockProps,
  HeadingBlockProps,
  ImageBlockProps,
  PageBlock,
  PageDocument,
  ParagraphBlockProps,
  SectionBlockProps,
  SpacerBlockProps,
} from '@tea-time/types';

type PageRendererVariant = 'hero' | 'preview';
type ViewportMode = 'desktop' | 'tablet' | 'mobile';

interface PageRendererProps {
  page: PageDocument;
  variant?: PageRendererVariant;
  viewport?: ViewportMode;
  selectedBlockId?: string | null;
  onBlockSelect?: (id: string) => void;
  editable?: boolean;
  onBlockChange?: (id: string, patch: Partial<PageBlock>) => void;
}

const viewportSizes: Record<ViewportMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

const DEFAULT_BACKGROUND = 'linear-gradient(135deg, #375c36 0%, #7d8f49 42%, #283b24 100%)';
const DEFAULT_OVERLAY =
  'linear-gradient(90deg,rgba(18,24,18,.62) 0%,rgba(18,24,18,.28) 38%,rgba(18,24,18,.08) 100%)';

function isSafeUrl(value: string | null | undefined) {
  if (!value) return false;
  const trimmed = value.trim();
  return (
    trimmed.startsWith('#') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  );
}

function alignStyle(align?: string | null): CSSProperties {
  if (align === 'center') return { textAlign: 'center' };
  if (align === 'right') return { textAlign: 'right' };
  return { textAlign: 'left' };
}

function buttonStyle(variant: string | null | undefined, hero = false): CSSProperties {
  const solid = {
    background: hero ? '#ffffff' : '#1f2937',
    color: hero ? '#111812' : '#ffffff',
    border: '1px solid transparent',
  } satisfies CSSProperties;
  const ghost = {
    background: 'transparent',
    color: hero ? '#ffffff' : '#1f2937',
    border: hero ? '1px solid rgba(255,255,255,0.28)' : '1px solid rgba(31,41,55,0.18)',
  } satisfies CSSProperties;
  return variant === 'ghost' ? ghost : solid;
}

function blockFrameStyle(selected: boolean, depth: number): CSSProperties {
  return {
    position: 'relative',
    borderRadius: depth === 0 ? '20px' : '16px',
    border: selected ? '2px solid #315f40' : '1px solid rgba(15, 23, 42, 0.12)',
    background: selected ? 'rgba(49, 95, 64, 0.06)' : 'rgba(255, 255, 255, 0.8)',
    boxShadow: depth === 0 ? '0 18px 36px rgba(15, 23, 42, 0.08)' : 'none',
    padding: depth === 0 ? '20px' : '16px',
    marginBottom: '16px',
  };
}

function backgroundStyle(props: SectionBlockProps): CSSProperties {
  if (props.background_type === 'solid' || props.background_type === 'gradient') {
    return {
      background: props.background_value || DEFAULT_BACKGROUND,
    };
  }

  const source = props.background_value || props.media_url;
  if (!source) {
    return { background: DEFAULT_BACKGROUND };
  }

  if (props.media_kind === 'video') {
    return {
      background: '#111812',
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

function renderButtons(props: SectionBlockProps, hero = false) {
  const buttons: ReactNode[] = [];
  if (props.primary_button_label && isSafeUrl(props.primary_button_href)) {
    buttons.push(
      <a
        key="primary"
        href={props.primary_button_href ?? '#'}
        style={{
          ...buttonStyle('solid', hero),
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          borderRadius: '999px',
          padding: '0.9rem 1.35rem',
          textDecoration: 'none',
          fontWeight: 800,
        }}
      >
        {props.primary_button_label}
      </a>,
    );
  }

  if (props.secondary_button_label && isSafeUrl(props.secondary_button_href)) {
    buttons.push(
      <a
        key="secondary"
        href={props.secondary_button_href ?? '#'}
        style={{
          ...buttonStyle('ghost', hero),
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          borderRadius: '999px',
          padding: '0.9rem 1.35rem',
          textDecoration: 'none',
          fontWeight: 800,
        }}
      >
        {props.secondary_button_label}
      </a>,
    );
  }

  return buttons.length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px' }}>{buttons}</div> : null;
}

function renderHeading(
  blockId: string,
  props: HeadingBlockProps,
  editable?: boolean,
  onBlockChange?: (id: string, patch: Partial<PageBlock>) => void,
) {
  const level = props.level ?? 2;
  const baseStyle: CSSProperties = {
    margin: 0,
    lineHeight: 1.08,
    fontWeight: 800,
    letterSpacing: '-0.04em',
    color: 'inherit',
    ...alignStyle(props.align),
  };

  const element = level === 1 ? 'h1' : level === 3 ? 'h3' : 'h2';
  const fontSize = level === 1 ? 'clamp(2.1rem, 4vw, 4.2rem)' : level === 3 ? 'clamp(1.2rem, 2vw, 1.75rem)' : 'clamp(1.5rem, 3vw, 2.6rem)';

  if (editable && onBlockChange) {
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(event) => onBlockChange(blockId, { props: { ...props, text: event.currentTarget.textContent || '' } } as Partial<PageBlock>)}
        style={{ ...baseStyle, fontSize, outline: 'none', cursor: 'text' }}
      >
        {props.text}
      </div>
    );
  }

  const HeadingTag = element as 'h1' | 'h2' | 'h3';
  return <HeadingTag style={{ ...baseStyle, fontSize }}>{props.text}</HeadingTag>;
}

function renderParagraph(
  blockId: string,
  props: ParagraphBlockProps,
  editable?: boolean,
  onBlockChange?: (id: string, patch: Partial<PageBlock>) => void,
) {
  const style = {
    margin: '0.85rem 0 0',
    fontSize: '1rem',
    lineHeight: 1.7,
    opacity: 0.92,
    ...alignStyle(props.align),
  } satisfies CSSProperties;

  if (editable && onBlockChange) {
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(event) => onBlockChange(blockId, { props: { ...props, text: event.currentTarget.textContent || '' } } as Partial<PageBlock>)}
        style={{ ...style, outline: 'none', cursor: 'text', whiteSpace: 'pre-wrap' }}
      >
        {props.text}
      </div>
    );
  }

  return <p style={style}>{props.text}</p>;
}

function renderImage(props: ImageBlockProps) {
  if (!isSafeUrl(props.src)) return null;
  return (
    <figure style={{ margin: '0.9rem 0 0' }}>
      <img
        src={props.src}
        alt={props.alt}
        style={{
          width: '100%',
          display: 'block',
          borderRadius: '16px',
          objectFit: 'cover',
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.14)',
        }}
      />
      {props.caption ? (
        <figcaption style={{ marginTop: '0.6rem', fontSize: '0.9rem', opacity: 0.75 }}>
          {props.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function renderButton(props: ButtonBlockProps) {
  if (!isSafeUrl(props.href)) return null;
  return (
    <a
      href={props.href}
      style={{
        ...buttonStyle(props.variant, false),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '999px',
        padding: '0.85rem 1.2rem',
        textDecoration: 'none',
        fontWeight: 800,
        marginTop: '0.5rem',
      }}
    >
      {props.label}
    </a>
  );
}

function renderDivider(props: DividerBlockProps) {
  const style = props.style === 'dotted' ? '1px dotted rgba(15,23,42,0.24)' : '1px solid rgba(15,23,42,0.16)';
  return <hr style={{ border: 0, borderTop: style, margin: '1.2rem 0' }} />;
}

function renderSpacer(height: SpacerBlockProps) {
  return <div style={{ height: `${Math.max(0, height.height)}px` }} />;
}

function renderBlock(
  block: PageBlock,
  depth: number,
  selectedBlockId?: string | null,
  onBlockSelect?: (id: string) => void,
  editable?: boolean,
  onBlockChange?: (id: string, patch: Partial<PageBlock>) => void,
): ReactNode {
  const selected = selectedBlockId === block.id;
  const selectHandlers = onBlockSelect
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick: () => onBlockSelect(block.id),
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
          if (event.key === 'Enter' || event.key === ' ') onBlockSelect(block.id);
        },
      }
    : {};

  const shellStyle = blockFrameStyle(selected, depth);

  if (block.type === 'section' || block.type === 'container') {
    const props = block.props as SectionBlockProps & { layout?: string; gap?: string };
    const wrapperStyle: CSSProperties = {
      ...shellStyle,
      color: props.text_color || 'inherit',
      overflow: 'hidden',
      background: block.type === 'section' ? '#ffffff' : shellStyle.background,
      ...((block.type === 'section' ? backgroundStyle(props) : {}) as CSSProperties),
    };

    return (
      <section key={block.id} style={wrapperStyle} {...selectHandlers}>
        <div
          style={{
            position: 'relative',
            padding: block.type === 'section' ? '28px' : '0',
            borderRadius: 'inherit',
            color: props.text_color || 'inherit',
          }}
        >
          {block.type === 'section' && (props.eyebrow || props.title || props.subtitle || props.description || props.primary_button_label || props.secondary_button_label) ? (
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                maxWidth: '760px',
                marginBottom: block.children.length ? '24px' : 0,
              }}
            >
              {props.eyebrow ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.3rem 0.7rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    background: 'rgba(255,255,255,0.14)',
                    marginBottom: '0.75rem',
                  }}
                >
                  {props.eyebrow}
                </div>
              ) : null}
              {props.title ? <h2 style={{ margin: 0, fontSize: 'clamp(1.8rem, 4vw, 3.25rem)', lineHeight: 1.06 }}>{props.title}</h2> : null}
              {props.subtitle ? <p style={{ margin: '0.75rem 0 0', fontSize: '1.08rem', lineHeight: 1.65 }}>{props.subtitle}</p> : null}
              {props.description ? <p style={{ margin: '0.65rem 0 0', fontSize: '1rem', lineHeight: 1.7, opacity: 0.92 }}>{props.description}</p> : null}
              {renderButtons(props, true)}
            </div>
          ) : null}

          {block.children.length ? (
            <div
              style={{
                display: block.type === 'container' && props.layout === 'grid' ? 'grid' : 'flex',
                flexDirection: 'column',
                gap: block.type === 'container' ? props.gap || '16px' : '16px',
                marginTop: block.type === 'section' ? '16px' : 0,
              }}
            >
              {block.children.map((child) => renderBlock(child, depth + 1, selectedBlockId, onBlockSelect))}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <div key={block.id} style={shellStyle} {...selectHandlers}>
      {block.type === 'heading' ? renderHeading(block.id, block.props, editable, onBlockChange) : null}
      {block.type === 'paragraph' ? renderParagraph(block.id, block.props, editable, onBlockChange) : null}
      {block.type === 'image' ? renderImage(block.props) : null}
      {block.type === 'button' ? renderButton(block.props) : null}
      {block.type === 'divider' ? renderDivider(block.props) : null}
      {block.type === 'spacer' ? renderSpacer(block.props) : null}
    </div>
  );
}

export function PageRenderer({
  page,
  variant = 'hero',
  viewport = 'desktop',
  selectedBlockId = null,
  onBlockSelect,
  editable = false,
  onBlockChange,
}: PageRendererProps) {
  const frameStyle: CSSProperties = {
    width: viewportSizes[viewport],
    maxWidth: viewport === 'desktop' ? '100%' : viewportSizes[viewport],
    margin: '0 auto',
    borderRadius: variant === 'preview' ? '28px' : 0,
    border: variant === 'preview' ? '1px solid rgba(15, 23, 42, 0.12)' : 'none',
    background: variant === 'preview' ? 'rgba(255,255,255,0.94)' : 'transparent',
    boxShadow: variant === 'preview' ? '0 26px 60px rgba(15, 23, 42, 0.12)' : 'none',
    overflow: 'hidden',
  };

  return (
    <article style={frameStyle}>
      <header
        style={{
          padding: variant === 'preview' ? '28px' : '0 0 24px',
          color: '#111812',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            opacity: 0.68,
          }}
        >
          {page.slug}
        </p>
        <h1
          style={{
            margin: '0.35rem 0 0',
            fontSize: 'clamp(2rem, 4vw, 3.8rem)',
            lineHeight: 1.02,
            fontWeight: 800,
            letterSpacing: '-0.04em',
          }}
        >
          {page.title}
        </h1>
        {page.subtitle ? (
          <p style={{ margin: '0.8rem 0 0', maxWidth: '70ch', lineHeight: 1.7, opacity: 0.88 }}>{page.subtitle}</p>
        ) : null}
        {page.description ? (
          <p style={{ margin: '0.6rem 0 0', maxWidth: '72ch', lineHeight: 1.7, opacity: 0.82 }}>
            {page.description}
          </p>
        ) : null}
      </header>

      <div
        style={{
          padding: variant === 'preview' ? '0 28px 28px' : 0,
        }}
      >
        {page.blocks.length ? (
          page.blocks.map((block) =>
            renderBlock(block, 0, selectedBlockId, onBlockSelect, editable, onBlockChange),
          )
        ) : (
          <div
            style={{
              padding: '32px',
              borderRadius: '20px',
              border: '1px dashed rgba(15, 23, 42, 0.18)',
              color: 'rgba(15, 23, 42, 0.72)',
            }}
          >
            This page has no blocks yet.
          </div>
        )}
      </div>
    </article>
  );
}
