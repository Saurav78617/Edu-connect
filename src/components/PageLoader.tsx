import { motion } from 'motion/react';

export default function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center pointer-events-none"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 border border-border-primary rounded-full border-t-brand-accent"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 border border-border-primary rounded-full border-b-brand-accent/50"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-2xl font-serif italic text-text-primary"
          >
            E<span className="text-brand-accent">C</span>
          </motion.div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-12 flex flex-col items-center gap-4"
      >
        <div className="text-[10px] uppercase tracking-[0.6em] text-text-primary/40 font-bold">
          Initializing Protocol
        </div>
        <div className="w-48 h-px bg-text-primary/5 relative overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-brand-accent"
          />
        </div>
      </motion.div>
      <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[8px] uppercase tracking-widest text-text-primary/20">System Status</p>
          <p className="text-[10px] text-text-primary/60 font-mono">BOOTING_CORE_v4.2</p>
        </div>
        <div className="text-[8px] uppercase tracking-[0.3em] text-text-primary/20 font-mono">
          ESTABLISHING SECURE BRIDGE...
        </div>
      </div>
    </motion.div>
  );
}
