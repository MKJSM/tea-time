
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Info, Plus, Minus, ArrowRight } from 'lucide-react';
import { Product, SelectedAttributes } from '../../types';
import { ProductCustomizer } from './ProductCustomizer';
import { useAppDispatch } from '../../store/hooks';
import { addItem } from '../../features/cart/cartSlice';
import toast from 'react-hot-toast';

interface QuickAddModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ product, isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const [qty, setQty] = useState(1);
  const [selections, setSelections] = useState<SelectedAttributes>({});

  // Initialize selections with defaults when modal opens
  useEffect(() => {
    if (isOpen && product.attributes) {
      const defaults: SelectedAttributes = {};
      product.attributes.forEach(attr => {
        const defaultOpt = attr.options.find(o => o.default) || attr.options[0];
        defaults[attr.id] = defaultOpt.value;
      });
      setSelections(defaults);
      setQty(1);
    }
  }, [isOpen, product]);

  const handleSelectionChange = (attributeId: string, value: any) => {
    setSelections(prev => ({ ...prev, [attributeId]: value }));
  };

  const currentPrice = useMemo(() => {
    let basePrice = product.price;
    if (product.attributes) {
      product.attributes.forEach(attr => {
        const selectedValue = selections[attr.id];
        const option = attr.options.find(o => o.value === selectedValue);
        if (option) {
          basePrice += option.priceAdjustment;
        }
      });
    }
    return basePrice;
  }, [product, selections]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addItem({ product, quantity: qty, selectedAttributes: selections }));
    toast.success(`${product.name} added to cart!`, {
      icon: '🍃',
      style: { borderRadius: '12px', background: '#1B5E20', color: '#fff' }
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-tea-950/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex-shrink-0">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-tea-900 leading-tight">{product.name}</h3>
                  <p className="text-[10px] font-bold text-tea-700 uppercase tracking-widest mt-1">{product.category}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-tea-800 hover:bg-tea-50 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 sm:p-8">
              <div className="space-y-8">
                {/* Ritual Intro */}
                <div className="flex items-start gap-3 p-4 bg-tea-50/50 rounded-2xl border border-tea-100/50">
                  <Info size={18} className="text-tea-700 mt-0.5 shrink-0" />
                  <p className="text-xs text-tea-900/70 italic leading-relaxed">
                    Personalize your tea ritual. Choose your preferred batch size and packaging to maintain peak harvest freshness.
                  </p>
                </div>

                {/* Attributes */}
                {product.attributes && (
                  <ProductCustomizer
                    attributes={product.attributes}
                    selections={selections}
                    onSelectionChange={handleSelectionChange}
                  />
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 sm:p-8 border-t border-gray-100 bg-gray-50/30 shrink-0">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Qty Selector */}
                <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-tea-50 rounded-full transition-colors text-tea-800"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-bold text-tea-950">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-tea-50 rounded-full transition-colors text-tea-800"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAddToCart}
                  className="w-full sm:flex-grow py-4 bg-tea-800 hover:bg-tea-950 text-white font-bold rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 group active:scale-[0.98]"
                >
                  <span className="tracking-widest text-xs uppercase">Add to Collection</span>
                  <span className="h-4 w-px bg-white/20" />
                  <span className="text-accent-400">${(currentPrice * qty).toFixed(2)}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
