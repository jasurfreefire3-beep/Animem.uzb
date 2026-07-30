import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { Download, X } from 'lucide-react';

const AFFILIATE_URL = "https://spin-b.com/mwGY27?tag=d_221320m_722889c_cz_AufBZvd8JsHCVwcFAHWmcL";
const TEN_MINUTES_MS = 10 * 60 * 1000; // 10 minutes

// High quality clean SVG fallback data URL for SpinBetter
const SPINBETTER_LOGO_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='200' height='200'><rect width='200' height='200' rx='40' fill='%230f172a'/><circle cx='100' cy='80' r='45' fill='%231d4ed8'/><circle cx='100' cy='80' r='45' fill='none' stroke='%23facc15' stroke-width='6' stroke-dasharray='10 5'/><path d='M 115 65 C 115 55, 85 55, 85 70 C 85 85, 115 80, 115 95 C 115 110, 85 110, 85 100' fill='none' stroke='%23facc15' stroke-width='9' stroke-linecap='round'/><rect x='15' y='140' width='170' height='40' rx='10' fill='%2322c55e'/><text x='100' y='166' font-family='sans-serif' font-weight='900' font-size='18' fill='%23ffffff' text-anchor='middle'>SPINBETTER</text></svg>";

export default function SpinBetterAdModal() {
  return null;
}
