
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../../store';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CreditCard, Truck, CheckCircle, Apple } from 'lucide-react';
import toast from 'react-hot-toast';
import { TeaLoader } from '../components/common/TeaLoader';

const CheckoutPage: React.FC = () => {
  const { total, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    // Simulate payment and processing with specific loader
    setTimeout(() => {
      clearCart();
      setIsProcessing(false);
      toast.success('Order placed successfully!', { icon: '🎉' });
      navigate('/orders');
    }, 4000);
  };

  if (isProcessing) {
    return <TeaLoader type="whisk" size="fullscreen" message="Processing payment and whisking your tea collection..." />;
  }

  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= i ? 'bg-tea-700 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                {step > i ? <CheckCircle size={20} /> : i}
              </div>
              {i < 3 && <div className={`h-1 w-12 rounded-full ${step > i ? 'bg-tea-700' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
            >
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-serif font-bold text-tea-900 mb-6 flex items-center gap-2">
                    <Truck className="text-tea-700" /> Shipping Details
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                      <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-tea-500" placeholder="John Doe" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Street Address</label>
                      <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-tea-500" placeholder="123 Tea Lane" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">City</label>
                      <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-tea-500" placeholder="Kyoto" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Zip Code</label>
                      <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-tea-500" placeholder="600-0001" />
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="w-full mt-8 py-4 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-colors"
                  >Continue to Payment</button>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-serif font-bold text-tea-900 mb-6 flex items-center gap-2">
                    <CreditCard className="text-tea-700" /> Payment Method
                  </h2>
                  <div className="space-y-4">
                    <button className="w-full py-4 bg-black text-white rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-gray-900 transition-colors">
                      <Apple size={20} /> Pay
                    </button>
                    <div className="flex items-center gap-4 my-6">
                      <div className="h-px flex-grow bg-gray-100" />
                      <span className="text-xs text-gray-400 font-bold uppercase">Or use Card</span>
                      <div className="h-px flex-grow bg-gray-100" />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Card Number</label>
                        <input type="password" name="cardNumber" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none" placeholder="0000 0000 0000 0000" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none" placeholder="MM/YY" />
                        <input type="password" name="cvc" className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none" placeholder="CVC" />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="w-full mt-8 py-4 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-colors"
                  >Review Order</button>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-serif font-bold text-tea-900 mb-6 flex items-center gap-2">
                    <CheckCircle className="text-tea-700" /> Final Review
                  </h2>
                  <div className="p-6 bg-tea-50 rounded-2xl border border-tea-100 mb-8">
                    <p className="text-sm text-tea-900/70 mb-2">By placing this order, you agree to our terms of service and the premium nature of the products.</p>
                    <p className="text-sm text-tea-900 font-bold italic">Estimated Delivery: 3-5 Business Days</p>
                  </div>
                  <button
                    onClick={handlePlaceOrder}
                    className="w-full py-5 bg-tea-800 text-white font-bold text-lg rounded-2xl hover:bg-tea-900 transition-all shadow-xl"
                  >Complete Purchase — ₹{(total() * 1.08).toFixed(2)}</button>
                  <button
                    onClick={() => setStep(1)}
                    className="w-full mt-4 py-2 text-tea-700 font-bold text-sm hover:underline"
                  >Edit Shipping Info</button>
                </div>
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-tea-900 text-white rounded-3xl p-8 sticky top-24">
              <h3 className="text-xl font-serif font-bold mb-6">In Your Bag</h3>
              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {useCartStore.getState().items.map(item => (
                  <div key={item.itemKey} className="flex justify-between items-center text-sm">
                    <div className="flex gap-3">
                      <img src={item.image} className="w-12 h-12 object-cover rounded-lg" alt={item.name} />
                      <div>
                        <p className="font-bold line-clamp-1">{item.name}</p>
                        <p className="text-tea-400 text-xs">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-6 border-t border-white/10">
                <div className="flex justify-between text-tea-300">
                  <span>Subtotal</span>
                  <span>₹{total().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-tea-300">
                  <span>VAT (8%)</span>
                  <span>₹{(total() * 0.08).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2">
                  <span>Total</span>
                  <span className="text-accent-400">₹{(total() * 1.08).toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-8 flex items-center gap-2 text-tea-400 text-[10px] uppercase tracking-widest font-bold">
                <ShieldCheck size={14} /> Encrypted Checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
