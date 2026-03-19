import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { motion } from 'motion/react';
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import GridBackground from '../components/GridBackground';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { token, newPassword: password });
      showToast(res.data.message || 'Password reset successful!', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary text-text-primary">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-serif italic text-red-500">Invalid Link</h2>
          <p className="text-text-primary/50">The password reset link is invalid or missing the security token.</p>
          <Link to="/login" className="inline-block mt-4 text-brand-accent hover:underline">Return to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center bg-bg-primary text-text-primary relative p-6"
    >
      <GridBackground />
      
      <div className="absolute top-8 left-8">
        <Link to="/login" className="flex items-center gap-2 text-text-primary/50 hover:text-text-primary transition-colors text-sm uppercase tracking-widest font-bold">
          <ArrowLeft size={16} /> Back to Login
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white/[0.02] backdrop-blur-2xl border border-border-primary p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif italic tracking-tight mb-2">Reset Password</h2>
          <p className="text-text-primary/40 text-sm font-light">Enter your new secure passkey below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 mb-2 group-focus-within:text-brand-accent transition-colors">
                New Passkey
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-0 text-text-primary/20 group-focus-within:text-brand-accent transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full bg-transparent border-b border-border-primary py-3 pl-8 pr-10 text-text-primary outline-none focus:border-brand-accent transition-all placeholder:text-text-primary/10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 text-text-primary/20 hover:text-brand-accent transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-500" />
              </div>
            </div>

            <div className="relative group">
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 mb-2 group-focus-within:text-brand-accent transition-colors">
                Confirm Passkey
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-0 text-text-primary/20 group-focus-within:text-brand-accent transition-colors" size={18} />
                <input
                  type="password"
                  required
                  className="w-full bg-transparent border-b border-border-primary py-3 pl-8 pr-4 text-text-primary outline-none focus:border-brand-accent transition-all placeholder:text-text-primary/10"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-accent group-focus-within:w-full transition-all duration-500" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-text-primary text-bg-primary text-xs uppercase tracking-widest font-bold hover:bg-brand-accent hover:text-white transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Processing...' : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
