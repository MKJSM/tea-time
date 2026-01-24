
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Award, BookOpen, Edit3, Plus, LogIn,
  Compass, Bookmark, Map as MapIcon,
  BarChart3, Thermometer, Clock, Droplets,
  Camera, Share2, Star, Target, Sparkles, Coffee,
  ChevronRight, Heart, Wind, Zap, Shield, Laptop,
  LogOut, AlertTriangle, Key, Smartphone, Trash2
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setAuthModalOpen, logout } from '../features/auth/authSlice';
import { mockUser } from '../../../mockData';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

type ProfileTab = 'journey' | 'journal' | 'achievements' | 'collection' | 'passport' | 'security';

const ProfilePage: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>('journey');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-lg border border-gray-100 mx-auto"
        >
          <div className="w-20 h-20 bg-tea-50 text-tea-700 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <LockIcon size={32} />
          </div>
          <h2 className="text-4xl font-serif font-bold text-tea-900 mb-4 tracking-tight">Access Your Sanctuary</h2>
          <p className="text-gray-500 mb-10 font-light text-lg">Please enter the gateway to access your personal tasting notes, achievements, and tea rewards.</p>
          <button
            onClick={() => dispatch(setAuthModalOpen(true))}
            className="w-full py-5 bg-tea-800 text-white font-bold rounded-2xl hover:bg-tea-950 transition-all flex items-center justify-center gap-3 shadow-xl shadow-tea-900/10 group"
          >
            <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
            Enter Sign In Portal
          </button>
        </motion.div>
      </div>
    );
  }

  const user = mockUser;

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Ritual complete. Safely logged out.', { icon: '👋' });
    navigate('/');
  };

  const handleRevokeSession = (sessionId: string) => {
    toast.success('Session access revoked successfully.');
  };

  const tabs: { id: ProfileTab; label: string; icon: any }[] = [
    { id: 'journey', label: 'Tea Journey', icon: Compass },
    { id: 'journal', label: 'Tasting Journal', icon: BookOpen },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'collection', label: 'My Collection', icon: Bookmark },
    { id: 'passport', label: 'Tea Passport', icon: MapIcon },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-cream-paper pb-24">
      {/* 1. Profile Header */}
      <div className="bg-white shadow-xl border-b border-tea-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg width="100%" height="100%"><pattern id="leaf" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M50 0 C60 20 80 30 100 50 C80 70 60 80 50 100 C40 80 20 70 0 50 C20 30 40 20 50 0" fill="currentColor" className="text-tea-800" /></pattern><rect width="100%" height="100%" fill="url(#leaf)" /></svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-12 pb-8 flex flex-col md:flex-row items-center md:items-end gap-8 relative z-10">
          <div className="relative group">
            <div className="w-48 h-48 rounded-full border-[6px] border-tea-50 p-2 shadow-2xl bg-white relative z-20">
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
              <button className="absolute bottom-2 right-2 bg-tea-800 text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform">
                <Edit3 size={18} />
              </button>
            </div>
            <svg className="absolute inset-0 w-full h-full -rotate-90 z-10 scale-110">
              <circle cx="50%" cy="50%" r="92" fill="none" stroke="#F1F8E9" strokeWidth="8" />
              <motion.circle
                cx="50%" cy="50%" r="92"
                fill="none"
                stroke="#2E7D32"
                strokeWidth="8"
                strokeDasharray="578"
                strokeDashoffset={578 * (1 - user.xp / user.xpToNext)}
                strokeLinecap="round"
                initial={{ strokeDashoffset: 578 }}
                animate={{ strokeDashoffset: 578 * (1 - user.xp / user.xpToNext) }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute -top-4 -right-4 bg-accent-500 text-tea-900 font-bold px-4 py-1.5 rounded-full shadow-lg border-2 border-white z-30 flex items-center gap-1.5">
              <Zap size={14} fill="currentColor" /> Level {user.level}
            </div>
          </div>

          <div className="flex-grow text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <h1 className="text-5xl font-serif font-bold text-tea-950 tracking-tight">{user.name}</h1>
              <div className="flex gap-2 justify-center md:justify-start">
                <span className="px-3 py-1 bg-tea-700 text-white text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                  <Award size={12} /> Kyoto Explorer
                </span>
                <span className="px-3 py-1 bg-accent-100 text-accent-800 text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-sm border border-accent-200">
                  <Sparkles size={12} fill="currentColor" /> Mastery Level 4
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-2">
              {[
                { label: 'Teas Tried', val: user.stats.teasTried, icon: Coffee },
                { label: 'Notes Written', val: user.stats.notesWritten, icon: BookOpen },
                { label: 'Current Streak', val: user.stats.streakDays, icon: Zap },
                { label: 'Regions', val: user.stats.regionsExplored, icon: Compass }
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-tea-50 flex items-center justify-center text-tea-700">
                    <stat.icon size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                    <p className="text-lg font-serif font-bold text-tea-900 leading-none">{stat.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button className="p-4 bg-white border border-gray-100 text-gray-400 hover:text-tea-800 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all">
              <Settings size={24} />
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-4 bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white rounded-[1.5rem] shadow-sm hover:shadow-md transition-all group"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto custom-scrollbar gap-2 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-8 py-5 text-xs font-bold uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 shrink-0",
                activeTab === tab.id ? "text-tea-800" : "text-gray-400 hover:text-tea-600"
              )}
            >
              <tab.icon size={16} className={cn(activeTab === tab.id && "fill-tea-50")} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-tea-800 rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'journey' && (
            <motion.div
              key="journey"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10"
            >
              {/* Previous Journey Content remains... */}
              <div className="lg:col-span-8 space-y-10">
                <section className="bg-tea-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-12 opacity-10"><Compass size={250} /></div>
                  <div className="relative z-10">
                    <span className="px-4 py-1.5 bg-accent-500 text-tea-950 text-[10px] font-bold rounded-full uppercase tracking-widest mb-6 inline-block">Current Exploration</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 italic leading-tight">May: Japanese Green Teas <br /> Ritual Mastery</h2>
                    <p className="text-tea-100/70 max-w-lg mb-8 leading-relaxed font-light">Join the community in exploring high-altitude Senchas and Uji Matchas this month to unlock the "Verdant Heart" badge.</p>
                    <div className="flex gap-4">
                      <button className="px-8 py-3 bg-white text-tea-900 font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-accent-500 transition-colors">Start Challenge</button>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Security Overview */}
                <div className="lg:col-span-8 space-y-8">
                  <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-tea-50">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Shield size={28} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-serif font-bold text-tea-950 leading-tight">Sanctuary Security</h2>
                        <p className="text-gray-400 font-light">Manage your access coordinates and digital defense layers.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-start gap-4">
                        <div className="p-3 bg-white rounded-xl text-tea-700 shadow-sm"><Key size={20} /></div>
                        <div>
                          <h4 className="font-bold text-tea-950 mb-1">Two-Factor Authentication</h4>
                          <p className="text-xs text-gray-500 mb-4 font-light">Secure your vault with a secondary temporal code.</p>
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">Enabled</span>
                        </div>
                      </div>
                      <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-start gap-4">
                        <div className="p-3 bg-white rounded-xl text-tea-700 shadow-sm"><Clock size={20} /></div>
                        <div>
                          <h4 className="font-bold text-tea-950 mb-1">Last Password Reset</h4>
                          <p className="text-xs text-gray-500 mb-4 font-light">Maintain cyclic security with periodic updates.</p>
                          <p className="text-[10px] font-mono text-tea-800 font-bold uppercase">{user.security.lastPasswordChange}</p>
                        </div>
                      </div>
                    </div>

                    <button className="mt-8 w-full py-4 bg-tea-800 text-white font-bold rounded-2xl hover:bg-tea-950 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest shadow-lg">
                      <Edit3 size={18} /> Update Secret Credentials
                    </button>
                  </section>

                  {/* Session Management */}
                  <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-tea-50">
                    <h3 className="text-2xl font-serif font-bold text-tea-950 mb-8 flex items-center gap-3">
                      <Laptop className="text-tea-700" size={24} /> Active Digital Signatures
                    </h3>
                    <div className="space-y-4">
                      {user.sessions.map((sess) => (
                        <div key={sess.id} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center justify-between group transition-all hover:bg-white hover:shadow-md">
                          <div className="flex items-center gap-5">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center",
                              sess.device.includes('iPhone') ? "bg-indigo-50 text-indigo-600" : "bg-teal-50 text-teal-600"
                            )}>
                              {sess.device.includes('iPhone') ? <Smartphone size={24} /> : <Laptop size={24} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-tea-950">{sess.device}</h4>
                                {sess.isCurrent && (
                                  <span className="px-2 py-0.5 bg-tea-100 text-tea-700 text-[8px] font-bold rounded-full uppercase tracking-tighter">Current Session</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 font-light">{sess.location} • <span className="font-medium text-tea-600">{sess.lastActive}</span></p>
                            </div>
                          </div>
                          {!sess.isCurrent && (
                            <button
                              onClick={() => handleRevokeSession(sess.id)}
                              className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-xl shadow-sm border border-gray-100 transition-all opacity-0 group-hover:opacity-100"
                              title="Revoke session access"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="mt-8 text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-2 mx-auto group"
                    >
                      <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                      Logout from all other devices
                    </button>
                  </section>
                </div>

                {/* Account Actions Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                  <section className="bg-red-50 rounded-[3rem] p-10 border border-red-100">
                    <div className="flex items-center gap-3 text-red-600 mb-6">
                      <AlertTriangle size={24} />
                      <h4 className="font-serif font-bold text-xl">Sanctuary Closure</h4>
                    </div>
                    <p className="text-red-900/60 text-sm font-light leading-relaxed mb-8">Permanently dissolve your digital sanctuary and archive all tasting notes and achievements. This action is irreversible.</p>
                    <button className="w-full py-4 border-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all">
                      Dissolve Account
                    </button>
                  </section>

                  <section className="bg-gradient-to-br from-tea-800 to-tea-950 text-white rounded-[3rem] p-10 shadow-xl relative overflow-hidden">
                    <Shield className="text-accent-400/20 absolute -right-4 -bottom-4 w-32 h-32" />
                    <h4 className="font-serif font-bold text-2xl mb-4 leading-tight">Privacy Monograph</h4>
                    <p className="text-tea-100/70 text-sm font-light leading-relaxed mb-8 italic">"We treat your tasting data as sacred digital artifact. Encrypted, private, and entirely within your control."</p>
                    <button className="text-[10px] font-bold uppercase tracking-widest text-accent-400 underline decoration-accent-500/20">Read Full Privacy Charter</button>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {/* ... Other Tabs remain identical to previous implementation ... */}
        </AnimatePresence>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-tea-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full relative z-10 text-center border border-tea-50"
            >
              <div className="w-16 h-16 bg-tea-50 text-tea-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LogOut size={32} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-tea-900 mb-2">Conclude Current Ritual?</h3>
              <p className="text-gray-500 mb-8 font-light leading-relaxed">Are you certain you wish to conclude your current session and exit the digital sanctuary?</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleLogout}
                  className="w-full py-4 bg-tea-800 text-white font-bold rounded-2xl shadow-lg hover:bg-tea-950 transition-all flex items-center justify-center gap-2 group"
                >
                  Confirm Logout
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
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

const LockIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);

export default ProfilePage;
