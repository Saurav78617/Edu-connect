import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { User, Briefcase, ArrowRight, Mail, Lock, Sparkles, UserCircle, Fingerprint, ShieldCheck } from 'lucide-react';
import GridBackground from '../components/GridBackground';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    skills: '',
    experienceYears: '',
    bio: '',
    hourlyRate: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      await api.post('/auth/register', {
        ...formData,
        email: formData.email.toLowerCase(),
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
        hourlyRate: formData.role === 'MENTOR' ? (formData.hourlyRate ? parseFloat(formData.hourlyRate) : 0) : undefined
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2
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
            <motion.div
              animate={{
                opacity: [0.03, 0.08, 0.03],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="text-[35vw] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent select-none pointer-events-none font-sans tracking-tighter opacity-5"
            >
              J
            </motion.div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Fingerprint className="text-brand-accent animate-pulse" size={40} />
                </div>
                <h1 className="text-6xl font-serif italic text-text-primary tracking-tight mb-4">
                  Join the <span className="bg-gradient-to-r from-brand-accent to-orange-400 bg-clip-text text-transparent">Bridge</span>
                </h1>
                <p className="text-text-primary/30 text-xs uppercase tracking-[0.6em] font-medium">
                  Initialize Your Legacy
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t border-border-primary pt-8">
          <div className="text-[9px] uppercase tracking-[0.3em] text-text-primary/20 font-mono">
            NODE_REGISTRATION / PENDING_AUTH
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-20 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-xl flex flex-col h-[650px] max-h-[85vh] relative z-10 py-10 pl-10 pr-6 rounded-[40px] border border-border-primary bg-white/[0.02] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          <div className="flex-1 flex flex-col overflow-y-auto pr-4 space-y-12 custom-scrollbar">
            <div className="space-y-4">
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-primary border border-border-primary text-text-primary/60 text-[10px] font-bold uppercase tracking-widest"
              >
                <Sparkles size={12} className="text-brand-accent" />
                New Node Entry
              </motion.div>
              <motion.h2 variants={itemVariants} className="text-6xl font-serif text-text-primary font-light tracking-tight leading-tight">
                Create your <br />
                <span className="italic font-medium text-brand-accent">Profile</span>
              </motion.h2>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-500/10 border-l-2 border-red-500 text-red-400 p-5 rounded-r-2xl text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Role Selection */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 p-1.5 bg-surface-primary rounded-2xl border border-border-primary">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'STUDENT' })}
                  className={`py-5 rounded-xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${formData.role === 'STUDENT' ? 'bg-text-primary text-bg-primary shadow-[0_10px_20px_rgba(0,0,0,0.1)]' : 'text-text-primary/30 hover:text-text-primary'}`}
                >
                  <User size={16} /> Student
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'MENTOR' })}
                  className={`py-5 rounded-xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${formData.role === 'MENTOR' ? 'bg-text-primary text-bg-primary shadow-[0_10px_20px_rgba(0,0,0,0.1)]' : 'text-text-primary/30 hover:text-text-primary'}`}
                >
                  <Briefcase size={16} /> Mentor
                </button>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <motion.div variants={itemVariants} className="relative group">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 mb-4 group-focus-within:text-brand-accent transition-all">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <UserCircle className="absolute left-0 text-text-primary/10 group-focus-within:text-brand-accent transition-all" size={20} />
                    <input
                      type="text"
                      required
                      className="w-full bg-transparent border-b border-border-primary py-4 pl-10 pr-4 text-text-primary outline-none focus:border-brand-accent transition-all placeholder:text-text-primary/5 font-light"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="relative group">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 mb-4 group-focus-within:text-brand-accent transition-all">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-0 text-text-primary/10 group-focus-within:text-brand-accent transition-all" size={20} />
                    <input
                      type="email"
                      required
                      className="w-full bg-transparent border-b border-border-primary py-4 pl-10 pr-4 text-text-primary outline-none focus:border-brand-accent transition-all placeholder:text-text-primary/5 font-light"
                      placeholder="name@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="relative group">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 mb-4 group-focus-within:text-brand-accent transition-all">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-0 text-text-primary/10 group-focus-within:text-brand-accent transition-all" size={20} />
                    <input
                      type="password"
                      required
                      className="w-full bg-transparent border-b border-border-primary py-4 pl-10 pr-4 text-text-primary outline-none focus:border-brand-accent transition-all placeholder:text-text-primary/5 font-light"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />
                  </div>
                </motion.div>

                {formData.role === 'MENTOR' && (
                  <>
                    <motion.div variants={itemVariants} className="relative group">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 mb-4 group-focus-within:text-brand-accent transition-all">
                        Experience (Years)
                      </label>
                      <input
                        type="number"
                        className="w-full bg-transparent border-b border-border-primary py-4 text-text-primary outline-none focus:border-brand-accent transition-all placeholder:text-text-primary/5 font-light"
                        placeholder="e.g. 5"
                        value={formData.experienceYears}
                        onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                      />
                      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative group">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 mb-4 group-focus-within:text-brand-accent transition-all">
                        Hourly Rate (₹/hr)
                      </label>
                      <input
                        type="number"
                        className="w-full bg-transparent border-b border-border-primary py-4 text-text-primary outline-none focus:border-brand-accent transition-all placeholder:text-text-primary/5 font-light"
                        placeholder="e.g. 500"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      />
                      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />
                    </motion.div>
                  </>
                )}
              </div>

              <motion.div variants={itemVariants} className="relative group">
                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 mb-4 group-focus-within:text-brand-accent transition-all">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-border-primary py-4 text-text-primary outline-none focus:border-brand-accent transition-all placeholder:text-text-primary/5 font-light"
                  placeholder="React, Python, Design..."
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />
              </motion.div>

              <motion.div variants={itemVariants} className="relative group">
                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 mb-4 group-focus-within:text-brand-accent transition-all">
                  Professional Bio
                </label>
                <textarea
                  rows={2}
                  className="w-full bg-transparent border-b border-border-primary py-4 text-text-primary outline-none focus:border-brand-accent transition-all placeholder:text-text-primary/5 font-light resize-none"
                  placeholder="Tell us about your journey..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />
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
                  {loading ? 'Creating Profile...' : (
                    <>
                      Create Account <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-brand-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.22, 1, 0.36, 1]" />
              </motion.button>
            </form>

            <motion.div variants={itemVariants} className="pt-12 border-t border-border-primary text-center">
              <p className="text-text-primary/20 text-sm font-light">
                Already have an active node?{' '}
                <Link to="/login" className="text-brand-accent font-medium hover:text-text-primary transition-colors underline underline-offset-8 decoration-brand-accent/20 hover:decoration-brand-accent">
                  Sign In
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
