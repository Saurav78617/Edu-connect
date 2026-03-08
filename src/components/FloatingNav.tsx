import { Link, useLocation } from 'react-router-dom';
import { Home, LogIn, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';

export default function FloatingNav() {
    const location = useLocation();

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-6 right-6 z-[100] flex items-center gap-1 p-1.5 bg-bg-primary/40 backdrop-blur-xl border border-border-primary rounded-2xl shadow-xl"
        >
            <Link
                to="/"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${location.pathname === '/'
                        ? 'bg-brand-accent/10 text-brand-accent'
                        : 'text-text-primary/60 hover:text-text-primary hover:bg-white/[0.02]'
                    }`}
            >
                <Home size={14} />
                Home
            </Link>

            <Link
                to="/login"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${location.pathname === '/login'
                        ? 'bg-brand-accent/10 text-brand-accent'
                        : 'text-text-primary/60 hover:text-text-primary hover:bg-white/[0.02]'
                    }`}
            >
                <LogIn size={14} />
                Login
            </Link>

            <Link
                to="/register"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${location.pathname === '/register'
                        ? 'bg-brand-accent/10 text-brand-accent'
                        : 'text-text-primary/60 hover:text-text-primary hover:bg-white/[0.02]'
                    }`}
            >
                <UserPlus size={14} />
                Register
            </Link>
        </motion.div>
    );
}
