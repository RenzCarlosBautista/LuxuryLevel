'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function BrandsDashboard() {
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [brandsRes, categoriesRes] = await Promise.all([
        supabase.from('brand').select('*').order('name'),
        supabase.from('category').select('id, name')
      ]);
      if (brandsRes.data) setBrands(brandsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const getCategoryName = (id: number | null) => {
    if (!id) return null;
    return categories.find(c => c.id === id)?.name.toUpperCase() || 'UNKNOWN';
  };

  const getParentName = (id: number | null) => {
    if (!id) return null;
    return brands.find(b => b.id === id)?.name || null;
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    const res = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      setBrands(brands.filter(b => b.id !== id));
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header Section */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Brands</h1>
          <p className="mt-2 text-sm text-gray-700">A list of all the luxury brands in your catalog including their categories, parent affiliations, and logo.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link 
            href="/admin/brands/add" 
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto transition-colors"
          >
            Add New Brand
          </Link>
        </div>
      </div>

      {/* Modern Table Wrapper */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Brand</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Affiliation</th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Featured</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Edit</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                     <tr><td colSpan={5} className="py-10 text-center text-sm text-gray-500">Loading your catalog...</td></tr>
                  ) : brands.length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-sm text-gray-500">No brands found. Click "Add New Brand" to begin.</td></tr>
                  ) : (
                    brands.map((brand) => (
                      <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 relative rounded-full border border-gray-200 bg-white overflow-hidden">
                              {brand.logo_url ? (
                                <Image src={brand.logo_url} alt="" fill className="object-contain p-1.5" />
                              ) : (
                                <span className="h-full w-full flex items-center justify-center font-bold text-gray-300 bg-gray-50">{brand.name.charAt(0)}</span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="font-semibold text-gray-900 uppercase tracking-wide text-sm">{brand.name}</div>
                              {brand.description && <div className="text-gray-500 text-xs truncate max-w-[200px]">{brand.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {getCategoryName(brand.category_id) ? (
                            <span className="inline-flex rounded-full bg-blue-50 px-2 text-xs font-semibold leading-5 text-blue-700">
                              {getCategoryName(brand.category_id)}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Uncategorized</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                           {getParentName(brand.parent_id) ? (
                            <div className="text-xs text-gray-900">Sub-brand of <span className="font-semibold">{getParentName(brand.parent_id)}</span></div>
                           ) : (
                             <span className="text-gray-400 italic text-xs">Main Brand</span>
                           )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                          {brand.featured ? (
                             <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">Active</span>
                          ) : (
                            <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-500">-</span>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link href={`/admin/brands/edit/${brand.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</Link>
                          <button onClick={() => handleDelete(brand.id, brand.name)} className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}