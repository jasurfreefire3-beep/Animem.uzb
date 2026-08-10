import React, { useEffect, useRef } from 'react';

interface TurnstileProps {
  sitekey: string;
  onToken: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement | string,
        options: {
          sitekey: string;
          theme: string;
          size: string;
          callback: (token: string) => void;
          'error-callback': () => void;
          'expired-callback': () => void;
        }
      ) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

export default function Turnstile({
  sitekey,
  onToken,
  onError,
  onExpire,
  theme = 'dark',
  size = 'normal',
}: TurnstileProps) {
  const containerId = useRef(`turnstile-${Math.random().toString(36).substring(2, 9)}`);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    // Load Turnstile script if not already loaded
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.turnstile) {
          const container = document.getElementById(containerId.current);
          if (container) {
            widgetId.current = window.turnstile!.render(container, {
              sitekey,
              theme,
              size,
              callback: onToken,
              'error-callback': onError || (() => {}),
              'expired-callback': onExpire || (() => {}),
            });
          }
        }
      };
      
      document.head.appendChild(script);
    } else {
      // If Turnstile is already loaded, render immediately
      const container = document.getElementById(containerId.current);
      if (container && window.turnstile) {
        widgetId.current = window.turnstile.render(container, {
          sitekey,
          theme,
          size,
          callback: onToken,
          'error-callback': onError || (() => {}),
          'expired-callback': onExpire || (() => {}),
        });
      }
    }

    return () => {
      // Cleanup on unmount
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch (e) {
          console.warn('Error removing Turnstile widget:', e);
        }
      }
    };
  }, [sitekey, onToken, onError, onExpire, theme, size]);

  return (
    <div
      id={containerId.current}
      className="flex justify-center my-4 rounded-lg overflow-hidden"
      style={{ minHeight: size === 'compact' ? '50px' : '65px' }}
    />
  );
}
