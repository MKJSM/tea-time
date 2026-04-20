import type { Address, CartResponse, CheckoutResult, OrderDetail } from '@tea-time/types';
import { formatMoney } from '../lib/format';

interface Props {
  session: boolean;
  cart: CartResponse | null;
  addresses: Address[];
  checkoutResult: CheckoutResult | null;
  selectedOrder: OrderDetail | null;
  orderMessage: string;
  paymentMessage: string;
  onCartQuantity: (itemId: string, quantity: number) => void;
  onCartDelete: (itemId: string) => void;
  onCheckout: () => void;
  onPaymentLaunch: () => void;
}

export function CartSection({
  session,
  cart,
  addresses,
  checkoutResult,
  selectedOrder,
  orderMessage,
  paymentMessage,
  onCartQuantity,
  onCartDelete,
  onCheckout,
  onPaymentLaunch,
}: Props) {
  const defaultAddress = addresses.find((a) => a.is_default) ?? null;

  return (
    <section className="container customer-grid wide" id="cart">
      {/* Cart items */}
      <section className="panel">
        <div className="section-head compact">
          <div>
            <span className="eyebrow">Cart</span>
            <h2>Review the cart before checkout.</h2>
          </div>
        </div>
        {session ? (
          cart && cart.items.length ? (
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
            <p className="helper-copy">Your cart is empty. Add products from the menu first.</p>
          )
        ) : (
          <p className="helper-copy">Login to keep a cart and move into checkout.</p>
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
            <span>Default address</span>
            <strong>{defaultAddress?.city ?? 'Not selected'}</strong>
          </div>
          <div>
            <span>Latest order</span>
            <strong>{checkoutResult?.order_number ?? 'Not created yet'}</strong>
          </div>
        </div>
        <div className="stack-actions">
          <button className="solid-button" type="button" onClick={onCheckout}>
            Create order
          </button>
          <button className="outline-button" type="button" onClick={onPaymentLaunch}>
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
        {selectedOrder ? (
          <article className="detail-card">
            <div className="list-title-row">
              <strong>{selectedOrder.order_number}</strong>
              <span className="status-pill">{selectedOrder.payment_status}</span>
            </div>
            <p>
              {selectedOrder.status} · {formatMoney(selectedOrder.total_amount, selectedOrder.currency)}
            </p>
            <div className="mini-list">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="mini-row">
                  <span>
                    {item.product_name} x {item.quantity}
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
