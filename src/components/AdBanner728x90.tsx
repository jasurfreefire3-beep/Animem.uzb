import React, { useEffect, useRef } from 'react';

interface AdBanner728x90Props {
  className?: string;
}

export default function AdBanner728x90({ className = '' }: AdBanner728x90Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Reset container DOM element
    containerRef.current.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.style.width = '728px';
    iframe.style.height = '90px';
    iframe.style.border = '0';
    iframe.style.margin = '0';
    iframe.style.padding = '0';
    iframe.style.overflow = 'hidden';
    iframe.style.background = 'transparent';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    
    containerRef.current.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              html, body {
                margin: 0;
                padding: 0;
                width: 728px;
                height: 90px;
                overflow: hidden;
                background: transparent;
                display: flex;
                align-items: center;
                justify-content: center;
              }
            </style>
          </head>
          <body>
            <script type="text/javascript">
              atOptions = {
                'key' : '79e885f0be5cd0839533ca3755585c29',
                'format' : 'iframe',
                'height' : 90,
                'width' : 728,
                'params' : {}
              };
            </script>
            <script type="text/javascript" src="https://www.highperformanceformat.com/79e885f0be5cd0839533ca3755585c29/invoke.js"></script>
          </body>
        </html>
      `);
      doc.close();
    }
  }, []);

  return (
    <div className={`w-full hidden md:flex flex-col items-center justify-center my-6 px-2 select-none ${className}`}>
      {/* Label */}
      <div className="flex items-center gap-2 mb-1.5 opacity-60">
        <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
          Reklama
        </span>
      </div>

      {/* Responsive Wrapper - auto scales down on smaller screens */}
      <div className="w-full max-w-[728px] overflow-x-auto overflow-y-hidden bg-[#0d0d10] border border-white/10 rounded-xl p-1.5 shadow-lg flex items-center min-h-[98px]">
        <div 
          ref={containerRef} 
          className="w-[728px] h-[90px] min-w-[728px] mx-auto flex items-center justify-center overflow-hidden" 
        />
      </div>
    </div>
  );
}
