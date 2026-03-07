import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Bell, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // SSE Connection setup
    const token = localStorage.getItem('token');
    if (!token) return;

    // Use absolute URL using window.location.origin
    const eventSource = new EventSource(`/api/notifications/stream?token=${token}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') return;

        // Data is an array of new notifications
        if (Array.isArray(data)) {
          setNotifications(prev => [...data, ...prev]);
          data.forEach(notification => {
            showToast(notification);
          });
        }
      } catch (err) {
        console.error("Error parsing SSE data", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const showToast = (notification: any) => {
    setToasts(prev => [...prev, notification]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== notification.id));
    }, 5000); // Remove toast after 5s
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async () => {
    try {
      await api.put('/notifications/read');
      setNotifications(notifications.map(n => ({ ...n, isRead: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => { setShow(!show); if (!show) markAsRead(); }}
          className="p-2.5 hover:bg-text-primary/5 rounded-xl relative transition-all border border-transparent hover:border-border-primary group"
        >
          <Bell size={20} className="text-text-primary/60 group-hover:text-text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-brand-accent rounded-full shadow-[0_0_10px_rgba(242,125,38,0.5)] animate-pulse" />
          )}
        </button>

        <AnimatePresence>
          {show && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShow(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-80 bg-bg-primary rounded-3xl shadow-2xl border border-border-primary z-50 overflow-hidden backdrop-blur-2xl"
              >
                <div className="p-6 border-b border-border-primary bg-white/[0.02]">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/40">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-12 text-center space-y-4">
                      <Bell className="mx-auto text-text-primary/5" size={32} />
                      <p className="text-[10px] uppercase tracking-widest text-text-primary/20 italic">
                        No active alerts
                      </p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-6 border-b border-border-primary last:border-0 transition-colors ${!n.isRead ? 'bg-brand-accent/5' : 'hover:bg-white/[0.02]'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-serif italic text-text-primary text-sm">{n.title}</p>
                          <span className="text-[8px] font-mono text-text-primary/20 uppercase tracking-widest">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-text-primary/40 font-light leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className="bg-bg-primary/90 backdrop-blur-xl border border-border-primary p-4 rounded-2xl w-80 shadow-2xl pointer-events-auto relative overflow-hidden group"
            >
              {/* Highlight bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent shadow-[0_0_10px_rgba(242,125,38,0.5)]"></div>

              <button
                onClick={() => removeToast(toast.id)}
                className="absolute top-4 right-4 text-text-primary/40 hover:text-text-primary transition-colors"
              >
                <X size={14} />
              </button>

              <div className="pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={14} className="text-brand-accent" />
                  <h4 className="font-serif italic text-text-primary text-sm">{toast.title}</h4>
                </div>
                <p className="text-xs text-text-primary/60 font-light leading-relaxed pr-6">
                  {toast.message}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
