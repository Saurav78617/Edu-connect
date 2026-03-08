import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { ArrowRight, ArrowLeft, Mail, Lock, Sparkles, ShieldCheck, Fingerprint, X, Eye, EyeOff } from 'lucide-react';
import GridBackground from '../components/GridBackground';
import FloatingNav from '../components/FloatingNav';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [sendingRecovery, setSendingRecovery] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Mouse Parallax Effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const rotateX = useTransform(y, [-300, 300], [5, -5]);
  const rotateY = useTransform(x, [-300, 300], [-5, 5]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseX.set(clientX - innerWidth / 2);
      mouseY.set(clientY - innerHeight / 2);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password
      });
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'STUDENT' ? '/student' : '/mentor');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setSendingRecovery(true);
    setTimeout(() => {
      setSendingRecovery(false);
      setShowForgotModal(false);
      setRecoveryEmail('');
      alert('Recovery link sent to your email!');
    }, 1500);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" } as any
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex bg-bg-primary text-text-primary overflow-hidden selection:bg-brand-accent/30 relative"
    >
      <GridBackground />
      <FloatingNav />

      {/* Left Side - Artistic Branding */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center perspective-1000">
        <motion.div
          style={{ rotateX, rotateY }}
          className="relative z-10 flex flex-col items-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* The Large Background Letter */}
            <motion.div
              animate={{
                opacity: [0.05, 0.1, 0.05],
                scale: [1, 1.02, 1]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="text-[40vw] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent select-none pointer-events-none font-sans tracking-tighter opacity-10"
            >
              E
            </motion.div>

            {/* Overlay Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="h-px w-12 bg-text-primary/10" />
                  <Fingerprint className="text-brand-accent animate-pulse" size={32} />
                  <div className="h-px w-12 bg-text-primary/10" />
                </div>
                <h1 className="text-7xl font-serif italic text-text-primary tracking-tight mb-4">
                  Edu <span className="text-brand-accent">Connect</span>
                </h1>
                <p className="text-text-primary/30 text-xs uppercase tracking-[0.6em] font-medium">
                  The Mentorship of Knowledge
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Details */}
        <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t border-border-primary pt-8">
          <div className="flex gap-12">
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-text-primary/20">Protocol</p>
              <p className="text-xs text-text-primary/60 font-mono">SECURE_AUTH_v2</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-text-primary/20">Node</p>
              <p className="text-xs text-text-primary/60 font-mono">GLOBAL_EDGE_01</p>
            </div>
          </div>
          <div className="text-[9px] uppercase tracking-[0.3em] text-text-primary/20 font-mono">
            ENCRYPTED SESSION / 256-BIT AES
          </div>
        </div>
      </div>

      {/* Right Side - Minimalist Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-20 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-xl flex flex-col h-[650px] max-h-[85vh] relative z-10 py-10 pl-10 pr-6 rounded-[40px] border border-border-primary bg-white/[0.02] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          <div className="flex-1 flex flex-col justify-center overflow-y-auto pr-4 space-y-12 custom-scrollbar">
            <div className="space-y-4">
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-text-primary/5 border border-border-primary text-text-primary/60 text-[10px] font-bold uppercase tracking-widest"
              >
                <Sparkles size={12} className="text-brand-accent" />
                Intelligence Gateway
              </motion.div>
              <motion.h2 variants={itemVariants} className="text-6xl font-serif text-text-primary font-light tracking-tight leading-tight">
                Sign in to <br />
                <span className="italic font-medium bg-gradient-to-r from-brand-accent to-orange-400 bg-clip-text text-transparent">The Bridge</span>
              </motion.h2>
              <motion.p variants={itemVariants} className="text-text-primary/30 text-lg font-light max-w-[280px]">
                Access the collective wisdom of our global network.
              </motion.p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-500/10 border-l-2 border-red-500 text-red-400 p-5 rounded-r-2xl text-sm flex items-center gap-4"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-8">
                <motion.div variants={itemVariants} className="relative group">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 mb-4 group-focus-within:text-brand-accent transition-all duration-500">
                    Identity
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-0 text-text-primary/10 group-focus-within:text-brand-accent transition-all duration-500" size={20} />
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      className="w-full bg-transparent border-b border-border-primary py-4 pl-10 pr-4 text-text-primary outline-none focus:border-brand-accent transition-all duration-500 placeholder:text-text-primary/10 font-light text-lg"
                      placeholder="name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="relative group">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 group-focus-within:text-brand-accent transition-all duration-500">
                      Passkey
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[9px] uppercase tracking-widest text-brand-accent/50 hover:text-brand-accent transition-colors"
                    >
                      Recovery?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-0 text-text-primary/10 group-focus-within:text-brand-accent transition-all duration-500" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      className="w-full bg-transparent border-b border-border-primary py-4 pl-10 pr-12 text-text-primary outline-none focus:border-brand-accent transition-all duration-500 placeholder:text-text-primary/10 font-light text-lg"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 text-text-primary/20 hover:text-brand-accent transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />
                  </div>
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="flex items-center justify-between">
                <label className="flex items-center gap-3 text-xs text-text-primary/30 cursor-pointer hover:text-text-primary transition-colors group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="peer appearance-none w-5 h-5 rounded-lg border border-border-primary bg-transparent checked:bg-brand-accent checked:border-brand-accent transition-all"
                    />
                    <ShieldCheck className="absolute text-text-primary opacity-0 peer-checked:opacity-100 transition-opacity" size={12} />
                  </div>
                  Persistent Session
                </label>
              </motion.div>

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full group relative overflow-hidden bg-text-primary text-bg-primary py-6 rounded-2xl font-bold flex items-center justify-center gap-4 hover:text-text-primary transition-all duration-500 disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                  {loading ? 'Authenticating...' : (
                    <>
                      Initialize Session <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-brand-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.22, 1, 0.36, 1]" />
              </motion.button>
            </form>

            <motion.div variants={itemVariants} className="pt-12 border-t border-border-primary text-center">
              <p className="text-text-primary/20 text-sm font-light">
                Don't have an active node?{' '}
                <Link to="/register" className="text-brand-accent font-medium hover:text-text-primary transition-colors underline underline-offset-8 decoration-brand-accent/20 hover:decoration-brand-accent">
                  Register Identity
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-bg-primary border border-border-primary p-10 rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent" />

              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-6 right-6 text-text-primary/20 hover:text-text-primary transition-colors"
              >
                <X size={24} />
              </button>

              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="text-3xl font-serif text-text-primary italic">Identity Recovery</h3>
                  <p className="text-text-primary/40 text-sm">Enter your registered email to receive a secure access token.</p>
                </div>

                <form onSubmit={handleRecoverySubmit} className="space-y-6">
                  <div className="relative group">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 mb-4 group-focus-within:text-brand-accent transition-all duration-500">
                      Registered Email
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-0 text-text-primary/10 group-focus-within:text-brand-accent transition-all duration-500" size={20} />
                      <input
                        type="email"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full bg-transparent border-b border-border-primary py-4 pl-10 pr-4 text-text-primary outline-none focus:border-brand-accent transition-all duration-500 placeholder:text-text-primary/5 font-light text-lg"
                        placeholder="name@domain.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={sendingRecovery || !recoveryEmail}
                    className="w-full bg-brand-accent text-text-primary py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-text-primary hover:text-bg-primary transition-all duration-500 disabled:opacity-50"
                  >
                    {sendingRecovery ? 'Sending...' : 'Send Recovery Token'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
