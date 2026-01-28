import React from 'react';
import {
    X, Shield, Lock, Smartphone, Laptop, Tablet,
    LogOut, ChevronRight, Globe, AlertCircle,
    CheckCircle2, KeyRound, Loader2, Trash2
} from 'lucide-react';
import { useSecurity } from '../../features/auth/useSecurity';
import { parseUserAgent } from '../../utils/userAgent';
import { checkStrength, getStrengthColor, getStrengthLabel } from '../../utils/password';
import ResponsiveModal from '../common/ResponsiveModal';

interface SecurityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose }) => {
    const {
        view,
        setView,
        isLoading,
        devices,
        passwordData,
        setPasswordData,
        handleDeviceLogout,
        handleLogoutAll,
        confirmLogoutAll,
        cancelLogoutAll,
        handlePasswordChange
    } = useSecurity(isOpen);

    const DeviceIcon = ({ ua }: { ua: string }) => {
        const { deviceType } = parseUserAgent(ua);
        if (deviceType === 'mobile') return <Smartphone size={20} />;
        if (deviceType === 'tablet') return <Tablet size={20} />;
        if (deviceType === 'desktop') return <Laptop size={20} />;
        return <Globe size={20} />;
    };


    const { score, checks } = checkStrength(passwordData.newPassword);
    const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword;
    const isDifferent = passwordData.currentPassword !== passwordData.newPassword;
    const isFormValid = score === 4 && passwordsMatch && isDifferent && passwordData.currentPassword.length > 0;


    const header = (
        <div className="p-5 sm:p-8 border-b border-gray-50 flex justify-between items-center z-20 bg-white">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-tea-50 text-tea-700 rounded-xl flex items-center justify-center">
                    {view === 'main' ? <Shield size={22} /> : view === 'confirmLogoutAll' ? <AlertCircle size={22} /> : <KeyRound size={22} />}
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-tea-900">
                    {view === 'main' ? 'Security Settings' : view === 'confirmLogoutAll' ? 'Confirm Logout' : 'Change Password'}
                </h2>
            </div>
            <button
                onClick={onClose}
                className="p-2 hover:bg-tea-50 rounded-full text-gray-400 hover:text-tea-800 transition-colors"
            >
                <X size={24} />
            </button>
        </div>
    );

    return (
        <ResponsiveModal
            isOpen={isOpen}
            onClose={onClose}
            className="md:max-w-lg"
            showCloseButton={false}
            customHeader={header}
        >
            <div className="flex-grow overflow-y-auto p-5 sm:p-8 custom-scrollbar min-h-[85vh] sm:min-h-0">
                {view === 'confirmLogoutAll' ? (
                    <div className="space-y-6">
                        <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex gap-3 text-red-800">
                            <AlertCircle className="shrink-0 mt-0.5" size={18} />
                            <p className="text-sm font-medium">
                                You are about to log out from ALL devices, including this one. You will need to log in again.
                            </p>
                        </div>
                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={cancelLogoutAll}
                                className="flex-1 py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmLogoutAll}
                                disabled={isLoading}
                                className="flex-[2] py-4 bg-red-600 text-white font-bold rounded-2xl shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                                Logout All Devices
                            </button>
                        </div>
                    </div>
                ) : view === 'main' ? (
                    <div className="space-y-6">
                        <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100 flex gap-3 text-orange-800">
                            <AlertCircle className="shrink-0 mt-0.5" size={18} />
                            <p className="text-sm font-medium">Review your login activity regularly to keep your account secure.</p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Active Sessions</h3>
                                {devices.length > 0 && (
                                    <button
                                        onClick={() => handleLogoutAll(onClose)}
                                        className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <Trash2 size={12} />
                                        Logout All
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {devices.map((device) => (
                                    <div key={device.session_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-tea-600 shadow-sm">
                                                <DeviceIcon ua={device.user_agent || ''} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-tea-900">
                                                        {(() => {
                                                            const { browser, os } = parseUserAgent(device.user_agent || '');
                                                            return `${browser} on ${os}`;
                                                        })()}
                                                    </p>
                                                    {device.is_current && (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 font-medium">
                                                    {device.ip_address || 'Unknown IP'} • {device.last_active_at ? new Date(device.last_active_at).toLocaleDateString() : 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                        {!device.is_current && (
                                            <button
                                                onClick={() => handleDeviceLogout(device.session_id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Log out device"
                                            >
                                                <LogOut size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {devices.length === 0 && (
                                    <p className="text-center text-gray-400 py-4 text-sm">No active sessions found.</p>
                                )}
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => setView('changePassword')}
                                className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:border-tea-300 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-tea-50 text-tea-700 rounded-xl flex items-center justify-center group-hover:bg-tea-100 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-tea-900">Change Password</p>
                                        <p className="text-xs text-gray-400 font-medium">Update your password securely</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-gray-300 group-hover:text-tea-500 transition-colors" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Current Password</label>
                            <input
                                type="password"
                                required
                                value={passwordData.currentPassword}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-tea-500 focus:border-transparent outline-none transition-all font-medium"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                                {passwordData.newPassword && (
                                    <span className={`text-xs font-bold transition-colors ${score <= 2 ? 'text-red-500' : score === 3 ? 'text-yellow-500' : 'text-green-500'}`}>
                                        {getStrengthLabel(score)}
                                    </span>
                                )}
                            </div>
                            <input
                                type="password"
                                required
                                value={passwordData.newPassword}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className={`w-full px-4 py-4 bg-gray-50 border rounded-2xl outline-none transition-all font-medium ${passwordData.newPassword && !isDifferent
                                    ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                                    : 'border-gray-100 focus:ring-2 focus:ring-tea-500 focus:border-transparent'
                                    }`}
                                placeholder="Min 8 characters, numbers & symbols"
                            />
                            {passwordData.newPassword && !isDifferent && (
                                <p className="text-xs text-red-500 font-medium mt-2 ml-1 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    New password cannot be the same as current password
                                </p>
                            )}

                            {/* Strength Meter */}
                            {passwordData.newPassword && (
                                <div className="mt-3 space-y-2">
                                    <div className="flex gap-1 h-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={`flex-1 rounded-full transition-all duration-300 ${score >= i ? getStrengthColor(score) : 'bg-gray-200'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <div className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider ${checks.length ? 'text-green-600' : 'text-gray-400'}`}>
                                            <CheckCircle2 size={12} className={checks.length ? 'text-green-500' : 'text-gray-300'} />
                                            8+ chars
                                        </div>
                                        <div className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider ${checks.hasUpper ? 'text-green-600' : 'text-gray-400'}`}>
                                            <CheckCircle2 size={12} className={checks.hasUpper ? 'text-green-500' : 'text-gray-300'} />
                                            Uppercase
                                        </div>
                                        <div className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider ${checks.hasLower ? 'text-green-600' : 'text-gray-400'}`}>
                                            <CheckCircle2 size={12} className={checks.hasLower ? 'text-green-500' : 'text-gray-300'} />
                                            Lowercase
                                        </div>
                                        <div className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider ${checks.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                                            <CheckCircle2 size={12} className={checks.hasNumber ? 'text-green-500' : 'text-gray-300'} />
                                            Number
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                value={passwordData.confirmPassword}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className={`w-full px-4 py-4 bg-gray-50 border rounded-2xl outline-none transition-all font-medium ${passwordData.confirmPassword && !passwordsMatch
                                    ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                                    : 'border-gray-100 focus:ring-2 focus:ring-tea-500 focus:border-transparent'
                                    }`}
                                placeholder="Re-enter new password"
                            />
                            {passwordData.confirmPassword && !passwordsMatch && (
                                <p className="text-xs text-red-500 font-medium mt-2 ml-1 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    Passwords do not match
                                </p>
                            )}
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setView('main');
                                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                }}
                                className="flex-1 py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !isFormValid}
                                className="flex-[2] py-4 bg-tea-800 text-white font-bold rounded-2xl shadow-xl hover:bg-tea-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                Update Password
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </ResponsiveModal>
    );
};

export default SecurityModal;
