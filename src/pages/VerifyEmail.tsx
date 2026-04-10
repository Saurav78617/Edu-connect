import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        showToast('Email verified successfully!', 'success');
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        const errorMsg = err.response?.data?.message || 'Verification failed. The link may have expired.';
        setMessage(errorMsg);
        showToast(errorMsg, 'error');
      }
    };

    verifyEmail();
  }, [token, navigate, showToast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary text-text-primary p-4 custom-scrollbar">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-8 rounded-3xl border border-border-primary bg-white/[0.02] backdrop-blur-xl shadow-2xl flex flex-col items-center text-center"
      >
        {status === 'loading' && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mb-6 text-brand-accent"
          >
            <Loader2 size={48} />
          </motion.div>
        )}
        
        {status === 'success' && (
          <motion.div
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             className="mb-6 text-emerald-500"
          >
            <CheckCircle size={48} />
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             className="mb-6 text-red-500"
          >
            <XCircle size={48} />
          </motion.div>
        )}

        <h2 className="text-2xl font-serif mb-4 text-text-primary">
          {status === 'loading' ? 'Verifying Email' : 
           status === 'success' ? 'Verification Complete' : 'Verification Failed'}
        </h2>
        
        <p className="text-text-primary/60 mb-8">{message}</p>

        {status !== 'loading' && (
          <Link 
            to="/login"
            className="inline-flex py-3 px-6 rounded-full bg-text-primary text-bg-primary font-medium hover:scale-105 transition-transform"
          >
            {status === 'success' ? 'Proceed to Login' : 'Return to Login'}
          </Link>
        )}
      </motion.div>
    </div>
  );
}
