import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  User,
  Star,
  Shield,
  CreditCard
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import GridBackground from '../components/GridBackground';

interface Session {
  id: number;
  studentId: number;
  mentorId: number;
  studentName?: string;
  studentEmail?: string;
  mentorName?: string;
  mentorEmail?: string;
  scheduledAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  meetLink?: string;
  price?: number;
}

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [loadingCancelId, setLoadingCancelId] = useState<number | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions/my');
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this session?')) return;
    setLoadingCancelId(id);
    try {
      await api.put(`/sessions/${id}/cancel`);
      fetchSessions();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCancelId(null);
    }
  };

  const filteredSessions = sessions.filter(s => filter === 'ALL' || s.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
      case 'PENDING': return 'text-orange-500 border-orange-500/20 bg-orange-500/5';
      case 'CANCELLED': return 'text-red-500 border-red-500/20 bg-red-500/5';
      default: return 'text-text-primary/40 border-border-primary bg-text-primary/5';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle size={14} />;
      case 'PENDING': return <Clock size={14} />;
      case 'CANCELLED': return <XCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-6">
      <div className="w-12 h-12 border-2 border-border-primary border-t-brand-accent rounded-full animate-spin" />
      <p className="text-[10px] uppercase tracking-[0.4em] text-text-primary/20">Accessing Booking Ledger...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-brand-accent/30 overflow-x-hidden relative">
      <GridBackground />

      <div className="max-w-6xl mx-auto p-8 pt-20 pb-32 relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 hover:text-text-primary transition-colors mb-12"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Return to Dashboard
        </motion.button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-2">
            <h2 className="text-5xl font-serif italic text-text-primary tracking-tight">My Bookings</h2>
            <p className="text-[10px] uppercase tracking-[0.4em] text-text-primary/20">Session History & Schedule</p>
          </div>

          <div className="flex gap-2 p-1.5 bg-surface-primary rounded-2xl border border-border-primary backdrop-blur-md">
            {(['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-text-primary text-bg-primary' : 'text-text-primary/40 hover:text-text-primary hover:bg-surface-primary'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredSessions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-24 rounded-[40px] border border-dashed border-border-primary flex flex-col items-center justify-center text-center space-y-6 bg-surface-primary"
              >
                <Calendar size={48} className="text-text-primary/5" />
                <div className="space-y-2">
                  <p className="text-text-primary/20 text-lg font-light italic">No sessions found in this sector.</p>
                  <p className="text-[10px] uppercase tracking-widest text-text-primary/10">Initialize a new booking to begin</p>
                </div>
              </motion.div>
            ) : (
              filteredSessions.map((session) => (
                <motion.div
                  layout
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative p-8 rounded-[32px] border border-border-primary bg-surface-primary hover:bg-brand-accent/[0.02] transition-all duration-500 flex flex-col lg:flex-row lg:items-center justify-between gap-8"
                >
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 bg-surface-primary rounded-2xl border border-border-primary flex items-center justify-center text-brand-accent font-serif italic font-bold text-2xl group-hover:scale-110 transition-transform duration-500">
                      {(user?.role === 'STUDENT' ? session.mentorName : session.studentName)?.charAt(0)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="text-2xl font-serif text-text-primary italic">
                          {user?.role === 'STUDENT' ? session.mentorName : session.studentName}
                        </h4>
                        <span className={`flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${getStatusColor(session.status)}`}>
                          {getStatusIcon(session.status)}
                          {session.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-6 text-[10px] text-text-primary/30 font-mono uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-brand-accent/40" />
                          {new Date(session.scheduledAt).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard size={12} className="text-brand-accent/40" />
                          ₹{session.price || 0}.00
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield size={12} className="text-brand-accent/40" />
                          {user?.role === 'STUDENT' ? session.mentorEmail : session.studentEmail}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {session.status === 'CONFIRMED' && session.meetLink && (
                      <a
                        href={session.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-8 py-4 rounded-2xl bg-text-primary text-bg-primary text-[10px] font-bold uppercase tracking-widest hover:bg-brand-accent hover:text-text-primary transition-all duration-500 flex items-center gap-3"
                      >
                        Join Session <ExternalLink size={14} />
                      </a>
                    )}

                    {session.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(session.id)}
                        disabled={loadingCancelId === session.id}
                        className="px-8 py-4 rounded-2xl border border-red-500/20 text-red-500/60 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-text-primary transition-all duration-500 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {loadingCancelId === session.id ? 'Canceling...' : 'Cancel Request'}
                      </button>
                    )}

                    {session.status === 'CONFIRMED' && user?.role === 'STUDENT' && (
                      <Link
                        to={`/student/profile`}
                        className="p-4 rounded-2xl border border-border-primary text-text-primary/20 hover:text-brand-accent hover:border-brand-accent/30 transition-all"
                      >
                        <Star size={18} />
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
