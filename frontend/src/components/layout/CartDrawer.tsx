
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, ArrowRight, Trash2, Minus, Plus } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { toggleDrawer } from '../../features/cart/cartSlice';
import { useCart } from '../../features/cart/useCart';
import { useNavigate } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, isDrawerOpen, updateItemQuantity, removeFromCart } = useCart();

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

  const renderAttributes = (item: any) => {
    if (!item.selectedAttributes || !item.attributes) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {item.attributes.map((attr: any) => {
          const value = item.selectedAttributes[attr.id];
          if (!value) return null;
          return (
            <div key={attr.id} className="px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded text-[7px] font-bold text-gray-500 uppercase tracking-tighter">
              {attr.name}: <span className="text-tea-800">{value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(toggleDrawer(false))}
            className="fixed inset-0 bg-tea-950/40 backdrop-blur-sm z-[120]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[130] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-tea-700" size={24} />
                <h3 className="text-xl font-serif font-bold text-tea-900">Your Cart</h3>
              </div>
              <button
                onClick={() => dispatch(toggleDrawer(false))}
                className="p-2 hover:bg-tea-50 rounded-full text-gray-400 hover:text-tea-800 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <ShoppingBag size={48} className="text-gray-200 mb-4" />
                  <p className="text-gray-500 font-medium">Your cart is empty!</p>
                  <button
                    onClick={() => { dispatch(toggleDrawer(false)); navigate('/shop'); }}
                    className="mt-4 text-tea-700 font-bold hover:underline"
                  >
                    Browse Teas
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  let unitPrice = item.price;
                  if (item.attributes && item.selectedAttributes) {
                    item.attributes.forEach(attr => {
                      const selectedValue = item.selectedAttributes![attr.id];
                      const option = attr.options.find(o => o.value === selectedValue);
                      if (option) unitPrice += option.priceAdjustment;
                    });
                  }

                  return (
                    <div key={item.itemKey} className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                        <img src={item.image || "https://images.unsplash.com/photo-1544787210-2213d2429f77?auto=format&fit=crop&q=80&w=200"} className="w-full h-full object-cover" alt={item.name} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-tea-900 text-sm truncate pr-2">{item.name}</h4>
                          <button onClick={() => removeFromCart(item.itemKey)} className="text-gray-300 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{item.categories.slice(0, 2).join(', ')}</p>
                        {renderAttributes(item)}
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100 scale-90 -ml-2">
                            <button onClick={() => updateItemQuantity(item.itemKey, item.quantity - 1)} className="p-1.5 hover:bg-white rounded-md transition-all"><Minus size={12} /></button>
                            <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                            <button onClick={() => updateItemQuantity(item.itemKey, item.quantity + 1)} className="p-1.5 hover:bg-white rounded-md transition-all"><Plus size={12} /></button>
                          </div>
                          <span className="font-bold text-tea-800 text-sm">₹{(unitPrice * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between mb-4">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="text-xl font-serif font-bold text-tea-900">₹{total.toFixed(2)}</span>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => { dispatch(toggleDrawer(false)); navigate('/checkout'); }}
                    className="w-full py-4 bg-tea-800 text-white font-bold rounded-xl shadow-lg hover:bg-tea-950 transition-all flex items-center justify-center gap-2 group"
                  >
                    Checkout
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => { dispatch(toggleDrawer(false)); navigate('/cart'); }}
                    className="w-full py-3 bg-white text-tea-700 font-bold text-sm rounded-xl border border-gray-100 hover:bg-gray-50 transition-all"
                  >
                    View Full Cart
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
