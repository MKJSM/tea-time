
import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Phone, Mail, Save, Loader2, Camera } from 'lucide-react';
import { User } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateProfile, uploadAvatar } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';
import ResponsiveModal from '../common/ResponsiveModal';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user }) => {
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: user.name,
                email: user.email,
                phone: user.phone || '',
            });
            setPreviewUrl(null);
            setSelectedFile(null);
        }
    }, [isOpen, user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let avatarUrl = user.avatar;

            // 1. Upload new avatar if selected
            if (selectedFile) {
                const result = await dispatch(uploadAvatar(selectedFile)).unwrap();
                avatarUrl = result;
            }

            // 2. Update profile with new data (and new avatar URL if applicable)
            await dispatch(updateProfile({ ...formData, avatar: avatarUrl })).unwrap();

            toast.success('Profile updated successfully!');
            onClose();
        } catch (err: any) {
            toast.error(err || 'Failed to update profile');
        }
    };

    return (
        <ResponsiveModal
            isOpen={isOpen}
            onClose={onClose}
            className="md:max-w-lg"
            showCloseButton={false}
        >
            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-serif font-bold text-tea-900">Edit Profile</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-tea-50 rounded-full text-gray-400 hover:text-tea-800 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Upload Section */}
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-tea-50 shadow-inner bg-gray-100">
                                <img
                                    src={previewUrl || user.avatar || 'https://via.placeholder.com/150'}
                                    alt="Profile Preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <label className="absolute bottom-0 right-0 bg-tea-800 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-tea-700 transition-colors active:scale-90">
                                <Camera size={14} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                        <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-tea-600" size={18} />
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-tea-500 focus:border-transparent outline-none transition-all font-medium text-tea-900"
                                placeholder="Enter your name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-tea-600" size={18} />
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-tea-500 focus:border-transparent outline-none transition-all font-medium text-tea-900"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-tea-600" size={18} />
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-tea-500 focus:border-transparent outline-none transition-all font-medium text-tea-900"
                                placeholder="Enter your phone number"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-[2] py-4 bg-tea-800 text-white font-bold rounded-2xl shadow-xl hover:bg-tea-950 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </ResponsiveModal>
    );
};

export default EditProfileModal;
