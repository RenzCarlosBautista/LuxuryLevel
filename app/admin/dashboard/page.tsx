// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Package } from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/products/list');
        if (response.ok) {
          const data = await response.json();
          const products = data.products || [];

          setStats({
            totalProducts: data.pagination?.total || 0,
            activeProducts: products.filter((p: any) => p.is_active).length,
            inactiveProducts: products.filter((p: any) => !p.is_active).length,
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <main className="flex-1 bg-gray-100 min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard
              title="Total Products"
              value={stats?.totalProducts || 0}
              color="blue"
            />
            <StatCard
              title="Active Products"
              value={stats?.activeProducts || 0}
              color="green"
            />
            <StatCard
              title="Inactive Products"
              value={stats?.inactiveProducts || 0}
              color="red"
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-col space-y-3">
            <Link
              href="/admin/products"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 transition max-w-xs"
            >
              <Package size={20} />
              <span>Manage Products</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'yellow';
}

function StatCard({ title, value, color }: StatCardProps) {
  const bgColors = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100',
  };

  const textColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
  };

  return (
    <div className={`${bgColors[color]} rounded-lg shadow p-6`}>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className={`text-3xl font-bold ${textColors[color]} mt-2`}>{value}</p>
    </div>
  );
}
