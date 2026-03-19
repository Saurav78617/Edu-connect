import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Monitor, Calendar, Clock, Star, ShieldCheck, QrCode, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface Mentor {
    id: number;
    name: string;
    role: string;
    skills: string[];
    experienceYears: number;
    hourlyRate: number;
    bio: string;
    city: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onBookingComplete?: () => void;
}

export default function HybridBookingModal({ isOpen, onClose, onBookingComplete }: Props) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [mode, setMode] = useState<'online' | 'offline'>('online');
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(false);

    // Booking State
    const [selectedMentor, setSelectedMentor] = useState<number | null>(null);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    
    // Payment State
    const [showQR, setShowQR] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchMentors();
            setShowQR(false); // Reset payment state when modal opens
        }
    }, [isOpen, mode]);

    const fetchMentors = async () => {
        setLoading(true);
        try {
            let endpoint = '/mentors';
            if (mode === 'offline' && user?.city) {
                endpoint = `/mentors/search?city=${encodeURIComponent(user.city)}`;
            }
            const res = await api.get(endpoint);
            // If offline is selected, we only show mentors who have a city matching the user's city
            let filtered = res.data;
            if (mode === 'offline') {
                filtered = res.data.filter((m: Mentor) => m.city?.toLowerCase() === user?.city?.toLowerCase());
            }
            setMentors(filtered);
        } catch (error) {
            console.error('Error fetching mentors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async () => {
        if (!selectedMentor || !date || !time) return;

        if (!showQR) {
            setShowQR(true);
            return;
        }

        setPaymentProcessing(true);
        try {
            const scheduledAt = new Date(`${date}T${time}`).toISOString();
            const mentor = mentors.find(m => m.id === selectedMentor);

            const res = await api.post('/sessions/book', {
                mentorId: selectedMentor,
                scheduledAt,
                price: mentor?.hourlyRate || 0,
                mode
            });

            const { orderId, amount, currency, id: sessionId } = res.data;

            const options = {
                key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID || '', // Fallback empty if not set
                amount,
                currency,
                name: "Edu Connect",
                description: `Mentorship Session with ${mentor?.name}`,
                order_id: orderId,
                handler: async function (response: any) {
                    try {
                        setPaymentProcessing(true);
                        await api.post('/sessions/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            sessionId
                        });

                        showToast('Payment successful & Session Booked!', 'success');
                        if (onBookingComplete) onBookingComplete();
                        onClose();
                    } catch (verificationError) {
                        console.error(verificationError);
                        showToast('Payment verification failed.', 'error');
                    } finally {
                        setPaymentProcessing(false);
                        setShowQR(false);
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
                setPaymentProcessing(false);
            });
            rzp.open();

        } catch (error) {
            console.error('Booking/Payment failed', error);
            showToast('Failed to process payment & book session.', 'error');
            setPaymentProcessing(false);
        }
    };

    if (!isOpen) return null;

    const selectedMentorData = mentors.find(m => m.id === selectedMentor);
    const price = selectedMentorData?.hourlyRate || 0;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-bg-primary border border-border-primary rounded-[32px] shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-border-primary border-bg-text-primary/5 flex justify-between items-start">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/10 mb-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">
                                    {showQR ? 'Secure Checkout' : 'Escalation Protocol'}
                                </span>
                            </div>
                            <h2 className="text-3xl font-serif italic text-text-primary">
                                {showQR ? 'Complete Payment' : 'Connect with a Mentor'}
                            </h2>
                            <p className="text-text-primary/40 text-sm mt-2 font-light">
                                {showQR ? "Scan the QR code below via Razorpay or any UPI app to confirm your booking." : "Choose how you'd like to interact with our experts."}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-text-primary/40 hover:text-text-primary transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 flex flex-col md:flex-row gap-8">
                        {showQR ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full flex flex-col items-center justify-center py-8"
                            >
                                <div className="bg-white p-4 rounded-2xl shadow-xl border-4 border-white mb-6">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=kumarsourabh11553-2@oksbi&pn=Saurav%20Rountaye&am=${price}&cu=INR`} 
                                        alt="UPI QR Code" 
                                        className="w-[200px] h-[200px]"
                                    />
                                </div>
                                <div className="text-center max-w-sm">
                                    <div className="text-2xl font-mono text-text-primary mb-2">${price} <span className="text-sm text-text-primary/50 uppercase tracking-widest">USD</span></div>
                                    <div className="text-sm text-text-primary/60 mb-2 flex items-center justify-center gap-2">
                                        <ShieldCheck size={16} className="text-emerald-500" />
                                        Secure UPI Payment
                                    </div>
                                    <div className="text-xs text-text-primary/60 mb-6 bg-white/5 py-2 px-4 rounded-lg font-mono border border-border-primary/50">
                                        UPI ID: kumarsourabh11553-2@oksbi
                                    </div>
                                    <p className="text-xs text-text-primary/40 leading-relaxed font-mono">
                                        Open any UPI app (GPay, PhonePe, Paytm), scan the QR code to authorize the payment, and finalize the session with <b>{selectedMentorData?.name}</b>.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <>
                                {/* Left: Configuration */}
                                <div className="w-full md:w-1/3 space-y-8">
                                    {/* Mode Toggle */}
                                    <div className="bg-white/5 p-1 rounded-2xl flex flex-col gap-1 border border-border-primary">
                                        <button
                                            onClick={() => setMode('online')}
                                            className={`flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium transition-all ${mode === 'online' ? 'bg-text-primary text-bg-primary shadow-lg' : 'text-text-primary/40 hover:text-text-primary hover:bg-white/5'
                                                }`}
                                        >
                                            <Monitor size={18} />
                                            Online Workspace
                                        </button>
                                        <button
                                            onClick={() => setMode('offline')}
                                            className={`flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium transition-all ${mode === 'offline' ? 'bg-text-primary text-bg-primary shadow-lg' : 'text-text-primary/40 hover:text-text-primary hover:bg-white/5'
                                                }`}
                                        >
                                            <MapPin size={18} />
                                            In-Person (Nearby)
                                        </button>
                                    </div>

                                    {mode === 'offline' && !user?.city && (
                                        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs">
                                            Please update your profile with your City to see nearby mentors for in-person sessions.
                                        </div>
                                    )}

                                    {/* Booking Form */}
                                    <div className="space-y-4">
                                        <label className="block text-xs uppercase tracking-widest text-text-primary/40 font-mono">Schedule Setup</label>
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-primary/40" size={16} />
                                                <input
                                                    type="date"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    className="w-full bg-white/5 border border-border-primary rounded-xl py-3 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-brand-accent transition-colors"
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                            <div className="relative">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-primary/40" size={16} />
                                                <input
                                                    type="time"
                                                    value={time}
                                                    onChange={(e) => setTime(e.target.value)}
                                                    className="w-full bg-white/5 border border-border-primary rounded-xl py-3 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-brand-accent transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Mentor Selection */}
                                <div className="w-full md:w-2/3">
                                    <label className="block text-xs uppercase tracking-widest text-text-primary/40 font-mono mb-4">
                                        Available Nodes {mode === 'offline' && user?.city ? `in ${user.city}` : ''}
                                    </label>

                                    <div className="grid gap-4">
                                        {loading ? (
                                            <div className="text-center py-12 text-sm text-text-primary/40 animate-pulse">Scanning the network...</div>
                                        ) : mentors.length === 0 ? (
                                            <div className="text-center p-8 rounded-2xl border border-dashed border-border-primary text-text-primary/40 text-sm">
                                                No active mentors found matching criteria.
                                            </div>
                                        ) : (
                                            mentors.map((mentor) => (
                                                <div
                                                    key={mentor.id}
                                                    onClick={() => setSelectedMentor(mentor.id)}
                                                    className={`cursor-pointer group p-6 rounded-2xl border transition-all duration-300 ${selectedMentor === mentor.id
                                                        ? 'border-brand-accent bg-brand-accent/5'
                                                        : 'border-border-primary bg-white/[0.02] hover:bg-white/[0.04]'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-serif text-xl text-text-primary">{mentor.name}</h3>
                                                                <ShieldCheck size={16} className="text-emerald-500" />
                                                            </div>
                                                            <p className="text-xs text-text-primary/40 flex items-center gap-2">
                                                                {mentor.experienceYears}y exp • ⭐ 4.9
                                                                {mentor.city && mode === 'offline' && (
                                                                    <span className="flex items-center gap-1 text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full text-[10px]">
                                                                        <MapPin size={10} /> {mentor.city}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-lg font-mono text-text-primary">${mentor.hourlyRate}</div>
                                                            <div className="text-[10px] uppercase text-text-primary/40 tracking-widest">/hr</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {mentor.skills.map((skill, i) => (
                                                            <span key={i} className="text-[10px] uppercase tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded-full text-text-primary/60">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 border-t border-border-primary bg-bg-primary mt-auto flex justify-between items-center">
                        <div className="text-xs text-text-primary/40 font-mono">
                            {showQR ? (
                                <button 
                                    onClick={() => setShowQR(false)}
                                    className="hover:text-text-primary transition-colors hover:underline"
                                >
                                    ← Back to Selection
                                </button>
                            ) : (
                                mode === 'offline' ? 'In-person sessions require physical commute.' : 'A secure meet link will be generated.'
                            )}
                        </div>
                        <button
                            onClick={handleBook}
                            disabled={!selectedMentor || !date || !time || paymentProcessing}
                            className={`px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                                showQR 
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' 
                                    : 'bg-text-primary text-bg-primary hover:bg-brand-accent hover:text-bg-primary'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {paymentProcessing ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : showQR ? (
                                <>
                                    <CheckCircle2 size={16} />
                                    I Have Paid
                                </>
                            ) : (
                                'Proceed to Payment'
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
