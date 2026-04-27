import type { OrderDetail, OrderSummary } from '@tea-time/types';
import { formatDate, formatMoney } from '../lib/format';

function describeCustomizations(selected: OrderDetail['items'][number]['selected_customizations']) {
  return selected.map((item) => `${item.group_name}: ${item.option_name}`).join(' · ');
}

interface Props {
  orders: OrderSummary[];
  selectedOrder: OrderDetail | null;
  onOrderOpen: (orderId: string) => void;
}

export function OrdersSection({ orders, selectedOrder, onOrderOpen }: Props) {
  return (
    <section className="container stacked-section" id="orders">
      <div className="section-head">
        <div>
          <span className="eyebrow">Orders</span>
          <h2>Placed orders and payment status.</h2>
        </div>
        <p>Reopen any order to inspect the delivery address, item snapshot, and payment state.</p>
      </div>
      <div className="order-grid">
        <div className="list-stack">
          {orders.length ? (
            orders.map((order) => (
              <article key={order.id} className="list-card">
                <div className="list-title-row">
                  <strong>{order.order_number}</strong>
                  <span className="status-pill">{order.payment_status}</span>
                </div>
                <p>
                  {formatMoney(order.total_amount, order.currency)} · {order.status}
                </p>
                <p>{formatDate(order.placed_on)}</p>
                <button
                  className="outline-button"
                  type="button"
                  onClick={() => onOrderOpen(order.id)}
                >
                  View details
                </button>
              </article>
            ))
          ) : (
            <p className="helper-copy">No orders yet.</p>
          )}
        </div>
        <div className="panel">
          {selectedOrder ? (
            <>
              <div className="list-title-row">
                <strong>{selectedOrder.order_number}</strong>
                <span className="status-pill">{selectedOrder.status}</span>
              </div>
              <p className="helper-copy">
                {selectedOrder.payment_status === 'paid'
                  ? 'Payment complete.'
                  : 'Payment pending.'}
              </p>
              <p>
                {selectedOrder.address.full_name} · {selectedOrder.address.phone}
              </p>
              <p>
                {selectedOrder.address.line_1}
                {selectedOrder.address.line_2 ? `, ${selectedOrder.address.line_2}` : ''},{' '}
                {selectedOrder.address.city}, {selectedOrder.address.state}
              </p>
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
            </>
          ) : (
            <p className="helper-copy">Select an order to inspect its details.</p>
          )}
        </div>
      </div>
    </section>
  );
}
