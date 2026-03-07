import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, User, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface Message {
    id: number;
    senderId: number;
    content: string;
    createdAt: string;
    senderName: string;
}

interface ChatModalProps {
    sessionId: number;
    otherParticipantName: string;
    onClose: () => void;
}

export default function ChatModal({ sessionId, otherParticipantName, onClose }: ChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchMessages();
        setupSSE();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/messages/${sessionId}`);
            setMessages(res.data);
        } catch (err) {
            console.error('Failed to load messages', err);
        } finally {
            setLoading(false);
        }
    };

    const setupSSE = () => {
        if (!token) return;
        const eventSource = new EventSource(`/api/notifications/stream?token=${token}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Only process if it's a chat message for this session
                if (data._type === 'CHAT_MESSAGE' && data.sessionId === sessionId) {
                    setMessages((prev) => {
                        // Check for duplicates
                        if (prev.find(m => m.id === data.id)) return prev;
                        return [...prev, data];
                    });
                }
            } catch (err) {
                console.error('SSE Parse Error:', err);
            }
        };

        return () => {
            eventSource.close();
        };
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        // Optimistic UI update
        const tempId = Date.now();
        const optimisticMessage: Message = {
            id: tempId,
            senderId: user.id,
            content: newMessage,
            createdAt: new Date().toISOString(),
            senderName: user.name || 'Me'
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');

        try {
            const res = await api.post(`/messages/${sessionId}`, { content: optimisticMessage.content });
            // Replace optimistic message with actual DB message
            setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
        } catch (err) {
            console.error('Failed to send message', err);
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 50 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full h-[85vh] sm:h-auto sm:max-h-[80vh] sm:max-w-md bg-bg-primary border border-border-primary sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-4 border-b border-border-primary bg-surface-primary flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent">
                            <User size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-text-primary">{otherParticipantName}</h3>
                            <p className="text-[10px] uppercase tracking-widest text-brand-accent">Active Session Chat</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-text-primary/40 hover:text-text-primary transition-colors hover:bg-surface-primary rounded-xl"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Layout */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="animate-spin text-brand-accent/50" size={24} />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-30">
                            <User size={32} />
                            <p className="text-xs uppercase tracking-widest">No messages yet</p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => {
                                const isMe = msg.senderId === user?.id;
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                                    >
                                        <span className="text-[8px] uppercase tracking-wider text-text-primary/30 mb-1 px-1">
                                            {isMe ? 'Me' : msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isMe
                                                ? 'bg-brand-accent text-text-primary rounded-br-sm'
                                                : 'bg-surface-primary border border-border-primary text-text-primary rounded-bl-sm'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-surface-primary border-t border-border-primary">
                    <form onSubmit={handleSendMessage} className="relative flex items-center">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full bg-bg-primary border border-border-primary rounded-2xl py-3 pl-4 pr-12 text-sm outline-none focus:border-brand-accent transition-all placeholder:text-text-primary/20"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="absolute right-2 p-2 bg-text-primary text-bg-primary rounded-xl disabled:opacity-30 disabled:scale-95 hover:bg-brand-accent hover:text-text-primary transition-all transform active:scale-90"
                        >
                            <Send size={16} className="-ml-0.5 mt-0.5" />
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
