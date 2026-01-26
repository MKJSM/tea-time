
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, MapPin, ExternalLink, RefreshCw, ChevronRight } from 'lucide-react';
import { OrderStatus } from '../types';

import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setAuthModalOpen } from '../features/auth/authSlice';

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

  const activeOrder = {
    id: 'TH-98421',
    status: OrderStatus.OUT_FOR_DELIVERY,
    date: 'May 12, 2024',
    total: 84.50,
    items: [
      { name: 'Dragon Well Special', qty: 1 },
      { name: 'Bamboo Steamer', qty: 1 }
    ]
  };

  const steps = [
    { label: 'Confirmed', status: 'completed' },
    { label: 'Processing', status: 'completed' },
    { label: 'Shipped', status: 'completed' },
    { label: 'Out for Delivery', status: 'active' },
    { label: 'Delivered', status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-tea-900 mb-10">My Orders</h1>

        {/* Active Order Card */}
        <Link to={`/order/${activeOrder.id}`} className="block group">
          <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden mb-12 border border-tea-100 transition-all group-hover:shadow-2xl group-hover:-translate-y-1">
            <div className="bg-tea-700 p-8 text-white flex justify-between items-start">
              <div>
                <p className="text-tea-200 text-xs font-bold uppercase tracking-widest mb-1">Active Shipment</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-serif font-bold">Order #{activeOrder.id}</h2>
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-tea-200 text-xs font-bold uppercase tracking-widest mb-1">Estimated Arrival</p>
                <h3 className="text-2xl font-bold italic">Today by 6:00 PM</h3>
              </div>
            </div>

            <div className="p-8">
              {/* Live Tracking Map Mock */}
              <div className="w-full h-64 bg-gray-100 rounded-3xl relative overflow-hidden mb-8 border border-gray-100 shadow-inner">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000"
                  alt="Map"
                  className="w-full h-full object-cover opacity-60 grayscale"
                />
                <motion.div
                  animate={{ x: [0, 100, 50], y: [0, -50, -20] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="bg-tea-800 p-2 rounded-full shadow-2xl">
                    <Truck className="text-white w-6 h-6" />
                  </div>
                </motion.div>
                <div className="absolute top-10 right-10">
                  <div className="bg-accent-500 p-2 rounded-full shadow-2xl ring-4 ring-white">
                    <MapPin className="text-tea-900 w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex justify-between relative mb-6">
                <div className="absolute top-4 left-0 right-0 h-1 bg-gray-100 -z-0" />
                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-md ${step.status === 'completed' ? 'bg-tea-600' :
                      step.status === 'active' ? 'bg-accent-500 animate-pulse' : 'bg-gray-200'
                      }`}>
                      {step.status === 'completed' && <CheckCircle className="text-white w-4 h-4" />}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${step.status === 'active' ? 'text-tea-800' : 'text-gray-400'
                      }`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Link>

        {/* History List */}
        <h2 className="text-2xl font-serif font-bold text-tea-900 mb-6">Past Orders</h2>
        <div className="space-y-4">
          {[
            { id: 'TH-92100', date: 'April 05, 2024', total: 125.99, items: 4 },
            { id: 'TH-88540', date: 'March 18, 2024', total: 42.15, items: 1 },
            { id: 'TH-87421', date: 'February 22, 2024', total: 89.00, items: 3 },
          ].map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-tea-200 transition-colors">
              <Link to={`/order/${order.id}`} className="flex items-center gap-4 flex-grow">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                  <Package />
                </div>
                <div>
                  <h4 className="font-bold text-tea-900 flex items-center gap-2">
                    Order #{order.id}
                    <ExternalLink size={14} className="opacity-40" />
                  </h4>
                  <p className="text-xs text-gray-400">{order.date} • {order.items} Items</p>
                </div>
              </Link>
              <div className="flex items-center gap-6">
                <span className="font-bold text-tea-800 text-lg">₹{order.total.toFixed(2)}</span>
                <button className="px-4 py-2 bg-tea-50 text-tea-700 font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-tea-100 transition-colors">
                  <RefreshCw size={14} /> Reorder
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
