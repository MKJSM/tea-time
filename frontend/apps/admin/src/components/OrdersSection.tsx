import type { OrderDetail, OrderSummary, PaymentDetailResponse, PaymentRecord } from '@tea-time/types';
import { formatDate, formatMoney } from '../lib/format';

function describeCustomizations(selected: OrderDetail['items'][number]['selected_customizations']) {
  return selected.map((item) => `${item.group_name}: ${item.option_name}`).join(' · ');
}

interface OrdersProps {
  orders?: OrderSummary[];
  selectedOrder?: OrderDetail | null;
  onChangeOrderStatus?: (id: string, status: string) => void;
  onOpenOrder?: (id: string) => void;
  variant?: 'list' | 'view';
}

export function OrdersSection({
  orders = [],
  selectedOrder,
  onChangeOrderStatus,
  onOpenOrder,
  variant = 'list',
}: OrdersProps) {
  if (variant === 'view' && selectedOrder) {
    return (
      <article className="detail-panel">
        <h3>{selectedOrder.order_number}</h3>
        <p>
          {selectedOrder.status} · {selectedOrder.payment_status}
        </p>
        <div className="detail-list">
          {selectedOrder.items.map((item) => (
            <div key={item.id} className="detail-row">
              <span>
                {item.product_name} x {item.quantity}
                {item.selected_customizations.length ? ` · ${describeCustomizations(item.selected_customizations)}` : ''}
              </span>
              <strong>{formatMoney(item.line_total, selectedOrder.currency)}</strong>
            </div>
          ))}
        </div>
      </article>
    );
  }
  return (
    <article className="admin-card" id="admin-orders">
      <div className="section-card-head">
        <div>
          <p className="section-kicker">Orders</p>
          <h2>Orders</h2>
          <p className="section-copy">
            Track fulfillment status and customer payments.
          </p>
        </div>
      </div>
      <div className="admin-list">
        {orders.map((order) => (
          <article key={order.id} className="admin-list-item">
            <div>
              <strong>{order.order_number}</strong>
              <span>
                {formatMoney(order.total_amount, order.currency)} · {order.payment_status}
              </span>
            </div>
            <div className="row-actions">
              <select
                onChange={(e) => onChangeOrderStatus?.(order.id, e.target.value)}
                value={order.status}
              >
                <option value="placed">Placed</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
              <button type="button" onClick={() => onOpenOrder?.(order.id)}>
                View
              </button>
            </div>
          </article>
        ))}
      </div>
    </article>
  );
}

interface PaymentsProps {
  payments?: PaymentRecord[];
  selectedPayment?: PaymentDetailResponse | null;
  onOpenPayment?: (id: string) => void;
  variant?: 'list' | 'view';
}

export function PaymentsSection({
  payments = [],
  selectedPayment,
  onOpenPayment,
  variant = 'list'
}: PaymentsProps) {
  if (variant === 'view' && selectedPayment) {
    return (
      <article className="detail-panel">
        <h3>{selectedPayment.item.provider}</h3>
        <p>
          {selectedPayment.item.status} · Paid on {formatDate(selectedPayment.item.paid_on)}
        </p>
        <div className="detail-list">
          {selectedPayment.events.map((event) => (
            <div key={event.id} className="detail-event">
              <strong>{event.event_type}</strong>
              <span>{formatDate(event.created_on)}</span>
              <code>{event.payload_json.slice(0, 180)}</code>
            </div>
          ))}
        </div>
      </article>
    );
  }
  return (
    <article className="admin-card" id="admin-payments">
      <div className="section-card-head">
        <div>
          <p className="section-kicker">Payments</p>
          <h2>Payments</h2>
          <p className="section-copy">
            Audit raw provider events and transaction trails.
          </p>
        </div>
      </div>
      <div className="admin-list">
        {payments.map((payment) => (
          <article key={payment.id} className="admin-list-item">
            <div>
              <strong>
                {payment.provider_payment_id ?? payment.provider_order_id ?? payment.id}
              </strong>
              <span>
                {formatMoney(payment.amount, payment.currency)} · {payment.status}
              </span>
            </div>
            <button type="button" onClick={() => onOpenPayment?.(payment.id)}>
              Watch
            </button>
          </article>
        ))}
      </div>
    </article>
  );
}
