import type { ChangeEvent, CSSProperties, FormEvent } from 'react';

import type { Banner, BannerInput, CreateCustomerInput, CustomerDetailResponse, CustomerListItem } from '@tea-time/types';
import type { Address } from '@tea-time/types';

interface BannersProps {
  banners: Banner[];
  bannerForm: BannerInput;
  bannerEditingId: string;
  onBannerFormChange: (patch: Partial<BannerInput>) => void;
  onSubmitBanner: (event: FormEvent<HTMLFormElement>) => void;
  onEditBanner: (banner: Banner) => void;
  onDeleteBanner: (id: string) => void;
  onFileAppend: (event: ChangeEvent<HTMLInputElement>, target: 'banner' | 'banner-background') => void;
}

type BannerVisual = {
  background_type: string;
  background_value?: string | null;
  media_url?: string | null;
};

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

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0'))
    .join('')}`;
}

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

function parseOverlayColor(value: string | null | undefined) {
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

function rgbaFromHex(color: string, opacity: number) {
  const { r, g, b } = hexToRgb(normalizeHexColor(color));
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(100, opacity)) / 100})`;
}

function slideBackgroundStyle(
  banner: BannerVisual,
): CSSProperties {
  if (banner.background_type === 'solid' || banner.background_type === 'gradient') {
    return {
      background:
        banner.background_value ?? 'linear-gradient(135deg, #375c36 0%, #7d8f49 42%, #283b24 100%)',
    };
  }

  const source = banner.background_value || banner.media_url;
  if (!source) {
    return {
      background: 'linear-gradient(135deg, #375c36 0%, #7d8f49 42%, #283b24 100%)',
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

function backgroundThumbStyle(
  banner: BannerVisual,
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

export function BannersSection({
  banners,
  bannerForm,
  bannerEditingId,
  onBannerFormChange,
  onSubmitBanner,
  onEditBanner,
  onDeleteBanner,
  onFileAppend,
}: BannersProps) {
  const textColor = normalizeHexColor(bannerForm.text_color, '#ffffff');
  const overlay = parseOverlayColor(bannerForm.overlay_color);
  const overlayColor = rgbaFromHex(overlay.color, overlay.opacity);

  const primaryLabel = bannerForm.primary_button_label?.trim();
  const secondaryLabel = bannerForm.secondary_button_label?.trim();
  const backgroundValue = bannerForm.background_value ?? '';
  const isImageBackground = bannerForm.background_type === 'image';
  const isVideoBackground = bannerForm.background_type === 'video';
  const isSolidBackground = bannerForm.background_type === 'solid';
  const isGradientBackground = bannerForm.background_type === 'gradient';

  function handleTextColorChange(nextValue: string) {
    onBannerFormChange({ text_color: nextValue });
  }

  function handleOverlayColorChange(nextColor: string) {
    onBannerFormChange({
      overlay_color: rgbaFromHex(nextColor, overlay.opacity),
    });
  }

  function handleOverlayOpacityChange(nextOpacity: number) {
    onBannerFormChange({
      overlay_color: rgbaFromHex(overlay.color, nextOpacity),
    });
  }

  return (
    <section className="admin-page-section banner-page" id="admin-banners">
      <div className="banner-editor">
        <form className="admin-card banner-editor-form" onSubmit={onSubmitBanner}>
          <div className="section-card-head">
            <div>
              <p className="section-kicker">Publishing</p>
              <h2>{bannerEditingId ? 'Edit banner' : 'Create banner'}</h2>
              <p className="section-copy">
                Adjust the hero banner, preview the result live, and keep the public landing page
                on brand.
              </p>
            </div>
          </div>

          <div className="editor-group">
            <h3>Content</h3>
            <label>
              Title
              <input
                value={bannerForm.title}
                onChange={(e) => onBannerFormChange({ title: e.target.value })}
                placeholder="Refreshment That Moves with Your Workday."
              />
            </label>
            <label>
              Subtitle
              <input
                value={bannerForm.subtitle ?? ''}
                onChange={(e) => onBannerFormChange({ subtitle: e.target.value })}
                placeholder="Daily Workplace Refreshment"
              />
            </label>
            <label>
              Description
              <textarea
                value={bannerForm.description ?? ''}
                onChange={(e) => onBannerFormChange({ description: e.target.value })}
                placeholder="A short line that explains the banner."
              />
            </label>
            <div className="split-inputs">
              <label>
                Primary button label
                <input
                  value={bannerForm.primary_button_label ?? ''}
                  onChange={(e) =>
                    onBannerFormChange({ primary_button_label: e.target.value })
                  }
                  placeholder="Subscribe now"
                />
              </label>
              <label>
                Primary button href
                <input
                  value={bannerForm.primary_button_href ?? ''}
                  onChange={(e) =>
                    onBannerFormChange({ primary_button_href: e.target.value })
                  }
                  placeholder="#categories"
                />
              </label>
            </div>
            <div className="split-inputs">
              <label>
                Secondary button label
                <input
                  value={bannerForm.secondary_button_label ?? ''}
                  onChange={(e) =>
                    onBannerFormChange({ secondary_button_label: e.target.value })
                  }
                  placeholder="Explore menu"
                />
              </label>
              <label>
                Secondary button href
                <input
                  value={bannerForm.secondary_button_href ?? ''}
                  onChange={(e) =>
                    onBannerFormChange({ secondary_button_href: e.target.value })
                  }
                  placeholder="#products"
                />
              </label>
            </div>
          </div>

          <div className="editor-group bg-type-fields">
            <h3>Background</h3>
            <label>
              Background type
              <select
                value={bannerForm.background_type}
                onChange={(e) =>
                  onBannerFormChange({
                    background_type: e.target.value as BannerInput['background_type'],
                  })
                }
              >
                <option value="gradient">Gradient</option>
                <option value="solid">Solid</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </label>

            {isGradientBackground ? (
              <label>
                Gradient CSS
                <textarea
                  value={backgroundValue}
                  onChange={(e) => onBannerFormChange({ background_value: e.target.value })}
                  placeholder="linear-gradient(135deg, #375c36 0%, #7d8f49 42%, #283b24 100%)"
                />
              </label>
            ) : null}

            {isSolidBackground ? (
              <label>
                Solid color
                <div className="color-with-picker">
                  <input
                    type="color"
                    value={normalizeHexColor(backgroundValue, '#315f40')}
                    onChange={(e) =>
                      onBannerFormChange({ background_value: e.target.value.toUpperCase() })
                    }
                  />
                  <input
                    type="text"
                    value={backgroundValue}
                    onChange={(e) => onBannerFormChange({ background_value: e.target.value })}
                    placeholder="#315f40"
                  />
                </div>
              </label>
            ) : null}

            {isImageBackground ? (
              <>
                <label>
                  Image URL
                  <input
                    value={backgroundValue}
                    onChange={(e) => onBannerFormChange({ background_value: e.target.value })}
                    placeholder="/assets/home-Dr3wWsX4.webp"
                  />
                </label>
                <label className="upload-field">
                  Upload background image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onFileAppend(e, 'banner-background')}
                  />
                </label>
              </>
            ) : null}

            {isVideoBackground ? (
              <label>
                Video URL
                <input
                  value={backgroundValue}
                  onChange={(e) => onBannerFormChange({ background_value: e.target.value })}
                  placeholder="https://..."
                />
              </label>
            ) : null}
          </div>

          <div className="editor-group">
            <h3>Media</h3>
            <label>
              Media URL
              <input
                value={bannerForm.media_url ?? ''}
                onChange={(e) => onBannerFormChange({ media_url: e.target.value })}
                placeholder="https://..."
              />
            </label>
            <label className="upload-field">
              Upload media
              <input
                type="file"
                accept="image/*,video/mp4"
                onChange={(e) => onFileAppend(e, 'banner')}
              />
            </label>
            <label>
              Media kind
              <select
                value={bannerForm.media_kind}
                onChange={(e) =>
                  onBannerFormChange({ media_kind: e.target.value as BannerInput['media_kind'] })
                }
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </label>
          </div>

          <div className="editor-group">
            <h3>Appearance</h3>
            <label>
              Text color
              <div className="color-with-picker">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => handleTextColorChange(e.target.value.toUpperCase())}
                />
                <input
                  type="text"
                  value={bannerForm.text_color ?? ''}
                  onChange={(e) => handleTextColorChange(e.target.value)}
                  placeholder="#ffffff"
                />
              </div>
            </label>
            <label>
              Overlay color
              <div className="color-with-picker">
                <input
                  type="color"
                  value={overlay.color}
                  onChange={(e) => handleOverlayColorChange(e.target.value.toUpperCase())}
                />
                <input
                  type="text"
                  value={overlay.color}
                  onChange={(e) => handleOverlayColorChange(e.target.value)}
                  placeholder="#111812"
                />
              </div>
            </label>
            <label>
              Overlay opacity
              <input
                type="range"
                min="0"
                max="100"
                value={overlay.opacity}
                onChange={(e) => handleOverlayOpacityChange(Number(e.target.value))}
              />
            </label>
            <div className="split-inputs">
              <label>
                Sort order
                <input
                  type="number"
                  value={bannerForm.sort_order}
                  onChange={(e) => onBannerFormChange({ sort_order: Number(e.target.value) })}
                />
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={bannerForm.is_active}
                  onChange={(e) => onBannerFormChange({ is_active: e.target.checked })}
                />
                Active on landing page
              </label>
            </div>
          </div>

          <button type="submit">{bannerEditingId ? 'Update banner' : 'Create banner'}</button>
        </form>

        <aside className="admin-card banner-preview" aria-label="Live preview">
          <div className="banner-preview-head">
            <p className="section-kicker">Live preview</p>
            <span className="type-chip">{bannerForm.background_type}</span>
          </div>

          <div className="banner-preview-canvas">
            <div className="hero-slide-background" style={slideBackgroundStyle(bannerForm)} />
            <div className="hero-overlay" style={{ background: overlayColor }} />
            <div className="banner-preview-copy hero-copy" style={{ '--hero-text': textColor } as CSSProperties}>
              {bannerForm.subtitle ? <span className="eyebrow">{bannerForm.subtitle}</span> : null}
              <h1>{bannerForm.title || 'Banner title'}</h1>
              {bannerForm.description ? <p>{bannerForm.description}</p> : <p>Live preview updates as you edit the form.</p>}
              <div className="hero-actions-row">
                {primaryLabel && bannerForm.primary_button_href ? (
                  <a className="solid-button" href={bannerForm.primary_button_href}>
                    {primaryLabel}
                  </a>
                ) : null}
                {secondaryLabel && bannerForm.secondary_button_href ? (
                  <a className="ghost-button" href={bannerForm.secondary_button_href}>
                    {secondaryLabel}
                  </a>
                ) : null}
              </div>
              <div className="slide-badges">
                <span className="slide-badge">{bannerForm.is_active ? 'Active' : 'Hidden'}</span>
                <span className="slide-badge">{bannerForm.media_kind}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <article className="admin-card banner-list-card">
        <div className="section-card-head">
          <div>
            <p className="section-kicker">Banners</p>
            <h2>Banner list</h2>
            <p className="section-copy">
              Review the current slider lineup, sort order, active state, and background type.
            </p>
          </div>
        </div>

        <div className="admin-table banner-list">
          <div className="admin-table-head">
            <span>Preview</span>
            <span>Title</span>
            <span>State</span>
            <span>Actions</span>
          </div>
          {banners.map((banner) => (
            <div key={banner.id} className="admin-table-row banner-row">
              <span className="banner-thumb" style={backgroundThumbStyle(banner)} aria-hidden="true" />
              <div className="banner-row-copy">
                <strong>{banner.title}</strong>
                <span>#{banner.sort_order}</span>
              </div>
              <div className="banner-row-badges">
                <span className={`status-chip${banner.is_active ? ' is-active' : ''}`}>
                  {banner.is_active ? 'Active' : 'Hidden'}
                </span>
                <span className="type-chip">{banner.background_type}</span>
              </div>
              <div className="row-actions">
                <button type="button" onClick={() => onEditBanner(banner)}>
                  Edit
                </button>
                <button type="button" className="danger" onClick={() => onDeleteBanner(banner.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

interface CustomersProps {
  users: CustomerListItem[];
  userForm: CreateCustomerInput;
  selectedUser: CustomerDetailResponse | null;
  onUserFormChange: (patch: Partial<CreateCustomerInput>) => void;
  onSubmitUser: (event: FormEvent<HTMLFormElement>) => void;
  onOpenUser: (id: string) => void;
}

export function CustomersSection({
  users,
  userForm,
  selectedUser,
  onUserFormChange,
  onSubmitUser,
  onOpenUser,
}: CustomersProps) {
  return (
    <section className="admin-page-section" id="admin-customers">
      <article className="admin-card">
        <div className="section-card-head">
          <div>
            <p className="section-kicker">Customers</p>
            <h2>Customers</h2>
            <p className="section-copy">
              Create and inspect customer records without leaving the dashboard.
            </p>
          </div>
        </div>

        <form className="admin-form admin-form--tight" onSubmit={onSubmitUser}>
          <label>
            Username
            <input
              value={userForm.user_name}
              onChange={(e) => onUserFormChange({ user_name: e.target.value })}
            />
          </label>
          <div className="split-inputs">
            <label>
              First name
              <input
                value={userForm.first_name}
                onChange={(e) => onUserFormChange({ first_name: e.target.value })}
              />
            </label>
            <label>
              Last name
              <input
                value={userForm.last_name}
                onChange={(e) => onUserFormChange({ last_name: e.target.value })}
              />
            </label>
          </div>
          <label>
            Phone
            <input
              value={userForm.phone ?? ''}
              onChange={(e) => onUserFormChange({ phone: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={userForm.email}
              onChange={(e) => onUserFormChange({ email: e.target.value })}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={userForm.password}
              onChange={(e) => onUserFormChange({ password: e.target.value })}
            />
          </label>
          <button type="submit">Create customer</button>
        </form>

        <div className="admin-table">
          <div className="admin-table-head">
            <span>Name</span>
            <span>Email</span>
            <span>Actions</span>
          </div>
          {users.map((user) => (
            <div key={user.id} className="admin-table-row">
              <strong>
                {user.first_name} {user.last_name}
              </strong>
              <span>{user.email}</span>
              <button type="button" onClick={() => onOpenUser(user.id)}>
                View
              </button>
            </div>
          ))}
        </div>

        {selectedUser ? (
          <article className="detail-panel">
            <h3>
              {selectedUser.customer.user.first_name} {selectedUser.customer.user.last_name}
            </h3>
            <p>{selectedUser.customer.user.email}</p>
            <p>
              {selectedUser.addresses.length} addresses · {selectedUser.orders.length} orders
            </p>
            {selectedUser.addresses.map((address: Address) => (
              <div key={address.id} className="detail-row">
                <span>{address.full_name}</span>
                <span>{address.city}</span>
              </div>
            ))}
          </article>
        ) : null}
      </article>
    </section>
  );
}
