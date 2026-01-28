
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Award, BookOpen, Edit3, LogIn,
  Compass, Bookmark, Map as MapIcon,
  Package, Shield, LogOut, ChevronRight,
  Heart, MapPin,
  HelpCircle, Info, Leaf, Sparkles
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchUserProfile, setAuthModalOpen, logoutUser, setAddressModalOpen, setEditingAddress } from '../features/auth/authSlice';

import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useGetFavoritesQuery } from '../features/favorites/favoritesApi';
import { useGetAddressesQuery } from '../features/addresses/addressesApi';
import EditProfileModal from '../components/auth/EditProfileModal';
import SecurityModal from '../components/auth/SecurityModal';
import ResponsiveModal from '../components/common/ResponsiveModal';

const ProfilePage: React.FC = () => {
  const { isAuthenticated, user: realUser } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isAddressesExpanded, setIsAddressesExpanded] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated || !realUser) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-lg border border-gray-100"
        >
          <div className="w-20 h-20 bg-tea-50 text-tea-700 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Shield size={32} />
          </div>
          <h2 className="text-4xl font-serif font-bold text-tea-900 mb-4 tracking-tight">Sign In Required</h2>
          <p className="text-gray-500 mb-10 font-light text-lg">Sign in to view your orders, favorites, and account details.</p>
          <button
            onClick={() => dispatch(setAuthModalOpen(true))}
            className="w-full py-5 bg-tea-800 text-white font-bold rounded-2xl hover:bg-tea-950 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            <LogIn size={20} />
            Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  // Use real user data from API (backend now provides mock data where missing)
  const user = realUser;

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully!', { icon: '👋' });
    navigate('/');
  };

  const SettingItem = ({
    icon: Icon,
    label,
    value,
    onClick,
    destructive = false
  }: {
    icon: any,
    label: string,
    value?: string,
    onClick?: () => void,
    destructive?: boolean
  }) => (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className="w-full flex items-center justify-between p-5 hover:bg-tea-50/50 transition-all group active:scale-[0.98]"
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
          destructive ? "bg-red-50 text-red-500" : "bg-gray-50 text-tea-800 group-hover:bg-white shadow-sm"
        )}>
          <Icon size={20} />
        </div>
        <div className="text-left">
          <p className={cn("text-sm font-bold", destructive ? "text-red-500" : "text-tea-950")}>{label}</p>
          {value && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{value}</p>}
        </div>
      </div>
      <ChevronRight size={18} className={cn("text-gray-300 transition-transform group-hover:translate-x-1", destructive && "text-red-200")} />
    </button>
  );

  const FavoritesSection = () => {
    const { data: favorites = [], isLoading } = useGetFavoritesQuery();
    const navigate = useNavigate();

    if (isLoading) return <SettingItem icon={Heart} label="Wishlist" value="Syncing..." />;

    if (favorites.length === 0) return <SettingItem icon={Heart} label="Wishlist" value="Empty" />;

    return (
      <div className="p-5 border-t border-gray-50">
        <div className="flex items-center justify-between mb-4" onClick={() => navigate('/shop')}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-tea-50 text-tea-800 rounded-xl flex items-center justify-center">
              <Heart size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-tea-950">Favorites</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{favorites.length} Saved Items</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {favorites.map(tea => (
            <Link key={tea.id} to={`/product/${tea.id}`} className="flex-shrink-0 w-24 group">
              <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden mb-2 border border-gray-100 group-hover:border-tea-300 transition-colors">
                <img src={tea.image} alt={tea.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-[10px] font-bold text-tea-900 truncate">{tea.name}</p>
              <p className="text-[9px] text-gray-400">₹{tea.price}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  const { data: addresses = [] } = useGetAddressesQuery(undefined, { skip: !isAuthenticated });

  return (
    <div className="min-h-screen bg-cream-paper pb-32">
      {/* 1. Elegant Header */}
      <div className="bg-white px-4 sm:px-6 pt-8 sm:pt-12 pb-8 sm:pb-10 border-b border-tea-50">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <div className="relative mb-4 sm:mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-tea-800 to-accent-500">
              {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover rounded-full border-4 border-white" />
              ) : (
                <div className="w-full h-full rounded-full border-4 border-white bg-tea-50 flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-serif font-bold text-tea-800">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute bottom-0 right-0 bg-tea-800 text-white p-2.5 rounded-full shadow-lg border-2 border-white active:scale-90 transition-transform"
            >
              <Edit3 size={14} />
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-tea-950 mb-1">{user.name}</h1>
          <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-widest mb-6">
            {user.email} • {user.phone || 'No phone added'}
          </p>

          <div className="w-full bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100 flex items-center justify-around shadow-inner">
            <div className="text-center">
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active Orders</p>
              <p className="text-base sm:text-lg font-serif font-bold text-tea-900">{user.active_orders_count || 0}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Wishlist</p>
              <p className="text-base sm:text-lg font-serif font-bold text-tea-900">{user.wishlist_count || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8 space-y-6 sm:space-y-8">
        {/* 2. Current Offer */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-tea-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10"><Compass size={120} /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-accent-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-tea-200">Special Offer</span>
            </div>
            <h3 className="text-xl font-serif font-bold mb-1">Get 20% Off on First Order</h3>
            <p className="text-xs text-tea-100/70 mb-6 font-light">Use code WELCOME20 at checkout.</p>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-accent-500 w-[65%]" />
            </div>
          </div>
        </motion.section>

        {/* 3. My Orders */}
        <section className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">My Orders</h4>
          </div>
          <div className="divide-y divide-gray-50">
            <SettingItem icon={Package} label="Order History" value={`${user.active_orders_count || 0} Active`} onClick={() => navigate('/orders')} />
            <SettingItem icon={Award} label="Rewards" value="0 Points" />
          </div>
        </section>

        {/* 4. My Favorites */}
        <section className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">My Favorites</h4>
          </div>
          <div className="divide-y divide-gray-50">
            <FavoritesSection />
          </div>
        </section>

        {/* 5. Account Settings */}
        <section className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Account Settings</h4>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="relative">
              <SettingItem
                icon={MapPin}
                label="Delivery Address"
                value={addresses && addresses.length > 0 ? `${addresses.length} Saved` : 'Add New'}
                onClick={() => {
                  if (addresses && addresses.length > 0) {
                    setIsAddressesExpanded(!isAddressesExpanded);
                  } else {
                    dispatch(setEditingAddress(null));
                    dispatch(setAddressModalOpen(true));
                  }
                }}
              />
              <AnimatePresence>
                {isAddressesExpanded && addresses && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-gray-50/50 border-t border-gray-100"
                  >
                    <div className="p-4 space-y-3">
                      {addresses.map((addr) => (
                        <div key={addr.id} className="p-3 bg-white rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-tea-900 uppercase tracking-wide">{addr.label}</span>
                              {addr.is_default && (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded-md uppercase tracking-wide">Default</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 font-medium line-clamp-1">{addr.street_address}, {addr.city}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatch(setEditingAddress(addr));
                              dispatch(setAddressModalOpen(true));
                            }}
                            className="p-2 text-gray-400 hover:text-tea-600 hover:bg-tea-50 rounded-lg transition-colors"
                          >
                            <Edit3 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          dispatch(setEditingAddress(null));
                          dispatch(setAddressModalOpen(true));
                        }}
                        className="w-full py-3 border border-dashed border-tea-200 text-tea-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-tea-50 transition-colors flex items-center justify-center gap-2"
                      >
                        Add New Address
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <SettingItem icon={Shield} label="Security" onClick={() => setIsSecurityModalOpen(true)} />
          </div>
        </section>

        {/* 6. Support & Legal */}
        <section className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
          <div className="divide-y divide-gray-50">
            <SettingItem icon={HelpCircle} label="Help & Support" onClick={() => navigate('/support')} />
            <SettingItem icon={Info} label="About Us" onClick={() => navigate('/about')} />
          </div>
        </section>

        {/* 7. Logout Action */}
        <section className="pt-4">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-600 font-bold rounded-[2.5rem] hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 active:scale-[0.98]"
          >
            <LogOut size={20} />
            <span className="text-sm uppercase tracking-widest">Log Out</span>
          </button>
        </section>

        <p className="text-center text-[10px] text-gray-300 font-medium uppercase tracking-widest pb-10">
          Tea Time v2.4.0
        </p>
      </div>

      {/* Logout Confirmation Modal */}
      <ResponsiveModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Log Out?"
        className="max-w-sm mx-auto"
      >
        <div className="p-6 pt-2 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LogOut size={32} />
          </div>
          <p className="text-gray-500 mb-8 font-light leading-relaxed">Are you sure you want to log out of your account?</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleLogout}
              className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg hover:bg-red-600 transition-all active:scale-[0.98]"
            >
              Yes, Log Out
            </button>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="w-full py-4 bg-white text-gray-400 font-bold text-sm rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      </ResponsiveModal>
      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={realUser}
      />
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
};

export default ProfilePage;
