import type { Address, CartResponse, CheckoutResult, OrderDetail } from '@tea-time/types';
import { formatMoney } from '../lib/format';

function describeCustomizations(selected: OrderDetail['items'][number]['selected_customizations']) {
  return selected.map((item) => `${item.group_name}: ${item.option_name}`).join(' · ');
}

interface Props {
  session: boolean;
  cart: CartResponse | null;
  addresses: Address[];
  selectedAddressId: string;
  orderNotes: string;
  checkoutResult: CheckoutResult | null;
  selectedOrder: OrderDetail | null;
  orderMessage: string;
  paymentMessage: string;
  onCartQuantity: (itemId: string, quantity: number) => void;
  onCartDelete: (itemId: string) => void;
  onAddressSelect: (addressId: string) => void;
  onNotesChange: (value: string) => void;
  onCheckout: () => void;
  onPaymentLaunch: () => void;
}

export function CartSection({
  session,
  cart,
  addresses,
  selectedAddressId,
  orderNotes,
  checkoutResult,
  selectedOrder,
  orderMessage,
  paymentMessage,
  onCartQuantity,
  onCartDelete,
  onAddressSelect,
  onNotesChange,
  onCheckout,
  onPaymentLaunch,
}: Props) {
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? null;
  const canCheckout = Boolean(session && cart?.items.length && selectedAddress && !checkoutResult);
  const canPay = Boolean(session && checkoutResult && selectedOrder?.payment_status !== 'paid');

  return (
    <section className="container customer-grid wide fade-up" id="cart">
      {/* Cart items */}
      <section className="panel">
        <div className="section-head compact">
          <div>
            <span className="eyebrow">Cart</span>
            <h2>Review the cart before checkout.</h2>
          </div>
        </div>
        {cart && cart.items.length ? (
          <div className="list-stack">
            {cart.items.map((item) => (
              <article key={item.id} className="list-card">
                <div className="cart-line">
                  <div className="thumb-wrap">
                    {item.images[0] ? (
                      <img src={item.images[0]} alt={item.product_name} />
                    ) : null}
                  </div>
                  <div>
                    <strong>{item.product_name}</strong>
                    {item.selected_customizations.length ? (
                      <p className="cart-customizations">{describeCustomizations(item.selected_customizations)}</p>
                    ) : null}
                    <p>
                      {formatMoney(item.unit_price)} each · {formatMoney(item.line_total)}
                    </p>
                  </div>
                </div>
                <div className="cart-actions">
                  <button
                    type="button"
                    onClick={() => onCartQuantity(item.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onCartQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    className="ghost-inline danger"
                    type="button"
                    onClick={() => onCartDelete(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="helper-copy">Your cart is empty. Add products from the catalog first.</p>
        )}
      </section>

      {/* Checkout summary */}
      <section className="panel">
        <div className="section-head compact">
          <div>
            <span className="eyebrow">Checkout</span>
            <h2>Create order, then launch payment.</h2>
          </div>
        </div>
        <div className="summary-card">
          <div>
            <span>Cart total</span>
            <strong>{formatMoney(cart?.total_amount ?? 0)}</strong>
          </div>
          <div>
            <span>Latest order</span>
            <strong>{checkoutResult?.order_number ?? 'Not created yet'}</strong>
          </div>
        </div>
        <label className="checkout-field">
          <span>Delivery address</span>
          <select
            value={selectedAddressId}
            onChange={(event) => onAddressSelect(event.target.value)}
            disabled={!session || !addresses.length}
          >
            <option value="">Select an address</option>
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.full_name} · {address.city} · {address.phone}
              </option>
            ))}
          </select>
        </label>
        <label className="checkout-field">
          <span>Order notes</span>
          <textarea
            rows={4}
            value={orderNotes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Add delivery instructions, preferred timing, or special requests."
            disabled={!session}
          />
        </label>
        {selectedAddress ? (
          <p className="helper-copy">
            Delivery to {selectedAddress.full_name}, {selectedAddress.line_1}
            {selectedAddress.line_2 ? `, ${selectedAddress.line_2}` : ''}, {selectedAddress.city}
          </p>
        ) : (
          <p className="helper-copy">
            Select a delivery address before creating the order.
          </p>
        )}
        <div className="stack-actions">
          <button className="solid-button" type="button" onClick={onCheckout} disabled={!canCheckout}>
            Create order
          </button>
          <button className="outline-button" type="button" onClick={onPaymentLaunch} disabled={!canPay}>
            Pay with Razorpay
          </button>
          {checkoutResult ? (
            <a className="ghost-button" href="#orders">
              Review latest order
            </a>
          ) : null}
        </div>
        {orderMessage ? <p className="form-message">{orderMessage}</p> : null}
        {paymentMessage ? <p className="form-message">{paymentMessage}</p> : null}
        {!session ? <p className="helper-copy">Sign in to create orders and launch payment.</p> : null}
        {selectedOrder ? (
          <article className="detail-card">
            <div className="list-title-row">
              <strong>{selectedOrder.order_number}</strong>
              <span className="status-pill">{selectedOrder.payment_status}</span>
            </div>
            <p>
              {selectedOrder.status} · {formatMoney(selectedOrder.total_amount, selectedOrder.currency)}
            </p>
            {selectedOrder.notes ? <p className="helper-copy">Notes: {selectedOrder.notes}</p> : null}
                <div className="mini-list">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="mini-row">
                      <span>
                        {item.product_name} x {item.quantity}
                        {item.selected_customizations.length ? ` · ${describeCustomizations(item.selected_customizations)}` : ''}
                      </span>
                      <strong>{formatMoney(item.line_total, selectedOrder.currency)}</strong>
                    </div>
                  ))}
            </div>
          </article>
        ) : null}
      </section>
    </section>
  );
}
