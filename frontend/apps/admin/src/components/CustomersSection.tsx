import type { FormEvent } from 'react';

import type {
  CreateCustomerInput,
  CustomerDetailResponse,
  CustomerListItem,
} from '@tea-time/types';

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
          {selectedUser.addresses.map((address) => (
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
