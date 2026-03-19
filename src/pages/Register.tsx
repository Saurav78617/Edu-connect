import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Mail, Lock, Sparkles, Fingerprint, User, Briefcase, Eye, EyeOff, UserCircle, ArrowRight } from 'lucide-react';
import GridBackground from '../components/GridBackground';
import FloatingNav from '../components/FloatingNav';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '../utils/schemas';

export default function Register() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'STUDENT',
      name: '',
      email: '',
      password: '',
      city: '',
      skills: '',
      bio: '',
      experienceYears: '',
      hourlyRate: ''
    },
    mode: 'onTouched'
  });

  const selectedRole = watch('role');

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
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

  const onSubmit = async (data: RegisterFormData) => {
    setApiError('');
    try {
      await api.post('/auth/register', {
        ...data,
        email: data.email.trim().toLowerCase(),
        experienceYears: data.experienceYears ? parseInt(data.experienceYears as string) : undefined,
        hourlyRate: data.role === 'MENTOR' ? (data.hourlyRate ? parseFloat(data.hourlyRate as string) : 0) : undefined
      });
      navigate('/login');
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Registration failed');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 }
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
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-text-primary/5 border border-border-primary text-text-primary/60 text-[10px] font-bold uppercase tracking-widest"
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
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-500/10 border-l-2 border-red-500 text-red-400 p-5 rounded-r-2xl text-sm"
                >
                  {apiError}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              {/* Sleek Pill Role Selection */}
              <motion.div variants={itemVariants} className="relative flex p-1.5 bg-[#141414] rounded-2xl w-full max-w-md mx-auto border border-white/5 shadow-inner">
                <button
                  type="button"
                  onClick={() => setValue('role', 'STUDENT')}
                  className={`relative flex-1 flex items-center justify-center gap-3 py-4 text-[12px] font-medium uppercase tracking-[0.2em] transition-colors duration-300 z-10 ${selectedRole === 'STUDENT'
                    ? 'text-black font-semibold'
                    : 'text-white/40 hover:text-white/80'
                    }`}
                >
                  {selectedRole === 'STUDENT' && (
                    <motion.div
                      layoutId="role-indicator"
                      className="absolute inset-0 bg-white rounded-[14px] shadow-sm z-[-1]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <User size={18} className="z-10" strokeWidth={1.5} /> <span className="z-10">STUDENT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('role', 'MENTOR')}
                  className={`relative flex-1 flex items-center justify-center gap-3 py-4 text-[12px] font-medium uppercase tracking-[0.2em] transition-colors duration-300 z-10 ${selectedRole === 'MENTOR'
                    ? 'text-black font-semibold'
                    : 'text-white/40 hover:text-white/80'
                    }`}
                >
                  {selectedRole === 'MENTOR' && (
                    <motion.div
                      layoutId="role-indicator"
                      className="absolute inset-0 bg-white rounded-[14px] shadow-sm z-[-1]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Briefcase size={18} className="z-10" strokeWidth={1.5} /> <span className="z-10">MENTOR</span>
                </button>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <motion.div variants={itemVariants} className="relative group">
                  <label className={`block text-[10px] font-bold uppercase tracking-[0.3em] mb-4 transition-all ${errors.name ? 'text-red-400' : 'text-text-primary/20 group-focus-within:text-brand-accent'}`}>
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <UserCircle className={`absolute left-0 transition-all ${errors.name ? 'text-red-400' : 'text-text-primary/10 group-focus-within:text-brand-accent'}`} size={20} />
                    <input
                      type="text"
                      autoComplete="name"
                      {...register('name')}
                      className={`w-full bg-transparent border-b py-4 pl-10 pr-4 text-text-primary outline-none transition-all placeholder:text-text-primary/5 font-light ${errors.name ? 'border-red-500/50' : 'border-border-primary focus:border-brand-accent'}`}
                      placeholder="John Doe"
                    />
                    {!errors.name && <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />}
                  </div>
                  {errors.name && <span className="text-red-400 text-[10px] mt-2 block">{errors.name.message}</span>}
                </motion.div>

                <motion.div variants={itemVariants} className="relative group">
                  <label className={`block text-[10px] font-bold uppercase tracking-[0.3em] mb-4 transition-all ${errors.email ? 'text-red-400' : 'text-text-primary/20 group-focus-within:text-brand-accent'}`}>
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className={`absolute left-0 transition-all ${errors.email ? 'text-red-400' : 'text-text-primary/10 group-focus-within:text-brand-accent'}`} size={20} />
                    <input
                      type="email"
                      autoComplete="email"
                      {...register('email')}
                      className={`w-full bg-transparent border-b py-4 pl-10 pr-4 text-text-primary outline-none transition-all placeholder:text-text-primary/5 font-light ${errors.email ? 'border-red-500/50' : 'border-border-primary focus:border-brand-accent'}`}
                      placeholder="name@domain.com"
                    />
                    {!errors.email && <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />}
                  </div>
                  {errors.email && <span className="text-red-400 text-[10px] mt-2 block">{errors.email.message}</span>}
                </motion.div>

                <motion.div variants={itemVariants} className="relative group">
                  <label className={`block text-[10px] font-bold uppercase tracking-[0.3em] mb-4 transition-all ${errors.password ? 'text-red-400' : 'text-text-primary/20 group-focus-within:text-brand-accent'}`}>
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className={`absolute left-0 transition-all ${errors.password ? 'text-red-400' : 'text-text-primary/10 group-focus-within:text-brand-accent'}`} size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('password')}
                      className={`w-full bg-transparent border-b py-4 pl-10 pr-12 text-text-primary outline-none transition-all placeholder:text-text-primary/5 font-light ${errors.password ? 'border-red-500/50' : 'border-border-primary focus:border-brand-accent'}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 text-text-primary/20 hover:text-brand-accent transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    {!errors.password && <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />}
                  </div>
                  {errors.password && <span className="text-red-400 text-[10px] mt-2 block">{errors.password.message}</span>}
                </motion.div>

                {selectedRole === 'MENTOR' && (
                  <>
                    <motion.div variants={itemVariants} className="relative group">
                      <label className={`block text-[10px] font-bold uppercase tracking-[0.3em] mb-4 transition-all ${errors.experienceYears ? 'text-red-400' : 'text-text-primary/20 group-focus-within:text-brand-accent'}`}>
                        Experience (Years)
                      </label>
                      <input
                        type="number"
                        {...register('experienceYears')}
                        className={`w-full bg-transparent border-b py-4 text-text-primary outline-none transition-all placeholder:text-text-primary/5 font-light ${errors.experienceYears ? 'border-red-500/50' : 'border-border-primary focus:border-brand-accent'}`}
                        placeholder="e.g. 5"
                      />
                      {errors.experienceYears && <span className="text-red-400 text-[10px] mt-2 block">{errors.experienceYears.message}</span>}
                      {!errors.experienceYears && <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />}
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative group">
                      <label className={`block text-[10px] font-bold uppercase tracking-[0.3em] mb-4 transition-all ${errors.hourlyRate ? 'text-red-400' : 'text-text-primary/20 group-focus-within:text-brand-accent'}`}>
                        Hourly Rate (₹/hr)
                      </label>
                      <input
                        type="number"
                        {...register('hourlyRate')}
                        className={`w-full bg-transparent border-b py-4 text-text-primary outline-none transition-all placeholder:text-text-primary/5 font-light ${errors.hourlyRate ? 'border-red-500/50' : 'border-border-primary focus:border-brand-accent'}`}
                        placeholder="e.g. 500"
                      />
                      {errors.hourlyRate && <span className="text-red-400 text-[10px] mt-2 block">{errors.hourlyRate.message}</span>}
                      {!errors.hourlyRate && <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />}
                    </motion.div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <motion.div variants={itemVariants} className="relative group">
                  <label className={`block text-[10px] font-bold uppercase tracking-[0.3em] mb-4 transition-all ${errors.city ? 'text-red-400' : 'text-text-primary/20 group-focus-within:text-brand-accent'}`}>
                    Base City Location
                  </label>
                  <input
                    type="text"
                    {...register('city')}
                    className={`w-full bg-transparent border-b py-4 text-text-primary outline-none transition-all placeholder:text-text-primary/5 font-light ${errors.city ? 'border-red-500/50' : 'border-border-primary focus:border-brand-accent'}`}
                    placeholder="e.g. Mumbai, New York..."
                  />
                  {errors.city && <span className="text-red-400 text-[10px] mt-2 block">{errors.city.message}</span>}
                  {!errors.city && <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />}
                </motion.div>

                <motion.div variants={itemVariants} className="relative group">
                  <label className={`block text-[10px] font-bold uppercase tracking-[0.3em] mb-4 transition-all ${errors.skills ? 'text-red-400' : 'text-text-primary/20 group-focus-within:text-brand-accent'}`}>
                    Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    {...register('skills')}
                    className={`w-full bg-transparent border-b py-4 text-text-primary outline-none transition-all placeholder:text-text-primary/5 font-light ${errors.skills ? 'border-red-500/50' : 'border-border-primary focus:border-brand-accent'}`}
                    placeholder="React, Python, Design..."
                  />
                  {errors.skills && <span className="text-red-400 text-[10px] mt-2 block">{errors.skills.message}</span>}
                  {!errors.skills && <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />}
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="relative group">
                <label className={`block text-[10px] font-bold uppercase tracking-[0.3em] mb-4 transition-all ${errors.bio ? 'text-red-400' : 'text-text-primary/20 group-focus-within:text-brand-accent'}`}>
                  Professional Bio
                </label>
                <textarea
                  rows={2}
                  {...register('bio')}
                  className={`w-full bg-transparent border-b py-4 text-text-primary outline-none transition-all placeholder:text-text-primary/5 font-light resize-none ${errors.bio ? 'border-red-500/50' : 'border-border-primary focus:border-brand-accent'}`}
                  placeholder="Tell us about your journey..."
                />
                {errors.bio && <span className="text-red-400 text-[10px] mt-2 block">{errors.bio.message}</span>}
                {!errors.bio && <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-700 ease-out" />}
              </motion.div>

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full group relative overflow-hidden bg-text-primary text-bg-primary py-6 rounded-2xl font-bold flex items-center justify-center gap-4 hover:text-text-primary transition-all duration-500 disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                  {isSubmitting ? 'Creating Profile...' : (
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
