import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

interface AnimatedLogoIntroProps {
  onComplete: () => void;
}

export const AnimatedLogoIntro: React.FC<AnimatedLogoIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<number>(0);
  const [isExiting, setIsExiting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      const timer = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(timer);
    }

    // Fast, precise 1.8s sequence
    const t1 = setTimeout(() => setPhase(1), 300); // 0.3s -> Olive sweep
    const t2 = setTimeout(() => setPhase(2), 1000); // 1.0s -> Brand text
    const t3 = setTimeout(() => setIsExiting(true), 1600); // 1.6s -> Exit
    const t4 = setTimeout(() => onComplete(), 2000); // 2.0s -> Finish

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  // Subtle ambient floating dust motes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = Array.from({ length: 18 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.5,
      speedY: -(Math.random() * 0.3 + 0.1),
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.y += p.speedY;
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(164, 184, 121, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(onComplete, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0D0E0C] text-[#F4F4ED] select-none overflow-hidden transition-all duration-500 ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Volumetric Olive Ambient Glow */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[420px] h-80 sm:h-[420px] rounded-full bg-[#596B35]/25 blur-[80px] pointer-events-none transition-all duration-700 ${
          phase >= 1 ? 'opacity-100 scale-110' : 'opacity-30 scale-90'
        }`}
      />

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-5 right-5 sm:top-6 sm:right-6 z-30 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-[#30342B] hover:border-[#596B35] text-[11px] font-bold text-[#A7AA9C] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
      >
        <span>Skip</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* 3D LOGO CONTAINER */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-5">
        <div
          className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-[#151713] border border-[#30342B] p-4 flex items-center justify-center shadow-2xl transition-all duration-700 ${
            phase >= 1 ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
        >
          {/* Olive Corona Ring */}
          <div
            className={`absolute inset-0 rounded-3xl bg-[#596B35]/30 blur-lg transition-opacity duration-700 ${
              phase >= 1 ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <img
            src="/logo.png"
            alt="Syllabus 3D"
            className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] relative z-10"
          />

          {/* Olive Glossy Light Sweep */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-20">
            <div
              className={`w-[200%] h-full absolute -top-0 -left-[100%] bg-gradient-to-r from-transparent via-[#DCE8B7]/40 to-transparent transform -skew-x-[25deg] transition-all duration-1000 ease-in-out ${
                phase >= 1 ? 'translate-x-[200%]' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {/* Brand Typography */}
        <div
          className={`text-center space-y-1 transition-all duration-700 ${
            phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <h1 className="text-xl sm:text-2xl font-black tracking-[0.2em] uppercase text-[#F4F4ED] font-serif">
            SYLLABUS 3D
          </h1>
          <p className="text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase text-[#A4B879] font-mono">
            Track • Complete • Master
          </p>
        </div>
      </div>
    </div>
  );
};
