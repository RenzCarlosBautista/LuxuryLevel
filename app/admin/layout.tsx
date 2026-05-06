// app/admin/layout.tsx
'use client';

import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/forgot-password' || pathname === '/admin/reset-password';

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar - Hidden on auth pages */}
      {!isAuthPage && <AdminSidebar />}
      
      {/* Main content wrapper */}
      <div className={isAuthPage ? 'w-full' : 'flex-1 ml-64'}>
        {children}
      </div>
    </div>
  );
}