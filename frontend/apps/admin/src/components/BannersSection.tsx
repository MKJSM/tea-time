import type { ChangeEvent, CSSProperties, FormEvent } from 'react';

import type { Banner, BannerInput, CreateCustomerInput, CustomerDetailResponse, CustomerListItem } from '@tea-time/types';
import type { Address } from '@tea-time/types';

import { BannerRenderer } from '@tea-time/ui';
import {
  normalizeHexColor,
  parseOverlayColor,
  rgbaFromHex,
  backgroundThumbStyle
} from '../lib/colors';

interface BannersProps {
  banners?: Banner[];
  bannerForm?: BannerInput;
  bannerEditingId?: string;
  onBannerFormChange?: (patch: Partial<BannerInput>) => void;
  onSubmitBanner?: (event: FormEvent<HTMLFormElement>) => void;
  onEditBanner?: (banner: Banner) => void;
  onDeleteBanner?: (id: string) => void;
  onFileAppend?: (event: ChangeEvent<HTMLInputElement>, target: 'banner' | 'banner-background') => void;
  onAddBanner?: () => void;
  variant?: 'list' | 'editor';
}

export function BannersSection({
  banners = [],
  bannerForm,
  bannerEditingId,
  onBannerFormChange,
  onSubmitBanner,
  onEditBanner,
  onDeleteBanner,
  onFileAppend,
  onAddBanner,
  variant = 'list',
}: BannersProps) {
  if (variant === 'editor' && bannerForm && onBannerFormChange && onSubmitBanner && onFileAppend) {
    const textColor = normalizeHexColor(bannerForm.text_color, '#ffffff');
    const overlay = parseOverlayColor(bannerForm.overlay_color);
    const previewBanner: Banner = {
      id: 'preview',
      title: bannerForm.title || 'Banner title',
      subtitle: bannerForm.subtitle || null,
      description: bannerForm.description || null,
      primary_button_label: bannerForm.primary_button_label || null,
      primary_button_href: bannerForm.primary_button_href || null,
      secondary_button_label: bannerForm.secondary_button_label || null,
      secondary_button_href: bannerForm.secondary_button_href || null,
      media_url: bannerForm.media_url || null,
      media_kind: bannerForm.media_kind,
      content_mode: bannerForm.content_mode,
      content_html: bannerForm.content_html || null,
      background_type: bannerForm.background_type,
      background_value: bannerForm.background_value || null,
      overlay_color: bannerForm.overlay_color || null,
      text_color: textColor,
      sort_order: bannerForm.sort_order,
      is_active: bannerForm.is_active,
    };

    const backgroundValue = bannerForm.background_value ?? '';
    const isImageBackground = bannerForm.background_type === 'image';
    const isVideoBackground = bannerForm.background_type === 'video';
    const isSolidBackground = bannerForm.background_type === 'solid';
    const isGradientBackground = bannerForm.background_type === 'gradient';
    const isHtmlMode = bannerForm.content_mode === 'html';

    const handleTextColorChange = (nextValue: string) => onBannerFormChange({ text_color: nextValue });
    const handleOverlayColorChange = (nextColor: string) => onBannerFormChange({ overlay_color: rgbaFromHex(nextColor, overlay.opacity) });
    const handleOverlayOpacityChange = (nextOpacity: number) => onBannerFormChange({ overlay_color: rgbaFromHex(overlay.color, nextOpacity) });

    return (
      <div className="banner-editor">
        <form className="banner-editor-form admin-form" onSubmit={onSubmitBanner}>
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
              Content mode
              <select
                value={bannerForm.content_mode}
                onChange={(e) =>
                  onBannerFormChange({
                    content_mode: e.target.value as BannerInput['content_mode'],
                  })
                }
              >
                <option value="structured">Structured editor</option>
                <option value="html">Custom HTML</option>
              </select>
            </label>

            {isHtmlMode ? (
              <label>
                HTML content
                <textarea
                  className="banner-html-input"
                  value={bannerForm.content_html ?? ''}
                  onChange={(e) => onBannerFormChange({ content_html: e.target.value })}
                  placeholder="<section style=&quot;padding: 32px; color: white;&quot;>...</section>"
                />
              </label>
            ) : (
              <>
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
              </>
            )}
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
            <h3>Appearance</h3>
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
                Active
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit">{bannerEditingId ? 'Update banner' : 'Create banner'}</button>
          </div>
        </form>

        <aside className="banner-preview" aria-label="Live preview">
          <div className="banner-preview-head">
            <p className="section-kicker">Live preview</p>
          </div>
          <div className="banner-preview-canvas">
            <BannerRenderer banner={previewBanner} variant="preview" />
          </div>
        </aside>
      </div>
    );
  }

  return (
    <section className="admin-page-section banner-page" id="admin-banners">
      <article className="admin-card banner-list-card">
        <div className="section-card-head">
          <div>
            <p className="section-kicker">Banners</p>
            <h2>Publishing</h2>
            <p className="section-copy">
              Review and manage the slider lineup for the customer homepage.
            </p>
          </div>
          <button className="add-button" onClick={onAddBanner}>
            <span>+</span> Add Banner
          </button>
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
                <button type="button" onClick={() => onEditBanner?.(banner)}>
                  Edit
                </button>
                <button type="button" className="danger" onClick={() => onDeleteBanner?.(banner.id)}>
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
  users?: CustomerListItem[];
  userForm?: CreateCustomerInput;
  selectedUser?: CustomerDetailResponse | null;
  onUserFormChange?: (patch: Partial<CreateCustomerInput>) => void;
  onSubmitUser?: (event: FormEvent<HTMLFormElement>) => void;
  onOpenUser?: (id: string) => void;
  onAddUser?: () => void;
  variant?: 'list' | 'create' | 'view';
}

export function CustomersSection({
  users = [],
  userForm,
  selectedUser,
  onUserFormChange,
  onSubmitUser,
  onOpenUser,
  onAddUser,
  variant = 'list',
}: CustomersProps) {
  if (variant === 'create' && userForm && onUserFormChange && onSubmitUser) {
    return (
      <form className="admin-form" onSubmit={onSubmitUser}>
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
    );
  }

  if (variant === 'view' && selectedUser) {
    return (
      <article className="detail-panel">
        <h3>
          {selectedUser.customer.user.first_name} {selectedUser.customer.user.last_name}
        </h3>
        <p>{selectedUser.customer.user.email}</p>
        <p>
          {selectedUser.addresses.length} addresses · {selectedUser.orders.length} orders
        </p>
        <div className="detail-list">
          {selectedUser.addresses.map((address: Address) => (
            <div key={address.id} className="detail-row">
              <span>{address.full_name}</span>
              <span>{address.city}</span>
            </div>
          ))}
        </div>
      </article>
    );
  }

  return (
    <section className="admin-page-section" id="admin-customers">
      <article className="admin-card">
        <div className="section-card-head">
          <div>
            <p className="section-kicker">Customers</p>
            <h2>Customers</h2>
            <p className="section-copy">
              Manage customer records and access their detailed information.
            </p>
          </div>
          <button className="add-button" onClick={onAddUser}>
            <span>+</span> Add Customer
          </button>
        </div>

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
              <button type="button" onClick={() => onOpenUser?.(user.id)}>
                View
              </button>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
