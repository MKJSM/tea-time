import type { OrderDetail, OrderSummary, PaymentDetailResponse, PaymentRecord } from '@tea-time/types';
import { formatDate, formatMoney } from '../lib/format';

interface OrdersProps {
  orders: OrderSummary[];
  selectedOrder: OrderDetail | null;
  onChangeOrderStatus: (id: string, status: string) => void;
  onOpenOrder: (id: string) => void;
}

export function OrdersSection({
  orders,
  selectedOrder,
  onChangeOrderStatus,
  onOpenOrder,
}: OrdersProps) {
  return (
    <article className="admin-card" id="admin-orders">
      <h2>Orders</h2>
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
                onChange={(e) => onChangeOrderStatus(order.id, e.target.value)}
                value={order.status}
              >
                <option value="placed">Placed</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
              <button type="button" onClick={() => onOpenOrder(order.id)}>
                View
              </button>
            </div>
          </article>
        ))}
      </div>

      {selectedOrder ? (
        <article className="detail-panel">
          <h3>{selectedOrder.order_number}</h3>
          <p>
            {selectedOrder.status} · {selectedOrder.payment_status}
          </p>
          {selectedOrder.items.map((item) => (
            <div key={item.id} className="detail-row">
              <span>
                {item.product_name} x {item.quantity}
              </span>
              <strong>{formatMoney(item.line_total, selectedOrder.currency)}</strong>
            </div>
          ))}
        </article>
      ) : null}
    </article>
  );
}

interface PaymentsProps {
  payments: PaymentRecord[];
  selectedPayment: PaymentDetailResponse | null;
  onOpenPayment: (id: string) => void;
}

export function PaymentsSection({ payments, selectedPayment, onOpenPayment }: PaymentsProps) {
  return (
    <article className="admin-card" id="admin-payments">
      <h2>Payments</h2>
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
            <button type="button" onClick={() => onOpenPayment(payment.id)}>
              Watch
            </button>
          </article>
        ))}
      </div>

      {selectedPayment ? (
        <article className="detail-panel">
          <h3>{selectedPayment.item.provider}</h3>
          <p>
            {selectedPayment.item.status} · Paid on {formatDate(selectedPayment.item.paid_on)}
          </p>
          {selectedPayment.events.map((event) => (
            <div key={event.id} className="detail-event">
              <strong>{event.event_type}</strong>
              <span>{formatDate(event.created_on)}</span>
              <code>{event.payload_json.slice(0, 180)}</code>
            </div>
          ))}
        </article>
      ) : null}
    </article>
  );
}
