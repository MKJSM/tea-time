
import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Heart, Check, Settings2 } from 'lucide-react';
import { Product } from '../../types';
import { useDispatch } from 'react-redux';
import { setAuthModalOpen } from '../../features/auth/authSlice';
import { useAppSelector } from '../../store/hooks';
import { useGetFavoriteIdsQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } from '../../features/favorites/favoritesApi';
import { useCart } from '../../features/cart/useCart';
import { QuickAddModal } from './QuickAddModal';
import { ImageSlider } from '../common/ImageSlider';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';
import { getOptimizedImageUrl } from '../../utils/images';

interface Props {
  product: Product;
}

const ProductCard: React.FC<Props> = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Using favorites API instead of auth slice for favorites list
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  // Fetch favorite IDs if authenticated
  const { data: favoriteIds = [] } = useGetFavoriteIdsQuery(undefined, { skip: !isAuthenticated });
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  // Use custom cart hook for add operations
  const { items: cartItems, addToCart } = useCart();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const isFavorited = favoriteIds.includes(product.id);
  const isInCart = cartItems.some((item) => item.id === product.id);

  const sliderImages = useMemo(() => {
    const images = product.images && product.images.length > 0 ? product.images : [product.image];
    return images.map(img => getOptimizedImageUrl(img, 400));
  }, [product.images, product.image]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If product has attributes, open the customization modal
    if (product.attributes && product.attributes.length > 0) {
      setIsQuickAddOpen(true);
      return;
    }

    addToCart(product, 1);
    toast.success(`${product.name} added!`, {
      icon: '🍃',
      style: { borderRadius: '10px', background: '#FFF8F0', color: '#2E7D32' },
    });
  }, [product, addToCart]);

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      dispatch(setAuthModalOpen(true));
      return;
    }

    try {
      if (isFavorited) {
        await removeFavorite(product.id);
        toast.success('Removed from favorites', { icon: '🍃' });
      } else {
        await addFavorite(product.id);
        toast.success('Added to favorites', { icon: '❤️' });
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  }, [isAuthenticated, isFavorited, product.id, dispatch, removeFavorite, addFavorite]);

  const hasAttributes = product.attributes && product.attributes.length > 0;

  return (
    <>
      <motion.div
        whileHover={{ y: -4, }}
        className="group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 sm:duration-500 h-full flex flex-col sm:border sm:border-gray-100/50"
      >
        <Link to={`/product/${product.id}`} className="flex flex-col h-full">
          {/* Image Section */}
          <div className="relative aspect-square overflow-hidden shrink-0 bg-gray-100">
            <ImageSlider
              images={sliderImages}
              autoPlay={true}
              showDots={true}
              className="w-full h-full"
            />

            <div className="hidden sm:block absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <button
              onClick={handleToggleFavorite}
              aria-label={isFavorited ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
              className={`absolute top-3 right-3 sm:top-4 sm:right-4 p-1 transition-all z-10 focus:outline-none focus:ring-2 focus:ring-tea-500 rounded-full ${isFavorited
                ? 'text-red-500'
                : 'text-gray-400 hover:text-red-500'
                }`}
            >
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-md" fill={isFavorited ? "currentColor" : "none"} aria-hidden="true" />
            </button>

            {isInCart && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-tea-700 sm:bg-tea-800/90 sm:backdrop-blur-md text-white text-[10px] font-semibold sm:font-bold rounded-full flex items-center gap-1 sm:gap-1.5 z-10 sm:shadow-xl sm:border sm:border-white/20">
                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:text-accent-400" /> In Cart
              </div>
            )}

            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex flex-wrap gap-1.5 sm:gap-2 z-10">
              {product.categories.slice(0, 2).map((category: string) => (
                <span
                  key={category}
                  className="px-2.5 py-1 sm:px-3 bg-white/95 sm:bg-white/90 sm:backdrop-blur-md text-[9px] sm:text-[10px] font-semibold sm:font-bold text-gray-800 sm:text-tea-900 rounded-md sm:rounded-full uppercase tracking-wide sm:tracking-widest sm:shadow-lg"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          {/* Content Section */}
          <div className="p-3 sm:p-6 flex flex-col flex-grow">
            <h3 className="font-serif text-sm sm:text-xl text-tea-950 group-hover:text-tea-700 transition-colors line-clamp-1 mb-1">
              {product.name}
            </h3>

            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-6">
              <div className="flex text-accent-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={10} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{product.origin}</span>
            </div>

            <div className="mt-auto flex items-center justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <span className="text-base sm:text-2xl font-serif font-bold text-tea-900 leading-tight">₹{product.price.toFixed(2)}</span>
                {hasAttributes && (
                  <span className="hidden sm:block text-[9px] text-tea-600 font-bold uppercase tracking-widest mt-0.5 opacity-60 truncate">Options</span>
                )}
              </div>

              {/* Mobile: Icon-only button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                aria-label={isInCart ? `${product.name} is in cart` : hasAttributes ? `Select options for ${product.name}` : `Add ${product.name} to cart`}
                className={cn(
                  "flex sm:hidden items-center justify-center p-2.5 rounded-xl transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-tea-500",
                  isInCart
                    ? 'bg-tea-100 text-tea-700 border border-tea-200'
                    : hasAttributes
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-tea-700 text-white hover:bg-tea-800'
                )}
              >
                {isInCart ? (
                  <Check size={16} aria-hidden="true" />
                ) : hasAttributes ? (
                  <Settings2 size={16} aria-hidden="true" />
                ) : (
                  <ShoppingCart size={16} aria-hidden="true" />
                )}
              </motion.button>

              {/* Desktop: Full button with text */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                aria-label={isInCart ? `${product.name} is in cart` : hasAttributes ? `Select options for ${product.name}` : `Add ${product.name} to cart`}
                className={cn(
                  "hidden sm:flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shrink-0 min-w-[100px] focus:outline-none focus:ring-2 focus:ring-tea-500",
                  isInCart
                    ? 'bg-tea-50 text-tea-800 border border-tea-100'
                    : hasAttributes
                      ? 'bg-tea-50 text-tea-900 border border-tea-200 hover:bg-white hover:shadow-lg'
                      : 'bg-tea-800 text-white hover:bg-tea-950 shadow-lg shadow-tea-900/10'
                )}
              >
                {isInCart ? (
                  <>
                    <Check size={14} aria-hidden="true" /> Added
                  </>
                ) : hasAttributes ? (
                  <>
                    <Settings2 size={14} className="text-tea-600" aria-hidden="true" /> Options
                  </>
                ) : (
                  <>
                    <ShoppingCart size={14} aria-hidden="true" /> Add
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
