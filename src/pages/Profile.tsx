import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Save, User, Briefcase, CheckCircle, ArrowLeft, Shield, Globe, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GridBackground from '../components/GridBackground';

export default function Profile() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', profile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center space-y-6">
      <div className="w-12 h-12 border-2 border-border-primary border-t-brand-accent rounded-full animate-spin" />
      <p className="text-[10px] uppercase tracking-[0.4em] text-text-primary/20">Syncing Profile Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-brand-accent/30 overflow-x-hidden relative">
      <GridBackground />

      <div className="max-w-4xl mx-auto p-8 pt-20 pb-32 relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 hover:text-text-primary transition-colors mb-12"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Return to Node
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left Column - Identity */}
          <div className="lg:col-span-4 space-y-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-10 rounded-[40px] border border-border-primary bg-surface-primary backdrop-blur-2xl flex flex-col items-center text-center space-y-8"
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-accent to-orange-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000" />
                <div className="relative w-24 h-24 bg-surface-primary rounded-full border border-border-primary flex items-center justify-center text-brand-accent text-4xl font-serif italic font-bold">
                  {profile.name.charAt(0)}
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-serif italic text-text-primary">{profile.name}</h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-primary border border-border-primary text-[8px] font-bold uppercase tracking-widest text-text-primary/40">
                  {profile.role}
                </div>
              </div>
            </motion.div>

            <div className="p-8 rounded-[32px] border border-border-primary bg-surface-primary space-y-8">
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
                  <span className="text-[10px] text-text-primary/60 font-mono">{profile.email.split('@')[0].toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Configuration */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-12 rounded-[40px] border border-border-primary bg-surface-primary backdrop-blur-2xl shadow-2xl"
            >
              <div className="flex justify-between items-end border-b border-border-primary pb-8 mb-12">
                <div className="space-y-1">
                  <h3 className="text-4xl font-serif italic">Configuration</h3>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-text-primary/20">Modify your digital presence</p>
                </div>
                <Globe size={24} className="text-text-primary/10" />
              </div>

              <form onSubmit={handleSave} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4 group">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 group-focus-within:text-brand-accent transition-colors">Full Name</label>
                    <input
                      type="text"
                      className="w-full bg-transparent border-b border-border-primary py-4 text-text-primary outline-none focus:border-brand-accent transition-all placeholder:text-text-primary/5 font-light"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-4 group">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20">Email (Read-only)</label>
                    <input
                      type="email"
                      disabled
                      className="w-full bg-transparent border-b border-border-primary py-4 text-text-primary/20 outline-none font-light cursor-not-allowed"
                      value={profile.email}
                    />
                  </div>
                </div>

                {profile.role === 'MENTOR' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-12"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4 group">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 group-focus-within:text-brand-accent transition-colors">Experience (Years)</label>
                        <input
                          type="number"
                          className="w-full bg-transparent border-b border-border-primary py-4 text-text-primary outline-none focus:border-brand-accent transition-all placeholder:text-text-primary/5 font-light"
                          value={profile.experienceYears || ''}
                          onChange={(e) => setProfile({ ...profile, experienceYears: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-4 group">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 group-focus-within:text-brand-accent transition-colors">Hourly Rate (₹)</label>
                        <input
                          type="number"
                          className="w-full bg-transparent border-b border-border-primary py-4 text-text-primary outline-none focus:border-brand-accent transition-all placeholder:text-text-primary/5 font-light"
                          value={profile.hourlyRate === 0 ? '' : (profile.hourlyRate || '')}
                          onChange={(e) => setProfile({ ...profile, hourlyRate: e.target.value ? parseFloat(e.target.value) : 0 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 group">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 group-focus-within:text-brand-accent transition-colors">Skills (Comma separated)</label>
                      <input
                        type="text"
                        className="w-full bg-transparent border-b border-border-primary py-4 text-text-primary outline-none focus:border-brand-accent transition-all placeholder:text-text-primary/5 font-light"
                        value={profile.skills.join(', ')}
                        onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(',').map(s => s.trim()) })}
                      />
                    </div>

                    <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/[0.02] border border-border-primary hover:border-brand-accent/20 transition-colors group">
                      <input
                        type="checkbox"
                        id="isAvailable"
                        className="w-5 h-5 accent-brand-accent bg-transparent border-border-primary rounded"
                        checked={Boolean(profile.isAvailable)}
                        onChange={(e) => setProfile({ ...profile, isAvailable: e.target.checked })}
                      />
                      <label htmlFor="isAvailable" className="text-xs font-bold uppercase tracking-widest text-text-primary/40 group-hover:text-text-primary transition-colors cursor-pointer">Available for new bookings</label>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-4 group">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-text-primary/20 group-focus-within:text-brand-accent transition-colors">Professional Bio</label>
                  <textarea
                    rows={4}
                    className="w-full bg-transparent border-b border-border-primary py-4 text-text-primary outline-none focus:border-brand-accent transition-all placeholder:text-text-primary/5 font-light resize-none leading-relaxed"
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={saving}
                  className="w-full group relative overflow-hidden bg-text-primary text-bg-primary py-6 rounded-2xl font-bold flex items-center justify-center gap-4 hover:text-text-primary transition-all duration-500 disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                    {saving ? 'Syncing Data...' : success ? (
                      <>
                        <CheckCircle size={20} /> Protocol Updated
                      </>
                    ) : (
                      <>
                        Update Profile <Save size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-brand-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.22, 1, 0.36, 1]" />
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
