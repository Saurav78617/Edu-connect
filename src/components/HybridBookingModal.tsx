import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Monitor, Calendar, Clock, Star, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

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
}

export default function HybridBookingModal({ isOpen, onClose }: Props) {
    const { user } = useAuth();
    const [mode, setMode] = useState<'online' | 'offline'>('online');
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(false);

    // Booking State
    const [selectedMentor, setSelectedMentor] = useState<number | null>(null);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchMentors();
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

        try {
            const scheduledAt = new Date(`${date}T${time}`).toISOString();
            const mentor = mentors.find(m => m.id === selectedMentor);

            await api.post('/sessions/book', {
                mentorId: selectedMentor,
                scheduledAt,
                price: mentor?.hourlyRate || 0,
                mode
            });

            alert('Session Booked successfully!');
            onClose();
        } catch (error) {
            console.error('Booking failed', error);
            alert('Failed to book session.');
        }
    };

    if (!isOpen) return null;

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
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">Escalation Protocol</span>
                            </div>
                            <h2 className="text-3xl font-serif italic text-text-primary">Connect with a Mentor</h2>
                            <p className="text-text-primary/40 text-sm mt-2 font-light">
                                Choose how you'd like to interact with our experts.
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-text-primary/40 hover:text-text-primary transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 flex flex-col md:flex-row gap-8">
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
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 border-t border-border-primary bg-bg-primary mt-auto flex justify-between items-center">
                        <div className="text-xs text-text-primary/40 font-mono">
                            {mode === 'offline' ? 'In-person sessions require physical commute.' : 'A secure meet link will be generated.'}
                        </div>
                        <button
                            onClick={handleBook}
                            disabled={!selectedMentor || !date || !time}
                            className="px-8 py-4 rounded-xl bg-text-primary text-bg-primary font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent hover:text-bg-primary transition-all duration-300"
                        >
                            Initialize Session
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
