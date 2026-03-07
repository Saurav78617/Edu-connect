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

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Static Grid */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: 'var(--grid-opacity)',
          backgroundImage: `linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Hardware-Accelerated Interactive Reveal Glow */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full pointer-events-none opacity-100"
        style={{
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.35) 0%, transparent 50%)',
          x: useTransform(x, v => v - 400), // Offset by half width to center on cursor
          y: useTransform(y, v => v - 400), // Offset by half height to center on cursor
        }}
      />
    </div>
  );
}
