
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, X } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setAuthModalOpen } from '../../features/auth/authSlice';
import { toggleDrawer } from '../../features/cart/cartSlice';
import logo from '../../assets/logo.webp';

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
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group" aria-label="Tea Time - Home">
            <img
              src={logo}
              alt="Tea Time"
              width="108"
              height="40"
              className="h-10 w-auto object-contain scale-110 group-hover:scale-115 transition-transform"
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8 lg:space-x-10">
            {/* Menu Dropdown */}
            <div className="relative group">
              <button className="text-tea-950/80 hover:text-tea-800 font-bold text-[10px] lg:text-xs uppercase tracking-widest transition-colors flex items-center gap-1">
                Menu
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-stone-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-left z-50 overflow-hidden">
                <Link to="/about" className="block px-6 py-4 text-stone-600 hover:bg-stone-50 hover:text-tea-600 transition-colors font-serif border-b border-stone-50">
                  About Us
                </Link>
                <Link to="/who-we-serve" className="block px-6 py-4 text-stone-600 hover:bg-stone-50 hover:text-tea-600 transition-colors font-serif">
                  Who We Serve
                </Link>
              </div>
            </div>

            <Link to="/shop" className="text-tea-950/80 hover:text-tea-800 font-bold text-[10px] lg:text-xs uppercase tracking-widest transition-colors">Shop</Link>
            {isAuthenticated ? (
              <>
                <Link to="/orders" className="text-tea-950/80 hover:text-tea-800 font-bold text-[10px] lg:text-xs uppercase tracking-widest transition-colors">Orders</Link>
                <Link to="/event-bookings" className="text-tea-950/80 hover:text-tea-800 font-bold text-[10px] lg:text-xs uppercase tracking-widest transition-colors">Events</Link>
              </>
            ) : (
              // Render empty invisible placeholder to maintain height if needed, but horizontal shift is inevitable if item appears. 
              // Ideally we shouldn't reserve space for "Orders" if user isn't logged in, that looks weird.
              // But valid CLS happens if it pops in. 
              // If we can't avoid the pop-in (state check), we can at least ensure the font doesn't shift IT.
              null
            )}
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-3 text-tea-950/70 hover:text-tea-800 transition-colors focus:outline-none focus:ring-2 focus:ring-tea-500 rounded-lg"
              aria-label={isSearchOpen ? "Close search" : "Open search"}
              aria-expanded={isSearchOpen}
            >
              {isSearchOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Search className="w-5 h-5" aria-hidden="true" />}
            </button>

            <Link
              to="/cart"
              onClick={handleCartClick}
              className="p-3 text-tea-950/70 hover:text-tea-800 transition-colors relative focus:outline-none focus:ring-2 focus:ring-tea-500 rounded-lg"
              aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
            >
              <ShoppingCart className="w-5 h-5" aria-hidden="true" />
              {itemCount > 0 && (
                <span
                  className="absolute top-2 right-2 bg-tea-800 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg border border-white leading-none animate-scaleIn"
                  aria-hidden="true"
                >
                  {itemCount}
                </span>
              )}
            </Link>

            <button
              onClick={handleAuthClick}
              className="p-3 text-tea-950/70 hover:text-tea-800 transition-colors focus:outline-none focus:ring-2 focus:ring-tea-500 rounded-lg"
              aria-label={isAuthenticated ? "Go to profile" : "Sign in or create account"}
            >
              <User className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div
          className="bg-white border-b overflow-hidden px-4 py-4 animate-slideDown"
          role="search"
        >
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex items-center bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 shadow-inner">
            <Search className="w-5 h-5 text-gray-400 mr-3" aria-hidden="true" />
            <label htmlFor="navbar-search" className="sr-only">Search products</label>
            <input
              id="navbar-search"
              type="search"
              placeholder="Search tea, snacks..."
              className="bg-transparent w-full outline-none text-tea-950 font-medium py-1 placeholder:text-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search">
                <X className="w-5 h-5 text-gray-400 hover:text-tea-700" aria-hidden="true" />
              </button>
            )}
          </form>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
