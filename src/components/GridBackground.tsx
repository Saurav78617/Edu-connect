import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';

export default function GridBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      mouseX.set(clientX);
      mouseY.set(clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const maskImage = useTransform(
    [x, y],
    ([latestX, latestY]) => `radial-gradient(600px circle at ${latestX}px ${latestY}px, black 0%, transparent 100%)`
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Static Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} 
      />
      
      {/* Interactive Reveal Grid */}
      <motion.div 
        className="absolute inset-0 opacity-[0.15]" 
        style={{ 
          backgroundImage: `linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage,
          WebkitMaskImage: maskImage
        }} 
      />

      {/* Floating Blobs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-accent/20 rounded-full blur-[120px]"
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.05, 0.1, 0.05],
          x: [0, -40, 0],
          y: [0, 60, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-text-primary/5 rounded-full blur-[150px]"
      />
    </div>
  );
}
