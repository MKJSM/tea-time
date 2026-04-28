import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

import { createBanner, deleteBanner, updateBanner, uploadFile } from '@tea-time/api-client';
import type { Banner, BannerInput } from '@tea-time/types';
import { BannerRenderer } from '@tea-time/ui';

interface BannerEditorPageProps {
  bannerId: string | null;
  banners: Banner[];
  onBack: () => void;
  onSaved: () => Promise<void> | void;
  onRemoved: () => Promise<void> | void;
  onMessage: (message: string) => void;
}

const DEFAULT_EDITOR_HTML = `
  <section class="banner-root" style="padding:48px; min-height:94vh; display:flex; align-items:center; color:#fff;">
    <div class="banner-copy">
      <span class="eyebrow" style="font-size:14px; letter-spacing:.1em; opacity:.7;">Daily Workplace Refreshment</span>
      <h1 style="font-size:clamp(36px,5vw,64px); line-height:0.95; letter-spacing:-0.05em; margin:12px 0 16px;">Refreshment That Moves with Your Workday.</h1>
      <p style="font-size:18px; line-height:1.7; opacity:.85; max-width:600px;">Daily delivery of hot and cold beverages, fresh juices, and snacks, served at your workplace morning and evening.</p>
      <div class="hero-actions-row" style="margin-top:28px;">
        <a class="solid-button" href="#account" style="display:inline-block; padding:14px 32px; background:#4caf7e; color:#fff; border-radius:32px; font-weight:700; text-decoration:none;">Subscribe Now</a>
      </div>
    </div>
  </section>
`;

const DEFAULT_EDITOR_CSS = `
  .banner-root {
    min-height: 100%;
    display: flex;
    align-items: center;
    padding: 48px;
    color: #ffffff;
  }

  .banner-copy {
    max-width: 720px;
  }

  .banner-copy h1 {
    margin: 12px 0 16px;
    font-size: clamp(36px, 5vw, 64px);
    line-height: 0.95;
    letter-spacing: -0.05em;
  }

  .banner-copy p {
    margin: 0 0 24px;
    font-size: 18px;
    line-height: 1.7;
    opacity: 0.85;
  }
`;

function createBlankBanner(sortOrder: number): BannerInput {
  return {
    title: '',
    subtitle: 'Daily Workplace Refreshment',
    description: '',
    primary_button_label: 'SUBSCRIBE NOW',
    primary_button_href: '#account',
    secondary_button_label: null,
    secondary_button_href: null,
    media_url: null,
    media_kind: 'image',
    content_mode: 'html',
    content_html: `<style>${DEFAULT_EDITOR_CSS}</style>${DEFAULT_EDITOR_HTML}`,
    content_json: null,
    background_type: 'image',
    background_value: '/assets/home-Dr3wWsX4.webp',
    overlay_color: 'rgba(17, 24, 18, 0.28)',
    text_color: '#ffffff',
    sort_order: sortOrder,
    is_active: true,
  };
}

function fromBanner(banner: Banner, sortOrderFallback: number): BannerInput {
  return {
    title: banner.title,
    subtitle: banner.subtitle,
    description: banner.description,
    primary_button_label: banner.primary_button_label,
    primary_button_href: banner.primary_button_href,
    secondary_button_label: banner.secondary_button_label,
    secondary_button_href: banner.secondary_button_href,
    media_url: banner.media_url,
    media_kind: banner.media_kind,
    content_mode: 'html',
    content_html: banner.content_html,
    content_json: banner.content_json,
    background_type: banner.background_type,
    background_value: banner.background_value,
    overlay_color: banner.overlay_color,
    text_color: banner.text_color,
    sort_order: banner.sort_order ?? sortOrderFallback,
    is_active: banner.is_active,
  };
}

function splitHtmlContent(contentHtml: string | null | undefined) {
  const raw = contentHtml ?? '';
  const styleMatch = raw.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const css = styleMatch?.[1] ?? '';
  let html = raw.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim();
  // GrapesJS wraps saved content in <body>...</body>; strip it before reinserting
  const bodyMatch = html.match(/^<body[^>]*>([\s\S]*)<\/body>$/i);
  if (bodyMatch) {
    html = bodyMatch[1].trim();
  }
  return { html, css };
}

function composeHtml(contentHtml: string, contentCss: string) {
  const html = contentHtml.trim();
  const css = contentCss.trim();
  return css ? `<style>${css}</style>${html}` : html;
}

function getEditorMarkup() {
  return DEFAULT_EDITOR_HTML.trim();
}

export function BannerEditorPage({
  bannerId,
  banners,
  onBack,
  onSaved,
  onRemoved,
  onMessage,
}: BannerEditorPageProps) {
  const existingBanner = useMemo(
    () => banners.find((banner) => banner.id === bannerId) ?? null,
    [bannerId, banners],
  );
  const [draft, setDraft] = useState<BannerInput>(() =>
    existingBanner ? fromBanner(existingBanner, banners.length + 1) : createBlankBanner(banners.length + 1),
  );
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [pasteHtml, setPasteHtml] = useState('');

  const editorRootRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setDraft(
      existingBanner ? fromBanner(existingBanner, banners.length + 1) : createBlankBanner(banners.length + 1),
    );
  }, [existingBanner, banners.length]);

  useEffect(() => {
    const root = editorRootRef.current;
    if (!root) return undefined;

    root.innerHTML = '';

    const editor = grapesjs.init({
      container: root,
      height: '100%',
      width: 'auto',
      storageManager: false,
      noticeOnUnload: false,
      fromElement: false,
      avoidInlineStyle: false,
      allowScripts: false,
      canvas: {
        // Inline styles injected into the GrapesJS iframe for baseline visibility
        styles: ['/admin/gjs-canvas.css'],
      },
      assetManager: {
        upload: true,
        uploadFile: async (event: any) => {
          const files = Array.from(
            (event?.dataTransfer?.files ?? event?.target?.files ?? []) as FileList | File[],
          );

          try {
            const urls: string[] = [];
            for (const file of files) {
              const response = await uploadFile(file);
              urls.push(response.file_url);
              editor.AssetManager.add({ src: response.file_url });
            }
            return urls;
          } catch (error) {
            onMessage(error instanceof Error ? error.message : 'Upload failed');
            return [];
          }
        },
      },
    });

    editorRef.current = editor;

    const { html, css } = splitHtmlContent(draft.content_html);
    editor.setComponents(html || getEditorMarkup());
    editor.setStyle(css || DEFAULT_EDITOR_CSS);

    return () => {
      editorRef.current = null;
      editor.destroy();
      root.innerHTML = '';
    };
    // The banner editor page is keyed by banner id, so remounting covers identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePasteSubmit() {
    if (!editorRef.current || !pasteHtml.trim()) {
      setIsPasting(false);
      return;
    }

    const editor = editorRef.current;
    const { html, css } = splitHtmlContent(pasteHtml);
    editor.setComponents(html);
    if (css) {
      editor.setStyle(css);
    }

    setPasteHtml('');
    setIsPasting(false);
    onMessage('Custom HTML applied to editor.');
  }

  async function saveBanner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    try {
      const editor = editorRef.current;
      const html = editor ? editor.getHtml() : splitHtmlContent(draft.content_html).html;
      const css = editor ? editor.getCss() : splitHtmlContent(draft.content_html).css;
      const projectData = editor?.getProjectData?.() ?? draft.content_json;
      const payload: BannerInput = {
        ...draft,
        content_mode: 'html',
        content_html: composeHtml(html, css),
        content_json: projectData,
        title: draft.title.trim(),
      };

      if (existingBanner) {
        await updateBanner(existingBanner.id, payload);
        setStatus('Banner updated.');
      } else {
        await createBanner(payload);
        setStatus('Banner created.');
      }

      onMessage(existingBanner ? 'Banner updated.' : 'Banner created.');
      await onSaved();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save banner';
      setStatus(message);
      onMessage(message);
    } finally {
      setSaving(false);
    }
  }

  async function removeBanner() {
    if (!existingBanner) {
      onBack();
      return;
    }

    if (!window.confirm('Delete this banner?')) return;

    try {
      await deleteBanner(existingBanner.id);
      setStatus('Banner deleted.');
      onMessage('Banner deleted.');
      await onRemoved();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete banner';
      setStatus(message);
      onMessage(message);
    }
  }

  const previewBanner: Banner = {
    id: existingBanner?.id ?? 'preview',
    title: draft.title || 'Banner title',
    subtitle: draft.subtitle ?? null,
    description: draft.description ?? null,
    primary_button_label: draft.primary_button_label ?? null,
    primary_button_href: draft.primary_button_href ?? null,
    secondary_button_label: draft.secondary_button_label ?? null,
    secondary_button_href: draft.secondary_button_href ?? null,
    media_url: draft.media_url ?? null,
    media_kind: draft.media_kind,
    content_mode: 'html',
    content_html: draft.content_html ?? null,
    content_json: draft.content_json ?? null,
    background_type: draft.background_type,
    background_value: draft.background_value ?? null,
    overlay_color: draft.overlay_color ?? null,
    text_color: draft.text_color ?? null,
    sort_order: draft.sort_order,
    is_active: draft.is_active,
  };

  return (
    <section className="admin-page-section banner-page" id="admin-banner-editor">
      <article className="admin-card banner-editor-shell">
        <div className="section-card-head">
          <div>
            <p className="section-kicker">Banners</p>
            <h2>{existingBanner ? 'Edit Banner' : 'Create Banner'}</h2>
            <p className="section-copy">
              Compose the banner body with GrapesJS or paste custom HTML.
            </p>
          </div>
          <div className="row-actions">
            <button type="button" className="secondary" onClick={() => setIsPasting(true)}>
              Paste HTML
            </button>
            <button type="button" onClick={onBack}>
              Back
            </button>
            {existingBanner ? (
              <button type="button" className="danger" onClick={() => void removeBanner()}>
                Delete
              </button>
            ) : null}
          </div>
        </div>

        {isPasting && (
          <div className="admin-modal-overlay">
            <div className="admin-modal paste-html-modal">
              <h3>Paste Custom HTML</h3>
              <p className="helper-copy">Input raw HTML and CSS (inside style tags if needed). This will overwrite the current canvas content.</p>
              <textarea
                value={pasteHtml}
                onChange={(e) => setPasteHtml(e.target.value)}
                placeholder="<style>...</style><div>...</div>"
                className="paste-area"
              />
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setIsPasting(false)}>Cancel</button>
                <button type="button" className="solid-button" onClick={handlePasteSubmit}>Apply to Editor</button>
              </div>
            </div>
          </div>
        )}

        <form className="banner-editor-2zone-form admin-form" onSubmit={saveBanner}>
          {/* Canvas — takes most of the width */}
          <div className="banner-editor-canvas-wrap">
            <div className="banner-editor-canvas" ref={editorRootRef} />
          </div>

          {/* Unified settings panel */}
          <aside className="banner-settings-panel">
            <div className="editor-group">
              <h3>General</h3>
              <label>
                Title
                <input
                  value={draft.title}
                  onChange={(event) => setDraft((c) => ({ ...c, title: event.target.value }))}
                  placeholder="Summer Refreshment"
                  required
                />
              </label>
              <label>
                Subtitle
                <input
                  value={draft.subtitle ?? ''}
                  onChange={(event) => setDraft((c) => ({ ...c, subtitle: event.target.value || null }))}
                  placeholder="Daily Workplace Refreshment"
                />
              </label>
              <label>
                Description
                <textarea
                  value={draft.description ?? ''}
                  onChange={(event) => setDraft((c) => ({ ...c, description: event.target.value || null }))}
                  placeholder="A short line that explains the banner."
                  rows={3}
                />
              </label>
            </div>

            <div className="editor-group">
              <h3>Call-to-Action</h3>
              <label>
                Primary label
                <input
                  value={draft.primary_button_label ?? ''}
                  onChange={(event) => setDraft((c) => ({ ...c, primary_button_label: event.target.value || null }))}
                  placeholder="SUBSCRIBE NOW"
                />
              </label>
              <label>
                Primary href
                <input
                  value={draft.primary_button_href ?? ''}
                  onChange={(event) => setDraft((c) => ({ ...c, primary_button_href: event.target.value || null }))}
                  placeholder="#account"
                />
              </label>
              <label>
                Secondary label
                <input
                  value={draft.secondary_button_label ?? ''}
                  onChange={(event) => setDraft((c) => ({ ...c, secondary_button_label: event.target.value || null }))}
                  placeholder="Learn more"
                />
              </label>
              <label>
                Secondary href
                <input
                  value={draft.secondary_button_href ?? ''}
                  onChange={(event) => setDraft((c) => ({ ...c, secondary_button_href: event.target.value || null }))}
                  placeholder="#contact"
                />
              </label>
            </div>

            <div className="editor-group">
              <h3>Settings</h3>
              <div className="settings-row">
                <label className="settings-order-label">
                  Order
                  <input
                    type="number"
                    value={draft.sort_order}
                    onChange={(event) => setDraft((c) => ({ ...c, sort_order: Number.parseInt(event.target.value, 10) || 0 }))}
                  />
                </label>
                <label className="checkbox-field settings-active-label">
                  <input
                    type="checkbox"
                    checked={draft.is_active}
                    onChange={(event) => setDraft((c) => ({ ...c, is_active: event.target.checked }))}
                  />
                  <span>Active</span>
                </label>
              </div>
              <label>
                Background type
                <select
                  value={draft.background_type}
                  onChange={(event) => setDraft((c) => ({ ...c, background_type: event.target.value }))}
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="gradient">Gradient</option>
                  <option value="solid">Solid color</option>
                </select>
              </label>
              <label>
                Background value
                <input
                  value={draft.background_value ?? ''}
                  onChange={(event) => setDraft((c) => ({ ...c, background_value: event.target.value || null }))}
                  placeholder="/assets/home.webp or linear-gradient(…)"
                />
              </label>
              <label>
                Overlay color
                <input
                  value={draft.overlay_color ?? ''}
                  onChange={(event) => setDraft((c) => ({ ...c, overlay_color: event.target.value || null }))}
                  placeholder="rgba(17, 24, 18, 0.28)"
                />
              </label>
              <label>
                Text color
                <input
                  value={draft.text_color ?? ''}
                  onChange={(event) => setDraft((c) => ({ ...c, text_color: event.target.value || null }))}
                  placeholder="#ffffff"
                />
              </label>
            </div>

            <div className="editor-group">
              <div className="banner-preview-head">
                <h3>Preview</h3>
                <span className="mode-chip">Hero</span>
              </div>
              <div className="banner-preview-canvas">
                <BannerRenderer banner={previewBanner} variant="hero" />
              </div>
            </div>

            <div className="settings-panel-footer">
              {status ? <p className="helper-copy status-msg">{status}</p> : null}
              <div className="panel-actions">
                <button type="button" className="secondary" onClick={onBack}>Cancel</button>
                <button type="submit" className="solid-button" disabled={saving}>
                  {saving ? 'Saving…' : existingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </div>
          </aside>
        </form>
      </article>
    </section>
  );
}
