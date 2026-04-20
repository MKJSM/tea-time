import type {
  Address,
  AddressInput,
  CustomerAuthResponse,
  CustomerRegisterInput,
  LoginInput,
} from '@tea-time/types';

type AsyncState = 'idle' | 'loading' | 'ready' | 'error';

interface ProfileFormState {
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string;
}

interface Props {
  session: CustomerAuthResponse | null;
  authState: AsyncState;
  authMessage: string;
  registerForm: CustomerRegisterInput;
  loginForm: LoginInput;
  profileForm: ProfileFormState;
  addresses: Address[];
  addressForm: AddressInput;
  editingAddressId: string | null;
  addressState: AsyncState;
  addressMessage: string;
  cartItemCount: number;
  orderCount: number;
  onRegisterFormChange: (patch: Partial<CustomerRegisterInput>) => void;
  onLoginFormChange: (patch: Partial<LoginInput>) => void;
  onProfileFormChange: (patch: Partial<ProfileFormState>) => void;
  onAddressFormChange: (patch: Partial<AddressInput>) => void;
  onRegister: (event: React.FormEvent<HTMLFormElement>) => void;
  onLogin: (event: React.FormEvent<HTMLFormElement>) => void;
  onLogout: () => void;
  onProfileSave: (event: React.FormEvent<HTMLFormElement>) => void;
  onAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddressSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onAddressDelete: (id: string) => void;
  onAddressEdit: (address: Address) => void;
  onAddressEditCancel: () => void;
}

export function AccountSection({
  session,
  authState,
  authMessage,
  registerForm,
  loginForm,
  profileForm,
  addresses,
  addressForm,
  editingAddressId,
  addressState,
  addressMessage,
  cartItemCount,
  orderCount,
  onRegisterFormChange,
  onLoginFormChange,
  onProfileFormChange,
  onAddressFormChange,
  onRegister,
  onLogin,
  onLogout,
  onProfileSave,
  onAvatarUpload,
  onAddressSubmit,
  onAddressDelete,
  onAddressEdit,
  onAddressEditCancel,
}: Props) {
  return (
    <section className="container customer-grid" id="account">
      {/* Auth / Profile Panel */}
      <section className="panel auth-panel">
        <div className="section-head compact">
          <div>
            <span className="eyebrow">Account</span>
            <h2>{session ? 'Your profile & addresses.' : 'Sign in or create account.'}</h2>
          </div>
        </div>

        {!session ? (
          <div className="dual-form-grid">
            {/* Register */}
            <form className="auth-card" onSubmit={onRegister}>
              <div className="auth-card-badge">✦ Create Account</div>
              <h3 className="serif">Join Us</h3>
              <p className="auth-sub">
                Create an account to save your favorites and track your orders.
              </p>
              {(
                [
                  { field: 'user_name', label: 'Username', type: 'text', icon: '👤' },
                  { field: 'first_name', label: 'First Name', type: 'text', icon: '👤' },
                  { field: 'last_name', label: 'Last Name', type: 'text', icon: '👤' },
                  { field: 'phone', label: 'Phone', type: 'tel', icon: '📞' },
                  { field: 'email', label: 'Email', type: 'email', icon: '✉️' },
                  { field: 'password', label: 'Password', type: 'password', icon: '🔒' },
                ] as const
              ).map(({ field, label, type, icon }) => (
                <div key={field} className="auth-input-wrap">
                  <span className="auth-icon">{icon}</span>
                  <input
                    type={type}
                    placeholder={label}
                    value={(registerForm as unknown as Record<string, string>)[field] ?? ''}
                    onChange={(e) =>
                      onRegisterFormChange({ [field]: e.target.value } as Partial<CustomerRegisterInput>)
                    }
                  />
                </div>
              ))}
              <button className="solid-button auth-cta" type="submit">
                {authState === 'loading' ? 'Creating…' : 'Create Account →'}
              </button>
            </form>

            {/* Login */}
            <form className="auth-card" onSubmit={onLogin}>
              <div className="auth-card-badge">✦ Login</div>
              <h3 className="serif">Welcome Back</h3>
              <p className="auth-sub">Sign in to your account to view your orders and favorites.</p>
              <div className="auth-input-wrap">
                <span className="auth-icon">✉️</span>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={loginForm.email}
                  onChange={(e) => onLoginFormChange({ email: e.target.value })}
                />
              </div>
              <div className="auth-input-wrap">
                <span className="auth-icon">🔒</span>
                <input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => onLoginFormChange({ password: e.target.value })}
                />
              </div>
              <button className="solid-button auth-cta" type="submit">
                {authState === 'loading' ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="account-chip-row">
              <span className="status-pill">{session.user.email}</span>
              <span className="status-pill">{orderCount} orders</span>
              <span className="status-pill">{cartItemCount} cart items</span>
              <button className="outline-button" type="button" onClick={onLogout}>
                Logout
              </button>
            </div>
            <form className="form-card" onSubmit={onProfileSave} style={{ marginTop: 16 }}>
              <h3>Profile</h3>
              <div className="profile-grid">
                <div className="avatar-block">
                  {profileForm.avatar_url ? (
                    <img className="avatar-preview" src={profileForm.avatar_url} alt="Avatar" />
                  ) : (
                    <div className="avatar-preview avatar-fallback">
                      {session.user.first_name.slice(0, 1)}
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={onAvatarUpload} />
                </div>
                <div className="profile-fields">
                  {(
                    [
                      { key: 'first_name', label: 'First name' },
                      { key: 'last_name', label: 'Last name' },
                      { key: 'phone', label: 'Phone' },
                      { key: 'avatar_url', label: 'Avatar URL' },
                    ] as const
                  ).map(({ key, label }) => (
                    <label key={key}>
                      {label}
                      <input
                        value={(profileForm as unknown as Record<string, string>)[key] ?? ''}
                        onChange={(e) =>
                          onProfileFormChange({ [key]: e.target.value } as Partial<ProfileFormState>)
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
              <button className="solid-button" type="submit" style={{ marginTop: 14 }}>
                Save profile
              </button>
            </form>
          </div>
        )}
        {authMessage ? (
          <p className={`form-message${authState === 'error' ? ' error' : ''}`}>{authMessage}</p>
        ) : null}
      </section>

      {/* Addresses Panel */}
      <section className="panel">
        <div className="section-head compact">
          <div>
            <span className="eyebrow">Addresses</span>
            <h2>Save and edit delivery addresses.</h2>
          </div>
        </div>
        {session ? (
          <>
            <form className="form-card" onSubmit={onAddressSubmit}>
              <h3>{editingAddressId ? 'Edit address' : 'Add address'}</h3>
              <div className="form-grid two-up">
                {(
                  [
                    { key: 'full_name', label: 'Full name', span: false },
                    { key: 'phone', label: 'Phone', span: false },
                    { key: 'line_1', label: 'Address line 1', span: true },
                    { key: 'line_2', label: 'Address line 2', span: true },
                    { key: 'city', label: 'City', span: false },
                    { key: 'state', label: 'State', span: false },
                    { key: 'postal_code', label: 'Postal code', span: false },
                    { key: 'country', label: 'Country', span: false },
                    { key: 'landmark', label: 'Landmark', span: true },
                  ] as const
                ).map(({ key, label, span }) => (
                  <label key={key} className={span ? 'span-2' : ''}>
                    {label}
                    <input
                      value={(addressForm as unknown as Record<string, string>)[key] ?? ''}
                      onChange={(e) =>
                        onAddressFormChange({ [key]: e.target.value } as Partial<AddressInput>)
                      }
                    />
                  </label>
                ))}
              </div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={addressForm.is_default}
                  onChange={(e) => onAddressFormChange({ is_default: e.target.checked })}
                />
                Set as default address
              </label>
              <div className="inline-actions">
                <button className="solid-button" type="submit">
                  {addressState === 'loading'
                    ? 'Saving…'
                    : editingAddressId
                      ? 'Update address'
                      : 'Save address'}
                </button>
                {editingAddressId ? (
                  <button className="outline-button" type="button" onClick={onAddressEditCancel}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
            <div className="list-stack" style={{ marginTop: 16 }}>
              {addresses.map((addr) => (
                <article key={addr.id} className="list-card">
                  <div className="list-title-row">
                    <strong>{addr.full_name}</strong>
                    {addr.is_default ? <span className="status-pill">Default</span> : null}
                  </div>
                  <p>
                    {addr.line_1}
                    {addr.line_2 ? `, ${addr.line_2}` : ''}, {addr.city}, {addr.state}{' '}
                    {addr.postal_code}
                  </p>
                  <p>
                    {addr.phone} · {addr.country}
                  </p>
                  <div className="inline-actions">
                    <button
                      className="outline-button"
                      type="button"
                      onClick={() => onAddressEdit(addr)}
                    >
                      Edit
                    </button>
                    <button
                      className="ghost-inline danger"
                      type="button"
                      onClick={() => onAddressDelete(addr.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="helper-copy">Login to manage delivery addresses.</p>
        )}
        {addressMessage ? (
          <p className={`form-message${addressState === 'error' ? ' error' : ''}`}>
            {addressMessage}
          </p>
        ) : null}
      </section>
    </section>
  );
}
