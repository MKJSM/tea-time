import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string;
}

export function AdminModal({ isOpen, onClose, title, children, width }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ width: width || 'min(90vw, 640px)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="modal-header">
                    <h2>{title}</h2>
                    <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
                        ✕
                    </button>
                </header>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}
