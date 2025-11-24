import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export default function GameTimer({ startTime, durationMinutes, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const end = startTime + (durationMinutes * 60 * 1000);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        clearInterval(interval);
        if (onTimeUp) onTimeUp();
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}:${s < 10 ? '0' : ''}${s}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes]);

  return (
    <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-600 text-white font-mono font-bold text-xl shadow-lg">
      <Clock size={20} className="text-red-500 animate-pulse" />
      {timeLeft}
    </div>
  );
}