// app/admin/products/add/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductForm from '@/components/admin/product-form';
import { Brand } from '@/lib/types';
import { ArrowLeft, Package, ChevronRight, Loader2, LayoutDashboard } from 'lucide-react';

interface CategoryTree {
  id: number;
  name: string;
  parent_id: number | null;
  subcategories?: CategoryTree[];
}

export default function AddProductPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandsRes, categoriesRes] = await Promise.all([
          fetch('/api/brands'),
          fetch('/api/admin/categories'),
        ]);

        if (brandsRes.ok) {
          const data = await brandsRes.json();
          setBrands(data.brands || []);
        }

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.categoryTree || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="flex-1 bg-[#F4F4F5] min-h-screen p-4 md:p-8 font-sans">
      {/* FIX: Changed max-w-5xl to w-full to stretch across the entire screen */}
      <div className="w-full space-y-6 animate-fade-in">
        
        {/* PREMIUM BREADCRUMBS & NAVIGATION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center text-sm font-medium text-slate-500">
            <Link href="/admin/products" className="hover:text-slate-900 transition-colors flex items-center gap-1.5">
              <LayoutDashboard size={16} />
              Inventory
            </Link>
            <ChevronRight size={16} className="mx-2 opacity-50" />
            <span className="text-slate-900 font-semibold bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
              New Product
            </span>
          </div>

          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-all hover:-translate-x-1"
          >
            <ArrowLeft size={16} />
            Back to Catalog
          </Link>
        </div>

        {/* PAGE HEADER */}
        <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
          {/* Subtle background flare */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-slate-100 to-transparent rounded-full blur-3xl -mr-10 -mt-10 opacity-60 pointer-events-none"></div>
          
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Package size={28} className="text-slate-700" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Listing</h1>
              <p className="text-slate-500 text-sm mt-1">Add a new item to your luxury catalog. Fill out the details below.</p>
            </div>
          </div>
        </div>

        {/* FORM CONTAINER OR SKELETON LOADER */}
        <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-slate-100 p-6 sm:p-10 transition-all duration-300 relative">
          {loading ? (
            <div className="space-y-8 animate-pulse">
              {/* Premium Skeleton Loader */}
              <div className="flex items-center gap-3 mb-8">
                <Loader2 size={20} className="text-slate-300 animate-spin" />
                <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">Loading Form Data...</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                  <div className="h-12 bg-slate-50 rounded-xl border border-slate-100 w-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                  <div className="h-12 bg-slate-50 rounded-xl border border-slate-100 w-full"></div>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <div className="h-4 bg-slate-100 rounded w-1/5"></div>
                <div className="h-32 bg-slate-50 rounded-xl border border-slate-100 w-full"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="h-12 bg-slate-50 rounded-xl border border-slate-100 w-full"></div>
                <div className="h-12 bg-slate-50 rounded-xl border border-slate-100 w-full"></div>
                <div className="h-12 bg-slate-50 rounded-xl border border-slate-100 w-full"></div>
              </div>
            </div>
          ) : (
            <div className="animate-slide-up">
              <ProductForm brands={brands} categories={categories} />
            </div>
          )}
        </div>

      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
      `}</style>
    </main>
  );
}