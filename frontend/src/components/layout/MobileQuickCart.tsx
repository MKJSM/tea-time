
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { clearLastAddedItem } from '../../features/cart/cartSlice';
import { useNavigate } from 'react-router-dom';

export const MobileQuickCart: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { lastAddedItem, items } = useAppSelector((state) => state.cart);

  useEffect(() => {
    if (lastAddedItem) {
      const timer = setTimeout(() => {
        dispatch(clearLastAddedItem());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastAddedItem, dispatch]);

  if (window.innerWidth >= 1024) return null; // Desktop handles with drawer

  return (
    <AnimatePresence>
      {lastAddedItem && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="fixed bottom-20 left-4 right-4 z-[90] lg:hidden"
        >
          <div className="bg-tea-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-white/10 backdrop-blur-lg">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-accent-400" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Added to Ritual</p>
                <p className="text-xs font-bold truncate">{lastAddedItem.name}</p>
              </div>
            </div>
            <button
              onClick={() => { dispatch(clearLastAddedItem()); navigate('/cart'); }}
              className="px-4 py-2 bg-accent-500 text-tea-950 font-bold text-xs rounded-xl flex items-center gap-2 shrink-0 active:scale-95 transition-transform"
            >
              Checkout
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
