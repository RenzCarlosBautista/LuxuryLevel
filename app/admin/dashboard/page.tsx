'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Package, Tags, Settings } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase to grab the quick counts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalBrands: number;
  totalCategories: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all stats simultaneously for faster loading
        const [productResponse, { count: brandCount }, { count: categoryCount }] = await Promise.all([
          fetch('/api/admin/products/list'),
          supabase.from('brand').select('*', { count: 'exact', head: true }),
          supabase.from('category').select('*', { count: 'exact', head: true })
        ]);

        let productData = { total: 0, active: 0, inactive: 0 };

        if (productResponse.ok) {
          const data = await productResponse.json();
          const products = data.products || [];
          productData = {
            total: data.pagination?.total || products.length || 0,
            active: products.filter((p: any) => p.is_active).length,
            inactive: products.filter((p: any) => !p.is_active).length,
          };
        }

        setStats({
          totalProducts: productData.total,
          activeProducts: productData.active,
          inactiveProducts: productData.inactive,
          totalBrands: brandCount || 0,
          totalCategories: categoryCount || 0,
        });

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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Command Center</h1>

        {loading ? (
          <div className="text-center py-12 animate-pulse">
            <p className="text-gray-600 font-medium">Loading your metrics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
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
              title="Total Brands"
              value={stats?.totalBrands || 0}
              color="purple"
            />
            <StatCard
              title="Categories"
              value={stats?.totalCategories || 0}
              color="yellow"
            />
             <StatCard
              title="Inactive Products"
              value={stats?.inactiveProducts || 0}
              color="red"
            />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <LayoutDashboard size={24} className="text-indigo-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <Link
              href="/admin/products"
              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold py-4 px-4 rounded-xl flex flex-col items-center justify-center gap-3 transition"
            >
              <Package size={28} />
              <span>Manage Products</span>
            </Link>

            <Link
              href="/admin/brands"
              className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-semibold py-4 px-4 rounded-xl flex flex-col items-center justify-center gap-3 transition"
            >
              <Tags size={28} />
              <span>Manage Brands</span>
            </Link>

            <Link
              href="/admin/settings"
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-4 px-4 rounded-xl flex flex-col items-center justify-center gap-3 transition"
            >
              <Settings size={28} />
              <span>Pricing Settings</span>
            </Link>

          </div>
        </div>
      </div>
    </main>
  );
}

// Upgraded StatCard with a new 'purple' color option
interface StatCardProps {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

function StatCard({ title, value, color }: StatCardProps) {
  const bgColors = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    red: 'bg-red-50 border-red-100',
    yellow: 'bg-amber-50 border-amber-100',
    purple: 'bg-purple-50 border-purple-100',
  };

  const textColors = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    red: 'text-red-700',
    yellow: 'text-amber-700',
    purple: 'text-purple-700',
  };

  return (
    <div className={`${bgColors[color]} border rounded-xl p-6 transition-all hover:shadow-md`}>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      <p className={`text-4xl font-extrabold ${textColors[color]} mt-3`}>{value}</p>
    </div>
  );
}