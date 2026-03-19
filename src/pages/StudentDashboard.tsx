import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, BookOpen, Calendar, MessageSquare, Star, CheckCircle,
  XCircle, Mail, Zap, ArrowRight, TrendingUp, CreditCard, X,
  Sparkles, Smartphone, ShieldCheck, ArrowUpRight,
  User, LogOut, Filter, Clock, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import { GoogleGenAI } from "@google/genai";
import GridBackground from '../components/GridBackground';
import ChatModal from '../components/ChatModal';
import DoubtSolver from '../components/DoubtSolver';

interface Mentor {
  id: number;
  name: string;
  skills: string[];
  bio: string;
  experienceYears: number;
  hourlyRate: number;
}

interface Session {
  id: number;
  mentorId: number;
  mentorName: string;
  scheduledAt: string;
  status: string;
  meetLink?: string;
  price?: number;
  completedAt?: string;
}

interface Masterclass {
  id: number;
  mentorName: string;
  originalHourlyRate: number;
  title: string;
  pricePerStudent: number;
  maxCapacity: number;
  currentEnrolled: number;
  scheduledDate: string;
}

export default function StudentDashboard() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<'match' | 'doubt'>('match');
  const [interests, setInterests] = useState('');
  const [matching, setMatching] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [adjustedPrice, setAdjustedPrice] = useState(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showReview, setShowReview] = useState<number | null>(null);
  const [activeChat, setActiveChat] = useState<{ id: number; participantId: number; name: string } | null>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [filter, setFilter] = useState({ skill: '', minExp: 0 });
  const [isBooking, setIsBooking] = useState(false);
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([]);
  const [mcPage, setMcPage] = useState(1);
  const [mcHasMore, setMcHasMore] = useState(true);
  const [enrollingClassId, setEnrollingClassId] = useState<number | null>(null);
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchMentors(1);
    fetchSessions();
    fetchMasterclasses();
  }, []);

  const fetchMasterclasses = async (pageNum: number = 1) => {
    try {
      const res = await api.get(`/masterclasses?page=${pageNum}&limit=4`);
      const newData = res.data.data || [];
      const meta = res.data.meta || {};

      if (pageNum === 1) {
        setMasterclasses(newData);
      } else {
        setMasterclasses(prev => [...prev, ...newData]);
      }
      
      setMcHasMore(pageNum < meta.totalPages);
      setMcPage(pageNum);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMentors = async (pageNum: number = 1) => {
    try {
      const res = await api.get(`/mentors?page=${pageNum}&limit=6`);
      const newData = res.data.data || [];
      const meta = res.data.meta || {};

      if (pageNum === 1) {
        setMentors(newData);
      } else {
        setMentors(prev => [...prev, ...newData]);
      }
      
      setHasMore(pageNum < meta.totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions/my');
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAIMatch = async () => {
    if (!interests || mentors.length === 0) return;
    setMatching(true);
    try {
      const res = await api.post('/mentors/match', { interests, mentors });
      const matchIds = res.data.matchIds || [];

      const matchedMentors = mentors.filter(m => matchIds.includes(m.id));
      // Sort mentors based on the order in matchIds
      const sortedMatches = [...matchedMentors].sort((a, b) => matchIds.indexOf(a.id) - matchIds.indexOf(b.id));

      if (sortedMatches.length > 0) {
        setMentors(sortedMatches);
      }
    } catch (err) {
      console.error("AI Match Error:", err);
      showToast("AI matching failed. Please try again.", 'error');
    } finally {
      setMatching(false);
    }
  };

  const handleBook = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setAdjustedPrice(mentor.hourlyRate);
    setShowPayment(true);
  };

  const confirmBooking = async () => {
    setIsBooking(true);

    try {
      const res = await api.post('/sessions/book', {
        mentorId: selectedMentor?.id,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        price: adjustedPrice
      });

      const { orderId, amount, currency, id: sessionId } = res.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '', // Fallback empty if not set in .env
        amount,
        currency,
        name: "Edu Connect",
        description: `Mentorship Session with ${selectedMentor?.name}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            setIsBooking(true);
            await api.post('/sessions/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              sessionId
            });

            setShowPayment(false);
            setBookingSuccess(true);
            fetchSessions();
            setTimeout(() => setBookingSuccess(false), 3000);
          } catch (verificationError) {
            console.error(verificationError);
            showToast('Payment verification failed.', 'error');
          } finally {
            setIsBooking(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: "9999999999"
        },
        theme: {
          color: "#ff6b00"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error(response.error.description);
        showToast('Payment failed: ' + response.error.description, 'error');
        setIsBooking(false);
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      showToast('Failed to initialize payment. Please try again.', 'error');
      setIsBooking(false);
    }
  };

  const submitReview = async (sessionId: number) => {
    try {
      await api.post('/reviews', { sessionId, ...reviewData });
      setShowReview(null);
      setReviewData({ rating: 5, comment: '' });
      showToast('Review submitted! Thank you.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnrollMasterclass = async (id: number) => {
    setEnrollingClassId(id);
    try {
      await api.post(`/masterclasses/${id}/enroll`);
      showToast("Successfully enrolled in Masterclass!", 'success');
      fetchMasterclasses();
      fetchSessions();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to enroll. You might already be enrolled.", 'error');
    } finally {
      setEnrollingClassId(null);
    }
  };

  const filteredMentors = mentors.filter(m => {
    const matchesSkill = !filter.skill || m.skills.some(s => s.toLowerCase().includes(filter.skill.toLowerCase()));
    const matchesExp = m.experienceYears >= filter.minExp;
    return matchesSkill && matchesExp;
  });

  const activeSessions = sessions.filter(s => s.status === 'PENDING' || (s.status === 'CONFIRMED' && !s.completedAt && new Date(s.scheduledAt).getTime() > Date.now() - 3600000));
  const historySessions = sessions.filter(s => s.status === 'CANCELLED' || s.status === 'COMPLETED' || s.completedAt || (s.status === 'CONFIRMED' && new Date(s.scheduledAt).getTime() <= Date.now() - 3600000));

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-brand-accent/30 overflow-x-hidden">
      <GridBackground />

      {/* Header */}
      <header className="bg-bg-primary/40 backdrop-blur-xl border-b border-border-primary px-8 py-5 flex justify-between items-center sticky top-0 z-[50]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-text-primary rounded-xl flex items-center justify-center text-bg-primary font-serif italic font-bold">EC</div>
          <h1 className="text-xl font-serif italic font-bold tracking-tight">Edu <span className="text-brand-accent">Connect</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <NotificationBell />
          <ThemeToggle />
          <Link to="/student/bookings" className="p-2.5 hover:bg-surface-primary rounded-xl transition-all border border-transparent hover:border-border-primary group relative">
            <Calendar size={20} className="text-text-primary/60 group-hover:text-brand-accent transition-colors" />
            <span className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-text-primary text-bg-primary text-[8px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">My Bookings</span>
          </Link>
          <Link to="/student/profile" className="p-2.5 hover:bg-surface-primary rounded-xl transition-all border border-transparent hover:border-border-primary group relative">
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
        {/* Hero Section */}
        <section className="mb-24 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-surface-primary border border-border-primary backdrop-blur-md"
          >
            <Sparkles size={14} className="text-brand-accent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-text-primary/60">AI Matching Protocol Active</span>
          </motion.div>

          <div className="space-y-4">
            <h2 className="text-6xl md:text-8xl font-serif font-light tracking-tighter leading-none">
              Find your <span className="italic text-brand-accent">Mentor</span>.
            </h2>
            <p className="max-w-xl mx-auto text-text-primary/30 text-lg font-light">
              Connect with the mentors of industry who have built the paths you wish to walk.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab('match')}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'match' ? 'bg-text-primary text-bg-primary' : 'bg-surface-primary text-text-primary/40 hover:text-text-primary'}`}
            >
              Find Mentor
            </button>
            <button
              onClick={() => setActiveTab('doubt')}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'doubt' ? 'bg-brand-accent text-bg-primary' : 'bg-surface-primary text-text-primary/40 hover:text-text-primary'}`}
            >
              AI Doubt Solver
            </button>
          </div>

          {activeTab === 'match' ? (
            <div className="max-w-3xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-accent to-orange-600 rounded-[30px] blur opacity-20 group-focus-within:opacity-40 transition duration-1000" />
              <div className="relative">
                <input
                  type="text"
                  placeholder="Describe your ambition... e.g. I want to build a career in sustainable tech leadership."
                  className="w-full bg-surface-primary text-text-primary px-8 py-7 rounded-[28px] border border-border-primary outline-none focus:border-brand-accent/50 transition-all pr-40 text-lg font-light placeholder:text-text-primary/20"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAIMatch()}
                />
                <button
                  onClick={handleAIMatch}
                  disabled={matching}
                  className="absolute right-3 top-3 bottom-3 bg-text-primary text-bg-primary px-8 rounded-2xl font-bold flex items-center gap-3 hover:bg-brand-accent hover:text-text-primary transition-all duration-500 disabled:opacity-50 group/btn"
                >
                  {matching ? 'Matching...' : (
                    <>
                      <span className="text-xs uppercase tracking-widest">Match</span>
                      <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto text-left">
              {activeTab === 'doubt' && (
                <DoubtSolver onBookingComplete={fetchSessions} />
              )}
            </div>
          )}
        </section>

        {/* Masterclass Circles */}
        {masterclasses.length > 0 && (
          <section className="mb-24 space-y-8">
            <div className="flex items-center gap-4 border-b border-border-primary pb-6">
              <h3 className="text-3xl font-serif italic text-text-primary">🔥 Trending Masterclass Circles</h3>
              <p className="text-[10px] uppercase tracking-[0.3em] text-brand-accent mt-2">1-to-Many Accelerated Learning</p>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
              {masterclasses.map(cls => (
                <div key={cls.id} className="min-w-[340px] p-8 rounded-[32px] border border-brand-accent/30 bg-surface-primary hover:bg-brand-accent/[0.02] transition-all duration-500 flex flex-col snap-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-accent via-orange-500 to-transparent" />

                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary/40 bg-text-primary/5 px-3 py-1.5 rounded-full">Group Session</span>
                    <div className="text-right">
                      <div className="text-sm font-mono text-text-primary/30 line-through">₹{cls.originalHourlyRate}/hr</div>
                      <div className="text-2xl font-serif italic text-brand-accent">₹{cls.pricePerStudent}</div>
                    </div>
                  </div>

                  <h4 className="text-xl font-serif text-text-primary mb-2 line-clamp-2">{cls.title}</h4>
                  <p className="text-xs text-text-primary/40 mb-6 font-light">Hosted by {cls.mentorName}</p>

                  <div className="space-y-4 mb-8 mt-auto">
                    <div className="flex items-center gap-3 text-text-primary/60">
                      <Calendar size={14} className="text-brand-accent/60" />
                      <span className="text-xs font-mono">{new Date(cls.scheduledDate).toLocaleString()}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-text-primary/40">
                        <span>Capacity</span>
                        <span>{cls.currentEnrolled} / {cls.maxCapacity} Seats</span>
                      </div>
                      <div className="w-full h-1 bg-bg-primary rounded-full overflow-hidden">
                        <div className="h-full bg-brand-accent" style={{ width: `${(cls.currentEnrolled / cls.maxCapacity) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleEnrollMasterclass(cls.id)}
                    disabled={cls.currentEnrolled >= cls.maxCapacity || enrollingClassId === cls.id}
                    className="w-full py-4 rounded-2xl bg-text-primary text-bg-primary font-bold text-[10px] uppercase tracking-widest hover:bg-brand-accent hover:text-bg-primary transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {enrollingClassId === cls.id ? 'Processing...' : cls.currentEnrolled >= cls.maxCapacity ? 'Class Full' : 'Enroll Now'}
                  </button>
                </div>
              ))}
            </div>

            {mcHasMore && masterclasses.length > 0 && (
              <div className="flex justify-center mt-6">
                 <button
                   onClick={() => fetchMasterclasses(mcPage + 1)}
                   className="px-8 py-3 rounded-xl border border-border-primary bg-surface-primary/50 text-text-primary/60 hover:text-text-primary hover:border-brand-accent/50 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                 >
                   Load More Masterclasses <ArrowRight size={14} />
                 </button>
              </div>
            )}
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left Column - Mentors */}
          <div className="lg:col-span-8 space-y-12">
            <div className="flex justify-between items-end border-b border-border-primary pb-8">
              <div className="space-y-1">
                <h3 className="text-3xl font-serif italic">Available Mentors</h3>
                <p className="text-[10px] uppercase tracking-[0.3em] text-text-primary/20">Curated for your trajectory</p>
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-primary/20" />
                  <input
                    type="text"
                    placeholder="Filter skills..."
                    className="pl-10 pr-4 py-2.5 bg-surface-primary border border-border-primary rounded-xl text-xs outline-none focus:border-brand-accent/30 transition-all w-40"
                    value={filter.skill}
                    onChange={(e) => setFilter({ ...filter, skill: e.target.value })}
                  />
                </div>
                <button onClick={() => { setFilter({ skill: '', minExp: 0 }); fetchMentors(1); }} className="text-[10px] uppercase tracking-widest text-brand-accent/50 hover:text-brand-accent transition-colors">Reset</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredMentors.length === 0 ? (
                <div className="col-span-full py-20 border border-dashed border-border-primary rounded-[32px] flex flex-col items-center justify-center text-text-primary/40 space-y-4">
                  <User size={48} className="opacity-20 text-brand-accent" />
                  <p className="text-sm font-light italic text-center max-w-sm">No mentors found matching your criteria. Try adjusting your filters!</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredMentors.map((mentor) => (
                    <motion.div
                      layout
                      key={mentor.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative p-8 rounded-[32px] border border-border-primary bg-surface-primary hover:bg-brand-accent/[0.02] transition-all duration-700 flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-8">
                        <div className="w-14 h-14 bg-surface-primary rounded-2xl border border-border-primary flex items-center justify-center text-brand-accent font-serif italic font-bold text-2xl group-hover:scale-110 transition-transform duration-500">
                          {mentor.name.charAt(0)}
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-2 justify-end">
                            <Clock size={12} className="text-text-primary/20" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary/40">
                              {mentor.experienceYears}Y Experience
                            </span>
                          </div>
                          <div className="text-lg font-serif italic text-brand-accent">₹{mentor.hourlyRate}/hr</div>
                        </div>
                      </div>

                      <h4 className="text-2xl font-serif text-text-primary mb-2">{mentor.name}</h4>
                      <p className="text-sm text-text-primary/30 mb-8 line-clamp-3 font-light leading-relaxed">{mentor.bio}</p>

                      <div className="flex flex-wrap gap-2 mb-10 mt-auto">
                        {mentor.skills.map(skill => (
                          <span key={skill} className="text-[9px] font-bold uppercase tracking-[0.2em] bg-surface-primary text-text-primary/40 px-3 py-1.5 rounded-lg border border-border-primary group-hover:border-brand-accent/20 transition-colors">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => handleBook(mentor)}
                        className="w-full py-5 rounded-2xl bg-text-primary text-bg-primary font-bold text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-text-primary transition-all duration-500 flex items-center justify-center gap-3"
                      >
                        <Calendar size={18} /> Book Session
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {hasMore && !matching && filter.skill === '' && filter.minExp === 0 && (
              <div className="flex justify-center mt-12 w-full col-span-full">
                <button
                  onClick={() => fetchMentors(page + 1)}
                  className="px-8 py-3 rounded-xl border border-border-primary bg-surface-primary/50 text-text-primary/60 hover:text-text-primary hover:border-brand-accent/50 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                >
                  Load More Mentors <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Sessions & Activity */}
          <div className="lg:col-span-4 space-y-12">
            <div className="space-y-8">
              <div className="border-b border-border-primary pb-8">
                <h3 className="text-3xl font-serif italic">My Sessions</h3>
                <p className="text-[10px] uppercase tracking-[0.3em] text-text-primary/20">Active Engagements</p>
              </div>

              <div className="space-y-6">
                {activeSessions.length === 0 ? (
                  <div className="p-12 rounded-[32px] border border-dashed border-border-primary flex flex-col items-center justify-center text-center space-y-4">
                    <Calendar className="text-text-primary/10" size={40} />
                    <p className="text-text-primary/20 text-sm font-light italic">No active sessions found.</p>
                  </div>
                ) : (
                  activeSessions.map(session => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-6 rounded-3xl border border-border-primary bg-surface-primary hover:bg-brand-accent/[0.02] transition-all duration-500 space-y-6"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="text-lg font-serif italic text-text-primary">{session.mentorName}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-text-primary/30 font-mono">
                            <Clock size={12} />
                            {new Date(session.scheduledAt).toLocaleString()}
                          </div>
                          <div className="text-[10px] font-bold text-brand-accent font-mono mt-1">₹{session.price || 0}.00</div>
                        </div>
                        <span className={`text-[8px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${session.status === 'CONFIRMED' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' :
                          session.status === 'PENDING' ? 'border-orange-500/20 text-orange-500 bg-orange-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5'
                          }`}>
                          {session.status}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        {session.status === 'CONFIRMED' && session.meetLink && (
                          <a
                            href={session.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-3 rounded-xl bg-text-primary text-bg-primary text-[10px] font-bold uppercase tracking-widest text-center hover:bg-brand-accent hover:text-text-primary transition-all duration-500"
                          >
                            Join Call
                          </a>
                        )}

                        <button
                          onClick={() => setActiveChat({ id: session.id, participantId: session.mentorId, name: session.mentorName })}
                          className="p-3 rounded-xl border border-border-primary text-text-primary/40 hover:text-brand-accent hover:border-brand-accent/30 transition-all flex items-center justify-center relative"
                          title="Open Chat"
                        >
                          <MessageSquare size={16} />
                        </button>

                        {session.status === 'CONFIRMED' && (
                          <button
                            onClick={() => setShowReview(session.id)}
                            className="p-3 rounded-xl border border-border-primary text-text-primary/40 hover:text-brand-accent hover:border-brand-accent/30 transition-all"
                          >
                            <Star size={16} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Session History Section */}
              <div className="border-b border-border-primary pb-8 pt-6">
                <h3 className="text-3xl font-serif italic">History</h3>
                <p className="text-[10px] uppercase tracking-[0.3em] text-text-primary/20">Completed & Past Sessions</p>
              </div>

              <div className="space-y-6">
                {historySessions.length === 0 ? (
                  <div className="p-12 rounded-[32px] border border-dashed border-border-primary flex flex-col items-center justify-center text-center space-y-4">
                    <Clock className="text-text-primary/10" size={40} />
                    <p className="text-text-primary/20 text-sm font-light italic">Your session history is empty.</p>
                  </div>
                ) : (
                  historySessions.map(session => (
                    <motion.div
                      key={`history-${session.id}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-6 rounded-3xl border border-border-primary bg-surface-primary/50 hover:bg-surface-primary hover:border-brand-accent/20 transition-all duration-500 space-y-6 opacity-80 hover:opacity-100"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="text-lg font-serif italic text-text-primary">{session.mentorName}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-text-primary/30 font-mono">
                            <Clock size={12} />
                            {new Date(session.scheduledAt).toLocaleString()}
                          </div>
                          <div className="text-[10px] font-bold text-brand-accent font-mono mt-1">₹{session.price || 0}.00</div>
                        </div>
                        <span className={`text-[8px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${session.status === 'COMPLETED' || session.status === 'CONFIRMED' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' :
                          'border-text-primary/20 text-text-primary/40 bg-text-primary/5'
                          }`}>
                          {session.status === 'CONFIRMED' ? 'COMPLETED' : session.status}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setActiveChat({ id: session.id, participantId: session.mentorId, name: session.mentorName })}
                          className="p-3 rounded-xl border border-border-primary text-text-primary/40 hover:text-brand-accent hover:border-brand-accent/30 transition-all flex items-center justify-center relative"
                          title="Open Chat History"
                        >
                          <MessageSquare size={16} />
                        </button>

                        {(session.status === 'COMPLETED' || session.status === 'CONFIRMED') && (
                          <button
                            onClick={() => setShowReview(session.id)}
                            className="p-3 rounded-xl border border-border-primary text-text-primary/40 hover:text-brand-accent hover:border-brand-accent/30 transition-all"
                            title="Leave a Review"
                          >
                            <Star size={16} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* System Stats / Info */}
            <div className="p-8 rounded-[32px] border border-border-primary bg-gradient-to-br from-white/[0.02] to-transparent space-y-6">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-brand-accent" />
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-text-primary/60">Node Security</h4>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-text-primary/20 uppercase tracking-widest">Encryption</span>
                  <span className="text-[10px] text-emerald-500 font-mono">ACTIVE_AES_256</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-text-primary/20 uppercase tracking-widest">Identity</span>
                  <span className="text-[10px] text-text-primary/60 font-mono">{user?.name?.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Review Modal */}
      <AnimatePresence>
        {showReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReview(null)}
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
                onClick={() => setShowReview(null)}
                className="absolute top-6 right-6 text-text-primary/20 hover:text-text-primary transition-colors"
              >
                <X size={24} />
              </button>

              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="text-xl font-serif text-text-primary mt-2">Rate your Session</h3>
                  <p className="text-text-primary/40 text-sm">Your insight helps the mentor refine their craft.</p>
                </div>

                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setReviewData({ ...reviewData, rating: n })}
                      className={`p-3 rounded-2xl transition-all ${reviewData.rating >= n ? 'text-brand-accent bg-brand-accent/10' : 'text-text-primary/10 hover:text-text-primary/30'}`}
                    >
                      <Star size={24} fill={reviewData.rating >= n ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>

                <div className="space-y-6">
                  <div className="relative group">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 mb-4 group-focus-within:text-brand-accent transition-all duration-500">
                      Your Experience
                    </label>
                    <textarea
                      className="w-full bg-transparent border-b border-border-primary py-4 text-text-primary outline-none focus:border-brand-accent transition-all duration-500 placeholder:text-text-primary/5 font-light resize-none leading-relaxed"
                      rows={4}
                      placeholder="How was your session? What did you learn?"
                      value={reviewData.comment}
                      onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    />
                  </div>

                  <button
                    onClick={() => submitReview(showReview)}
                    className="w-full bg-text-primary text-bg-primary py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-text-primary transition-all duration-500"
                  >
                    Submit Review
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {bookingSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-text-primary text-bg-primary px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 z-[100] border border-border-primary"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-text-primary">
              <CheckCircle size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Protocol Initialized Successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal (Hackathon Demo) */}
      <AnimatePresence>
        {showPayment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPayment(false)}
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
                onClick={() => setShowPayment(false)}
                className="absolute top-6 right-6 text-text-primary/20 hover:text-text-primary transition-colors"
              >
                <X size={24} />
              </button>

              <div className="space-y-10">
                <div className="space-y-2">
                  <h3 className="text-3xl font-serif text-text-primary italic">Confirm Booking</h3>
                  <p className="text-text-primary/40 text-sm font-light">Secure bridge to {selectedMentor?.name}</p>
                </div>

                <div className="p-8 rounded-3xl bg-white/[0.02] border border-border-primary space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-text-primary/20">Base Mentorship Fee</span>
                    <span className="text-sm font-mono text-text-primary/40 line-through">₹{selectedMentor?.hourlyRate}.00</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase tracking-widest text-text-primary/20">Adjusted Fee</span>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <button
                              onClick={() => setAdjustedPrice(prev => Math.max(0, prev - 100))}
                              className="px-2 py-1 rounded-lg bg-text-primary/5 border border-border-primary text-[8px] font-bold hover:bg-red-500/20 hover:text-red-500 transition-all"
                            >
                              -100
                            </button>
                            <button
                              onClick={() => setAdjustedPrice(prev => Math.max(0, prev - 10))}
                              className="px-2 py-1 rounded-lg bg-text-primary/5 border border-border-primary text-[8px] font-bold hover:bg-red-500/20 hover:text-red-500 transition-all"
                            >
                              -10
                            </button>
                          </div>
                        </div>
                        <span className="text-sm font-mono text-text-primary font-bold">₹{adjustedPrice}.00</span>
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <button
                              onClick={() => setAdjustedPrice(prev => prev + 10)}
                              className="px-2 py-1 rounded-lg bg-text-primary/5 border border-border-primary text-[8px] font-bold hover:bg-emerald-500/20 hover:text-emerald-500 transition-all"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => setAdjustedPrice(prev => prev + 100)}
                              className="px-2 py-1 rounded-lg bg-text-primary/5 border border-border-primary text-[8px] font-bold hover:bg-emerald-500/20 hover:text-emerald-500 transition-all"
                            >
                              +100
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-text-primary/20">Platform Fee</span>
                    <span className="text-sm font-mono text-emerald-500">₹0.00</span>
                  </div>
                  <div className="pt-4 border-t border-border-primary flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-text-primary/60">Total to Pay</span>
                    <span className="text-2xl font-serif italic text-brand-accent">₹{adjustedPrice}.00</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-primary/40 block mb-2">Select Payment Method</label>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-4 p-5 rounded-2xl border border-brand-accent/50 bg-brand-accent/5 relative overflow-hidden">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center">
                            <Smartphone className="text-brand-accent" size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold uppercase tracking-widest text-text-primary">UPI / QR Code</p>
                            <p className="font-mono text-[10px] text-text-primary/40 mt-1 tracking-wider">Google Pay, PhonePe, Paytm</p>
                          </div>
                          <CheckCircle size={18} className="text-brand-accent" />
                        </div>
                        
                        <div className="w-full flex justify-center py-4 bg-white rounded-xl">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=kumarsourabh11553-2@oksbi&pn=Saurav%20Rountaye&am=${adjustedPrice}&cu=INR`} alt="UPI QR Code" className="w-48 h-48 object-contain" />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-5 rounded-2xl border border-border-primary bg-white/[0.01] opacity-50 cursor-not-allowed">
                        <div className="w-10 h-10 rounded-xl bg-surface-primary flex items-center justify-center">
                          <CreditCard className="text-text-primary/40" size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold uppercase tracking-widest text-text-primary/60">Debit / Credit Card</p>
                          <p className="font-mono text-[10px] text-text-primary/30 mt-1 tracking-wider">Visa, Mastercard, RuPay</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-primary/40 block">Your UPI ID (For Verification)</label>
                      <input
                        type="text"
                        placeholder="example@okicici"
                        defaultValue="student@paytm"
                        className="w-full bg-surface-primary border border-border-primary rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-accent transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={confirmBooking}
                    disabled={isBooking}
                    className="w-full bg-text-primary text-bg-primary py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-white transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBooking ? (
                      <>Processing <div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" /></>
                    ) : (
                      <>Pay & Confirm <ArrowUpRight size={18} /></>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-text-primary/20">
                  <ShieldCheck size={14} className="text-emerald-500/50" />
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold">Secured by Razorpay™ Demo</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeChat && (
          <ChatModal
            sessionId={activeChat.id}
            otherParticipantId={activeChat.participantId}
            otherParticipantName={activeChat.name}
            onClose={() => setActiveChat(null)}
          />
        )}
      </AnimatePresence>
    </div >
  );
}
