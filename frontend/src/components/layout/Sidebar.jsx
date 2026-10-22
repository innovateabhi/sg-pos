import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ReceiptText, 
  BookOpen, 
  Grid3x3, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  Flame,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isOwner, isManager } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'POS & Billing', path: '/pos', icon: UtensilsCrossed, badge: 'Live' },
    { name: 'Orders History', path: '/orders', icon: ReceiptText },
    { name: 'Menu Items', path: '/menu', icon: BookOpen },
    { name: 'Dining Tables', path: '/tables', icon: Grid3x3 },
    { name: 'Reports & Sales', path: '/reports', icon: BarChart3 },
    ...(isManager ? [{ name: 'Staff Management', path: '/staff', icon: Users }] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#172033] text-white flex flex-col justify-between
        transition-transform duration-300 ease-in-out border-r border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-[#121927]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#CF7C12] to-[#E99A24] flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-wide text-white">Saffron Grill</h1>
                <p className="text-[11px] text-amber-400 font-medium tracking-wider uppercase">POS & Dining Ops</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose?.()}
                  className={({ isActive }) => `
                    flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                    ${isActive 
                      ? 'bg-[#E99A24] text-slate-950 font-semibold shadow-md shadow-amber-500/20' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-[#121927]/60">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 border border-amber-500/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Staff'}</p>
                <p className="text-[10px] text-amber-300/80 font-medium capitalize truncate">{user?.role || 'Cashier'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="px-2 pt-1 pb-1 text-center">
            <p className="text-[10px] text-slate-500 tracking-wide">
              Prototype by <span className="text-slate-400 font-semibold">Softrenix Technologies</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
