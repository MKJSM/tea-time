import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Apple, Leaf, Sparkles, ChevronRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser, signupUser, setAuthModalOpen, setAddressModalOpen, setPendingCheckoutAfterAddress } from '../../features/auth/authSlice';
import { addressesApi } from '../../features/addresses/addressesApi';
import toast from 'react-hot-toast';
import ResponsiveModal from '../common/ResponsiveModal';

const AuthModal: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, isAuthModalOpen, pendingCheckoutAfterAddress } = useAppSelector((state) => state.auth);

  const onClose = useCallback(() => {
    dispatch(setAuthModalOpen(false));
  }, [dispatch]);

  // Handle ESC key is now handled by ResponsiveModal internally via AnimatePresence/Close logic? 
  // Wait, ResponsiveModal might not handle ESC unless we add it there. 
  // Let's rely on ResponsiveModal or add the listener there if needed.
  // Actually ResponsiveModal does NOT currently have ESC listener. 
  // We can add it to ResponsiveModal later or keep it here if strictly needed, 
  // but usually a modal library handles it.
  // For now, I'll keep the listener in ResponsiveModal logic if I could edit it, 
  // but since I already wrote it, I might add it here or just assume user clicks backdrop/X.
  // UPDATE: I will add ESC listener to ResponsiveModal in a future step if requested, 
  // or I can leave it here. However, `ResponsiveModal` is mounted only when open.

  // Let's add the ESC listener back here just to be safe if ResponsiveModal doesn't cover it yet.
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isAuthModalOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isAuthModalOpen, onClose]);


  const checkAddressesAndProceed = async () => {
    try {
      // Fetch user addresses
      const result = await dispatch(addressesApi.endpoints.getAddresses.initiate()).unwrap();

      if (result.length === 0) {
        // No addresses - open address modal
        dispatch(setAddressModalOpen(true));
      } else if (pendingCheckoutAfterAddress) {
        // Has addresses and pending checkout - navigate to checkout
        dispatch(setPendingCheckoutAfterAddress(false));
        navigate('/checkout');
      }
    } catch (err) {
      console.error('Failed to fetch addresses', err);
      // If fetch fails but pending checkout, still navigate
      if (pendingCheckoutAfterAddress) {
        dispatch(setPendingCheckoutAfterAddress(false));
        navigate('/checkout');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Email is required');
    if (!password) return toast.error('Password is required');

    try {
      if (isLogin) {
        await dispatch(loginUser({ email, password })).unwrap();
        toast.success('Welcome back!', {
          icon: '🍃',
          style: { borderRadius: '12px', background: '#1B5E20', color: '#fff' }
        });
      } else {
        if (!name) return toast.error('Name is required');
        await dispatch(signupUser({ name, email, password })).unwrap();
        toast.success('Account created successfully!', {
          icon: '🍃',
          style: { borderRadius: '12px', background: '#1B5E20', color: '#fff' }
        });
      }
      onClose();
      // Check addresses after successful login
      await checkAddressesAndProceed();
    } catch (err) {
      toast.error('Login failed. Please check your details.');
    }
  };

  const handleSocialLogin = async (provider: string) => {
    const toastId = toast.loading(`Connecting to ${provider}...`);
    setTimeout(async () => {
      try {
        await dispatch(loginUser({ email: `social_${provider.toLowerCase()}@teahaven.com`, password: 'social_dummy_password' })).unwrap();
        toast.success(`Successfully connected via ${provider}`, { id: toastId });
        onClose();
        await checkAddressesAndProceed();
      } catch (err) {
        toast.error('Login failed', { id: toastId });
      }
    }, 1200);
  };

  const CustomHeader = (
    <div className="flex items-center gap-3">
      <div className="bg-tea-800 p-2.5 rounded-2xl shadow-lg shadow-tea-900/10 scale-90 sm:scale-100">
        <Leaf className="text-white" size={24} />
      </div>
      {/* We can put title here directly or rely on modal prop, but AuthModal has dynamic title content */}
    </div>
  );

  return (
    <ResponsiveModal
      isOpen={isAuthModalOpen}
      onClose={onClose}
      className="md:max-w-lg"
      showCloseButton={true} // We want the X
    >
      {/* Custom Header Injection if reusable modal allowed? 
            ResponsiveModal has a fixed header structure. 
            We can hide the default header by not passing title and showCloseButton=false, then render our own.
            OR we can just put the branding inside the content.
            Let's putbranding inside content for maximum control since AuthModal was custom.
            Wait, ResponsiveModal forces a header if showCloseButton is true.
            Let's customize: pass title as null, but keep showCloseButton. 
            We'll render the Leaf icon inside the content top area or 
            just accept valid simplifications.
        */}

      <div className="p-6 sm:p-10 flex flex-col w-full">
        {/* Branded Header Area */}
        <div className="mb-6 sm:mb-8 flex justify-between items-start">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 text-tea-700 font-bold uppercase tracking-[0.2em] text-[9px] sm:text-[10px] mb-3 bg-tea-50/50 px-3 py-1 rounded-full border border-tea-100/50"
            >
              <Sparkles size={12} className="text-accent-600" />
              {isLogin ? 'Login' : 'Create Account'}
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-tea-950 mb-3 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Join Us'}
            </h2>
            <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed max-w-sm">
              {isLogin
                ? 'Sign in to your account to view your orders and favorites.'
                : 'Create an account to save your favorites and track your orders.'}
            </p>
          </div>

          {/* Brand Icon floating */}
          <div className="hidden sm:block bg-tea-800 p-2.5 rounded-2xl shadow-lg shadow-tea-900/10">
            <Leaf className="text-white" size={24} />
          </div>
        </div>

        {/* Social Integration */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleSocialLogin('Google')}
            className="py-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-center gap-3 hover:border-tea-200 hover:shadow-lg transition-all active:scale-[0.98] shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Google</span>
          </button>
          <button
            onClick={() => handleSocialLogin('Apple')}
            className="py-4 bg-black text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-900 hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <Apple size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Apple</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-5">
          <div className="h-px flex-grow bg-gray-100" />
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em] whitespace-nowrap">Or use account</span>
          <div className="h-px flex-grow bg-gray-100" />
        </div>

        {/* Form Logic */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-tea-700 transition-colors w-5 h-5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border border-gray-100 rounded-3xl outline-none focus:bg-white focus:ring-[6px] focus:ring-tea-500/5 focus:border-tea-200 transition-all text-base text-tea-950 placeholder:text-gray-300 shadow-sm"
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-tea-700 transition-colors w-5 h-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border border-gray-100 rounded-3xl outline-none focus:bg-white focus:ring-[6px] focus:ring-tea-500/5 focus:border-tea-200 transition-all text-base text-tea-950 placeholder:text-gray-300 shadow-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-tea-700 transition-colors w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border border-gray-100 rounded-3xl outline-none focus:bg-white focus:ring-[6px] focus:ring-tea-500/5 focus:border-tea-200 transition-all text-base text-tea-950 placeholder:text-gray-300 shadow-sm"
                required
              />
            </div>
            {isLogin && (
              <div className="text-right">
                <button type="button" className="text-[10px] text-gray-400 hover:text-tea-700 transition-colors font-bold uppercase tracking-widest px-2">
                  Forgot Password?
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-tea-800 hover:bg-tea-900 text-white font-bold rounded-3xl transition-all shadow-xl shadow-tea-900/20 flex items-center justify-center gap-3 group disabled:opacity-50 mt-4 active:scale-[0.98]"
          >
            <span className="tracking-[0.2em] text-xs uppercase">{isLogin ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-tea-700 hover:text-tea-900 transition-all flex items-center justify-center gap-2 mx-auto group bg-tea-50/80 px-6 py-3 rounded-full hover:bg-tea-100/80 active:scale-95"
          >
            {isLogin ? "New here? Create Account" : "Already have an account? Sign In"}
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Minimal Brand Footnote Logic */}
        <div className="mt-6 text-center border-t border-gray-100/50 pt-4">
          <p className="text-[10px] text-gray-400 font-medium italic tracking-wide">
            Fresh tea and snacks delivered to your door
          </p>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default AuthModal;
