import React, { useState, useEffect } from 'react';

interface CountdownProps {
  date: string;
  time: string;
}

export default function Countdown({ date, time }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const targetDate = new Date(`${date}T${time}`).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setIsPast(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [date, time]);

  if (isPast) {
    return (
      <div className="bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow backdrop-blur-sm border border-red-400/50">
        Événement terminé
      </div>
    );
  }

  return (
    <div className="flex space-x-2 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-xl">
      <div className="flex flex-col items-center justify-center bg-white/10 rounded-lg w-12 h-12">
        <span className="text-white font-bold text-lg leading-none">{String(timeLeft.days).padStart(2, '0')}</span>
        <span className="text-white/70 text-[10px] uppercase font-medium mt-0.5">Jours</span>
      </div>
      <div className="flex flex-col items-center justify-center bg-white/10 rounded-lg w-12 h-12">
        <span className="text-white font-bold text-lg leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-white/70 text-[10px] uppercase font-medium mt-0.5">Hres</span>
      </div>
      <div className="flex flex-col items-center justify-center bg-white/10 rounded-lg w-12 h-12">
        <span className="text-white font-bold text-lg leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-white/70 text-[10px] uppercase font-medium mt-0.5">Mins</span>
      </div>
      <div className="flex flex-col items-center justify-center bg-white/10 rounded-lg w-12 h-12">
        <span className="text-white font-bold text-lg leading-none text-blue-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-white/70 text-[10px] uppercase font-medium mt-0.5">Secs</span>
      </div>
    </div>
  );
}
