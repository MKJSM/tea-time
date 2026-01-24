
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, Leaf, X } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
// Fix: Added AnimatePresence to imports from framer-motion
import { motion, AnimatePresence } from 'framer-motion';
import { setAuthModalOpen } from '../../features/auth/authSlice';
import { toggleDrawer } from '../../features/cart/cartSlice';

const Navbar: React.FC = () => {
  const cartItems = useAppSelector((state) => state.cart.items);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const handleAuthClick = () => {
    if (isAuthenticated) {
      navigate('/profile');
    } else {
      dispatch(setAuthModalOpen(true));
    }
  };

  const handleCartClick = (e: React.MouseEvent) => {
    // On mobile, we still navigate to full cart page for better UX
    // On desktop, we toggle the right drawer
    if (window.innerWidth >= 1024) {
      e.preventDefault();
      dispatch(toggleDrawer(true));
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-tea-800 p-1.5 rounded-lg group-hover:scale-110 transition-transform shadow-lg shadow-tea-900/20">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-serif font-bold text-tea-950 tracking-tight">Tea Time</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center space-x-10">
            <Link to="/shop" className="text-tea-950/80 hover:text-tea-800 font-bold text-xs uppercase tracking-widest transition-colors">Collection</Link>
            <Link to="/orders" className="text-tea-950/80 hover:text-tea-800 font-bold text-xs uppercase tracking-widest transition-colors">Orders</Link>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-tea-950/70 hover:text-tea-800 transition-colors"
            >
              {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            <Link
              to="/cart"
              onClick={handleCartClick}
              className="p-2 text-tea-950/70 hover:text-tea-800 transition-colors relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-tea-800 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white leading-none" // Fix: Perfected padding and centering
                >
                  {itemCount}
                </motion.span>
              )}
            </Link>

            <button onClick={handleAuthClick} className="hidden sm:flex items-center p-2 text-tea-950/70 hover:text-tea-800 transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b overflow-hidden px-4 py-4"
          >
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex items-center bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 shadow-inner">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search rare harvests..."
                className="bg-transparent w-full outline-none text-tea-950 font-medium py-1 placeholder:text-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')}>
                  <X className="w-5 h-5 text-gray-400 hover:text-tea-700" />
                </button>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
