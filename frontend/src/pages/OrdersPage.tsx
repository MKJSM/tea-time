
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, MapPin, ExternalLink, RefreshCw, ChevronRight } from 'lucide-react';
import { OrderStatus, OrderSummary } from '../types';

import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setAuthModalOpen } from '../features/auth/authSlice';
import { useGetOrdersQuery } from '../features/orders/ordersApi';
import { TeaLoader } from '../components/common/TeaLoader';
import { formatPrice } from '../utils/format';

const OrdersPage: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-lg border border-gray-100">
          <h2 className="text-3xl font-serif font-bold text-tea-900 mb-4">Sign In Required</h2>
          <p className="text-gray-500 mb-8 font-light">Please sign in to view your orders and track your deliveries.</p>
          <button
            onClick={() => dispatch(setAuthModalOpen(true))}
            className="px-10 py-4 bg-tea-800 text-white font-bold rounded-2xl shadow-lg hover:bg-tea-950 transition-all uppercase tracking-widest text-xs"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const { data: orders = [], isLoading, error } = useGetOrdersQuery();

  if (isLoading) {
    return <TeaLoader type="kettle" size="fullscreen" message="Loading your tea journeys..." />;
  }

  // Filter orders
  const activeOrders = orders.filter(
    (order: OrderSummary) => order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED
  );

  const pastOrders = orders.filter(
    (order: OrderSummary) => order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED
  );

  const activeOrder = activeOrders.length > 0 ? activeOrders[0] : null;

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');

  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-tea-900 mb-10">My Orders</h1>

        {/* Active Order Card */}
        {activeOrder && (
          <Link to={`/order/${activeOrder.id}`} className="block group">
            <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden mb-12 border border-tea-100 transition-all group-hover:shadow-2xl group-hover:-translate-y-1">
              <div className="bg-tea-700 p-8 text-white flex justify-between items-start">
                <div>
                  <p className="text-tea-200 text-xs font-bold uppercase tracking-widest mb-1">Active Shipment</p>
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-serif font-bold">Order #{activeOrder.orderNumber}</h2>
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-tea-200 text-xs font-bold uppercase tracking-widest mb-1">Status</p>
                  <h3 className="text-2xl font-bold italic">{capitalize(activeOrder.status)}</h3>
                </div>
              </div>

              <div className="p-8">
                {/* Simplified Active View */}
                <div className="flex items-center gap-4">
                  <div className="bg-tea-50 p-4 rounded-full">
                    <Truck className="text-tea-700 w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-tea-900">Processing order details...</p>
                    <p className="text-sm text-gray-500">Includes {activeOrder.item_count} items</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* History List */}
        <h2 className="text-2xl font-serif font-bold text-tea-900 mb-6">Past Orders</h2>
        {pastOrders.length === 0 && !activeOrder ? (
          <div className="text-center py-12 bg-white rounded-[2rem] shadow-sm">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 italic">No orders found.</p>
            <Link to="/shop" className="text-tea-700 font-bold hover:underline mt-2 inline-block">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pastOrders.map((order: OrderSummary) => (
              <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-tea-200 transition-colors">
                <Link to={`/order/${order.id}`} className="flex items-center gap-4 flex-grow">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                    <Package />
                  </div>
                  <div>
                    <h4 className="font-bold text-tea-900 flex items-center gap-2">
                      Order #{order.orderNumber}
                      <ExternalLink size={14} className="opacity-40" />
                    </h4>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()} • {order.item_count} Items</p>
                  </div>
                </Link>
                <div className="flex items-center gap-6">
                  <span className="font-bold text-tea-800 text-lg">{formatPrice(order.total_amount)}</span>
                  <Link to={`/order/${order.id}`} className="px-4 py-2 bg-tea-50 text-tea-700 font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-tea-100 transition-colors">
                    <RefreshCw size={14} /> View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
