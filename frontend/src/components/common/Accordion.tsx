
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children, isOpen, onToggle }) => (
    <div className="border-b border-gray-100 last:border-0">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between py-4 text-left transition-colors hover:text-tea-700"
        >
            <span className="text-sm font-semibold uppercase tracking-widest text-gray-900">{title}</span>
            <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform duration-300", isOpen && "rotate-180")} />
        </button>
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="pb-6 text-sm text-gray-600 leading-relaxed space-y-3">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);
