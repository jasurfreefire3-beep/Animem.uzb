import React, { useEffect, useRef } from 'react';

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script';
let turnstileScriptPromise: Promise<void> | null = null;

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
          'error-callback': (code?: string) => void;
          'expired-callback': () => void;
        }
      ) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Turnstile script failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    // `turnstile.render` requires Cloudflare's explicit rendering mode.
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile script failed to load'));
    document.head.appendChild(script);
  }).catch((error) => {
    turnstileScriptPromise = null;
    throw error;
  });

  return turnstileScriptPromise;
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
  const callbacks = useRef({ onToken, onError, onExpire });

  // Login and registration forms re-render as users type. Keep the latest
  // callbacks without destroying an in-progress Turnstile challenge.
  callbacks.current = { onToken, onError, onExpire };

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        const container = document.getElementById(containerId.current);
        if (cancelled || !container || !window.turnstile) return;

        container.replaceChildren();
        widgetId.current = window.turnstile.render(container, {
          sitekey,
          theme,
          size,
          callback: (token) => callbacks.current.onToken(token),
          'error-callback': (code) => {
            console.error('Cloudflare Turnstile error:', code);
            callbacks.current.onError?.();
          },
          'expired-callback': () => callbacks.current.onExpire?.(),
        });
      })
      .catch((error) => {
        console.error('Unable to load Cloudflare Turnstile:', error);
        callbacks.current.onError?.();
      });

    return () => {
      cancelled = true;
      // Cleanup on unmount
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch (e) {
          console.warn('Error removing Turnstile widget:', e);
        }
        widgetId.current = null;
      }
    };
  }, [sitekey, theme, size]);

  return (
    <div
      id={containerId.current}
      className="flex justify-center my-4 rounded-lg overflow-hidden"
      style={{ minHeight: size === 'compact' ? '50px' : '65px' }}
    />
  );
}
