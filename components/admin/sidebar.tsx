// components/admin/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, LogOut, Inbox } from 'lucide-react';
import { useState } from 'react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">LuxuryLevel</h1>
        <p className="text-sm text-gray-400">Admin Panel</p>
      </div>

      <nav className="p-6 space-y-2">
        <Link
          href="/admin/dashboard"
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
            isActive('/admin/dashboard')
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/admin/products"
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
            isActive('/admin/products') || pathname.startsWith('/admin/products/')
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          <Package size={20} />
          <span>Products</span>
        </Link>

        <Link
          href="/admin/staging"
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
            isActive('/admin/staging') || pathname.startsWith('/admin/staging/')
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          <Inbox size={20} />
          <span>Staging & Approval</span>
        </Link>
      </nav>

      <div className="p-6 border-t border-gray-800 absolute bottom-0 w-full">
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-gray-800 transition disabled:opacity-50"
        >
          <LogOut size={20} />
          <span>{loading ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  );
}
