import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';

interface AnimatedLogoIntroProps {
  onComplete: () => void;
}

export const AnimatedLogoIntro: React.FC<AnimatedLogoIntroProps> = ({ onComplete }) => {
  // Animation Phase State: 0 (Reveal) -> 1 (Sweep) -> 2 (Settle) -> 3 (Text) -> 4 (Hold) -> 5 (Exit)
  const [phase, setPhase] = useState<number>(0);
  const [isExiting, setIsExiting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Precise timeline orchestrator
    // 0.0s -> 0.7s: Reveal
    const t1 = setTimeout(() => setPhase(1), 700);
    // 0.7s -> 2.2s: 3D Glossy Light Sweep
    const t2 = setTimeout(() => setPhase(2), 2200);
    // 2.2s -> 2.8s: Settle & Backlight Glow
    const t3 = setTimeout(() => setPhase(3), 2800);
    // 2.8s -> 3.8s: Brand Text Reveal & Hold
    const t4 = setTimeout(() => setPhase(4), 3800);
    // 3.8s -> 4.4s: Seamless Exit Transition
    const t5 = setTimeout(() => {
      setIsExiting(true);
    }, 4000);

    const t6 = setTimeout(() => {
      onComplete();
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [onComplete]);

  // Subtle Parallax Tilt on Mouse Move / Touch
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
    const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
    setMousePos({ x: x * 8, y: y * -8 });
  };

  // Subtle Ambient Golden Stardust Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      alpha: number;
      maxAlpha: number;
      growing: boolean;
    }> = Array.from({ length: 26 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.6,
      speedY: -(Math.random() * 0.4 + 0.15),
      speedX: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.5,
      maxAlpha: Math.random() * 0.5 + 0.2,
      growing: Math.random() > 0.5,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.growing) {
          p.alpha += 0.008;
          if (p.alpha >= p.maxAlpha) p.growing = false;
        } else {
          p.alpha -= 0.008;
          if (p.alpha <= 0.05) p.growing = true;
        }

        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }

        ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(onComplete, 300);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0C0D10] text-[#F5E6C8] select-none overflow-hidden transition-all duration-700 ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ perspective: '1200px' }}
    >
      {/* 1. Canvas for Floating Ambient Gold Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* 2. Deep Volumetric Radial Backlight */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[520px] h-[340px] sm:h-[520px] rounded-full bg-gradient-to-tr from-[#D4AF37]/20 via-[#B89327]/10 to-transparent blur-[90px] pointer-events-none transition-all duration-1000 ${
          phase >= 1 ? 'opacity-100 scale-110' : 'opacity-30 scale-90'
        }`}
      />

      {/* Soft Vignette Overlay */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-0 opacity-80" />

      {/* 3. Skip Button (Top Right) */}
      <button
        onClick={handleSkip}
        className="absolute top-5 right-5 sm:top-7 sm:right-8 z-30 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[11px] font-bold text-[#F5E6C8]/70 hover:text-white transition-all backdrop-blur-md flex items-center gap-1 cursor-pointer active:scale-95 group shadow-sm"
      >
        <span>Skip</span>
        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* 4. MAIN 3D LOGO CONTAINER */}
      <div
        className="relative z-10 flex flex-col items-center justify-center transform transition-transform duration-300 ease-out"
        style={{
          transform: `rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* LOGO BOX WITH 3D GLASS SPECULAR SWEEP */}
        <div
          className={`relative w-32 h-32 sm:w-44 sm:h-44 md:w-48 md:h-48 flex items-center justify-center transition-all duration-1000 ease-out ${
            phase === 0
              ? 'opacity-0 scale-90 blur-md'
              : 'opacity-100 scale-100 blur-0'
          }`}
        >
          {/* Subtle 3D Depth Cast Shadow */}
          <div className="absolute -bottom-6 w-3/4 h-8 bg-black/80 rounded-full blur-xl transform scale-y-50" />

          {/* Golden Corona Halo Ring behind Logo */}
          <div
            className={`absolute inset-0 rounded-[32px] sm:rounded-[40px] bg-gradient-to-tr from-[#D4AF37]/30 via-[#F5E6C8]/20 to-[#B89327]/30 blur-xl transition-all duration-1000 ${
              phase >= 2 ? 'opacity-90 scale-105' : 'opacity-0 scale-95'
            }`}
          />

          {/* Logo Frame Box */}
          <div className="relative w-full h-full rounded-[28px] sm:rounded-[36px] bg-[#141519]/90 border border-[#EBD3A0]/30 shadow-2xl p-4 sm:p-5 flex items-center justify-center overflow-hidden backdrop-blur-2xl">
            
            {/* Primary Logo Image */}
            <img
              src="/logo.png"
              alt="Syllabus 3D Logo"
              className={`w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] transition-all duration-700 ${
                phase >= 1 ? 'brightness-105 contrast-105' : 'brightness-90'
              }`}
            />

            {/* STAGE 2: 3D Glossy Light Sweep Beam (Interactive Surface Reflection) */}
            <div
              className={`absolute inset-0 pointer-events-none overflow-hidden rounded-[28px] sm:rounded-[36px] transition-opacity duration-500 ${
                phase >= 1 && phase < 4 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div
                className={`w-[220%] h-full absolute -top-0 -left-[120%] bg-gradient-to-r from-transparent via-white/40 via-[#F5E6C8]/60 to-transparent transform -skew-x-[25deg] mix-blend-overlay transition-all duration-1500 ease-in-out ${
                  phase >= 1 ? 'translate-x-[220%]' : 'translate-x-0'
                }`}
              />
            </div>

            {/* Micro Specular Glint Star */}
            <div
              className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-3 h-3 bg-[#FFF3D6] rounded-full blur-[1px] shadow-[0_0_12px_#D4AF37] transition-all duration-700 ${
                phase === 1 ? 'opacity-100 scale-125' : 'opacity-0 scale-50'
              }`}
            />
          </div>
        </div>

        {/* 5. BRAND TEXT & TAGLINE (Stage 4 Reveal) */}
        <div className="mt-6 sm:mt-8 text-center space-y-1.5">
          {/* Main App Title */}
          <div
            className={`overflow-hidden transition-all duration-800 ease-out transform ${
              phase >= 3
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-3'
            }`}
          >
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-[0.2em] uppercase bg-gradient-to-r from-[#D4AF37] via-[#FFF5DE] to-[#B89327] bg-clip-text text-transparent drop-shadow-sm font-sans">
              SYLLABUS 3D
            </h1>
          </div>

          {/* Subtitle / Tagline */}
          <div
            className={`transition-all duration-800 delay-150 ease-out transform ${
              phase >= 3
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2'
            }`}
          >
            <p className="text-[10px] sm:text-xs md:text-sm font-extrabold tracking-[0.3em] uppercase text-[#D4AF37]/90 font-mono flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <span>PLAN • TRACK • MASTER</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            </p>
          </div>
        </div>
      </div>

      {/* 6. Subtle Bottom Loading Indicator Line */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 w-32 sm:w-44 h-[2px] bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent rounded-full transition-all duration-4000 ease-linear"
          style={{
            width: isExiting ? '100%' : `${Math.min(100, (phase + 1) * 22)}%`,
          }}
        />
      </div>
    </div>
  );
};
