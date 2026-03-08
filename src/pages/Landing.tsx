import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Users, Sparkles, ShieldCheck, Fingerprint, Globe, Cpu, Zap } from 'lucide-react';
import GridBackground from '../components/GridBackground';
import FloatingNav from '../components/FloatingNav';

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } as any
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-brand-accent/30 overflow-x-hidden">
      <GridBackground />
      <FloatingNav />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        <motion.div
          style={{ opacity, scale }}
          className="relative z-10 w-full max-w-7xl mx-auto text-center"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-surface-primary border border-border-primary backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-text-primary/60">
                The Future of Mentorship
              </span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-[14vw] lg:text-[10vw] font-serif font-light leading-[0.85] tracking-tighter">
              Experience <br />
              <span className="italic font-medium bg-gradient-to-r from-brand-accent to-orange-400 bg-clip-text text-transparent">Meets</span> <br />
              Ambition.
            </motion.h1>

            <motion.p variants={itemVariants} className="max-w-xl mx-auto text-lg md:text-xl text-text-primary/40 font-light leading-relaxed">
              Connecting the next generation of talent with the mentors of industry.
              A bridge between legacy and potential.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8">
              <Link
                to="/register"
                className="group relative w-full sm:w-auto px-12 py-6 rounded-2xl bg-text-primary text-bg-primary font-bold text-xs uppercase tracking-[0.2em] overflow-hidden transition-all duration-500"
              >
                <span className="relative z-10 flex items-center justify-center gap-3 group-hover:text-text-primary transition-colors duration-500">
                  Initialize Journey <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-500" />
                </span>
                <div className="absolute inset-0 bg-brand-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.22, 1, 0.36, 1]" />
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto px-12 py-6 rounded-2xl border border-border-primary text-text-primary/60 font-bold text-xs uppercase tracking-[0.2em] hover:bg-surface-primary hover:text-text-primary transition-all duration-500"
              >
                Access Node
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <div className="text-[9px] uppercase tracking-[0.4em] text-text-primary/20 font-mono">Scroll to Explore</div>
          <div className="w-px h-12 bg-gradient-to-b from-brand-accent to-transparent" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-40 px-6 relative border-y border-border-primary">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
          {[
            { label: 'Active Mentors', value: '500+', icon: Globe },
            { label: 'Success Rate', value: '94%', icon: Zap },
            { label: 'AI Matches', value: '12k', icon: Cpu },
            { label: 'Global Nodes', value: '24', icon: Fingerprint },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="space-y-4 group"
            >
              <stat.icon className="text-brand-accent/40 group-hover:text-brand-accent transition-colors duration-500" size={24} />
              <div className="text-5xl font-serif italic text-text-primary">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-text-primary/20">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features - Bento Grid Style */}
      <section className="py-40 px-6 relative">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <h2 className="text-6xl md:text-8xl font-serif font-light tracking-tighter leading-none">
              The <span className="italic bg-gradient-to-r from-brand-accent to-orange-400 bg-clip-text text-transparent">Mentorship</span> <br />
              of Success.
            </h2>
            <p className="max-w-sm text-text-primary/30 text-sm leading-relaxed">
              We've engineered a platform that removes the friction from professional growth,
              leveraging advanced intelligence to foster meaningful human connections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI Grounding',
                desc: 'Our Gemini-powered engine analyzes career trajectories to find the optimal mentor match.',
                icon: Sparkles,
                color: 'bg-orange-500/10'
              },
              {
                title: 'Legacy Network',
                desc: 'Access a curated pool of retired executives from Fortune 500 companies.',
                icon: Users,
                color: 'bg-blue-500/10'
              },
              {
                title: 'Secure Protocol',
                desc: 'Every interaction is protected by enterprise-grade security and verification.',
                icon: ShieldCheck,
                color: 'bg-emerald-500/10'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group p-12 rounded-[40px] border border-border-primary bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-700"
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon className="text-brand-accent" size={32} />
                </div>
                <h3 className="text-3xl font-serif italic text-text-primary mb-4">{feature.title}</h3>
                <p className="text-text-primary/30 leading-relaxed font-light">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-12 relative z-10">
          <h2 className="text-7xl md:text-9xl font-serif italic tracking-tighter">
            Ready to <span className="text-brand-accent">Bridge</span>?
          </h2>
          <Link
            to="/register"
            className="inline-flex items-center gap-4 px-16 py-8 rounded-full bg-text-primary text-bg-primary font-bold text-sm uppercase tracking-[0.4em] hover:bg-brand-accent hover:text-text-primary transition-all duration-700"
          >
            Initialize Account <ArrowRight size={24} />
          </Link>
        </div>

        {/* Background Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30vw] font-black text-white/[0.02] select-none pointer-events-none tracking-tighter">
          EDU
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-border-primary relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-4">
            <div className="text-2xl font-serif italic text-text-primary">Edu <span className="text-brand-accent">Connect</span></div>
            <p className="text-text-primary/20 text-xs uppercase tracking-widest">© 2026 / ALL RIGHTS RESERVED</p>
          </div>

          <div className="flex gap-12">
            {['Privacy', 'Terms', 'Security', 'Contact'].map((link) => (
              <a key={link} href="#" className="text-[10px] uppercase tracking-[0.3em] text-text-primary/20 hover:text-brand-accent transition-colors">
                {link}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] uppercase tracking-widest text-text-primary/40 font-mono">SYSTEM_STATUS: OPERATIONAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
