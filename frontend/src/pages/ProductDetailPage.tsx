
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGetProductByIdQuery, useGetProductsQuery } from '../features/products/productsApi';
import { useGetFavoriteIdsQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } from '../features/favorites/favoritesApi';
import { setAuthModalOpen } from '../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useCart } from '../features/cart/useCart';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ShoppingCart, Star, Heart,
  Plus, Minus, ChevronDown, Share2,
  ShieldCheck, Truck, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ProductCustomizer } from '../components/products/ProductCustomizer';
import { ImageSlider } from '../components/common/ImageSlider';
import { SelectedAttributes } from '../types';
import { cn } from '../utils/cn';
import { getOptimizedImageUrl } from '../utils/images';
import ProductCard from '../components/products/ProductCard';

const Accordion = ({ title, children, isOpen, onToggle }: { title: string, children: React.ReactNode, isOpen: boolean, onToggle: () => void }) => (
  <div className="border-b border-gray-100 last:border-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-4 text-left transition-colors hover:text-tea-700"
    >
      <span className="text-sm font-semibold uppercase tracking-widest text-gray-900">{title}</span>
      <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform duration-300", isOpen && "rotate-180")} />
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="pb-6 text-sm text-gray-600 leading-relaxed space-y-3">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const ProductDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useGetProductByIdQuery(id || '');
  const { data: allProducts = [] } = useGetProductsQuery(undefined);

  const dispatch = useAppDispatch();
  // Use custom cart hook
  const { addToCart } = useCart();
  // Adapted to use our existing favorites implementation
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: favoriteIds = [] } = useGetFavoriteIdsQuery(undefined, { skip: !isAuthenticated });
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  const [qty, setQty] = useState(1);
  const [selections, setSelections] = useState<SelectedAttributes>({});
  const [openAccordion, setOpenAccordion] = useState<string | null>('details');

  useEffect(() => {
    if (product?.attributes) {
      const defaults: SelectedAttributes = {};
      product.attributes.forEach(attr => {
        const defaultOpt = attr.options.find(o => o.default) || attr.options[0];
        defaults[attr.id] = defaultOpt.value;
      });
      setSelections(defaults);
    }
    window.scrollTo(0, 0);
  }, [product]);

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

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, qty, undefined, selections);
    toast.success(`${product.name} added to cart`, {
      icon: '🍃',
      style: { borderRadius: '8px', background: '#2E7D32', color: '#fff', fontSize: '14px' }
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const isFavorited = product ? favoriteIds.includes(product.id) : false;

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      dispatch(setAuthModalOpen(true));
      return;
    }
    if (product) {
      if (isFavorited) {
        await removeFavorite(product.id);
        toast.success('Removed from favorites', { icon: '🍃' });
      } else {
        await addFavorite(product.id);
        toast.success('Added to favorites', { icon: '❤️' });
      }
    }
  };

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter(p => p.id !== product.id && p.categories.some(cat => product.categories.includes(cat)))
      .slice(0, 4);
  }, [allProducts, product]);

  if (isLoading) return <LoadingSpinner fullPage />;
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <Link to="/shop" className="text-tea-700 font-bold hover:underline">Back to shop</Link>
        </div>
      </div>
    );
  }

  const discountPercent = 15; // Mock discount for sale display

  const rawImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const productImages = rawImages.map(img => getOptimizedImageUrl(img, 800));

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb - Mobile Only visible */}
        <Link to="/shop" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-8 hover:text-tea-700 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-20">
          {/* Left Column: Image Gallery & Description */}
          <div className="lg:col-span-7 space-y-8 md:space-y-12">
            {/* Hero Image Section */}
            <div className="relative aspect-[4/3] sm:aspect-square bg-white rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
              <ImageSlider
                images={productImages}
                autoPlay={false}
                showArrows={true}
                showDots={true}
                className="w-full h-full"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 bg-tea-700/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-sm">Organic</span>
                {product.tags && product.tags.includes('Limited') && (
                  <span className="px-3 py-1 bg-accent-600/90 backdrop-blur-sm text-black text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-sm">Limited</span>
                )}
              </div>
            </div>

            {/* Desktop Only: Full Description */}
            <div className="hidden lg:block space-y-10">
              <section className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">About This Product</h2>
                <div className="text-gray-600 leading-relaxed space-y-4">
                  <p>{product.story}</p>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Flavor Profile</h2>
                <ul className="grid grid-cols-2 gap-4">
                  {(Object.entries(product.flavorProfile) as [string, number][]).map(([key, val]) => (
                    <li key={key} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-tea-700" />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        <span className="font-bold">{key}</span>: {val}/10
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Reviews Section */}
              <section className="pt-10 border-t border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
                    <div className="flex items-center gap-1 text-accent-700">
                      <Star size={16} fill="currentColor" />
                      <span className="text-sm font-bold text-gray-900">{product.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-tea-700 uppercase tracking-widest hover:underline">View All →</button>
                </div>
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-6 bg-white rounded-2xl border border-gray-100">
                      <div className="flex justify-between mb-2">
                        <div className="flex text-accent-500">
                          {[...Array(5)].map((_, j) => <Star key={j} size={12} fill={j < 5 ? "currentColor" : "none"} />)}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Verified Purchase</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">"Exceptional clarity and depth. Truly a morning ritual staple."</p>
                      <p className="text-xs text-gray-500">- Sarah M.</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Right Column: Information & Actions */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 space-y-6 md:space-y-8">
              {/* Product Essentials */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-[28px] font-bold text-gray-900 leading-tight mb-2">{product.name}</h1>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {product.categories.slice(0, 2).map((cat) => (
                        <span key={cat} className="px-2 py-0.5 bg-tea-50 text-tea-700 text-[9px] font-bold uppercase tracking-widest rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex text-accent-600">
                        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} />)}
                      </div>
                      <span className="text-xs font-medium text-gray-400">{product.rating.toFixed(1)} (124 reviews)</span>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleFavorite}
                    className="p-3 text-gray-300 hover:text-red-500 transition-colors active:scale-90"
                    aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart size={24} fill={isFavorited ? "currentColor" : "none"} className={isFavorited ? "text-red-500" : ""} />
                  </button>
                </div>

                <div className="flex items-baseline gap-3 pt-2">
                  <span className="text-3xl font-bold text-tea-900">₹{currentPrice.toFixed(2)}</span>
                  <span className="text-sm text-gray-400 line-through">₹{(currentPrice * 1.2).toFixed(2)}</span>
                  <span className="text-xs font-bold text-tea-700 bg-tea-50 px-2 py-0.5 rounded">Save 20%</span>
                </div>
              </div>

              {/* Customizer */}
              {product.attributes && product.attributes.length > 0 && (
                <div className="pt-2">
                  <ProductCustomizer
                    attributes={product.attributes}
                    selections={selections}
                    onSelectionChange={(attrId, val) => setSelections(prev => ({ ...prev, [attrId]: val }))}
                  />
                </div>
              )}

              {/* Quantity & CTA */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-6">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quantity</span>
                  <div className="flex items-center border border-gray-200 rounded-full p-1 bg-white">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors active:scale-90" aria-label="Decrease quantity"><Minus size={16} /></button>
                    <span className="w-10 text-center font-bold text-gray-900">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors active:scale-90" aria-label="Increase quantity"><Plus size={16} /></button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-5 bg-tea-700 hover:bg-tea-800 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    Add to Cart · ₹{(currentPrice * qty).toFixed(2)}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="w-full py-4 bg-white border border-tea-700 text-tea-700 font-bold rounded-2xl hover:bg-tea-50 transition-all active:scale-[0.98]"
                  >
                    Buy It Now
                  </button>
                </div>
              </div>

              {/* Accordions */}
              <div className="pt-6 border-t border-gray-100">
                <Accordion
                  title="Details"
                  isOpen={openAccordion === 'details'}
                  onToggle={() => setOpenAccordion(openAccordion === 'details' ? null : 'details')}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Origin</p>
                      <p className="font-semibold text-gray-900">{product.origin}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Harvest</p>
                      <p className="font-semibold text-gray-900">Spring 2024</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Caffeine</p>
                      <p className="font-semibold text-gray-900">{product.caffeine}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Format</p>
                      <p className="font-semibold text-gray-900">{product.format}</p>
                    </div>
                  </div>
                </Accordion>
                <Accordion
                  title="Brewing Guide"
                  isOpen={openAccordion === 'brew'}
                  onToggle={() => setOpenAccordion(openAccordion === 'brew' ? null : 'brew')}
                >
                  <div className="space-y-4">
                    <p>{product.brewing.instructions}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Temp</p>
                        <p className="font-bold text-gray-900">{product.brewing.temperature}°C</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Time</p>
                        <p className="font-bold text-gray-900">{product.brewing.time}s</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Water</p>
                        <p className="font-bold text-gray-900">250ml</p>
                      </div>
                    </div>
                  </div>
                </Accordion>
                <Accordion
                  title="Shipping & Returns"
                  isOpen={openAccordion === 'shipping'}
                  onToggle={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
                >
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Truck size={14} className="text-tea-600" /> Free shipping on orders over ₹2000
                    </li>
                    <li className="flex items-center gap-2">
                      <RotateCcw size={14} className="text-tea-600" /> 30-day easy returns
                    </li>
                  </ul>
                </Accordion>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 pt-6">
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
                  <ShieldCheck size={20} className="text-tea-600" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-900">100% Organic</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
                  <Share2 size={20} className="text-tea-600" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-900">Direct Farm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Only: Description & Reviews (Moved below if mobile) */}
        <div className="lg:hidden mt-16 space-y-12">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">About This Product</h2>
            <div className="text-sm text-gray-600 leading-relaxed">
              {product.story}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
              <div className="flex items-center gap-1 text-accent-700">
                <Star size={16} fill="currentColor" />
                <span className="text-sm font-bold text-gray-900">{product.rating.toFixed(1)}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-5 bg-white rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-900 font-medium mb-1">"Perfect for morning focus."</p>
                <p className="text-xs text-gray-500">- David L.</p>
              </div>
            </div>
            <button className="w-full py-4 bg-gray-50 text-gray-900 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-100">View All 124 Reviews</button>
          </section>
        </div>

        {/* You Might Also Like */}
        <section className="mt-20 pt-20 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-10">You Might Also Like</h2>
          <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
            {relatedProducts.map(p => (
              <div key={p.id} className="min-w-[280px] md:min-w-0 md:flex-1 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetailPage;
