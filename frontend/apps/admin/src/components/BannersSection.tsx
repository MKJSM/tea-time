import type { Banner } from '@tea-time/types';

import { backgroundThumbStyle } from '../lib/colors';

interface BannersSectionProps {
  banners: Banner[];
  onOpenBanner: (bannerId: string) => void;
  onDeleteBanner: (bannerId: string) => void;
  onAddBanner: () => void;
}

export function BannersSection({
  banners,
  onOpenBanner,
  onDeleteBanner,
  onAddBanner,
}: BannersSectionProps) {
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
          <button type="button" className="add-button" onClick={onAddBanner}>
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
          {banners.length ? (
            banners.map((banner) => (
              <div
                key={banner.id}
                className="admin-table-row banner-row banner-row-clickable"
                role="button"
                tabIndex={0}
                onClick={() => onOpenBanner(banner.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenBanner(banner.id);
                  }
                }}
              >
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
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenBanner(banner.id);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteBanner(banner.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="admin-empty-state banner-empty-state">
              <h3>No banners yet</h3>
              <p>Create the first banner to replace the default homepage fallback.</p>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
