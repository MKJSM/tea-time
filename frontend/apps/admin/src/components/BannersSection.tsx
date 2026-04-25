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
import { VisualBannerEditor, BannerBlockPalette, type BannerBlock, type BlockType } from './VisualBannerEditor';

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
      content_json: bannerForm.content_json ?? null,
      background_type: bannerForm.background_type,
      background_value: bannerForm.background_value || null,
      overlay_color: bannerForm.overlay_color || null,
      text_color: textColor,
      sort_order: bannerForm.sort_order,
      is_active: bannerForm.is_active,
    };

    const isImageBackground = bannerForm.background_type === 'image';
    const isVideoBackground = bannerForm.background_type === 'video';
    const isSolidBackground = bannerForm.background_type === 'solid';
    const isGradientBackground = bannerForm.background_type === 'gradient';
    const isHtmlMode = bannerForm.content_mode === 'html';

    const handleTextColorChange = (nextValue: string) => onBannerFormChange({ text_color: nextValue });
    const handleOverlayColorChange = (nextColor: string) => onBannerFormChange({ overlay_color: rgbaFromHex(nextColor, overlay.opacity) });
    const handleOverlayOpacityChange = (nextOpacity: number) => onBannerFormChange({ overlay_color: rgbaFromHex(overlay.color, nextOpacity) });

    const bannerBlocks = Array.isArray(bannerForm.content_json) ? bannerForm.content_json as BannerBlock[] : [];

    const handleUpdateBlocks = (newBlocks: BannerBlock[]) => {
      onBannerFormChange({ content_json: newBlocks });
    };

    const addBlock = (type: BlockType) => {
      const newBlock: BannerBlock = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        content: type === 'image' ? { src: '', alt: '' } : type === 'button' ? { label: 'Click here', href: '#' } : type === 'divider' ? {} : 'New ' + type,
      };
      handleUpdateBlocks([...bannerBlocks, newBlock]);
    };

    return (
      <div className="banner-editor">
        <form className="banner-editor-form admin-form" onSubmit={onSubmitBanner} id="banner-master-form">
          <aside className="banner-palette">
            <h3>Blocks</h3>
            <BannerBlockPalette onAdd={addBlock} />
          </aside>

          <main className="banner-canvas-workspace">
            {isHtmlMode ? (
              <VisualBannerEditor
                bannerForm={bannerForm}
                onChange={onBannerFormChange}
                blocks={bannerBlocks}
                onUpdateBlocks={handleUpdateBlocks}
              />
            ) : (
              <div className="structured-editor-fallback">
                <h3>Structured Content</h3>
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
              </div>
            )}
          </main>

          <aside className="banner-sidebar-settings">
            <div className="editor-group no-border">
              <h3>Editor Mode</h3>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={isHtmlMode}
                  onChange={(e) => onBannerFormChange({ content_mode: e.target.checked ? 'html' : 'structured' })}
                />
                <span>Enable HTML-First Mode</span>
              </label>
              <p className="field-hint">Use blocks to build a custom visual layout.</p>
            </div>

            <div className="editor-group">
              <h3>General</h3>
              <label>
                Internal Title
                <input
                  value={bannerForm.title}
                  onChange={(e) => onBannerFormChange({ title: e.target.value })}
                  placeholder="e.g. Summer Promo 2024"
                />
              </label>
              <div className="split-inputs">
                <label>
                  Sort Order
                  <input
                    type="number"
                    value={bannerForm.sort_order}
                    onChange={(e) => onBannerFormChange({ sort_order: parseInt(e.target.value) || 0 })}
                  />
                </label>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={bannerForm.is_active}
                    onChange={(e) => onBannerFormChange({ is_active: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>

            <div className="editor-group">
              <h3>Background</h3>
              <label>
                Background Type
                <select
                  value={bannerForm.background_type}
                  onChange={(e) => onBannerFormChange({ background_type: e.target.value as any })}
                >
                  <option value="solid">Solid Color</option>
                  <option value="gradient">Gradient</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </label>

              {(isImageBackground || isVideoBackground) && (
                <label className="upload-field">
                  {isImageBackground ? 'Upload Image' : 'Upload Video'}
                  <input
                    type="file"
                    accept={isImageBackground ? 'image/*' : 'video/*'}
                    onChange={(e) => onFileAppend(e, 'banner-background')}
                  />
                  {bannerForm.background_value && (
                    <div
                      className="bg-preview-mini"
                      style={backgroundThumbStyle({
                        background_type: bannerForm.background_type,
                        background_value: bannerForm.background_value,
                        media_url: bannerForm.media_url || null,
                      })}
                    />
                  )}
                </label>
              )}

              {(isSolidBackground || isGradientBackground) && (
                <label>
                  {isSolidBackground ? 'Color Value' : 'Gradient CSS'}
                  <input
                    value={bannerForm.background_value ?? ''}
                    onChange={(e) => onBannerFormChange({ background_value: e.target.value })}
                    placeholder={isSolidBackground ? '#1d2b20' : 'linear-gradient(...)'}
                  />
                </label>
              )}

              <div className="color-pair">
                <label>
                  Overlay Color
                  <div className="color-with-picker">
                    <input
                      type="color"
                      value={overlay.color}
                      onChange={(e) => handleOverlayColorChange(e.target.value)}
                    />
                    <input
                      type="text"
                      value={bannerForm.overlay_color ?? ''}
                      onChange={(e) => onBannerFormChange({ overlay_color: e.target.value })}
                    />
                  </div>
                </label>
                <label>
                  Overlay Opacity ({overlay.opacity}%)
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={overlay.opacity}
                    onChange={(e) => handleOverlayOpacityChange(parseInt(e.target.value, 10))}
                  />
                </label>
              </div>

              <label>
                Text Base Color
                <div className="color-with-picker">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => handleTextColorChange(e.target.value)}
                  />
                  <input
                    type="text"
                    value={bannerForm.text_color ?? ''}
                    onChange={(e) => handleTextColorChange(e.target.value)}
                  />
                </div>
              </label>
            </div>

            <div className="banner-preview">
              <h3>Live Preview</h3>
              <div className="preview-container mini">
                <BannerRenderer banner={previewBanner} variant="preview" />
              </div>
            </div>

            <div className="form-actions sticky-footer">
              <button type="submit" form="banner-master-form" className="solid-button large">
                {bannerEditingId ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </aside>
        </form>
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
