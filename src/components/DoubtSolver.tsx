import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, ShieldAlert, Sparkles } from 'lucide-react';
import api from '../utils/api';
import HybridBookingModal from './HybridBookingModal';

interface Message {
    id: string;
    sender: 'ai' | 'user';
    text: string;
}

interface Props {
    onBookingComplete?: () => void;
}

export default function DoubtSolver({ onBookingComplete }: Props) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'ai',
            text: "Initialize inquiry. I am your Gemini-powered assistant on The Bridge. How can I help resolve your doubt today?"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userText = input.trim();
        setInput('');
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userText }]);
        setLoading(true);

        try {
            const res = await api.post('/chat', { prompt: userText });
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: res.data.response || "No response generated."
            }]);
        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: "System overload. Failed to process request."
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] border border-border-primary bg-bg-primary/50 backdrop-blur-md rounded-3xl overflow-hidden relative">
            {/* Header */}
            <div className="p-6 border-b border-border-primary bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center border border-brand-accent/30">
                        <Bot size={20} className="text-brand-accent" />
                    </div>
                    <div>
                        <h2 className="text-xl font-serif text-text-primary">AI Node</h2>
                        <div className="text-[10px] uppercase tracking-widest text-brand-accent flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" /> Online
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex gap-4 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.sender === 'user'
                                ? 'bg-text-primary/10 border-text-primary/20'
                                : 'bg-brand-accent/10 border-brand-accent/30'
                                }`}>
                                {msg.sender === 'user' ? <User size={14} className="text-text-primary/60" /> : <Bot size={14} className="text-brand-accent" />}
                            </div>

                            <div className={`space-y-4 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
                                    ? 'bg-text-primary text-bg-primary rounded-tr-none'
                                    : 'bg-white/5 text-text-primary/80 border border-border-primary rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>

                                {msg.sender === 'ai' && msg.id !== '1' && (
                                    <motion.button
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 }}
                                        onClick={() => setShowModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 mt-2 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-medium hover:bg-orange-500/20 transition-colors"
                                    >
                                        <ShieldAlert size={14} />
                                        Not Helpful? Escalate to Human Mentor
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-brand-accent/10 border border-brand-accent/30">
                                <Bot size={14} className="text-brand-accent animate-pulse" />
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-border-primary rounded-tl-none flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-accent/50 animate-bounce" />
                                <span className="w-2 h-2 rounded-full bg-brand-accent/50 animate-bounce delay-75" />
                                <span className="w-2 h-2 rounded-full bg-brand-accent/50 animate-bounce delay-150" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-border-primary bg-bg-primary/80">
                <form onSubmit={handleSend} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        placeholder="Initialize query..."
                        className="w-full bg-white/5 border border-border-primary rounded-2xl py-4 pl-6 pr-16 text-sm text-text-primary placeholder:text-text-primary/30 focus:outline-none focus:border-brand-accent transition-colors disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-brand-accent text-bg-primary rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>

            <HybridBookingModal isOpen={showModal} onClose={() => setShowModal(false)} onBookingComplete={onBookingComplete} />
        </div>
    );
}
