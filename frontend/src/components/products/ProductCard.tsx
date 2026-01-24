
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Heart, Check, Settings2, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { useDispatch } from 'react-redux';
import { addItem } from '../../features/cart/cartSlice';
import { setAuthModalOpen } from '../../features/auth/authSlice';
import { useAppSelector } from '../../store/hooks';
import { useGetFavoriteIdsQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } from '../../features/favorites/favoritesApi';
import { QuickAddModal } from './QuickAddModal';
import { ImageSlider } from '../common/ImageSlider';
import toast from 'react-hot-toast';
// Fix: Added missing import for cn utility
import { cn } from '../../utils/cn';
import { getOptimizedImageUrl } from '../../utils/images';

interface Props {
  product: Product;
}

const ProductCard: React.FC<Props> = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Using favorites API instead of auth slice for favorites list
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  // Fetch favorite IDs if authenticated
  const { data: favoriteIds = [] } = useGetFavoriteIdsQuery(undefined, { skip: !isAuthenticated });
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  const cartItems = useAppSelector((state) => state.cart.items);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const isFavorited = favoriteIds.includes(product.id);
  const isInCart = cartItems.some((item) => item.id === product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If product has attributes, open the customization modal
    if (product.attributes && product.attributes.length > 0) {
      setIsQuickAddOpen(true);
      return;
    }

    dispatch(addItem({ product, quantity: 1 }));
    toast.success(`${product.name} added!`, {
      icon: '🍃',
      style: { borderRadius: '10px', background: '#FFF8F0', color: '#2E7D32' },
    });
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      dispatch(setAuthModalOpen(true));
      return;
    }

    try {
      if (isFavorited) {
        await removeFavorite(product.id);
        toast.success('Removed from collection', { icon: '🍃' });
      } else {
        await addFavorite(product.id);
        toast.success('Saved to collection', { icon: '❤️' });
      }
    } catch (error) {
      toast.error('Could not update favorites');
    }
  };

  const hasAttributes = product.attributes && product.attributes.length > 0;

  return (
    <>
      <motion.div
        whileHover={{ y: -8 }}
        className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 h-full flex flex-col border border-gray-100/50"
      >
        <Link to={`/product/${product.id}`} className="flex flex-col h-full">
          {/* Enhanced Image Carousel */}
          <div className="relative aspect-square overflow-hidden shrink-0">
            import {getOptimizedImageUrl} from '../../utils/images';

            // ... existing imports ...

            // In ProductCard component
            <ImageSlider
              images={(product.images && product.images.length > 0 ? product.images : [product.image]).map(img => getOptimizedImageUrl(img, 400))}
              autoPlay={true}
              showDots={true}
              className="w-full h-full"
            />

            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <button
              onClick={handleToggleFavorite}
              className={`absolute top-4 right-4 p-2.5 backdrop-blur-md rounded-full transition-all z-10 ${isFavorited
                ? 'bg-red-500 text-white'
                : 'bg-white/40 text-white hover:text-red-500 hover:bg-white shadow-lg'
                }`}
            >
              <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
            </button>

            {isInCart && (
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-tea-800/90 backdrop-blur-md text-white text-[10px] font-bold rounded-full flex items-center gap-1.5 shadow-xl z-10 border border-white/20">
                <Check size={12} className="text-accent-400" /> In Ritual
              </div>
            )}

            <div className="absolute bottom-4 left-4 flex gap-2 z-10">
              <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold text-tea-900 rounded-full uppercase tracking-widest shadow-lg">
                {product.category}
              </span>
            </div>
          </div>

          {/* Premium Content */}
          <div className="p-6 flex flex-col flex-grow">
            <h3 className="font-serif text-xl text-tea-950 group-hover:text-tea-700 transition-colors line-clamp-1 mb-1">
              {product.name}
            </h3>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex text-accent-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={10} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.origin} Estate</span>
            </div>

            <div className="mt-auto flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-2xl font-serif font-bold text-tea-900">₹{product.price.toFixed(2)}</span>
                {hasAttributes && (
                  <span className="text-[9px] text-tea-600 font-bold uppercase tracking-widest mt-0.5 opacity-60">Artisan Options</span>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all", // Refined: Smaller padding and font
                  isInCart
                    ? 'bg-tea-50 text-tea-800 border border-tea-100'
                    : hasAttributes
                      ? 'bg-tea-50 text-tea-900 border border-tea-200 hover:bg-white hover:shadow-lg'
                      : 'bg-tea-800 text-white hover:bg-tea-950 shadow-lg shadow-tea-900/10'
                )}
              >
                {isInCart ? (
                  <>
                    <Check size={14} /> <span>Ritual Set</span>
                  </>
                ) : hasAttributes ? (
                  <>
                    <Settings2 size={14} className="text-tea-600" /> <span>Customize</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={14} /> <span>Add to Cart</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </Link>
      </motion.div>

      {hasAttributes && (
        <QuickAddModal
          product={product}
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
        />
      )}
    </>
  );
};

export default ProductCard;
