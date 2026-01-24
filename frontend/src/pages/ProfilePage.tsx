
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Award, BookOpen, Edit3, LogIn,
  Compass, Bookmark, Map as MapIcon,
  Package, Shield, LogOut, ChevronRight,
  Heart, Zap, Star, MapPin, CreditCard,
  HelpCircle, Info, Leaf, Sparkles
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchCurrentUser, setAuthModalOpen, logout, logoutUser } from '../features/auth/authSlice';
import { mockUser } from '../mockData';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { isAuthenticated, user: realUser } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCurrentUser());
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
          <h2 className="text-4xl font-serif font-bold text-tea-900 mb-4 tracking-tight">Your Sanctuary Awaits</h2>
          <p className="text-gray-500 mb-10 font-light text-lg">Sign in to access your curated collection, rewards, and personal tea journal.</p>
          <button
            onClick={() => dispatch(setAuthModalOpen(true))}
            className="w-full py-5 bg-tea-800 text-white font-bold rounded-2xl hover:bg-tea-950 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            <LogIn size={20} />
            Enter Sign In Portal
          </button>
        </motion.div>
      </div>
    );
  }

  // Merge real user data with mock stats for visual completeness since backend is MVP
  const user = {
    ...mockUser,
    id: realUser.id.toString(),
    name: realUser.name,
    email: realUser.email,
    // Keep mock avatar/stats for now until backend supports them
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Ritual complete. Safely logged out.', { icon: '👋' });
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
      onClick={onClick}
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

  return (
    <div className="min-h-screen bg-cream-paper pb-32">
      {/* 1. Elegant Header */}
      <div className="bg-white px-6 pt-12 pb-10 border-b border-tea-50">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-tea-800 to-accent-500">
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover rounded-full border-4 border-white" />
            </div>
            <button className="absolute bottom-0 right-0 bg-tea-800 text-white p-2 rounded-full shadow-lg border-2 border-white">
              <Edit3 size={14} />
            </button>
          </div>

          <h1 className="text-3xl font-serif font-bold text-tea-950 mb-1">{user.name}</h1>
          <p className="text-sm text-gray-400 font-medium mb-6">{user.email}</p>

          <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-around">
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rituals</p>
              <p className="text-lg font-serif font-bold text-tea-900">{user.stats.teasTried}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Credits</p>
              <p className="text-lg font-serif font-bold text-tea-900">{user.loyaltyPoints}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Mastery</p>
              <p className="text-lg font-serif font-bold text-tea-900">Lvl {user.level}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-8 space-y-8">
        {/* 2. Active Journey Highlight */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-tea-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10"><Compass size={120} /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-accent-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-tea-200">Current Exploration</span>
            </div>
            <h3 className="text-xl font-serif font-bold mb-1">Japanese Green Mastery</h3>
            <p className="text-xs text-tea-100/70 mb-6 font-light">Complete 3 Sencha tastings to unlock Kyoto badge.</p>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-accent-500 w-[65%]" />
            </div>
          </div>
        </motion.section>

        {/* 3. The Journey Group */}
        <section className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">The Journey</h4>
          </div>
          <div className="divide-y divide-gray-50">
            <SettingItem icon={Package} label="Order History" value="2 Active • 24 Past" onClick={() => navigate('/orders')} />
            <SettingItem icon={MapIcon} label="Tea Passport" value="5 Regions Explored" />
            <SettingItem icon={Award} label="Achievements" value="12 Badges Unlocked" />
          </div>
        </section>

        {/* 4. The Vault Group */}
        <section className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">The Vault</h4>
          </div>
          <div className="divide-y divide-gray-50">
            <SettingItem icon={BookOpen} label="Tasting Journal" value="18 Entries" />
            <SettingItem icon={Bookmark} label="My Collection" value="8 Saved Teas" />
            <SettingItem icon={Heart} label="Wishlist" />
          </div>
        </section>

        {/* 5. Account Settings Group */}
        <section className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Account Vault</h4>
          </div>
          <div className="divide-y divide-gray-50">
            <SettingItem icon={MapPin} label="Shipping Coordinates" />
            <SettingItem icon={CreditCard} label="Payment Methods" />
            <SettingItem icon={Shield} label="Sanctuary Security" />
            <SettingItem icon={Settings} label="App Preferences" />
          </div>
        </section>

        {/* 6. Support & Legal */}
        <section className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
          <div className="divide-y divide-gray-50">
            <SettingItem icon={HelpCircle} label="Help Center" />
            <SettingItem icon={Leaf} label="Sustainability Charter" />
            <SettingItem icon={Info} label="About Tea Time" />
          </div>
        </section>

        {/* 7. Logout Action */}
        <section className="pt-4">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-600 font-bold rounded-[2.5rem] hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 active:scale-[0.98]"
          >
            <LogOut size={20} />
            <span className="text-sm uppercase tracking-widest">Conclude Ritual</span>
          </button>
        </section>

        <p className="text-center text-[10px] text-gray-300 font-medium uppercase tracking-widest pb-10">
          Tea Time Version 2.4.0 • Built for Conscious Brewers
        </p>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-tea-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full relative z-10 text-center border border-tea-50"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LogOut size={32} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-tea-900 mb-2">Safe Travels?</h3>
              <p className="text-gray-500 mb-8 font-light leading-relaxed">Are you certain you wish to conclude your session and exit the digital sanctuary?</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleLogout}
                  className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg hover:bg-red-600 transition-all"
                >
                  Confirm Logout
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-4 bg-white text-gray-400 font-bold text-sm rounded-2xl hover:bg-gray-50 transition-all"
                >Return to Sanctuary</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
