'use client';

// Nagdagdag tayo ng 'use' mula sa react
import { useEffect, useState, use } from 'react';
import BrandForm from '@/components/admin/brand-form'; // (O kung anuman ang exact filename mo)
import Link from 'next/link';

// Pansinin na ang type ng params ngayon ay Promise
export default function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  // ITO ANG FIX: I-unwrap ang params Promise para makuha ang ID
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [brandData, setBrandData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ginagamit na natin yung unwrapped 'id' variable dito
    fetch(`/api/admin/brands/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setBrandData(data.brand);
        setIsLoading(false);
      });
  }, [id]); // Ginagamit din natin yung 'id' sa dependency array

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <Link href="/admin/brands" className="text-sm font-semibold text-slate-500 hover:text-slate-900 mb-2 inline-block">
          &larr; Back to Brands
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Edit Brand</h1>
      </div>
      
      {isLoading ? (
        <div className="p-10 text-center text-slate-500 font-semibold animate-pulse">Loading brand data...</div>
      ) : brandData ? (
        <BrandForm initialData={brandData} />
      ) : (
        <div className="p-10 text-center text-red-500 font-bold bg-red-50 rounded-xl">Brand not found!</div>
      )}
    </div>
  );
}