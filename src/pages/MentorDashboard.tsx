import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, CheckCircle, Video, Clock, User, XCircle, Star, Calendar, Shield, ArrowUpRight, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import GridBackground from '../components/GridBackground';
import ChatModal from '../components/ChatModal';

interface Session {
  id: number;
  studentName: string;
  studentEmail: string;
  scheduledAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  meetLink?: string;
  price?: number;
}

interface Review {
  id: number;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function MentorDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviews, setShowReviews] = useState(false);
  const [activeChat, setActiveChat] = useState<{ id: number; name: string } | null>(null);
  const [loadingActionId, setLoadingActionId] = useState<number | null>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchSessions();
    fetchReviews();
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

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/mentors/${user?.id}/reviews`);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirm = async (id: number) => {
    setLoadingActionId(id);
    try {
      await api.put(`/sessions/${id}/confirm`);
      fetchSessions();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this session?")) return;
    setLoadingActionId(id);
    try {
      await api.put(`/sessions/${id}/cancel`);
      fetchSessions();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-brand-accent/30 overflow-x-hidden">
      <GridBackground />

      {/* Header */}
      <header className="bg-bg-primary/40 backdrop-blur-xl border-b border-border-primary px-8 py-5 flex justify-between items-center sticky top-0 z-[50]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-text-primary rounded-xl flex items-center justify-center text-bg-primary font-serif italic font-bold">EC</div>
          <h1 className="text-xl font-serif italic font-bold tracking-tight">Mentor <span className="text-brand-accent">Portal</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <NotificationBell />
          <ThemeToggle />
          <Link to="/mentor/bookings" className="p-2.5 hover:bg-surface-primary rounded-xl transition-all border border-transparent hover:border-border-primary group relative">
            <Calendar size={20} className="text-text-primary/60 group-hover:text-brand-accent transition-colors" />
            <span className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-text-primary text-bg-primary text-[8px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">My Bookings</span>
          </Link>
          <Link to="/mentor/profile" className="p-2.5 hover:bg-surface-primary rounded-xl transition-all border border-transparent hover:border-border-primary group relative">
            <User size={20} className="text-text-primary/60 group-hover:text-brand-accent transition-colors" />
            <span className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-text-primary text-bg-primary text-[8px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Profile</span>
          </Link>
          <button onClick={logout} className="p-2.5 hover:bg-red-500/10 text-red-500/60 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-500/20 group relative">
            <LogOut size={20} />
            <span className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500 text-text-primary text-[8px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 pt-16 pb-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-12">
            <div className="flex justify-between items-end border-b border-border-primary pb-8">
              <div className="space-y-1">
                <h2 className="text-5xl font-serif font-light tracking-tighter leading-none">
                  Your <span className="italic text-brand-accent">{showReviews ? 'Feedback' : 'Sessions'}</span>
                </h2>
                <p className="text-[10px] uppercase tracking-[0.3em] text-text-primary/20">
                  {showReviews ? 'Student Testimonials' : 'Upcoming Engagements'}
                </p>
              </div>
              <button
                onClick={() => setShowReviews(!showReviews)}
                className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-surface-primary border border-border-primary text-[10px] font-bold uppercase tracking-widest text-text-primary/60 hover:text-text-primary hover:border-brand-accent/30 transition-all"
              >
                {showReviews ? (
                  <>
                    <Calendar size={14} /> View Sessions
                  </>
                ) : (
                  <>
                    <Star size={14} /> View Reviews
                  </>
                )}
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="w-12 h-12 border-2 border-border-primary border-t-brand-accent rounded-full animate-spin" />
                <p className="text-[10px] uppercase tracking-[0.4em] text-text-primary/20">Syncing Node Data...</p>
              </div>
            ) : showReviews ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reviews.length === 0 ? (
                  <div className="md:col-span-2 p-20 rounded-[40px] border border-dashed border-border-primary flex flex-col items-center justify-center text-center space-y-6">
                    <Star className="text-text-primary/5" size={64} />
                    <p className="text-text-primary/20 text-lg font-light italic">No reviews yet. Complete sessions to build your legacy.</p>
                  </div>
                ) : (
                  reviews.map(review => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-8 rounded-[32px] border border-border-primary bg-surface-primary hover:bg-brand-accent/[0.02] transition-all duration-700 space-y-6"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="text-xl font-serif italic text-text-primary">{review.studentName}</h4>
                        <div className="flex gap-1 text-brand-accent">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={12} fill={review.rating >= n ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-text-primary/40 italic font-light leading-relaxed">"{review.comment}"</p>
                      <div className="pt-4 border-t border-border-primary flex justify-between items-center">
                        <span className="text-[9px] text-text-primary/20 uppercase tracking-widest font-mono">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                        <Shield size={12} className="text-text-primary/10" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {sessions.length === 0 ? (
                  <div className="p-20 rounded-[40px] border border-dashed border-border-primary flex flex-col items-center justify-center text-center space-y-6">
                    <CustomCalendarIcon className="text-text-primary/5" size={64} />
                    <p className="text-text-primary/20 text-lg font-light italic">No sessions booked yet. Your node is active and visible.</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group p-8 rounded-[32px] border border-border-primary bg-surface-primary hover:bg-brand-accent/[0.02] transition-all duration-700 flex flex-col md:flex-row md:items-center justify-between gap-8"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-surface-primary rounded-2xl border border-border-primary flex items-center justify-center text-brand-accent font-serif italic font-bold text-2xl group-hover:scale-110 transition-transform duration-500">
                          {session.studentName.charAt(0)}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-2xl font-serif text-text-primary">{session.studentName}</h4>
                          <p className="text-xs text-text-primary/30 font-light">{session.studentEmail}</p>
                          <div className="pt-2 flex items-center gap-3">
                            <span className={`text-[8px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${session.status === 'CONFIRMED' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' :
                              session.status === 'PENDING' ? 'border-orange-500/20 text-orange-500 bg-orange-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5'
                              }`}>
                              {session.status}
                            </span>
                            <span className="text-[10px] font-bold text-brand-accent font-mono">₹{session.price || 0}.00</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end gap-6">
                        <div className="flex items-center gap-3 text-text-primary/40">
                          <Clock size={16} className="text-brand-accent/40" />
                          <span className="text-xs font-mono">{new Date(session.scheduledAt).toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          {session.status === 'CONFIRMED' && (
                            <button
                              onClick={() => setActiveChat({ id: session.id, name: session.studentName })}
                              className="p-4 rounded-2xl border border-border-primary text-text-primary/40 hover:text-brand-accent hover:border-brand-accent/30 transition-all flex items-center justify-center"
                              title="Open Chat"
                            >
                              <MessageSquare size={20} />
                            </button>
                          )}

                          {session.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleCancel(session.id)}
                                disabled={loadingActionId === session.id}
                                className="p-4 rounded-2xl border border-border-primary text-text-primary/20 hover:text-red-500 hover:border-red-500/20 transition-all disabled:opacity-50"
                                title="Cancel Session"
                              >
                                {loadingActionId === session.id ? <div className="w-5 h-5 border-2 border-text-primary/20 border-t-red-500 rounded-full animate-spin" /> : <XCircle size={20} />}
                              </button>
                              <button
                                onClick={() => handleConfirm(session.id)}
                                disabled={loadingActionId === session.id}
                                className="min-w-[120px] px-8 py-4 rounded-2xl bg-text-primary text-bg-primary font-bold text-[10px] uppercase tracking-widest hover:bg-brand-accent hover:text-text-primary transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50"
                              >
                                {loadingActionId === session.id ? (
                                  <>Processing <div className="w-3 h-3 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" /></>
                                ) : (
                                  <><CheckCircle size={18} /> Confirm</>
                                )}
                              </button>
                            </>
                          )}
                          {session.status === 'CONFIRMED' && (
                            <a
                              href={session.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-8 py-4 rounded-2xl bg-emerald-600 text-text-primary font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all duration-500 flex items-center gap-3"
                            >
                              <Video size={18} /> Join Meet
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Column - Stats & Info */}
          <div className="lg:col-span-4 space-y-12">
            <div className="p-10 rounded-[40px] border border-border-primary bg-gradient-to-br from-text-primary/[0.02] to-transparent space-y-10">
              <div className="space-y-2">
                <h3 className="text-3xl font-serif italic text-text-primary">Node Stats</h3>
                <p className="text-[10px] uppercase tracking-[0.3em] text-text-primary/20">Performance Metrics</p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <div className="text-3xl font-serif italic text-brand-accent">{sessions.filter(s => s.status === 'CONFIRMED').length}</div>
                  <div className="text-[8px] uppercase tracking-widest text-text-primary/20">Total Sessions</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-serif italic text-brand-accent">{reviews.length}</div>
                  <div className="text-[8px] uppercase tracking-widest text-text-primary/20">Reviews</div>
                </div>
              </div>

              <div className="pt-10 border-t border-border-primary space-y-6">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-brand-accent" />
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-text-primary/60">System Integrity</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-text-primary/20 uppercase tracking-widest">Protocol</span>
                    <span className="text-[10px] text-emerald-500 font-mono">SECURE_BRIDGE_v4</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-text-primary/20 uppercase tracking-widest">Identity</span>
                    <span className="text-[10px] text-text-primary/60 font-mono">{user?.name?.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 rounded-[40px] border border-border-primary bg-surface-primary flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                <ArrowUpRight size={32} />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-serif italic text-text-primary">Expand Your Reach</h4>
                <p className="text-sm text-text-primary/20 font-light">Update your profile to attract more students matching your expertise.</p>
              </div>
              <Link
                to="/mentor/profile"
                className="w-full py-4 rounded-2xl border border-border-primary text-[10px] font-bold uppercase tracking-widest text-text-primary/40 hover:text-text-primary hover:border-border-primary transition-all"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {activeChat && (
          <ChatModal
            sessionId={activeChat.id}
            otherParticipantName={activeChat.name}
            onClose={() => setActiveChat(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomCalendarIcon({ className, size }: { className?: string, size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}
