import React, { useEffect, useRef } from 'react';

interface NativeBannerAdProps {
  className?: string;
}

export default function NativeBannerAd({ className = '' }: NativeBannerAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Reset container DOM element
    containerRef.current.innerHTML = '';

    const containerDiv = document.createElement('div');
    containerDiv.id = 'container-5e5bdedbb0917caa7cf44e3709da7781';
    containerRef.current.appendChild(containerDiv);

    const script = document.createElement('script');
    script.src = 'https://pl29370526.effectivecpmnetwork.com/5e5bdedbb0917caa7cf44e3709da7781/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className={`w-full flex flex-col items-center justify-center my-6 px-2 select-none ${className}`}>
      {/* Label */}
      <div className="flex items-center gap-2 mb-1.5 opacity-60">
        <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
          Tavsiya etilgan reklama
        </span>
      </div>

      {/* Banner Wrapper */}
      <div className="w-full max-w-4xl bg-[#0d0d10] border border-white/10 rounded-xl p-3 shadow-lg min-h-[120px] flex items-center justify-center overflow-hidden">
        <div ref={containerRef} className="w-full flex items-center justify-center min-h-[100px]" />
      </div>
    </div>
  );
}
