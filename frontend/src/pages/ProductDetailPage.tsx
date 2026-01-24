
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetProductByIdQuery } from '../features/products/productsApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addItem } from '../features/cart/cartSlice';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ShoppingCart, Thermometer,
  Clock, Share2, Heart, PlayCircle, BarChart3, Check,
  Info, ShieldCheck, Zap, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ProductCustomizer } from '../components/products/ProductCustomizer';
import { ImageSlider } from '../components/common/ImageSlider';
import { SelectedAttributes } from '../types';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams();
  const { data: product, isLoading, error } = useGetProductByIdQuery(id || '');
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const [qty, setQty] = useState(1);
  const [selections, setSelections] = useState<SelectedAttributes>({});

  useEffect(() => {
    if (product?.attributes) {
      const defaults: SelectedAttributes = {};
      product.attributes.forEach(attr => {
        const defaultOpt = attr.options.find(o => o.default) || attr.options[0];
        defaults[attr.id] = defaultOpt.value;
      });
      setSelections(defaults);
    }
  }, [product]);

  const handleSelectionChange = (attributeId: string, value: any) => {
    setSelections(prev => ({ ...prev, [attributeId]: value }));
  };

  const currentPrice = useMemo(() => {
    if (!product) return 0;
    let basePrice = product.price;
    if (product.attributes) {
      product.attributes.forEach(attr => {
        const selectedValue = selections[attr.id];
        const option = attr.options.find(o => o.value === selectedValue);
        if (option) basePrice += option.priceAdjustment;
      });
    }
    return basePrice;
  }, [product, selections]);

  if (isLoading) return <LoadingSpinner fullPage />;
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-[3rem] shadow-xl">
          <h2 className="text-2xl font-serif text-tea-900 mb-4">Discovery Interrupted</h2>
          <p className="text-gray-500 mb-8">This exceptional leaf has vanished from our archives.</p>
          <Link to="/shop" className="px-8 py-3 bg-tea-700 text-white font-bold rounded-2xl">Back to Collection</Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    dispatch(addItem({ product, quantity: qty, selectedAttributes: selections }));
    toast.success(`Added ${qty} items to collection`, {
      icon: '🍃',
      style: { borderRadius: '15px', background: '#1B5E20', color: '#fff' }
    });
  };

  const productImages = product.images && product.images.length > 0 ? product.images : [product.image];

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/shop" className="inline-flex items-center text-tea-700 font-bold mb-8 hover:underline group">
          <ChevronLeft className="mr-1 w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Collection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
          {/* Gallery Side with Auto Slider */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl bg-white border border-gray-100 relative group"
            >
              <ImageSlider
                images={productImages}
                showArrows
                showDots
                className="w-full h-full"
              />
              <div className="absolute top-6 left-6 z-20">
                <div className="px-4 py-2 bg-white/90 backdrop-blur-md text-[10px] font-bold text-tea-800 rounded-full uppercase tracking-widest shadow-lg border border-white/50">
                  {product.category}
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-4 gap-4">
              {productImages.map((img, i) => (
                <div key={i} className="aspect-square rounded-3xl overflow-hidden bg-white border border-gray-100 hover:border-tea-500 cursor-pointer transition-all shadow-sm">
                  <img src={img || "https://images.unsplash.com/photo-1544787210-2213d2429f77?auto=format&fit=crop&q=80&w=200"} alt="Detail" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            <div className="bg-white/50 backdrop-blur p-8 rounded-[3rem] border border-white shadow-sm">
              <div className="flex items-center gap-3 text-tea-800 font-bold mb-6">
                <PlayCircle size={24} className="text-tea-600" />
                <span className="text-xl font-serif">The Brewing Ritual</span>
              </div>
              <div className="aspect-video bg-gray-100 rounded-[2rem] overflow-hidden relative group cursor-pointer shadow-inner">
                <img src="https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-70" alt="Brewing" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <PlayCircle size={32} className="text-tea-800 fill-tea-800" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Side */}
          <div className="flex flex-col">
            <div className="mb-10">
              <span className="text-tea-700 font-bold uppercase tracking-[0.3em] text-[10px] bg-tea-50 px-4 py-2 rounded-full mb-6 inline-block border border-tea-100">{product.origin} Estate Sanctuary</span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif font-bold text-tea-900 mb-8 tracking-tight leading-[1.1]">{product.name}</h1>
              <div className="flex items-center gap-10 mb-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Investment</span>
                  <span className="text-5xl font-serif font-bold text-tea-900">₹{currentPrice.toFixed(2)}</span>
                </div>
                <div className="h-12 w-px bg-gray-200" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Artisan Rating</span>
                  <div className="flex items-center text-accent-600 gap-1.5 font-bold text-2xl">
                    <Star size={24} fill="currentColor" /> {product.rating.toFixed(1)}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed italic text-xl font-light border-l-4 border-tea-700/20 pl-8 py-2">"{product.story}"</p>
            </div>

            {product.attributes && product.attributes.length > 0 && (
              <div className="mb-14 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
                <ProductCustomizer
                  attributes={product.attributes}
                  selections={selections}
                  onSelectionChange={handleSelectionChange}
                />
              </div>
            )}

            <div className="space-y-10 mb-14">
              <div className="flex flex-wrap items-center gap-6">
                <div className="bg-white border border-gray-100 rounded-2xl p-2 shadow-sm flex items-center">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-12 flex items-center justify-center hover:bg-tea-50 rounded-xl transition-all font-bold text-xl">-</button>
                  <span className="w-14 text-center font-bold text-xl">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="w-12 h-12 flex items-center justify-center hover:bg-tea-50 rounded-xl transition-all font-bold text-xl">+</button>
                </div>
                <button onClick={handleAddToCart} className="flex-grow py-5 bg-tea-800 hover:bg-tea-950 text-white font-bold rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 text-xl group active:scale-[0.98]">
                  <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />
                  Add to Collection — ₹{(currentPrice * qty).toFixed(2)}
                </button>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest">
                  <Heart size={20} /> Save for Ritual
                </button>
                <button className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 hover:text-tea-700 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest">
                  <Share2 size={20} /> Share Discovery
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-14">
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex items-center gap-5 shadow-sm">
                <div className="p-3.5 bg-tea-50 text-tea-800 rounded-2xl"><ShieldCheck size={24} /></div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Purity Grade</p>
                  <p className="text-sm font-bold text-tea-950">100% Traceable Harvest</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex items-center gap-5 shadow-sm">
                <div className="p-3.5 bg-accent-50 text-accent-700 rounded-2xl"><Zap size={24} /></div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Express</p>
                  <p className="text-sm font-bold text-tea-950">Carbon-Neutral Flow</p>
                </div>
              </div>
            </div>

            <div className="bg-tea-950 text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><BarChart3 size={150} /></div>
              <h3 className="font-serif font-bold text-3xl mb-10 relative z-10">Flavor Architecture</h3>
              <div className="space-y-8 relative z-10">
                {(Object.entries(product.flavorProfile) as [string, number][]).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-tea-200/60 mb-3">
                      <span>{key} Analysis</span>
                      <span className="text-accent-400">{val * 10}% Concentration</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${val * 10}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-accent-500 rounded-full shadow-[0_0_12px_rgba(255,235,59,0.4)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
