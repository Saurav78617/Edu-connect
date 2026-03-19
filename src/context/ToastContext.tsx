import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000); // Auto remove after 5s
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} className="text-emerald-500" />;
            case 'error': return <XCircle size={20} className="text-red-500" />;
            case 'warning': return <AlertCircle size={20} className="text-amber-500" />;
            case 'info': return <Info size={20} className="text-blue-500" />;
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="bg-bg-primary border border-border-primary shadow-2xl rounded-xl p-4 flex items-start gap-3 w-80 pointer-events-auto relative overflow-hidden"
                            layout
                        >
                            <div className="flex-shrink-0 mt-0.5">
                                {getIcon(toast.type)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-text-primary text-pretty">
                                    {toast.message}
                                </p>
                            </div>
                            <button 
                                onClick={() => removeToast(toast.id)}
                                className="flex-shrink-0 text-text-primary/40 hover:text-text-primary transition-colors p-1 -m-1"
                            >
                                <X size={16} />
                            </button>

                            {/* Progress bar effect behind */}
                            <motion.div 
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: 5, ease: "linear" }}
                                className="absolute bottom-0 left-0 h-1 bg-brand-accent/20"
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
