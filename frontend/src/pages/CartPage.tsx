
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../features/cart/useCart';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, Settings2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setAuthModalOpen, setPendingCheckoutAfterAddress } from '../features/auth/authSlice';

const CartPage: React.FC = () => {
  const { items, updateItemQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      dispatch(setPendingCheckoutAfterAddress(true));
      dispatch(setAuthModalOpen(true));
      return;
    }
    navigate('/checkout');
  };

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
          <h2 className="text-3xl font-serif font-bold text-tea-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-500 mb-10 text-lg">Looks like you haven't added anything yet. Check out our teas and snacks!</p>
          <Link to="/shop" className="inline-flex items-center px-8 py-4 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-all shadow-lg hover:shadow-xl">
            Browse Products
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
    <div className="min-h-screen bg-cream py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-tea-900 mb-6 sm:mb-10">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
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
                    className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center"
                  >
                    <div className="flex gap-4 items-center w-full sm:w-auto">
                      <img src={item.image} alt={item.name} className="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-2xl shrink-0" />
                      <div className="sm:hidden flex-grow">
                        <h3 className="font-serif font-bold text-lg text-tea-900 line-clamp-1">{item.name}</h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{item.origin}</p>
                        <span className="font-bold text-tea-900 mt-1 block">₹{(unitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex-grow w-full">
                      <div className="hidden sm:flex justify-between items-start">
                        <div>
                          <h3 className="font-serif font-bold text-lg text-tea-900">{item.name}</h3>
                          <p className="text-xs text-gray-400 uppercase tracking-widest">{item.origin} | {item.categories.slice(0, 2).join(', ')}</p>
                          {renderAttributes(item)}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => removeFromCart(item.itemKey)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                          <button onClick={() => navigate(`/product/${item.id}`)} className="p-2 text-gray-300 hover:text-tea-700 transition-colors">
                            <Settings2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Attributes for mobile */}
                      <div className="sm:hidden mb-2">
                        {renderAttributes(item)}
                      </div>

                      <div className="mt-2 sm:mt-4 flex justify-between items-center w-full">
                        <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100">
                          <button
                            onClick={() => updateItemQuantity(item.itemKey, item.quantity - 1)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full transition-all"
                            aria-label="Decrease quantity"
                          ><Minus size={14} /></button>
                          <span className="w-10 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(item.itemKey, item.quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full transition-all"
                            aria-label="Increase quantity"
                          ><Plus size={14} /></button>
                        </div>
                        <div className="text-right flex flex-col sm:block">
                          <span className="hidden sm:block font-bold text-lg text-tea-900">₹{(unitPrice * item.quantity).toFixed(2)}</span>
                          <span className="text-[10px] text-gray-400 font-medium">₹{unitPrice.toFixed(2)} each</span>
                          <button
                            onClick={() => removeFromCart(item.itemKey)}
                            className="sm:hidden text-red-500 text-xs font-bold mt-1 uppercase tracking-widest"
                          >
                            Remove
                          </button>
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
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-tea-100 lg:sticky lg:top-24">
              <h2 className="text-2xl font-serif font-bold text-tea-900 mb-6">Order Summary</h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm sm:text-base text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base text-gray-500">
                  <span>Shipping</span>
                  <span className="text-tea-600 font-bold uppercase text-xs tracking-widest">Free</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base text-gray-500">
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
                  onClick={handleCheckout}
                  className="w-full py-5 bg-tea-700 hover:bg-tea-800 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
                  <ArrowRight size={20} />
                </button>
                <div className="text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Safe & Secure Payment via SSL</span>
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
