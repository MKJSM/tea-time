
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
   ChevronLeft, Truck, MapPin, Navigation,
   Phone, MessageSquare, Clock, ShieldCheck,
   Edit3, Share2, Info, CheckCircle2, Cloud,
   Zap, AlertCircle
} from 'lucide-react';
import { useGetOrderByIdQuery } from '../features/orders/ordersApi';
import { TeaLoader } from '../components/common/TeaLoader';
import { OrderStatus } from '../types';
import toast from 'react-hot-toast';

const OrderTrackingPage: React.FC = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const { data: order, isLoading, error } = useGetOrderByIdQuery(id || '');
   const [activeTab, setActiveTab] = useState<'tracking' | 'management'>('tracking');
   const [vehiclePos, setVehiclePos] = useState({ x: 10, y: 70 });
   const [stopsRemaining, setStopsRemaining] = useState(3);

   // Simulation effect for vehicle movement
   useEffect(() => {
      if (order?.status === OrderStatus.OUT_FOR_DELIVERY) {
         const interval = setInterval(() => {
            setVehiclePos(prev => {
               const nextX = prev.x + 0.1;
               if (nextX > 90) return { x: 10, y: 70 }; // loop for demo
               return { ...prev, x: nextX };
            });
         }, 500);
         return () => clearInterval(interval);
      }
   }, [order?.status]);

   if (isLoading) return <TeaLoader type="kettle" size="fullscreen" message="Synchronizing with delivery satellites..." />;
   if (error || !order) return (
      <div className="min-h-screen flex items-center justify-center p-6">
         <div className="text-center bg-white p-12 rounded-[2.5rem] shadow-xl border border-gray-100 max-w-md">
            <AlertCircle size={48} className="mx-auto text-red-400 mb-6" />
            <h2 className="text-2xl font-serif font-bold text-tea-900 mb-2">Tracking Interrupted</h2>
            <p className="text-gray-500 mb-8">This tea journey hasn't been mapped in our live tracking system yet.</p>
            <Link to="/orders" className="px-10 py-4 bg-tea-700 text-white font-bold rounded-2xl">Back to Orders</Link>
         </div>
      </div>
   );

   const isDelivered = order.status === OrderStatus.DELIVERED;

   return (
      <div className="min-h-screen bg-white md:bg-cream flex flex-col md:flex-row overflow-hidden relative">
         {/* Top Banner - Mobile Only */}
         <div className="md:hidden fixed top-0 left-0 right-0 z-[60] p-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center">
            <button onClick={() => navigate(-1)} className="p-2 text-tea-900"><ChevronLeft size={24} /></button>
            <div className="text-center">
               <p className="text-[10px] font-bold text-tea-700 uppercase tracking-widest">{order.orderNumber}</p>
               <p className="text-xs font-bold text-gray-900">{isDelivered ? 'Arrived Safe' : `Arriving in ${order.tracking?.etaMinutes || '--'} mins`}</p>
            </div>
            <button onClick={() => toast.success('Tracking link copied!')} className="p-2 text-tea-900"><Share2 size={20} /></button>
         </div>

         {/* Main Map Viewport */}
         <div className="flex-grow h-[55vh] md:h-screen relative bg-[#F9F7F3] overflow-hidden">
            {/* Mock Map Background */}
            <div className="absolute inset-0 z-0">
               <svg className="w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,20 Q50,40 100,20" fill="none" stroke="#D1D5DB" strokeWidth="0.5" />
                  <path d="M0,50 Q50,70 100,50" fill="none" stroke="#D1D5DB" strokeWidth="0.5" />
                  <path d="M0,80 Q50,90 100,80" fill="none" stroke="#D1D5DB" strokeWidth="0.5" />
                  <path d="M20,0 Q40,50 20,100" fill="none" stroke="#D1D5DB" strokeWidth="0.5" />
                  <path d="M50,0 Q70,50 50,100" fill="none" stroke="#D1D5DB" strokeWidth="0.5" />
                  <path d="M80,0 Q90,50 80,100" fill="none" stroke="#D1D5DB" strokeWidth="0.5" />
               </svg>

               {/* Destination Landmark */}
               <div className="absolute right-[15%] top-[25%] transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                     <motion.div
                        animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                        className="absolute inset-0 bg-tea-600 rounded-full blur-xl"
                     />
                     <div className="relative bg-white p-3 rounded-full shadow-2xl border-2 border-tea-600">
                        <MapPin className="text-tea-700" size={24} />
                     </div>
                     <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                        <p className="text-[10px] font-bold text-tea-900">Your Sanctuary</p>
                     </div>
                  </div>
               </div>

               {/* Animated Delivery Route */}
               {!isDelivered && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                     <motion.path
                        d="M 10 70 Q 50 40 85 25"
                        fill="none"
                        stroke="#2E7D32"
                        strokeWidth="0.8"
                        strokeDasharray="2,2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                     />
                  </svg>
               )}

               {/* Animated Vehicle */}
               {!isDelivered && (
                  <motion.div
                     style={{ left: `${vehiclePos.x}%`, top: `${vehiclePos.y}%` }}
                     className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  >
                     <div className="relative">
                        <motion.div
                           animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                           transition={{ repeat: Infinity, duration: 1.5 }}
                           className="absolute -inset-4 bg-tea-500 rounded-full blur-md"
                        />
                        <div className="bg-tea-800 p-3 rounded-full shadow-2xl border-2 border-white text-white">
                           <Truck size={20} />
                        </div>
                     </div>
                  </motion.div>
               )}

               {/* Delivered State Visual */}
               {isDelivered && order.deliveryProof && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[2px]">
                     <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-2 rounded-[2.5rem] shadow-2xl max-w-sm overflow-hidden"
                     >
                        <img src={order.deliveryProof.photo} className="w-full h-48 object-cover rounded-[2rem]" alt="Delivery Proof" />
                        <div className="p-4 text-center">
                           <p className="text-xs font-bold text-tea-700 uppercase tracking-widest mb-1">Package Delivered</p>
                           <p className="text-lg font-serif font-bold text-tea-900 italic">"Tea has arrived at your porch"</p>
                        </div>
                     </motion.div>
                  </div>
               )}
            </div>

            {/* Map Overlays: Traffic & Weather */}
            <div className="absolute top-20 md:top-10 left-6 z-20 space-y-3 hidden sm:block">
               <div className="bg-white/90 backdrop-blur p-3 rounded-2xl shadow-sm border border-white flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Cloud size={18} /></div>
                  <div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase">Weather</p>
                     <p className="text-xs font-bold text-gray-900">{order.tracking?.weather || 'Clear'}</p>
                  </div>
               </div>
               <div className="bg-white/90 backdrop-blur p-3 rounded-2xl shadow-sm border border-white flex items-center gap-3">
                  <div className="p-2 bg-tea-50 text-tea-600 rounded-xl"><Zap size={18} /></div>
                  <div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase">Traffic</p>
                     <p className="text-xs font-bold text-gray-900">{order.tracking?.traffic || 'Light'} Conditions</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Bottom Sheet Detail Panel */}
         <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 md:relative md:w-[450px] lg:w-[500px] h-[50vh] md:h-screen bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.1)] md:shadow-none z-[70] rounded-t-[3rem] md:rounded-none flex flex-col"
         >
            {/* Header/Grabber */}
            <div className="md:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4 shrink-0" />

            {/* Content Tabs */}
            <div className="flex px-6 border-b border-gray-100 shrink-0">
               <button
                  onClick={() => setActiveTab('tracking')}
                  className={`flex-1 py-5 text-sm font-bold tracking-widest uppercase transition-all border-b-2 ${activeTab === 'tracking' ? 'border-tea-800 text-tea-900' : 'border-transparent text-gray-400'
                     }`}
               >Tracking</button>
               <button
                  onClick={() => setActiveTab('management')}
                  className={`flex-1 py-5 text-sm font-bold tracking-widest uppercase transition-all border-b-2 ${activeTab === 'management' ? 'border-tea-800 text-tea-900' : 'border-transparent text-gray-400'
                     }`}
               >Manage</button>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-8">
               <AnimatePresence mode="wait">
                  {activeTab === 'tracking' ? (
                     <motion.div
                        key="tracking"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                     >
                        {/* Status Banner */}
                        <div className="bg-tea-50 p-6 rounded-[2rem] border border-tea-100">
                           <div className="flex justify-between items-start mb-4">
                              <div className="bg-tea-800 p-2 text-white rounded-lg shadow-lg">
                                 <Truck size={20} />
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-bold text-tea-700 uppercase tracking-widest">Est. Arrival</p>
                                 <p className="text-2xl font-serif font-bold text-tea-900">{isDelivered ? 'Delivered' : order.estimatedDelivery}</p>
                              </div>
                           </div>
                           {!isDelivered && (
                              <div className="flex items-center gap-2">
                                 <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-2 h-2 bg-tea-600 rounded-full"
                                 />
                                 <p className="text-sm text-tea-900 font-medium">Currently {order.tracking?.stopsAway || '0'} stops away from you.</p>
                              </div>
                           )}
                        </div>

                        {/* Delivery Person Profile */}
                        <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-2xl">
                           <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                              <img src={order.deliveryPerson?.photo} className="w-full h-full object-cover" alt="Driver" />
                           </div>
                           <div className="flex-grow">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Tea Courier</p>
                              <h4 className="text-lg font-serif font-bold text-tea-900">{order.deliveryPerson?.name}</h4>
                              <div className="flex items-center gap-1 text-accent-600 text-sm font-bold">
                                 <span>★</span> {order.deliveryPerson?.rating.toFixed(1)}
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button className="p-3 bg-white text-tea-700 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 border border-gray-100"><Phone size={18} /></button>
                              <button className="p-3 bg-white text-tea-700 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 border border-gray-100"><MessageSquare size={18} /></button>
                           </div>
                        </div>

                        {/* Journey Timeline */}
                        <div className="space-y-6">
                           <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Journey Log</h5>
                           <div className="space-y-8 pl-4 border-l border-gray-100 relative">
                              {order.timeline.slice().reverse().map((event, idx) => (
                                 <div key={idx} className="relative">
                                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${idx === 0 ? 'bg-tea-600 ring-4 ring-tea-50' : 'bg-gray-300'
                                       }`} />
                                    <div className="flex justify-between items-start mb-1">
                                       <h6 className={`font-bold text-sm ${idx === 0 ? 'text-tea-900' : 'text-gray-400'}`}>{event.status}</h6>
                                       <span className="text-[10px] text-gray-400 font-mono">{event.timestamp}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-light leading-relaxed">{event.description}</p>
                                    {event.location && (
                                       <div className="flex items-center gap-1 text-[9px] font-bold text-tea-600 uppercase mt-2">
                                          <Navigation size={10} /> {event.location}
                                       </div>
                                    )}
                                 </div>
                              ))}
                           </div>
                        </div>
                     </motion.div>
                  ) : (
                     <motion.div
                        key="management"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8"
                     >
                        {/* Management Options */}
                        <div className="space-y-4">
                           <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Instructions</h5>
                           <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm group">
                              <div className="flex justify-between items-start mb-4">
                                 <p className="text-sm text-tea-900 italic">"{order.deliveryInstructions || 'No specific instructions provided.'}"</p>
                                 <button className="text-tea-700 p-2 hover:bg-tea-50 rounded-lg transition-colors"><Edit3 size={16} /></button>
                              </div>
                              <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                                 <ShieldCheck className="text-tea-600" size={18} />
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Safe Drop: Porch (Enabled)</p>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                           <button className="w-full p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                 <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock size={20} /></div>
                                 <div className="text-left">
                                    <p className="font-bold text-tea-900">Reschedule Delivery</p>
                                    <p className="text-[10px] text-gray-400 uppercase">Modify time or date</p>
                                 </div>
                              </div>
                              <ChevronLeft size={18} className="rotate-180 text-gray-300 group-hover:text-tea-700 transition-colors" />
                           </button>
                           <button className="w-full p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                 <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><MapPin size={20} /></div>
                                 <div className="text-left">
                                    <p className="font-bold text-tea-900">Hold at Location</p>
                                    <p className="text-[10px] text-gray-400 uppercase">Pickup from Kyoto Central</p>
                                 </div>
                              </div>
                              <ChevronLeft size={18} className="rotate-180 text-gray-300 group-hover:text-tea-700 transition-colors" />
                           </button>
                        </div>

                        <div className="p-6 bg-gray-50 rounded-[2rem] text-center border border-dashed border-gray-200">
                           <Info size={24} className="mx-auto text-gray-300 mb-4" />
                           <h6 className="font-bold text-tea-900 mb-2">Need Live Support?</h6>
                           <p className="text-xs text-gray-500 font-light mb-6">Our ritual coordinators are standing by to assist with complex delivery logistics.</p>
                           <button className="px-8 py-3 bg-white border border-gray-200 text-tea-800 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-sm">Start Chat</button>
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>

            {/* Footer/CTA Area */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 mt-auto hidden md:block">
               <div className="flex items-center justify-between">
                  <div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tracking Number</p>
                     <p className="text-sm font-mono font-bold text-tea-900">{order.trackingNumber}</p>
                  </div>
                  <div className="flex gap-3">
                     <button className="px-4 py-2 bg-tea-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg">Copy Link</button>
                     <button className="px-4 py-2 bg-white border border-gray-200 text-tea-700 font-bold text-[10px] uppercase tracking-widest rounded-lg">Carrier Site</button>
                  </div>
               </div>
            </div>
         </motion.div>

         {/* Mobile Back Button - Float */}
         <button
            onClick={() => navigate(-1)}
            className="hidden md:flex fixed top-10 left-10 z-[100] w-12 h-12 bg-white rounded-full items-center justify-center shadow-xl hover:scale-110 transition-transform text-tea-900 border border-gray-100"
         >
            <ChevronLeft size={24} />
         </button>
      </div>
   );
};

export default OrderTrackingPage;
