import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

export default function BackgroundOrbs() {
    const { theme } = useTheme();

    // Only highly visible in dark mode, extremely subtle in light mode.
    const opacity = theme === 'dark' ? 0.4 : 0.05;

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none w-full h-full">
            {/* Top Left Orb - Brand Accent */}
            <motion.div
                animate={{
                    x: [-100, 100, -100],
                    y: [-50, 50, -50],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-accent"
                style={{ filter: 'blur(80px)', opacity }}
            />

            {/* Bottom Right Orb - Deep Violet/Purple for contrast */}
            <motion.div
                animate={{
                    x: [100, -100, 100],
                    y: [50, -50, 50],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500"
                style={{ filter: 'blur(100px)', opacity: opacity * 0.8 }}
            />
        </div>
    );
}
