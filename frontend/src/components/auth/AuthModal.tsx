
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, Apple, Leaf, Sparkles, ChevronRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser, setAuthModalOpen } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';

const AuthModal: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const dispatch = useAppDispatch();
  const { isLoading, isAuthModalOpen } = useAppSelector((state) => state.auth);

  const onClose = useCallback(() => {
    dispatch(setAuthModalOpen(false));
  }, [dispatch]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isAuthModalOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isAuthModalOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Email is required');
    if (!password) return toast.error('Password is required');

    try {
      if (isLogin) {
        await dispatch(loginUser({ email, password })).unwrap();
        toast.success('Welcome back to your sanctuary!', {
          icon: '🍃',
          style: { borderRadius: '12px', background: '#1B5E20', color: '#fff' }
        });
      } else {
        if (!name) return toast.error('Name is required');
        // import signupUser from authSlice
        // We need to make sure signupUser is exported and imported
        // Assuming it's in the same file as loginUser
        const { signupUser } = await import('../../features/auth/authSlice');
        await dispatch(signupUser({ name, email, password })).unwrap();
        toast.success('Your journey begins now.', {
          icon: '🍃',
          style: { borderRadius: '12px', background: '#1B5E20', color: '#fff' }
        });
      }
      onClose();
    } catch (err) {
      toast.error('Authentication failed. Please check your coordinates.');
    }
  };

  const handleSocialLogin = (provider: string) => {
    const toastId = toast.loading(`Connecting to ${provider}...`);
    setTimeout(() => {
      dispatch(loginUser({ email: `social_${provider.toLowerCase()}@teahaven.com`, password: 'social_dummy_password' }));
      toast.success(`Successfully connected via ${provider}`, { id: toastId });
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
          {/* Immersive Background Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-cream via-white to-tea-50"
          >
            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <svg width="100%" height="100%">
                <pattern id="leaf-bg" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M50 0 C60 20 80 30 100 50 C80 70 60 80 50 100 C40 80 20 70 0 50 C20 30 40 20 50 0" fill="currentColor" className="text-tea-900" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#leaf-bg)" />
              </svg>
            </div>

            {/* Soft Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-tea-200/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-200/20 blur-[120px] rounded-full" />
          </motion.div>

          {/* Modal Close Backdrop Click Area */}
          <div className="absolute inset-0 z-0" onClick={onClose} />

          {/* Floating Card Content */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="relative w-full h-full md:h-auto md:max-w-xl md:mx-4 z-10"
          >
            <div className="bg-white/80 backdrop-blur-xl md:rounded-[3.5rem] w-full h-full md:h-auto overflow-y-auto custom-scrollbar shadow-[0_32px_100px_-20px_rgba(13,61,16,0.15)] border border-white/50 flex flex-col">

              {/* Header: Branding & Close */}
              <div className="p-8 pb-0 flex justify-between items-start shrink-0">
                <div className="bg-tea-800 p-2.5 rounded-2xl shadow-lg shadow-tea-900/10">
                  <Leaf className="text-white" size={24} />
                </div>
                <button
                  onClick={onClose}
                  className="p-3 bg-gray-50 text-gray-400 hover:text-tea-800 rounded-full transition-all group"
                  aria-label="Close modal"
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              {/* Main Auth Content */}
              <div className="flex-grow p-8 pt-6 sm:p-12 md:p-14 flex flex-col justify-center max-w-lg mx-auto w-full">

                {/* Intro Section */}
                <div className="mb-10">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-2 text-tea-700 font-bold uppercase tracking-[0.2em] text-[10px] mb-3 bg-tea-50/50 px-3 py-1 rounded-full border border-tea-100/50"
                  >
                    <Sparkles size={12} className="text-accent-600" />
                    {isLogin ? 'Member Access' : 'New Arrival'}
                  </motion.div>
                  <h2 className="text-4xl sm:text-5xl font-serif font-bold text-tea-950 mb-3 tracking-tight">
                    {isLogin ? 'Welcome Back' : 'Begin Journey'}
                  </h2>
                  <p className="text-gray-500 font-light text-sm leading-relaxed">
                    {isLogin
                      ? 'Re-enter your digital sanctuary to access your curated collection.'
                      : 'Join our guild of connoisseurs to track rare flushes and tasting notes.'}
                  </p>
                </div>

                {/* Social Integration */}
                <div className="grid grid-cols-2 gap-4 mb-8">
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
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-grow bg-gray-100" />
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em] whitespace-nowrap">Or use account</span>
                  <div className="h-px flex-grow bg-gray-100" />
                </div>

                {/* Form Logic */}
                <form onSubmit={handleSubmit} className="space-y-5">
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
                          Recover Secret Key
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-5 bg-tea-800 hover:bg-tea-900 text-white font-bold rounded-3xl transition-all shadow-xl shadow-tea-900/20 flex items-center justify-center gap-3 group disabled:opacity-50 mt-4 active:scale-[0.98]"
                  >
                    <span className="tracking-[0.2em] text-xs uppercase">{isLogin ? 'Enter Sanctuary' : 'Establish Ritual'}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>

                {/* Mode Toggle */}
                <div className="mt-10 text-center">
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm font-bold text-tea-700 hover:text-tea-900 transition-all flex items-center justify-center gap-2 mx-auto group bg-tea-50/80 px-6 py-3 rounded-full hover:bg-tea-100/80 active:scale-95"
                  >
                    {isLogin ? "Join the collection" : "Already a member? Sign In"}
                    <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Minimal Brand Footnote */}
              <div className="p-8 text-center border-t border-gray-100/50 bg-gray-50/30 shrink-0">
                <p className="text-[10px] text-gray-400 font-medium italic tracking-wide">
                  "The leaf speaks to those who listen."
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
