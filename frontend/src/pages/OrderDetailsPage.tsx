
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Copy, Clock, Package, Truck,
  CheckCircle, MapPin, Star, Share2, RefreshCw,
  HelpCircle, Map as MapIcon, Camera, Coffee,
  Download, Instagram, Facebook, Send, Navigation
} from 'lucide-react';
import { useGetOrderByIdQuery } from '../features/orders/ordersApi';
import { OrderStatus } from '../types';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { addItem } from '../features/cart/cartSlice';
import { TeaLoader } from '../components/common/TeaLoader';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setAuthModalOpen } from '../features/auth/authSlice';

const OrderDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, error } = useGetOrderByIdQuery(id || '');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const dispatch = useDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const appDispatch = useAppDispatch(); // Use typed dispatch for auth actions if needed

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl text-center">
          <h2 className="text-2xl font-serif font-bold text-tea-900 mb-4">Authentication Required</h2>
          <button
            onClick={() => appDispatch(setAuthModalOpen(true))}
            className="px-8 py-3 bg-tea-800 text-white rounded-2xl font-bold"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <TeaLoader type="kettle" size="fullscreen" message="Pouring your journey details..." />;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center mx-auto bg-white p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
          <h2 className="text-3xl font-serif font-bold text-tea-900 mb-4">Order Not Found</h2>
          <p className="text-gray-500 mb-8 font-light leading-relaxed">This journey hasn't been mapped in our archives yet.</p>
          <Link to="/orders" className="inline-block px-10 py-4 bg-tea-700 text-white font-bold rounded-2xl shadow-lg hover:bg-tea-800 transition-all">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!', {
      style: { borderRadius: '10px', background: '#2E7D32', color: '#fff' }
    });
  };

  const handleReorderAll = () => {
    order.items.forEach(item => dispatch(addItem({ product: item, quantity: item.quantity })));
    toast.success('All items added to cart!', { icon: '🛒' });
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PLACED: return 'bg-blue-500';
      case OrderStatus.CONFIRMED: return 'bg-teal-500';
      case OrderStatus.PROCESSING: return 'bg-amber-500';
      case OrderStatus.SHIPPED: return 'bg-indigo-500';
      case OrderStatus.OUT_FOR_DELIVERY: return 'bg-purple-500';
      case OrderStatus.DELIVERED: return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const showLiveTracking = order.status === OrderStatus.OUT_FOR_DELIVERY || order.status === OrderStatus.SHIPPED;

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <Link to="/orders" className="inline-flex items-center text-tea-700 font-bold mb-4 hover:underline group">
              <ChevronLeft className="mr-1 w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              My Tea Journeys
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-tea-900 tracking-tight">
                {order.orderNumber}
              </h1>
              <button
                onClick={() => handleCopyToClipboard(order.orderNumber)}
                className="p-1.5 text-gray-400 hover:text-tea-700 hover:bg-tea-50 rounded-lg transition-all"
                title="Copy order number"
              >
                <Copy size={16} />
              </button>
            </div>
            <p className="text-gray-500 font-medium italic">Dispatched on {order.date}</p>
          </div>

          <div className="flex items-center gap-3">
            {showLiveTracking && (
              <button
                onClick={() => navigate(`/tracking/${order.id}`)}
                className="px-6 py-2 bg-tea-800 text-white font-bold text-xs uppercase tracking-widest rounded-full shadow-lg hover:bg-tea-950 transition-all flex items-center gap-2"
              >
                <Navigation size={14} className="animate-pulse" /> Track Live
              </button>
            )}
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`px-6 py-2 rounded-full text-white font-bold text-xs uppercase tracking-widest shadow-lg ${getStatusColor(order.status)}`}
            >
              {order.status}
            </motion.div>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-3 bg-white border border-gray-200 text-gray-400 hover:text-tea-700 rounded-2xl shadow-sm transition-all"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column (70%) */}
          <div className="lg:col-span-8 space-y-8">

            {/* Visual Timeline */}
            <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
              <h3 className="text-xl font-serif font-bold text-tea-900 mb-10 flex items-center gap-3">
                <Clock className="text-tea-700" size={24} /> Logistics Architecture
              </h3>

              <div className="relative pl-10 border-l-2 border-gray-100 space-y-12 ml-4">
                {order.timeline.map((event, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative"
                  >
                    <div className={`absolute -left-[51px] top-0 w-6 h-6 rounded-full border-4 border-white shadow-md ${event.isCompleted ? 'bg-tea-600' : 'bg-gray-200'
                      } ${order.status === event.status ? 'ring-4 ring-tea-100 animate-pulse' : ''}`} />

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                      <div>
                        <h4 className={`font-bold uppercase tracking-widest text-[10px] mb-1 ${event.isCompleted ? 'text-tea-800' : 'text-gray-400'
                          }`}>{event.status}</h4>
                        <p className="text-sm text-gray-600 font-light max-w-md">{event.description}</p>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-3 py-1 rounded-full whitespace-nowrap border border-gray-100">
                        {event.timestamp}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Live Tracking Map Preview */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="flex justify-between items-center mb-6 px-2">
                <div>
                  <h3 className="text-xl font-serif font-bold text-tea-900 mb-1">Live Tracking</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1 font-bold">
                    <Truck size={12} className="text-tea-600" /> Carrier: {order.carrier}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-tea-700 uppercase tracking-widest mb-1">Est. Arrival</p>
                  <p className="text-xl font-serif font-bold text-tea-900">{order.estimatedDelivery}</p>
                </div>
              </div>

              <div
                onClick={() => navigate(`/tracking/${order.id}`)}
                className="h-80 md:h-[400px] bg-gray-100 rounded-[2rem] relative overflow-hidden group border border-gray-50 cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1500"
                  alt="Map"
                  className="w-full h-full object-cover opacity-60 grayscale scale-110 group-hover:scale-100 transition-transform duration-1000"
                />

                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all" />

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="px-8 py-3 bg-tea-800 text-white rounded-full font-bold shadow-2xl flex items-center gap-2">
                    <Navigation size={18} /> Enter Live Tracking
                  </div>
                </div>

                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 2, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-accent-500 rounded-full blur-2xl"
                    />
                    <div className="relative bg-white p-4 rounded-full shadow-2xl ring-4 ring-accent-500 text-tea-900">
                      <MapPin size={28} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Order Items List */}
            <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
              <h3 className="text-xl font-serif font-bold text-tea-900 mb-10 flex items-center gap-3">
                <Package className="text-tea-700" size={24} /> Your Sanctuary Collection
              </h3>

              <div className="divide-y divide-gray-100">
                {order.items.map((item, idx) => (
                  <div key={item.id} className="flex flex-col md:flex-row gap-8 items-center py-8 first:pt-0 last:pb-0">
                    <div className="w-32 h-32 rounded-3xl overflow-hidden bg-gray-50 flex-shrink-0 shadow-md">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow space-y-3 w-full">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xl font-serif font-bold text-tea-900">{item.name}</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.origin} • {item.category}</p>
                        </div>
                        <span className="font-bold text-tea-800 text-xl">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>

                      {order.status === OrderStatus.DELIVERED && (
                        <div className="flex items-center gap-8 pt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ritual Rating:</span>
                            <div className="flex text-accent-500">
                              {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} className="cursor-pointer hover:scale-125 transition-transform" />)}
                            </div>
                          </div>
                          <button onClick={() => dispatch(addItem({ product: item, quantity: 1 }))} className="text-[10px] text-tea-700 font-bold uppercase tracking-widest hover:underline flex items-center gap-1.5">
                            <RefreshCw size={12} /> Buy Again
                          </button>
                        </div>
                      )}

                      <div className="pt-2">
                        <span className="text-sm text-gray-500 font-medium">Allocation: <span className="font-bold text-tea-900">{item.quantity} units</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column (30%) - Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-24 space-y-8">
              <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
                <h3 className="text-xl font-serif font-bold text-tea-900 mb-8">Summary of Haven</h3>
                <div className="space-y-4 mb-10">
                  <div className="flex justify-between text-gray-500 text-sm font-medium">
                    <span>Artifact Subtotal</span>
                    <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-sm font-medium">
                    <span>Curation & Transit</span>
                    <span className="text-tea-600 font-bold text-[10px] uppercase tracking-widest">Complimentary</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-sm font-medium">
                    <span>Tax (VAT)</span>
                    <span className="text-gray-900">${order.tax.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-gray-50 my-6" />
                  <div className="flex justify-between text-3xl font-serif font-bold text-tea-900">
                    <span>Final</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleReorderAll}
                    className="w-full py-5 bg-tea-700 hover:bg-tea-800 text-white font-bold rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                  >
                    <RefreshCw size={18} />
                    Infinite Loop Reorder
                  </button>
                  <button className="w-full py-4 bg-white border border-gray-200 text-tea-900 font-bold rounded-2xl transition-all hover:bg-gray-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                    <HelpCircle size={18} className="text-gray-300" />
                    Sanctuary Support
                  </button>
                </div>
              </section>

              <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
                <h3 className="text-xl font-serif font-bold text-tea-900 mb-8 flex items-center gap-3">
                  <MapPin className="text-tea-700" size={20} /> Destination Coordinates
                </h3>
                <div className="space-y-6">
                  <div className="p-4 bg-cream/50 rounded-2xl border border-tea-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Primary Sanctuary</p>
                    <p className="text-sm text-tea-900 leading-relaxed font-medium">{order.deliveryAddress}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Delivery Instructions</p>
                    <p className="text-xs text-gray-600 italic">"{order.deliveryInstructions || 'Leave at door.'}"</p>
                  </div>
                  <div className="pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Digital Signature</p>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-bold text-tea-900 uppercase">{order.carrier}</span>
                      <span className="text-[10px] font-mono text-gray-400">{order.trackingNumber}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-gradient-to-br from-tea-900 to-teal-950 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <Coffee size={40} className="text-accent-400/30 mb-6" />
                <h4 className="font-serif font-bold text-2xl mb-4 leading-tight">Artisanal Brewing Monograph</h4>
                <p className="text-sm text-tea-100/70 font-light leading-relaxed mb-6 italic">
                  "For these specific flushes, we recommend a 30-second pre-rinse with lukewarm water to awaken the cellular memory of the leaves."
                </p>
                <button className="text-[10px] font-bold uppercase tracking-widest text-accent-400 flex items-center gap-2 hover:gap-3 transition-all underline decoration-accent-500/20">
                  View Complete Guide <ChevronLeft size={14} className="rotate-180" />
                </button>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
