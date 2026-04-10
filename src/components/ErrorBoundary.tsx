import React, { Component, ErrorInfo, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-6 relative overflow-hidden">
                    {/* Subtle Background Elements */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />

                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="w-full max-w-lg relative z-10"
                    >
                        <div className="bg-surface-primary border border-red-500/20 rounded-[32px] p-8 sm:p-12 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
                            
                            <motion.div
                                initial={{ rotate: -10, scale: 0.8 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                className="w-20 h-20 rounded-2xl bg-red-500/10 flex flex-col items-center justify-center mb-8 border border-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
                            >
                                <AlertOctagon size={40} strokeWidth={1.5} />
                            </motion.div>

                            <div className="space-y-4 mb-10">
                                <h1 className="text-3xl font-serif text-white tracking-tight">System Fault Detected</h1>
                                <p className="text-text-primary/60 font-light leading-relaxed text-sm">
                                    We encountered an unexpected error while rendering this sector of the Bridge. Our nodes have logged the anomaly.
                                </p>
                                
                                {(import.meta as any).env?.DEV && this.state.error && (
                                    <div className="mt-6 p-4 bg-black/40 rounded-xl border border-red-500/10 text-left overflow-x-auto">
                                        <p className="font-mono text-[10px] text-red-400/80 font-medium">
                                            {this.state.error.toString()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full relative overflow-hidden group bg-text-primary text-bg-primary px-6 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all hover:bg-white/90"
                                >
                                    <RefreshCw size={16} className="group-hover:-rotate-180 transition-transform duration-700" />
                                    <span className="text-xs uppercase tracking-[0.2em]">Reboot Matrix</span>
                                </button>
                                
                                <button
                                    onClick={() => {
                                        this.setState({ hasError: false, error: null });
                                        window.location.href = '/';
                                    }}
                                    className="w-full px-6 py-4 rounded-2xl flex items-center justify-center gap-3 border border-border-primary text-text-primary/60 hover:text-text-primary hover:border-text-primary/20 hover:bg-white/[0.02] transition-all font-medium"
                                >
                                    <Home size={16} />
                                    <span className="text-xs uppercase tracking-[0.2em]">Return Base</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
