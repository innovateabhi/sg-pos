import React, { useState, useEffect } from 'react';
import { Menu, PlusCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onOpenSidebar, title = 'Dashboard' }) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 hidden sm:block">Saffron Grill • IQ City & Bijra, Durgapur</p>
        </div>
      </div>

      {/* Right: Live Clock & Quick Action */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>{formattedDate}</span>
          <span className="font-semibold text-slate-900">{formattedTime}</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Connected</span>
        </div>

        <button
          onClick={() => navigate('/pos')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E99A24] hover:bg-[#CF7C12] text-slate-950 font-semibold text-xs tracking-wide shadow-xs transition active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">New Order</span>
          <span className="sm:hidden">POS</span>
        </button>
      </div>
    </header>
  );
}
