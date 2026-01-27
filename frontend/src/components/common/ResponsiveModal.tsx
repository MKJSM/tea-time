import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

interface ResponsiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    className?: string; // For additional styling on the modal container
    showCloseButton?: boolean;
    customHeader?: React.ReactNode;
}

import useEscapeKey from '../../hooks/useEscapeKey';

const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    className = '',
    showCloseButton = true,
    customHeader
}) => {
    useScrollLock(isOpen);
    useEscapeKey(onClose, isOpen);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640); // sm breakpoint
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const desktopVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 }
    };

    const mobileVariants = {
        hidden: { y: '100%' },
        visible: { y: 0 },
        exit: { y: '100%' }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        variants={isMobile ? mobileVariants : desktopVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ type: "spring", damping: 25, stiffness: 120 }}
                        className={`
              relative w-full z-10 bg-white shadow-2xl overflow-hidden flex flex-col
              rounded-t-[2rem] sm:rounded-[2.5rem] 
              max-h-[90vh] sm:max-h-[85vh]
              ${isMobile ? 'pb-safe' : ''} 
              ${className}
            `}
                        style={{
                            // Mobile specific styles mostly handled by classes, but ensuring full width on mobile
                            width: isMobile ? '100%' : undefined
                        }}
                    >
                        {/* Header / Drag Handle for Mobile */}
                        {isMobile && !customHeader && (
                            <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
                            </div>
                        )}

                        {/* Title / Close Button Header (Optional) or Custom Header */}
                        {customHeader ? (
                            <div className="flex-none w-full z-50 bg-white relative">
                                {customHeader}
                            </div>
                        ) : (title || showCloseButton) ? (
                            <div className="flex justify-between items-center p-5 sm:p-8 border-b border-gray-50 shrink-0">
                                {title && <h3 className="text-xl font-serif font-bold text-tea-900">{title}</h3>}
                                {showCloseButton && !isMobile && (
                                    <button
                                        onClick={onClose}
                                        className="p-2 sm:p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-tea-800 rounded-full transition-all"
                                        aria-label="Close modal"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                                {/* On mobile, we might rely on swipe down or backdrop tape, but keeping an X is good for UX too if title exists */}
                                {showCloseButton && isMobile && (
                                    <button
                                        onClick={onClose}
                                        className="ml-auto p-2 bg-gray-100/50 rounded-full"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        ) : null}

                        {/* Content Area */}
                        <div className="flex-grow overflow-y-auto custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ResponsiveModal;
