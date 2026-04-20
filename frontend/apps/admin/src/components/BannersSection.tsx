import type { Banner, BannerInput, CreateCustomerInput, CustomerDetailResponse, CustomerListItem } from '@tea-time/types';
import type { Address } from '@tea-time/types';

interface BannersProps {
  banners: Banner[];
  bannerForm: BannerInput;
  bannerEditingId: string;
  onBannerFormChange: (patch: Partial<BannerInput>) => void;
  onSubmitBanner: (event: React.FormEvent<HTMLFormElement>) => void;
  onEditBanner: (banner: Banner) => void;
  onDeleteBanner: (id: string) => void;
  onFileAppend: (event: React.ChangeEvent<HTMLInputElement>, target: 'banner') => void;
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
  return (
    <article className="admin-card" id="admin-banners-form">
      <h2>Banners</h2>
      <form className="admin-form" onSubmit={onSubmitBanner}>
        <label>
          Title
          <input
            value={bannerForm.title}
            onChange={(e) => onBannerFormChange({ title: e.target.value })}
          />
        </label>
        <label>
          Subtitle
          <input
            value={bannerForm.subtitle ?? ''}
            onChange={(e) => onBannerFormChange({ subtitle: e.target.value })}
          />
        </label>
        <label>
          Description
          <textarea
            value={bannerForm.description ?? ''}
            onChange={(e) => onBannerFormChange({ description: e.target.value })}
          />
        </label>
        <label>
          Media URL
          <input
            value={bannerForm.media_url ?? ''}
            onChange={(e) => onBannerFormChange({ media_url: e.target.value })}
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
          Background value
          <input
            value={bannerForm.background_value ?? ''}
            onChange={(e) => onBannerFormChange({ background_value: e.target.value })}
          />
        </label>
        <div className="split-inputs">
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
        </div>
        <div className="split-inputs">
          <label>
            Sort order
            <input
              type="number"
              value={bannerForm.sort_order}
              onChange={(e) => onBannerFormChange({ sort_order: Number(e.target.value) })}
            />
          </label>
          <label>
            Text color
            <input
              value={bannerForm.text_color ?? ''}
              onChange={(e) => onBannerFormChange({ text_color: e.target.value })}
            />
          </label>
        </div>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={bannerForm.is_active}
            onChange={(e) => onBannerFormChange({ is_active: e.target.checked })}
          />
          Banner active on landing page
        </label>
        <button type="submit">{bannerEditingId ? 'Update banner' : 'Create banner'}</button>
      </form>

      <div className="admin-list">
        {banners.map((banner) => (
          <article key={banner.id} className="admin-list-item">
            <div>
              <strong>{banner.title}</strong>
              <span>
                #{banner.sort_order} · {banner.is_active ? 'Active' : 'Hidden'}
              </span>
            </div>
            <div className="row-actions">
              <button type="button" onClick={() => onEditBanner(banner)}>
                Edit
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => onDeleteBanner(banner.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </article>
  );
}

interface CustomersProps {
  users: CustomerListItem[];
  userForm: CreateCustomerInput;
  selectedUser: CustomerDetailResponse | null;
  onUserFormChange: (patch: Partial<CreateCustomerInput>) => void;
  onSubmitUser: (event: React.FormEvent<HTMLFormElement>) => void;
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
    <article className="admin-card" id="admin-customers">
      <h2>Customers</h2>
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

      <div className="admin-list">
        {users.map((user) => (
          <article key={user.id} className="admin-list-item">
            <div>
              <strong>
                {user.first_name} {user.last_name}
              </strong>
              <span>{user.email}</span>
            </div>
            <button type="button" onClick={() => onOpenUser(user.id)}>
              View
            </button>
          </article>
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
  );
}
