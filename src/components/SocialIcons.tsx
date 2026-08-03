import React from 'react';

export interface SocialIconProps {
  className?: string;
  size?: number;
}

// Telegram
export const TelegramIcon: React.FC<SocialIconProps> = ({ className = "w-10 h-10", size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="24" fill="#0088CC" />
    <path
      d="M34.5 13.5L10.5 22.8C9.5 23.2 9.5 24.3 10.4 24.6L16.5 26.5L30.7 17.6C31.4 17.2 32 17.4 31.4 17.9L19.9 28.3L19.5 34.1C20.1 34.1 20.4 33.8 20.7 33.5L23.6 30.7L29.6 35.1C30.7 35.7 31.5 35.4 31.8 34.1L35.7 15.6C36.1 14 35.1 13.3 34.5 13.5Z"
      fill="white"
    />
  </svg>
);

// Instagram
export const InstagramIcon: React.FC<SocialIconProps> = ({ className = "w-10 h-10", size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="5%" stopColor="#fdf497" />
        <stop offset="45%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="100%" stopColor="#285AEB" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="24" fill="url(#ig-grad)" />
    <rect x="14" y="14" width="20" height="20" rx="6" stroke="white" strokeWidth="2.5" fill="none" />
    <circle cx="24" cy="24" r="5" stroke="white" strokeWidth="2.5" fill="none" />
    <circle cx="29.5" cy="18.5" r="1.5" fill="white" />
  </svg>
);

// TikTok
export const TikTokIcon: React.FC<SocialIconProps> = ({ className = "w-10 h-10", size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="24" fill="#010101" />
    <path
      d="M29.5 14C28.3 14 27.2 13.4 26.5 12.5C26 11.9 25.7 11.1 25.7 10H21.5V28C21.5 30.2 19.7 32 17.5 32C15.3 32 13.5 30.2 13.5 28C13.5 25.8 15.3 24 17.5 24C18 24 18.5 24.1 18.9 24.3V20C18.4 19.9 18 19.9 17.5 19.9C13 19.9 9.3 23.6 9.3 28.1C9.3 32.6 13 36.3 17.5 36.3C22 36.3 25.7 32.6 25.7 28.1V18.1C27.5 19.4 29.7 20.2 32 20.2V16C30.6 16 29.5 15.1 29.5 14Z"
      fill="white"
    />
    <path
      d="M32 16.2C30.2 16.2 28.6 15.3 27.6 14H25.7V28.1C25.7 32.6 22 36.3 17.5 36.3C15.2 36.3 13.1 35.3 11.7 33.8C13.1 35.2 15.2 36 17.5 36C22 36 25.7 32.3 25.7 27.8V17.8C27.5 19.1 29.7 19.9 32 19.9V16.2Z"
      fill="#25F4EE"
      opacity="0.8"
    />
  </svg>
);

// YouTube
export const YouTubeIcon: React.FC<SocialIconProps> = ({ className = "w-10 h-10", size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="24" fill="#FF0000" />
    <path
      d="M33.2 19C33 18.2 32.3 17.5 31.5 17.3C29.9 16.9 24 16.9 24 16.9C24 16.9 18.1 16.9 16.5 17.3C15.7 17.5 15 18.2 14.8 19C14.4 20.6 14.4 24 14.4 24C14.4 24 14.4 27.4 14.8 29C15 29.8 15.7 30.5 16.5 30.7C18.1 31.1 24 31.1 24 31.1C24 31.1 29.9 31.1 31.5 30.7C32.3 30.5 33 29.8 33.2 29C33.6 27.4 33.6 24 33.6 24C33.6 24 33.6 20.6 33.2 19Z"
      fill="white"
    />
    <polygon points="22,20 28,24 22,28" fill="#FF0000" />
  </svg>
);

// Discord
export const DiscordIcon: React.FC<SocialIconProps> = ({ className = "w-10 h-10", size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="24" fill="#5865F2" />
    <path
      d="M31.2 16.8C29.6 16.1 27.9 15.6 26.1 15.4C25.9 15.8 25.7 16.3 25.5 16.7C23.6 16.4 21.7 16.4 19.8 16.7C19.6 16.3 19.4 15.8 19.2 15.4C17.4 15.6 15.7 16.1 14.1 16.8C10.9 21.6 10.1 26.3 10.5 30.9C12.6 32.5 14.6 33.5 16.6 34.1C17.1 33.4 17.6 32.7 18 31.9C17.3 31.6 16.6 31.3 16 30.9C16.2 30.7 16.3 30.6 16.5 30.4C20.3 32.2 24.5 32.2 28.3 30.4C28.5 30.6 28.6 30.7 28.8 30.9C28.2 31.3 27.5 31.6 26.8 31.9C27.2 32.7 27.7 33.4 28.2 34.1C30.2 33.5 32.2 32.5 34.3 30.9C34.8 25.5 33.4 20.9 31.2 16.8ZM18.4 27.7C17.2 27.7 16.2 26.6 16.2 25.2C16.2 23.8 17.1 22.7 18.4 22.7C19.6 22.7 20.6 23.8 20.5 25.2C20.5 26.6 19.6 27.7 18.4 27.7ZM26.4 27.7C25.2 27.7 24.2 26.6 24.2 25.2C24.2 23.8 25.1 22.7 26.4 22.7C27.6 22.7 28.6 23.8 28.5 25.2C28.5 26.6 27.6 27.7 26.4 27.7Z"
      fill="white"
    />
  </svg>
);

// Facebook
export const FacebookIcon: React.FC<SocialIconProps> = ({ className = "w-10 h-10", size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="24" fill="#1877F2" />
    <path
      d="M28 25.5L28.7 20.8H24.2V17.8C24.2 16.5 24.8 15.3 26.8 15.3H29V11.3C29 11.3 27 11 25.1 11C21.2 11 18.7 13.4 18.7 17.6V20.8H14.5V25.5H18.7V37H24.2V25.5H28Z"
      fill="white"
    />
  </svg>
);

// VK (Vkontakte)
export const VKIcon: React.FC<SocialIconProps> = ({ className = "w-10 h-10", size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="24" fill="#0077FF" />
    <path
      d="M26.7 32.5C16.4 32.5 10.5 25.4 10.3 13.5H15.5C15.6 22.3 19.5 26 22.5 26.8V13.5H27.4V21.1C30.4 20.8 33.6 17.3 34.7 13.5H39.6C38.7 18.2 35.3 21.7 32.8 23.1C35.3 24.3 39.1 27.4 40.5 32.5H35.1C34 29.1 31.2 26.4 27.4 26V32.5H26.7Z"
      fill="white"
    />
  </svg>
);
