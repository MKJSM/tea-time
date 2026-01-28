import React from 'react';
import { Copy, Facebook, Twitter, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import ResponsiveModal from './ResponsiveModal';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    text?: string;
    url?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, title, text, url = window.location.href }) => {

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
    };

    const handleShare = (platform: string) => {
        let shareUrl = '';
        const encodedUrl = encodeURIComponent(url);
        const encodedText = encodeURIComponent(text || title);

        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%0A%0A${encodedUrl}`;
                break;
            default:
                return;
        }

        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    return (
        <ResponsiveModal
            isOpen={isOpen}
            onClose={onClose}
            title="Share"
            className="sm:max-w-sm sm:mx-auto"
        >
            <div className="p-6 space-y-6 min-h-[30vh] sm:min-h-0">
                <div className="flex justify-between gap-2">
                    <button onClick={() => handleShare('facebook')} className="flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-colors group">
                        <div className="w-10 h-10 bg-blue-100/50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Facebook size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Facebook</span>
                    </button>
                    <button onClick={() => handleShare('twitter')} className="flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-sky-50 hover:text-sky-500 transition-colors group">
                        <div className="w-10 h-10 bg-sky-100/50 text-sky-500 rounded-full flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">
                            <Twitter size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Twitter</span>
                    </button>
                    <button onClick={() => handleShare('email')} className="flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-100 hover:text-gray-600 transition-colors group">
                        <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center group-hover:bg-gray-600 group-hover:text-white transition-colors">
                            <Mail size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Email</span>
                    </button>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3 border border-gray-100">
                    <p className="flex-grow text-xs text-gray-500 font-medium truncate">{url}</p>
                    <button
                        onClick={handleCopy}
                        className="p-2 bg-white text-tea-700 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                        title="Copy Link"
                    >
                        <Copy size={16} />
                    </button>
                </div>
            </div>
        </ResponsiveModal>
    );
};

export default ShareModal;
