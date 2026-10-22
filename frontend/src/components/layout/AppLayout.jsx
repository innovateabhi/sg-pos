import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const PAGE_TITLES = {
  '/': 'Restaurant Overview & Dashboard',
  '/pos': 'Point of Sale & Realtime Billing',
  '/orders': 'Order Management & History',
  '/menu': 'Food Menu & Category Management',
  '/tables': 'Dining Tables & Floor Status',
  '/reports': 'Sales Reports & Analytics',
  '/staff': 'Staff & Cashier Access Control',
  '/settings': 'Restaurant Settings & Billing Prefs',
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] || 'Saffron Grill POS';

  return (
    <div className="min-h-screen bg-[#F7F7F4] flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} title={title} />

        <main className="flex-1 p-4 lg:p-6 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
