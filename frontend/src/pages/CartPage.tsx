
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { removeItem, updateQuantity } from '../features/cart/cartSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, Settings2 } from 'lucide-react';

const CartPage: React.FC = () => {
  const { items } = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const total = items.reduce((acc, item) => {
    let unitPrice = item.price;
    if (item.attributes && item.selectedAttributes) {
      item.attributes.forEach(attr => {
        const selectedValue = item.selectedAttributes![attr.id];
        const option = attr.options.find(o => o.value === selectedValue);
        if (option) unitPrice += option.priceAdjustment;
      });
    }
    return acc + unitPrice * item.quantity;
  }, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl text-center max-w-lg border border-gray-100">
          <div className="w-20 h-20 bg-tea-50 text-tea-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={40} />
          </div>
          <h2 className="text-3xl font-serif font-bold text-tea-900 mb-4">Your basket is empty</h2>
          <p className="text-gray-500 mb-10 text-lg">It seems you haven't discovered our exceptional teas yet. Let's start your journey.</p>
          <Link to="/shop" className="inline-flex items-center px-8 py-4 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-all shadow-lg hover:shadow-xl">
            Explore Collection
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  const renderAttributes = (item: any) => {
    if (!item.selectedAttributes || !item.attributes) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {item.attributes.map((attr: any) => {
          const value = item.selectedAttributes[attr.id];
          if (!value) return null;
          return (
            <div key={attr.id} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
              {attr.name}: <span className="text-tea-800">{value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cream py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-tea-900 mb-10">Shopping Basket</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => {
                let unitPrice = item.price;
                if (item.attributes && item.selectedAttributes) {
                  item.attributes.forEach(attr => {
                    const selectedValue = item.selectedAttributes![attr.id];
                    const option = attr.options.find(o => o.value === selectedValue);
                    if (option) unitPrice += option.priceAdjustment;
                  });
                }

                return (
                  <motion.div
                    key={item.itemKey}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 flex gap-4 sm:gap-6 items-center"
                  >
                    <img src={item.image} alt={item.name} className="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-2xl" />
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-serif font-bold text-lg text-tea-900">{item.name}</h3>
                          <p className="text-xs text-gray-400 uppercase tracking-widest">{item.origin} | {item.category}</p>
                          {renderAttributes(item)}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => dispatch(removeItem(item.itemKey))}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                          <button onClick={() => navigate(`/product/${item.id}`)} className="text-gray-300 hover:text-tea-700 transition-colors">
                            <Settings2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100">
                          <button
                            onClick={() => dispatch(updateQuantity({ itemKey: item.itemKey, quantity: item.quantity - 1 }))}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full transition-all"
                          ><Minus size={14} /></button>
                          <span className="w-10 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => dispatch(updateQuantity({ itemKey: item.itemKey, quantity: item.quantity + 1 }))}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full transition-all"
                          ><Plus size={14} /></button>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg text-tea-900 block">₹{(unitPrice * item.quantity).toFixed(2)}</span>
                          <span className="text-[10px] text-gray-400 font-medium">₹{unitPrice.toFixed(2)} each</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-tea-100 sticky top-24">
              <h2 className="text-2xl font-serif font-bold text-tea-900 mb-6">Order Summary</h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className="text-tea-600 font-bold uppercase text-xs tracking-widest">Free</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax (EST)</span>
                  <span className="font-medium text-gray-900">₹{(total * 0.08).toFixed(2)}</span>
                </div>
                <div className="h-px bg-gray-100 my-4" />
                <div className="flex justify-between text-xl font-bold text-tea-900">
                  <span>Total</span>
                  <span>₹{(total * 1.08).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-5 bg-tea-700 hover:bg-tea-800 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight size={20} />
                </button>
                <div className="text-center">
                  <span className="text-xs text-gray-400 font-medium">Safe & Secure Payment via SSL</span>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <p className="text-sm font-bold text-tea-800 mb-3">Add a Promo Code</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="SPRING24" className="flex-grow bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-tea-500" />
                  <button className="px-4 py-2 bg-tea-50 text-tea-700 font-bold text-xs rounded-xl hover:bg-tea-100 transition-colors">Apply</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
